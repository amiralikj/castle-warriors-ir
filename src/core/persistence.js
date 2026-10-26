/**
 * ذخیره‌سازی، اعتبارسنجی و پیشرفت آفلاین.
 * وضعیت بازی در localStorage نگه داشته می‌شود؛ همه‌ی توابع
 * یک «انبار» (storage) قابل تزریق می‌گیرند تا تست بدون مرورگر ممکن باشد.
 */
import { createResources, productionRates, storageCaps, accrue } from './economy.js';
import { createVillage, tick, castleLevel } from './village.js';
import { BUILDINGS } from '../data/buildings.js';

export const SAVE_VERSION = 1;
export const STORAGE_KEY = 'castle-warriors-ir:save';
/** حداکثر درآمد آفلاین؛ از انبار شدن بی‌پایان منابع جلوگیری می‌کند. */
export const MAX_OFFLINE_SECONDS = 8 * 3600;
export const GRID_LIMIT = 20;

/** انبار حافظه‌ای برای تست و محیط‌های بدون localStorage. */
export function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    _map: map,
  };
}

/** انبار واقعی مرورگر؛ اگر localStorage در دسترس نباشد، حافظه‌ای می‌شود. */
export function browserStorage() {
  try {
    const probe = '__cw_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}

/** وضعیت تازه‌ی بازی. */
export function createGameState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    resources: createResources(),
    village: createVillage(),
    stats: {
      battlesWon: 0,
      battlesLost: 0,
      totalGoldEarned: 0,
      totalWheatEarned: 0,
      buildingsBuilt: 1,
    },
    settings: { sound: true, theme: 'auto' },
  };
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clampLevel = (type, level) => {
  const def = BUILDINGS[type];
  return Math.max(1, Math.min(Math.round(finite(level, 1)), def.maxLevel));
};

/** یک ساختمان را پاک‌سازی می‌کند؛ نامعتبر باشد null برمی‌گردد. */
export function sanitizeBuilding(raw, size = GRID_LIMIT) {
  if (!isObject(raw)) return null;
  const def = BUILDINGS[raw.type];
  if (!def) return null;
  const x = Math.round(finite(raw.x, NaN));
  const y = Math.round(finite(raw.y, NaN));
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || y < 0 || x + def.size.w > size || y + def.size.h > size) return null;

  const level = clampLevel(raw.type, raw.level);
  const validState = ['idle', 'building', 'upgrading'].includes(raw.state) ? raw.state : 'idle';
  const completeAt = Number.isFinite(Number(raw.completeAt)) ? Number(raw.completeAt) : null;
  const startedAt = Number.isFinite(Number(raw.startedAt)) ? Number(raw.startedAt) : null;
  const targetLevel = Number.isFinite(Number(raw.targetLevel))
    ? clampLevel(raw.type, raw.targetLevel)
    : null;

  const safeState =
    validState !== 'idle' && (completeAt === null || targetLevel === null) ? 'idle' : validState;

  return {
    uid: Math.max(1, Math.round(finite(raw.uid, 1))),
    type: raw.type,
    level,
    x,
    y,
    state: safeState,
    startedAt: safeState === 'idle' ? null : startedAt,
    completeAt: safeState === 'idle' ? null : completeAt,
    targetLevel: safeState === 'idle' ? null : targetLevel,
  };
}

/** دهکده را پاک‌سازی می‌کند: ساختمان‌های نامعتبر حذف و ارگ تضمین می‌شود. */
export function sanitizeVillage(raw) {
  const size = GRID_LIMIT;
  if (!isObject(raw)) return createVillage();
  const seenUids = new Set();
  const occupied = new Set();
  const buildings = [];

  const list = Array.isArray(raw.buildings) ? raw.buildings : [];
  for (const candidate of list) {
    const building = sanitizeBuilding(candidate, size);
    if (!building) continue;
    if (seenUids.has(building.uid)) building.uid = Math.max(0, ...seenUids) + 1;
    const def = BUILDINGS[building.type];
    const cells = [];
    let overlaps = false;
    for (let dx = 0; dx < def.size.w && !overlaps; dx += 1) {
      for (let dy = 0; dy < def.size.h && !overlaps; dy += 1) {
        const key = `${building.x + dx}:${building.y + dy}`;
        if (occupied.has(key)) overlaps = true;
        cells.push(key);
      }
    }
    if (overlaps) continue;
    if (def.unique && buildings.some((b) => b.type === building.type)) continue;
    cells.forEach((cell) => occupied.add(cell));
    seenUids.add(building.uid);
    buildings.push(building);
  }

  if (!buildings.some((b) => b.type === 'castle')) {
    const castle = createVillage().buildings[0];
    while (buildings.some((b) => b.uid === castle.uid)) castle.uid += 1;
    buildings.unshift(castle);
    seenUids.add(castle.uid);
  }

  const nextUid = Math.max(Math.round(finite(raw.nextUid, 1)), Math.max(0, ...seenUids) + 1);
  return { size, nextUid, buildings };
}

