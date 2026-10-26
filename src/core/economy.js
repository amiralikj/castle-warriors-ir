/**
 * منطق خالص اقتصاد: منابع، هزینه، تولید و ظرفیت.
 * هیچ‌جا از Date.now استفاده نمی‌شود؛ زمان تزریق می‌شود.
 */
import { BUILDINGS, capacityFor, getBuilding, productionFor } from '../data/buildings.js';

export const RESOURCE_KEYS = ['gold', 'wheat', 'gems'];
export const CAPPED_RESOURCES = ['gold', 'wheat'];

/** منابع اولیه‌ی یک دهکده‌ی تازه. */
export const STARTING_RESOURCES = Object.freeze({ gold: 800, wheat: 600, gems: 50 });

export function createResources(initial = STARTING_RESOURCES) {
  return {
    gold: Math.max(0, Number(initial.gold) || 0),
    wheat: Math.max(0, Number(initial.wheat) || 0),
    gems: Math.max(0, Number(initial.gems) || 0),
  };
}

/** آیا منابع برای پرداخت هزینه کافی است؟ */
export function canAfford(resources, cost = {}) {
  return Object.entries(cost).every(([key, amount]) => (resources[key] || 0) >= (amount || 0));
}

/**
 * هزینه را از منابع کم می‌کند و شیء جدید برمی‌گرداند.
 * اگر منابع کافی نباشد null برمی‌گردد. شیء ورودی تغییر نمی‌کند.
 */
export function pay(resources, cost = {}) {
  if (!canAfford(resources, cost)) return null;
  const next = { ...resources };
  for (const [key, amount] of Object.entries(cost)) next[key] = (next[key] || 0) - (amount || 0);
  return next;
}

/** منابع را اضافه می‌کند و به سقف ظرفیت محدود می‌کند. گوهر سقف ندارد. */
export function grant(resources, gain = {}, caps = {}) {
  const next = { ...resources };
  for (const [key, amount] of Object.entries(gain)) {
    if (!amount) continue;
    const raw = Math.max(0, (next[key] || 0) + amount);
    const cap = caps[key];
    next[key] = Number.isFinite(cap) ? Math.min(raw, cap) : raw;
  }
  return next;
}

/**
 * نرخ تولید در ساعت بر پایه‌ی ساختمان‌های ساخته‌شده.
 * @param {Array<{type: string, level: number}>} buildings
 */
export function productionRates(buildings = []) {
  const rates = { gold: 0, wheat: 0 };
  for (const building of buildings) {
    if (!building || !BUILDINGS[building.type]) continue;
    const production = productionFor(building.type, building.level);
    if (production) rates[production.resource] += production.perHour;
  }
  return rates;
}

/**
 * سقف ذخیره بر پایه‌ی انبارها. حداقل پایه همیشه در دسترس است
 * تا بازیکن تازه‌وارد هیچ‌وقت در بن‌بست نماند.
 */
export function storageCaps(buildings = [], { base = { gold: 1500, wheat: 1500 } } = {}) {
  const caps = { ...base };
  for (const building of buildings) {
    if (!building || !BUILDINGS[building.type]) continue;
    const capacity = capacityFor(building.type, building.level);
    if (capacity) caps[capacity.resource] = (caps[capacity.resource] || 0) + capacity.amount;
  }
  return caps;
}

/**
 * منابع را با گذشت زمان جلو می‌برد (تولید پیوسته و محدود به سقف).
 * @param {{gold:number,wheat:number,gems:number}} resources
 * @param {{gold:number,wheat:number}} rates نرخ در ساعت
 * @param {{gold:number,wheat:number}} caps
 * @param {number} seconds
 */
export function accrue(resources, rates, caps, seconds) {
  if (!(seconds > 0)) return { ...resources };
  const gain = {};
  for (const [key, rate] of Object.entries(rates)) {
    if (rate > 0) gain[key] = (rate / 3600) * seconds;
  }
  const next = { ...resources };
  for (const [key, amount] of Object.entries(gain)) {
    const cap = caps[key];
    const value = (next[key] || 0) + amount;
    next[key] = Number.isFinite(cap) ? Math.min(value, cap) : value;
  }
  // منابع همیشه عدد صحیح ذخیره می‌شوند
  for (const key of RESOURCE_KEYS) next[key] = Math.floor(next[key] || 0);
  return next;
}

/** درصد پرشدگی یک منبع (۰ تا ۱). */
export function fillRatio(resources, caps, key) {
  const cap = caps[key];
  if (!Number.isFinite(cap) || cap <= 0) return 0;
  return Math.max(0, Math.min(1, (resources[key] || 0) / cap));
}

/** آیا ساختمان هزینه‌ی ساختش را دارد؟ */
export function affordableBuildings(resources, castleLevel, costFn) {
  return Object.values(BUILDINGS)
    .filter((def) => def.unlockAt <= castleLevel && !def.unique)
    .filter((def) => canAfford(resources, costFn(def.id, 1)))
    .map((def) => def.id);
}

/** سطح ارگ از میان ساختمان‌های موجود. */
export function castleLevelOf(buildings = []) {
  const castle = buildings.find((b) => b.type === 'castle');
  return castle ? castle.level : 1;
}

/** بررسی می‌کند شناسه‌ی ساختمان معتبر باشد. */
export function assertKnownBuilding(id) {
  return getBuilding(id);
}
