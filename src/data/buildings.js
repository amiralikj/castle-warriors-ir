/**
 * کاتالوگ ساختمان‌های «جنگاوران قلعه»
 * همه‌ی اعداد لاتین و خام هستند؛ نمایش فارسی در لایه‌ی UI انجام می‌شود.
 *
 * هر ساختمان:
 *   size        ابعاد روی شبکه‌ی روستا
 *   maxLevel    بالاترین سطح مجاز
 *   unique      فقط یک نمونه در روستا مجاز است
 *   unlockAt    سطح ارگ لازم برای ساخت
 *   cost        هزینه‌ی ساخت سطح ۱
 *   upgrade     { gold, wheat } پایه‌ی هزینه‌ی ارتقا (سطح ۲)
 *   growth      ضریب رشد هزینه در هر سطح
 *   time        { base, growth } ثانیه‌ی ساخت/ارتقا
 *   production  { resource, perHour, growth } تولید در سطح ۱
 *   capacity    { resource, base, growth } ظرفیت انبار در سطح ۱
 */
export const BUILDINGS = {
  castle: {
    id: 'castle',
    name: 'ارگ',
    description: 'قلب دهکده؛ سطح ارگ سقف پیشرفت و ساختمان‌های قابل ساخت را تعیین می‌کند.',
    category: 'main',
    icon: 'castle',
    size: { w: 4, h: 4 },
    maxLevel: 10,
    unique: true,
    unlockAt: 1,
    cost: { gold: 0, wheat: 0 },
    upgrade: { gold: 900, wheat: 900 },
    growth: 2.1,
    time: { base: 60, growth: 2.4 },
  },
  goldMine: {
    id: 'goldMine',
    name: 'معدن طلا',
    description: 'در دل کوه طلا استخراج می‌کند و به‌آرامی خزانه‌ی دهکده را پر می‌کند.',
    category: 'resource',
    icon: 'gold',
    size: { w: 2, h: 2 },
    maxLevel: 10,
    unlockAt: 1,
    cost: { gold: 120 },
    upgrade: { gold: 180 },
    growth: 1.85,
    time: { base: 45, growth: 1.75 },
    production: { resource: 'gold', perHour: 120, growth: 1.45 },
  },
  farm: {
    id: 'farm',
    name: 'کشتزار گندم',
    description: 'گندم، خوراک سپاه است؛ کشتزار آن را برای آموزش سرباز فراهم می‌کند.',
    category: 'resource',
    icon: 'wheat',
    size: { w: 2, h: 2 },
    maxLevel: 10,
    unlockAt: 1,
    cost: { gold: 90 },
    upgrade: { gold: 140 },
    growth: 1.85,
    time: { base: 40, growth: 1.75 },
    production: { resource: 'wheat', perHour: 140, growth: 1.45 },
  },
  goldStorage: {
    id: 'goldStorage',
    name: 'خزانه‌ی طلا',
    description: 'سقف نگهداری طلا را بالا می‌برد؛ بدون آن، طلای اضافه هدر می‌رود.',
    category: 'storage',
    icon: 'gold',
    size: { w: 3, h: 3 },
    maxLevel: 8,
    unlockAt: 1,
    cost: { gold: 220 },
    upgrade: { gold: 260 },
    growth: 1.9,
    time: { base: 90, growth: 1.9 },
    capacity: { resource: 'gold', base: 4000, growth: 1.6 },
  },
  wheatStorage: {
    id: 'wheatStorage',
    name: 'انبار گندم',
    description: 'گندم را خشک و سالم نگه می‌دارد و سقف ذخیره را بالا می‌برد.',
    category: 'storage',
    icon: 'wheat',
    size: { w: 3, h: 3 },
    maxLevel: 8,
    unlockAt: 1,
    cost: { gold: 160 },
    upgrade: { gold: 200 },
    growth: 1.9,
    time: { base: 80, growth: 1.9 },
    capacity: { resource: 'wheat', base: 4000, growth: 1.6 },
  },
  barracks: {
    id: 'barracks',
    name: 'سربازخانه',
    description: 'جای آموزش سپاه؛ سطح آن سرعت و ظرفیت آموزش را تعیین می‌کند.',
    category: 'army',
    icon: 'army',
    size: { w: 3, h: 3 },
    maxLevel: 6,
    unlockAt: 2,
    cost: { gold: 380, wheat: 120 },
    upgrade: { gold: 420, wheat: 160 },
    growth: 1.8,
    time: { base: 180, growth: 2 },
  },
  watchtower: {
    id: 'watchtower',
    name: 'برج دیده‌بانی',
    description: 'از فراز برج، مهاجمان را می‌بینند و به آن‌ها تیر می‌بندند.',
    category: 'defense',
    icon: 'castle',
    size: { w: 2, h: 2 },
    maxLevel: 6,
    unlockAt: 3,
    cost: { gold: 500, wheat: 200 },
    upgrade: { gold: 520, wheat: 220 },
    growth: 1.8,
    time: { base: 240, growth: 2 },
  },
  fireTemple: {
    id: 'fireTemple',
    name: 'آتشکده',
    description: 'آتش مقدس، توان رزمی سپاه را افزون می‌کند.',
    category: 'defense',
    icon: 'castle',
    size: { w: 2, h: 2 },
    maxLevel: 5,
    unlockAt: 4,
    cost: { gold: 800, wheat: 400 },
    upgrade: { gold: 900, wheat: 450 },
    growth: 1.9,
    time: { base: 300, growth: 2 },
  },
  workshop: {
    id: 'workshop',
    name: 'کارگاه',
    description: 'چرخ و چوب و آهن را به هم می‌بافد تا ابزار و سلاح سنگین ساخته شود.',
    category: 'economy',
    icon: 'castle',
    size: { w: 3, h: 3 },
    maxLevel: 5,
    unlockAt: 3,
    cost: { gold: 650 },
    upgrade: { gold: 700 },
    growth: 1.85,
    time: { base: 210, growth: 2 },
  },
};

