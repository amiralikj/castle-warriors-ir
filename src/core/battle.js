/**
 * تولید دشمن و شبیه‌سازی نبرد — کاملاً قطعی بر پایه‌ی بذر.
 * هیچ وابستگی‌ای به DOM یا ساعت واقعی ندارد.
 */
import { TROOPS } from '../data/troops.js';
import { BUILDINGS } from '../data/buildings.js';
import { createRng, randomInt, pick } from '../utils/random.js';
import { housingUsed } from './army.js';

export const ENEMY_NAMES = [
  'دهکده‌ی شن‌ها',
  'قلعه‌ی سیاه‌کوه',
  'روستای بادگیر',
  'دژ راهزنان',
  'دهکده‌ی خشک‌رود',
  'برج سرخ',
  'قلعه‌ی نمک‌زار',
];

const BUILDING_HP = { castle: 1200, goldMine: 320, farm: 300, goldStorage: 520, wheatStorage: 480, barracks: 420, watchtower: 600, fireTemple: 500, workshop: 380 };
const BUILDING_WEIGHT = { castle: 5, goldMine: 2, farm: 2, goldStorage: 3, wheatStorage: 3, barracks: 2, watchtower: 3, fireTemple: 2, workshop: 2 };
const LOOT_BUILDINGS = { goldStorage: 'gold', goldMine: 'gold', farm: 'wheat', wheatStorage: 'wheat' };
const PRIORITY = { watchtower: 0, fireTemple: 1, barracks: 2, goldMine: 3, farm: 3, goldStorage: 4, wheatStorage: 4, workshop: 5, castle: 9 };

export function buildingHp(type, level = 1) {
  const base = BUILDING_HP[type] || 300;
  return Math.round(base * (1 + 0.35 * (Math.max(1, level) - 1)));
}

function canPlaceEnemy(list, def, x, y) {
  for (const building of list) {
    const other = BUILDINGS[building.type];
    const overlap =
      x < building.x + other.size.w &&
      x + def.size.w > building.x &&
      y < building.y + other.size.h &&
      y + def.size.h > building.y;
    if (overlap) return false;
  }
  return true;
}

/**
 * دشمنی متناسب با سطح ارگ بازیکن می‌سازد.
 * @param {{seed?: number|string, level?: number, name?: string}} params
 */
export function generateEnemy({ seed = 1, level = 1, name } = {}) {
  const rng = createRng(seed);
  const enemyLevel = Math.max(1, Math.min(10, Math.round(level)));
  const buildings = [];

  const add = (type, levelOverride = enemyLevel) => {
    const def = BUILDINGS[type];
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = randomInt(rng, 0, 20 - def.size.w);
      const y = randomInt(rng, 0, 20 - def.size.h);
      if (!canPlaceEnemy(buildings, def, x, y)) continue;
      buildings.push({
        type,
        x,
        y,
        level: levelOverride,
        hp: buildingHp(type, levelOverride),
      });
      return true;
    }
    return false;
  };

  add('castle');
  const resources = 1 + enemyLevel;
  for (let i = 0; i < resources; i += 1) add(pick(rng, ['goldMine', 'farm']));
  add('goldStorage');
  add('wheatStorage');
  if (enemyLevel >= 2) add('barracks');
  for (let i = 0; i < Math.max(0, enemyLevel - 1); i += 1) add('watchtower');
  if (enemyLevel >= 4) add('fireTemple');

  const garrisonCount = enemyLevel * 3;
  const lootGold = Math.round((350 + 220 * enemyLevel) * (0.9 + rng() * 0.2));
  const lootWheat = Math.round((300 + 200 * enemyLevel) * (0.9 + rng() * 0.2));

  return {
    seed,
    name: name || pick(rng, ENEMY_NAMES),
    level: enemyLevel,
    buildings,
    garrison: garrisonCount > 0 ? [{ type: 'spearman', count: garrisonCount }] : [],
    loot: { gold: lootGold, wheat: lootWheat },
    defenseDps: buildings.reduce((sum, b) => {
      const def = BUILDINGS[b.type];
      if (b.type === 'watchtower') return sum + 18 * b.level;
      if (b.type === 'fireTemple') return sum + 10 * b.level;
      if (b.type === 'castle') return sum + 6 * b.level;
      return sum + (def.category === 'army' ? 4 : 0);
    }, 0),
  };
}

function garrisonDps(count) {
  return Math.round(count * (TROOPS.spearman.stats.dps * 0.5));
}

/** توان دفاعی دشمن برای نمایش در نقشه. */
export function enemyPower(enemy) {
  const hp = enemy.buildings.reduce((sum, b) => sum + b.hp, 0);
  return Math.round(hp * 0.4 + enemy.defenseDps * 6);
}

