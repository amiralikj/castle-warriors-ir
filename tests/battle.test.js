import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateEnemy,
  simulateBattle,
  attackerStats,
  lootCapacity,
  enemyPower,
  createOpponents,
  buildingHp,
} from '../src/core/battle.js';
import { BUILDINGS } from '../src/data/buildings.js';
import { createRng, hashSeed } from '../src/utils/random.js';

test('مولد تصادفی بذردار قطعی است', () => {
  const a = createRng(42);
  const b = createRng(42);
  const c = createRng(43);
  assert.equal(a(), b());
  assert.notEqual(createRng(1)(), c());
  assert.equal(hashSeed('قلعه'), hashSeed('قلعه'));
  assert.ok(createRng('castle')(), 'بذر متنی هم کار می‌کند');
});

test('تولید دشمن قطعی، معتبر و بدون هم‌پوشانی است', () => {
  const enemy = generateEnemy({ seed: 7, level: 3 });
  const again = generateEnemy({ seed: 7, level: 3 });
  assert.deepEqual(enemy, again, 'با بذر یکسان نتیجه یکسان است');
  assert.ok(enemy.buildings.some((b) => b.type === 'castle'));
  assert.ok(enemy.buildings.length >= 4);
  assert.ok(enemy.loot.gold > 0 && enemy.loot.wheat > 0);

  const cells = new Set();
  for (const building of enemy.buildings) {
    const def = BUILDINGS[building.type];
    assert.ok(building.x >= 0 && building.y >= 0);
    assert.ok(building.x + def.size.w <= 20 && building.y + def.size.h <= 20);
    for (let dx = 0; dx < def.size.w; dx += 1) {
      for (let dy = 0; dy < def.size.h; dy += 1) {
        const key = `${building.x + dx}:${building.y + dy}`;
        assert.equal(cells.has(key), false, 'خانه‌ها نباید هم‌پوشانی داشته باشند');
        cells.add(key);
      }
    }
  }
});

test('دشمن سطح بالاتر قوی‌تر و ثروتمندتر است', () => {
  const low = generateEnemy({ seed: 5, level: 1 });
  const high = generateEnemy({ seed: 5, level: 8 });
  assert.ok(enemyPower(high) > enemyPower(low));
  assert.ok(high.loot.gold > low.loot.gold);
  assert.ok(high.buildings.some((b) => b.type === 'watchtower'));
  assert.equal(low.buildings.some((b) => b.type === 'watchtower'), false);
});

test('ارتش قوی دشمن ضعیف را با سه ستاره می‌شکند', () => {
  const enemy = generateEnemy({ seed: 11, level: 1 });
  const units = { spearman: 80, archer: 30 };
  const result = simulateBattle({ units, enemy, seed: 99 });
  assert.equal(result.win, true);
  assert.equal(result.stars, 3);
  assert.ok(result.loot.gold > 0);
  assert.ok(result.loot.gold <= enemy.loot.gold);
  assert.ok(result.loot.gold <= result.capacity, 'غنیمت از ظرفیت سپاه بیشتر نمی‌شود');
  assert.ok(result.destruction > 0.5);
  assert.ok(result.log.length > 0);
  const survivors = Object.values(result.survivors).reduce((sum, n) => sum + n, 0);
  assert.ok(survivors <= 110);
});

test('نبرد با بذر یکسان دقیقاً تکرارپذیر است', () => {
  const enemy = generateEnemy({ seed: 3, level: 4 });
  const units = { spearman: 25, archer: 10 };
  const a = simulateBattle({ units, enemy, seed: 123 });
  const b = simulateBattle({ units, enemy, seed: 123 });
  assert.deepEqual(a, b);
  for (const field of ['stars', 'rounds', 'destruction']) {
    assert.equal(typeof a[field], 'number');
  }
  // بذر دشمن، چیدمان و غنیمت را تغییر می‌دهد
  assert.notDeepEqual(generateEnemy({ seed: 4, level: 4 }), enemy);
});

test('ارتش خالی هیچ ستاره و غنیمتی ندارد', () => {
  const enemy = generateEnemy({ seed: 2, level: 2 });
  const result = simulateBattle({ units: {}, enemy, seed: 1 });
  assert.equal(result.stars, 0);
  assert.equal(result.win, false);
  assert.deepEqual(result.loot, { gold: 0, wheat: 0 });
  assert.deepEqual(result.survivors, {});
  assert.equal(result.rounds, 0);
});

test('آمار مهاجم، ظرفیت غنیمت و توان دشمن محاسبه می‌شود', () => {
  const stats = attackerStats({ spearman: 10, archer: 5, ghost: 100 });
  assert.equal(stats.count, 15);
  assert.equal(stats.housing, 15);
  assert.ok(stats.hp === 10 * 120 + 5 * 80);
  assert.ok(lootCapacity({ spearman: 10 }) > lootCapacity({ spearman: 1 }));
  assert.ok(buildingHp('castle', 3) > buildingHp('castle', 1));
  assert.equal(attackerStats({}).count, 0);
});

test('سه حریف پیشنهادی با سطوح نزدیک به بازیکن ساخته می‌شوند', () => {
  const opponents = createOpponents(4, 100);
  assert.equal(opponents.length, 3);
  assert.deepEqual(opponents.map((o) => o.level), [3, 4, 5]);
  assert.equal(new Set(opponents.map((o) => o.seed)).size, 3);
});
