import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILDINGS,
  BUILDING_IDS,
  costFor,
  constructionSeconds,
  productionFor,
  capacityFor,
  isUnlocked,
  unlockedBuildings,
  getBuilding,
} from '../src/data/buildings.js';
import {
  createResources,
  canAfford,
  pay,
  grant,
  productionRates,
  storageCaps,
  accrue,
  fillRatio,
  castleLevelOf,
  STARTING_RESOURCES,
} from '../src/core/economy.js';

test('کاتالوگ ساختمان‌ها معتبر است', () => {
  assert.ok(BUILDING_IDS.length >= 8);
  for (const id of BUILDING_IDS) {
    const def = getBuilding(id);
    assert.equal(def.id, id);
    assert.ok(def.name.length > 1);
    assert.ok(def.size.w >= 1 && def.size.h >= 1);
    assert.ok(def.maxLevel >= 1);
    assert.ok(def.time.base >= 0);
    if (!def.unique) assert.ok(def.cost.gold >= 0);
  }
  assert.throws(() => getBuilding('nonexistent'), /ناشناخته/);
});

test('هزینه‌ی ارتقا با سطح رشد می‌کند و به مضرب ۵ گرد می‌شود', () => {
  const l1 = costFor('goldMine', 1);
  const l2 = costFor('goldMine', 2);
  const l3 = costFor('goldMine', 3);
  assert.deepEqual(l1, { gold: 120 });
  assert.ok(l2.gold > l1.gold);
  assert.ok(l3.gold > l2.gold);
  for (const cost of [l2.gold, l3.gold]) assert.equal(cost % 5, 0);
  assert.deepEqual(costFor('castle', 2), { gold: 900, wheat: 900 });
  // سطح بیش از سقف، به سقف محدود می‌شود
  assert.deepEqual(costFor('goldMine', 999), costFor('goldMine', BUILDINGS.goldMine.maxLevel));
});

test('زمان ساخت با سطح رشد می‌کند و ارگ اولیه فوری است', () => {
  assert.equal(constructionSeconds('castle', 1), 0);
  assert.ok(constructionSeconds('farm', 2) > constructionSeconds('farm', 1));
  assert.ok(constructionSeconds('barracks', 3) > constructionSeconds('barracks', 2));
});

test('تولید و ظرفیت بر پایه‌ی سطح محاسبه می‌شوند', () => {
  assert.deepEqual(productionFor('goldMine', 1), { resource: 'gold', perHour: 120 });
  assert.ok(productionFor('goldMine', 2).perHour > 120);
  assert.equal(productionFor('castle', 5), null);
  assert.deepEqual(capacityFor('goldStorage', 1), { resource: 'gold', amount: 4000 });
  assert.ok(capacityFor('goldStorage', 2).amount > 4000);
  assert.equal(capacityFor('farm', 2), null);
});

test('قفل ساختمان‌ها بر اساس سطح ارگ کار می‌کند', () => {
  assert.equal(isUnlocked('goldMine', 1), true);
  assert.equal(isUnlocked('barracks', 1), false);
  assert.equal(isUnlocked('barracks', 2), true);
  assert.equal(isUnlocked('watchtower', 2), false);
  assert.equal(isUnlocked('watchtower', 3), true);
  const early = unlockedBuildings(1).map((d) => d.id);
  assert.ok(!early.includes('barracks'));
  assert.ok(early.includes('farm'));
});

test('منابع اولیه و پرداخت نکردن هزینه‌ی ناکافی', () => {
  const resources = createResources();
  assert.equal(resources.gold, STARTING_RESOURCES.gold);
  assert.equal(canAfford(resources, { gold: 800 }), true);
  assert.equal(canAfford(resources, { gold: 801 }), false);

  const after = pay(resources, { gold: 300 });
  assert.equal(after.gold, 500);
  assert.equal(resources.gold, 800, 'شیء ورودی نباید تغییر کند');
  assert.equal(pay(resources, { gold: 99999 }), null);
  assert.deepEqual(pay(resources, {}), resources);
});

test('افزودن منابع به سقف ظرفیت محدود می‌شود ولی گوهر نه', () => {
  const capped = grant({ gold: 1450, wheat: 0, gems: 10 }, { gold: 500, gems: 500 }, { gold: 1500, wheat: 100 });
  assert.equal(capped.gold, 1500);
  assert.equal(capped.gems, 510);
  assert.equal(grant({ gold: 50 }, { wheat: 30 }, { wheat: 20 }).wheat, 20);
});

test('نرخ تولید مجموع ساختمان‌هاست و ساختمان ناشناخته نادیده گرفته می‌شود', () => {
  const rates = productionRates([
    { type: 'goldMine', level: 1 },
    { type: 'goldMine', level: 1 },
    { type: 'farm', level: 2 },
    { type: 'castle', level: 1 },
    { type: 'ghost', level: 1 },
    null,
  ]);
  assert.equal(rates.gold, 240);
  assert.equal(rates.wheat, productionFor('farm', 2).perHour);
});

test('سقف انبارها با ظرفیت پایه جمع می‌شود', () => {
  const caps = storageCaps([{ type: 'goldStorage', level: 1 }, { type: 'wheatStorage', level: 2 }]);
  assert.equal(caps.gold, 1500 + capacityFor('goldStorage', 1).amount);
  assert.equal(caps.wheat, 1500 + capacityFor('wheatStorage', 2).amount);
  const custom = storageCaps([], { base: { gold: 10, wheat: 20 } });
  assert.deepEqual(custom, { gold: 10, wheat: 20 });
});

test('تولید با گذشت زمان و محدودیت سقف کار می‌کند', () => {
  const rates = { gold: 3600, wheat: 1800 };
  const caps = { gold: 5000, wheat: 2000 };
  const afterHour = accrue({ gold: 0, wheat: 0, gems: 5 }, rates, caps, 3600);
  assert.equal(afterHour.gold, 3600);
  assert.equal(afterHour.wheat, 1800);
  assert.equal(afterHour.gems, 5);

  const afterLong = accrue({ gold: 4900, wheat: 1900, gems: 0 }, rates, caps, 86_400);
  assert.equal(afterLong.gold, 5000, 'از سقف عبور نمی‌کند');
  assert.equal(afterLong.wheat, 2000);

  const noTime = accrue({ gold: 10, wheat: 10, gems: 0 }, rates, caps, 0);
  assert.deepEqual(noTime, { gold: 10, wheat: 10, gems: 0 });
  assert.equal(accrue({ gold: 0, wheat: 0, gems: 0 }, rates, caps, 90).gold, 90);
});

test('درصد پرشدگی منابع بین ۰ و ۱ می‌ماند', () => {
  assert.equal(fillRatio({ gold: 500 }, { gold: 1000 }, 'gold'), 0.5);
  assert.equal(fillRatio({ gold: 5000 }, { gold: 1000 }, 'gold'), 1);
  assert.equal(fillRatio({ gold: 10 }, {}, 'gold'), 0);
});

test('سطح ارگ از ساختمان‌ها خوانده می‌شود', () => {
  assert.equal(castleLevelOf([{ type: 'farm', level: 3 }]), 1);
  assert.equal(castleLevelOf([{ type: 'castle', level: 4 }, { type: 'farm', level: 9 }]), 4);
});
