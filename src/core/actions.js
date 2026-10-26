/**
 * اکشن‌های سطح بازی: ترکیب اقتصاد و دهکده.
 * هر اکشن وضعیت جدید برمی‌گرداند یا {ok:false, code, message} می‌دهد.
 */
import { costFor, getBuilding, constructionSeconds, isUnlocked } from '../data/buildings.js';
import { canAfford, pay } from './economy.js';
import { addBuilding, canPlace, findByUid, castleLevel, startUpgrade } from './village.js';

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
