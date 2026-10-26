/**
 * اکشن‌های سطح بازی: ترکیب اقتصاد و دهکده.
 * هر اکشن وضعیت جدید برمی‌گرداند یا {ok:false, code, message} می‌دهد.
 */
import { costFor, getBuilding, constructionSeconds, isUnlocked } from '../data/buildings.js';
import { canAfford, pay } from './economy.js';
import { addBuilding, canPlace, findByUid, castleLevel, startUpgrade } from './village.js';
import { createArmy, enqueueTraining } from './army.js';
import { simulateBattle, createOpponents } from './battle.js';
import { grant, storageCaps } from './economy.js';
import { troopCost, trainingSeconds } from '../data/troops.js';

/** پیام خطای یکدست برای کمبود منابع. */
function noResources(cost) {
  const missing = Object.entries(cost)
    .map(([key, value]) => (key === 'gold' ? `${value} طلا` : `${value} گندم`))
    .join(' و ');
  return { ok: false, code: 'NO_RESOURCES', message: `منابع کافی نیست؛ نیاز: ${missing}` };
}

/**
 * ساخت ساختمان جدید: اعتبارسنجی جای‌گذاری، بررسی منابع، کسر هزینه و شروع تایمر.
 */
export function buildBuilding(state, { type, x, y, now = Date.now() }) {
  const def = getBuilding(type);
  if (!isUnlocked(type, castleLevel(state.village))) {
    return { ok: false, code: 'LOCKED', message: `${def.name} به سطح ${def.unlockAt} ارگ نیاز دارد.` };
  }
  const placement = canPlace(state.village, type, x, y);
  if (!placement.ok) return placement;

  const cost = costFor(type, 1);
  if (!canAfford(state.resources, cost)) return noResources(cost);

  const placed = addBuilding(state.village, { type, x, y, now });
  if (!placed.ok) return placed;

  const resources = pay(state.resources, cost);
  return {
    ok: true,
    cost,
    building: placed.building,
    state: {
      ...state,
      village: placed.village,
      resources,
      stats: { ...state.stats, buildingsBuilt: (state.stats?.buildingsBuilt || 0) + 1 },
    },
  };
}

/** شروع ارتقای یک ساختمان. */
export function upgradeBuilding(state, { uid, now = Date.now() }) {
  const building = findByUid(state.village, uid);
  if (!building) return { ok: false, code: 'NOT_FOUND', message: 'ساختمان پیدا نشد.' };
  const def = getBuilding(building.type);
  if (building.state !== 'idle') {
    return { ok: false, code: 'BUSY', message: 'این ساختمان مشغول ساخت یا ارتقاست.' };
  }
  if (building.level >= def.maxLevel) {
    return { ok: false, code: 'MAX_LEVEL', message: `${def.name} در بالاترین سطح است.` };
  }

  const cost = costFor(building.type, building.level + 1);
  if (!canAfford(state.resources, cost)) return noResources(cost);

  const started = startUpgrade(state.village, uid, now);
  if (!started.ok) return started;
  return {
    ok: true,
    cost,
    seconds: constructionSeconds(building.type, building.level + 1),
    building: started.building,
    state: { ...state, village: started.village, resources: pay(state.resources, cost) },
  };
}

/** هزینه و زمان ارتقای بعدی ساختمان (برای نمایش در رابط). */
export function upgradePreview(village, uid) {
  const building = findByUid(village, uid);
  if (!building) return null;
  const def = getBuilding(building.type);
  const atMax = building.level >= def.maxLevel;
  return {
    atMax,
    level: building.level,
    maxLevel: def.maxLevel,
    cost: atMax ? null : costFor(building.type, building.level + 1),
    seconds: atMax ? 0 : constructionSeconds(building.type, building.level + 1),
    busy: building.state !== 'idle',
  };
}