/** وضعیت خام را به نسخه‌ی فعلی مهاجرت و پاک‌سازی می‌کند. */
export function migrate(raw) {
  if (!isObject(raw)) return null;
  const version = Math.round(finite(raw.version, 0));
  if (version > SAVE_VERSION) return null; // ذخیره‌ی نسخه‌ی جدیدتر را نمی‌شناسیم

  const now = Date.now();
  const base = createGameState(now);
  const village = sanitizeVillage(raw.village);
  const resources = isObject(raw.resources) ? raw.resources : {};

  return {
    ...base,
    version: SAVE_VERSION,
    createdAt: Math.round(finite(raw.createdAt, now)),
    lastSeen: Math.round(finite(raw.lastSeen, now)),
    resources: {
      gold: Math.max(0, Math.floor(finite(resources.gold, base.resources.gold))),
      wheat: Math.max(0, Math.floor(finite(resources.wheat, base.resources.wheat))),
      gems: Math.max(0, Math.floor(finite(resources.gems, base.resources.gems))),
    },
    village,
    stats: {
      ...base.stats,
      ...Object.fromEntries(
        Object.entries(isObject(raw.stats) ? raw.stats : {}).map(([key, value]) => [
          key,
          Math.max(0, Math.floor(finite(value, 0))),
        ]),
      ),
    },
    settings: {
      ...base.settings,
      ...(isObject(raw.settings) ? raw.settings : {}),
      sound: raw.settings?.sound !== false,
    },
  };
}

/** وضعیت را ذخیره می‌کند؛ خطای انبار باعث کرش نمی‌شود. */
export function saveState(storage, state) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSeen: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

/** وضعیت را می‌خواند؛ نبود یا خرابی ذخیره null برمی‌گرداند. */
export function loadState(storage) {
  if (!storage) return null;
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return null;
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
}

export function clearState(storage) {
  try {
    storage?.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * بازی را تا لحظه‌ی `now` جلو می‌برد: تایمرها تسویه، منابع تولید و
 * گزارش پیشرفت آفلاین ساخته می‌شود.
 */
export function advanceGame(state, now = Date.now()) {
  const safeNow = Math.max(state.lastSeen || 0, now);
  const elapsedRaw = Math.max(0, (safeNow - (state.lastSeen || safeNow)) / 1000);
  const elapsed = Math.min(elapsedRaw, MAX_OFFLINE_SECONDS);

  const village = tick(state.village, safeNow);
  const rates = productionRates(village.buildings);
  const caps = storageCaps(village.buildings);
  const before = state.resources;
  const resources = accrue(before, rates, caps, elapsed);

  const report = {
    seconds: Math.round(elapsed),
    cappedOut: elapsedRaw > MAX_OFFLINE_SECONDS,
    gold: Math.max(0, resources.gold - before.gold),
    wheat: Math.max(0, resources.wheat - before.wheat),
    completed: village.buildings.filter(
      (b) => b.state === 'idle' && state.village.buildings.some((o) => o.uid === b.uid && o.state !== 'idle'),
    ).length,
  };

  const stats = {
    ...state.stats,
    totalGoldEarned: (state.stats?.totalGoldEarned || 0) + report.gold,
    totalWheatEarned: (state.stats?.totalWheatEarned || 0) + report.wheat,
  };

  return {
    state: { ...state, village, resources, stats, lastSeen: safeNow },
    report,
  };
}

/** وضعیت را برای نمایش خلاصه می‌کند. */
export function summarize(state) {
  return {
    castleLevel: castleLevel(state.village),
    buildings: state.village.buildings.length,
    rates: productionRates(state.village.buildings),
    caps: storageCaps(state.village.buildings),
    resources: state.resources,
  };
}