export const BUILDING_IDS = Object.keys(BUILDINGS);

/** تعریف یک ساختمان را برمی‌گرداند؛ برای شناسه‌ی ناشناخته خطا می‌دهد. */
export function getBuilding(id) {
  const def = BUILDINGS[id];
  if (!def) throw new Error(`ساختمان ناشناخته: ${id}`);
  return def;
}

export function isBuildingId(id) {
  return Object.prototype.hasOwnProperty.call(BUILDINGS, id);
}

/** گرد کردن هزینه‌ها به مضرب ۵ برای خوانایی. */
export function roundCost(value) {
  return Math.max(0, Math.round(value / 5) * 5);
}

/** هزینه‌ی رسیدن به سطح مشخص. سطح ۱ = هزینه‌ی ساخت. */
export function costFor(id, level) {
  const def = getBuilding(id);
  const target = Math.max(1, Math.min(level, def.maxLevel));
  if (target === 1) return normalizeCost(def.cost);
  const factor = def.growth ** (target - 2);
  return normalizeCost({
    gold: roundCost((def.upgrade.gold || 0) * factor),
    wheat: roundCost((def.upgrade.wheat || 0) * factor),
  });
}

function normalizeCost(cost = {}) {
  return {
    ...(cost.gold ? { gold: cost.gold } : {}),
    ...(cost.wheat ? { wheat: cost.wheat } : {}),
  };
}

/** زمان ساخت یا ارتقا تا سطح مشخص، به ثانیه. */
export function constructionSeconds(id, level) {
  const def = getBuilding(id);
  const target = Math.max(1, Math.min(level, def.maxLevel));
  if (def.unique && target === 1) return 0;
  const factor = def.time.growth ** Math.max(0, target - 1);
  return Math.round(def.time.base * factor);
}

/** تولید در ساعت در سطح مشخص (۰ برای ساختمان‌های غیرتولیدی). */
export function productionFor(id, level) {
  const def = getBuilding(id);
  if (!def.production) return null;
  const safeLevel = Math.max(1, Math.min(level, def.maxLevel));
  return {
    resource: def.production.resource,
    perHour: Math.round(def.production.perHour * def.production.growth ** (safeLevel - 1)),
  };
}

/** ظرفیت انبار در سطح مشخص (۰ برای ساختمان‌های غیرانباری). */
export function capacityFor(id, level) {
  const def = getBuilding(id);
  if (!def.capacity) return null;
  const safeLevel = Math.max(1, Math.min(level, def.maxLevel));
  return {
    resource: def.capacity.resource,
    amount: Math.round(def.capacity.base * def.capacity.growth ** (safeLevel - 1)),
  };
}

/** آیا این ساختمان در سطح فعلی ارگ قابل ساخت است؟ */
export function isUnlocked(id, castleLevel) {
  return getBuilding(id).unlockAt <= Math.max(1, castleLevel);
}

/** فهرست ساختمان‌های قابل ساخت برای سطح ارگ. */
export function unlockedBuildings(castleLevel) {
  return BUILDING_IDS.map(getBuilding).filter((def) => isUnlocked(def.id, castleLevel));
}