/** سطح سربازخانه‌ی آماده (۰ اگر ساخته نشده باشد). */
export function barracksLevel(village) {
  const barracks = village.buildings.find((b) => b.type === 'barracks' && b.state === 'idle');
  return barracks ? barracks.level : 0;
}

/**
 * آموزش سرباز: بررسی سربازخانه، ظرفیت و صف، سپس کسر گندم.
 */
export function trainUnits(state, { type, count = 1, now = Date.now() }) {
  const level = barracksLevel(state.village);
  if (level === 0) {
    return { ok: false, code: 'NO_BARRACKS', message: 'اول سربازخانه بساز تا سپاه آموزش ببیند.' };
  }
  const army = state.army || createArmy();
  const queued = enqueueTraining(army, { type, count, now, barracksLevel: level });
  if (!queued.ok) return queued;

  const cost = troopCost(type, count);
  if (!canAfford(state.resources, cost)) return noResources(cost);

  return {
    ok: true,
    cost,
    job: queued.job,
    seconds: queued.seconds ?? trainingSeconds(type, count, level),
    state: {
      ...state,
      army: queued.army,
      resources: pay(state.resources, cost),
    },
  };
}

/**
 * حمله به دهکده‌ی دشمن: شبیه‌سازی نبرد، جایگزینی بازماندگان، دریافت غنیمت
 * و ثبت در تاریخچه.
 */
export function attackEnemy(state, { enemy, units, now = Date.now(), seed } = {}) {
  if (!enemy || !Array.isArray(enemy.buildings)) {
    return { ok: false, code: 'NO_ENEMY', message: 'حریف معتبر نیست.' };
  }
  const available = state.army?.units || {};
  const sent = {};
  for (const [type, count] of Object.entries(units ?? available)) {
    const n = Math.floor(Number(count) || 0);
    if (n <= 0) continue;
    if ((available[type] || 0) < n) {
      return { ok: false, code: 'NOT_ENOUGH', message: 'سرباز کافی از این نوع نداری.' };
    }
    sent[type] = n;
  }
  const sentTotal = Object.values(sent).reduce((sum, n) => sum + n, 0);
  if (sentTotal === 0) {
    return { ok: false, code: 'NO_UNITS', message: 'سپاهی برای حمله نداری؛ اول سرباز آموزش بده.' };
  }

  const result = simulateBattle({ units: sent, enemy, seed: seed ?? state.battle?.seed ?? 7 });

  const caps = storageCaps(state.village.buildings);
  const resources = grant(state.resources, result.loot, caps);

  const remainingUnits = { ...available };
  for (const [type, count] of Object.entries(sent)) {
    remainingUnits[type] = (remainingUnits[type] || 0) - count + (result.survivors[type] || 0);
    if (remainingUnits[type] <= 0) delete remainingUnits[type];
  }

  const entry = {
    id: `battle-${now}-${Math.round(result.destruction * 100)}`,
    at: now,
    name: enemy.name,
    level: enemy.level,
    stars: result.stars,
    win: result.stars > 0,
    sent: sentTotal,
    losses: result.attackerLosses,
    loot: result.loot,
  };

  const history = [entry, ...(state.battle?.history || [])].slice(0, 20);
  const stats = {
    ...state.stats,
    battlesWon: (state.stats?.battlesWon || 0) + (result.win ? 1 : 0),
    battlesLost: (state.stats?.battlesLost || 0) + (result.win ? 0 : 1),
  };

  return {
    ok: true,
    result,
    entry,
    state: {
      ...state,
      resources,
      stats,
      army: { ...state.army, units: remainingUnits },
      battle: { ...state.battle, history },
    },
  };
}

/** حریفان تازه برای نقشه‌ی نبرد. */
export function refreshOpponents(state, { seed } = {}) {
  const nextSeed = seed ?? ((state.battle?.seed || 7) + 1);
  const level = castleLevel(state.village);
  return {
    seed: nextSeed,
    opponents: createOpponents(level, nextSeed),
    state: { ...state, battle: { ...state.battle, seed: nextSeed } },
  };
}