/** جمع‌بندی ارتش مهاجم. */
export function attackerStats(units = {}) {
  let hp = 0;
  let dps = 0;
  let housing = 0;
  let count = 0;
  for (const [type, n] of Object.entries(units)) {
    const troop = TROOPS[type];
    if (!troop || n <= 0) continue;
    hp += troop.stats.hp * n;
    dps += troop.stats.dps * n;
    housing += troop.housing * n;
    count += n;
  }
  return { hp, dps, housing, count };
}

/** ظرفیت غنیمت سپاه. */
export function lootCapacity(units = {}) {
  return 120 + housingUsed({ units, queue: [] }) * 45;
}

/**
 * شبیه‌سازی نبرد.
 * ارتش مهاجم به ترتیب اولویت، ساختمان‌ها را می‌شکند و پادگان دشمن هم آسیب می‌زند.
 * @returns {{win:boolean, stars:number, destruction:number, loot:{gold:number,wheat:number}, survivors:object, log:string[], rounds:number}}
 */
export function simulateBattle({ units = {}, enemy, seed = 1 }) {
  const rng = createRng(seed);
  const attacker = attackerStats(units);
  const initialHp = attacker.hp;
  let attackerHp = attacker.hp;
  const capacity = lootCapacity(units);

  const targets = [...enemy.buildings]
    .map((building) => ({
      ...building,
      hp: building.hp,
      maxHp: building.hp,
      priority: PRIORITY[building.type] ?? 5,
    }))
    .sort((a, b) => a.priority - b.priority || a.hp - b.hp);

  const totalWeight = targets.reduce((sum, t) => sum + (BUILDING_WEIGHT[t.type] || 1), 0);
  let destroyedWeight = 0;
  let castleDestroyed = false;
  const log = [];
  let round = 0;

  const enemyDps = enemy.defenseDps + garrisonDps(enemy.garrison?.reduce((sum, g) => sum + g.count, 0) || 0);

  while (round < 90 && attackerHp > 0 && targets.some((t) => t.hp > 0)) {
    round += 1;
    let damage = attacker.dps * (0.9 + rng() * 0.2);
    for (const target of targets) {
      if (damage <= 0) break;
      if (target.hp <= 0) continue;
      const applied = Math.min(target.hp, damage);
      target.hp -= applied;
      damage -= applied;
      if (target.hp <= 0) {
        destroyedWeight += BUILDING_WEIGHT[target.type] || 1;
        if (target.type === 'castle') castleDestroyed = true;
        if (log.length < 12) log.push(`${BUILDINGS[target.type]?.name || target.type} ویران شد.`);
      }
    }
    if (castleDestroyed) break;
    attackerHp = Math.max(0, attackerHp - enemyDps * (0.85 + rng() * 0.3));
  }

  const destruction = totalWeight > 0 ? Math.min(1, destroyedWeight / totalWeight) : 0;
  const stars = castleDestroyed ? 3 : destruction >= 0.5 ? 2 : destruction >= 0.15 ? 1 : 0;
  const survivalRatio = initialHp > 0 ? Math.max(0, attackerHp / initialHp) : 0;

  const survivors = {};
  for (const [type, count] of Object.entries(units)) {
    const alive = Math.floor(count * survivalRatio);
    if (alive > 0) survivors[type] = alive;
  }

  const lootRatio = Math.min(1, destruction * 1.1 + (castleDestroyed ? 0.2 : 0));
  const rawGold = Math.floor((enemy.loot?.gold || 0) * lootRatio);
  const rawWheat = Math.floor((enemy.loot?.wheat || 0) * lootRatio);
  const loot = {
    gold: Math.min(rawGold, capacity),
    wheat: Math.min(rawWheat, capacity),
  };

  if (stars === 0) log.push('سپاه عقب نشست؛ غنیمتی به دست نیامد.');
  else log.push(`نبرد با ${stars} ستاره تمام شد.`);

  return {
    win: stars > 0,
    stars,
    destruction,
    loot,
    capacity,
    survivors,
    log,
    rounds: round,
    attackerLosses: attacker.count - Object.values(survivors).reduce((sum, n) => sum + n, 0),
  };
}

/** ساخت دشمن پیشنهادی برای بازیکن (سه گزینه با بذرهای متفاوت). */
export function createOpponents(playerLevel = 1, seed = 1, count = 3) {
  return Array.from({ length: count }, (_, index) => {
    const level = Math.max(1, Math.min(10, playerLevel + (index - 1)));
    return generateEnemy({ seed: seed + index * 101, level });
  });
}
