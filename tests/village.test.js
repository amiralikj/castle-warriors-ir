import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE,
  createVillage,
  footprint,
  castleLevel,
  buildingAt,
  canPlace,
  addBuilding,
  startUpgrade,
  tick,
  remainingMs,
  progressRatio,
  busyBuildings,
  moveBuilding,
  countOfType,
  findByUid,
} from '../src/core/village.js';
import { constructionSeconds, costFor } from '../src/data/buildings.js';

test('دهکده‌ی تازه یک ارگ سطح ۱ در مرکز دارد', () => {
  const village = createVillage();
  assert.equal(village.size, GRID_SIZE);
  assert.equal(village.buildings.length, 1);
  const castle = village.buildings[0];
  assert.equal(castle.type, 'castle');
  assert.equal(castle.level, 1);
  assert.equal(castle.state, 'idle');
  assert.equal(castleLevel(village), 1);
  assert.equal(footprint(castle).length, 16);
});

test('جای‌گذاری بیرون از شبکه رد می‌شود', () => {
  const village = createVillage();
  assert.equal(canPlace(village, 'farm', -1, 0).code, 'OUT_OF_BOUNDS');
  assert.equal(canPlace(village, 'farm', 19, 0).code, 'OUT_OF_BOUNDS');
  assert.throws(() => canPlace(village, 'factory', 0, 0), /ناشناخته/);
});

test('ساختمان روی ساختمان دیگر ساخته نمی‌شود', () => {
  const village = createVillage();
  assert.equal(canPlace(village, 'farm', 8, 8).code, 'OCCUPIED');
  assert.equal(canPlace(village, 'farm', 7, 7).code, 'OCCUPIED');
  assert.equal(canPlace(village, 'farm', 0, 0).ok, true);
});

test('ساختمان قفل‌شده بدون سطح ارگ ساخته نمی‌شود', () => {
  const village = createVillage();
  assert.equal(canPlace(village, 'barracks', 0, 0).code, 'LOCKED');
  assert.equal(canPlace(village, 'goldMine', 0, 0).ok, true);
});

test('ساختمان یکتا دوباره ساخته نمی‌شود', () => {
  const village = createVillage();
  assert.equal(canPlace(village, 'castle', 0, 0).code, 'UNIQUE');
});

test('ساخت با تایمر شروع می‌شود و در زمان مقرر کامل می‌شود', () => {
  const village = createVillage();
  const result = addBuilding(village, { type: 'farm', x: 0, y: 0, now: 1000 });
  assert.equal(result.ok, true);
  const farm = result.building;
  assert.equal(farm.state, 'building');
  assert.equal(farm.completeAt, 1000 + constructionSeconds('farm', 1) * 1000);

  const busyVillage = result.village;
  assert.equal(busyBuildings(busyVillage).length, 1);
  assert.equal(buildingAt(busyVillage, 1, 1).uid, farm.uid);

  const before = tick(busyVillage, 1500);
  assert.equal(findByUid(before, farm.uid).state, 'building');
  assert.ok(remainingMs(findByUid(before, farm.uid), 1500) > 0);

  const done = tick(busyVillage, farm.completeAt);
  const finished = findByUid(done, farm.uid);
  assert.equal(finished.state, 'idle');
  assert.equal(finished.completeAt, null);
  assert.equal(finished.level, 1);
  assert.equal(busyBuildings(done).length, 0);
});

test('پیشرفت ساخت نسبی و کران‌دار است', () => {
  const village = createVillage();
  const { building } = addBuilding(village, { type: 'goldMine', x: 0, y: 0, now: 0 });
  assert.equal(progressRatio(building, 0), 0);
  assert.ok(progressRatio(building, building.completeAt / 2) > 0.4);
  assert.equal(progressRatio(building, building.completeAt + 10_000), 1);
  assert.equal(progressRatio({ ...building, state: 'idle' }, 0), 1);
});

test('ارتقا سطح را بالا می‌برد و سپس تایمر تسویه می‌شود', () => {
  const village = createVillage();
  const uid = village.buildings[0].uid;
  const started = startUpgrade(village, uid, 5000);
  assert.equal(started.ok, true);
  assert.equal(started.building.targetLevel, 2);
  assert.deepEqual(started.cost, costFor('castle', 2));
  assert.equal(started.seconds, constructionSeconds('castle', 2));
  assert.equal(castleLevel(started.village), 1, 'سطح تا پایان ساخت تغییر نمی‌کند');
  assert.equal(startUpgrade(started.village, uid, 6000).code, 'BUSY');

  const done = tick(started.village, started.building.completeAt);
  assert.equal(castleLevel(done), 2);
  assert.equal(findByUid(done, uid).state, 'idle');
});

test('ارتقای ساختمان ناشناخته و سطح حداکثر رد می‌شود', () => {
  const village = createVillage();
  assert.equal(startUpgrade(village, 999, 0).code, 'NOT_FOUND');
  const maxed = {
    ...village,
    buildings: village.buildings.map((b) => ({ ...b, level: 10 })),
  };
  assert.equal(startUpgrade(maxed, 1, 0).code, 'MAX_LEVEL');
});

test('جابه‌جایی ساختمان فقط روی زمین خالی ممکن است', () => {
  const village = createVillage();
  const { village: withFarm, building: farm } = addBuilding(village, { type: 'farm', x: 0, y: 0, now: 0 });
  const done = tick(withFarm, farm.completeAt);

  assert.equal(moveBuilding(done, farm.uid, 8, 8).code, 'OCCUPIED');
  assert.equal(moveBuilding(done, 4242, 0, 0).code, 'NOT_FOUND');
  const moved = moveBuilding(done, farm.uid, 3, 4);
  assert.equal(moved.ok, true);
  assert.equal(findByUid(moved.village, farm.uid).x, 3);

  const busy = startUpgrade(done, farm.uid, 0);
  assert.equal(moveBuilding(busy.village, farm.uid, 5, 5).code, 'BUSY');
});

test('شمارش ساختمان‌ها و یافتن خانه‌ها درست است', () => {
  const village = createVillage();
  const { village: withFarm } = addBuilding(village, { type: 'farm', x: 0, y: 0, now: 0 });
  assert.equal(countOfType(withFarm, 'farm'), 1);
  assert.equal(countOfType(withFarm, 'castle'), 1);
  assert.equal(buildingAt(withFarm, 0, 1).type, 'farm');
  assert.equal(buildingAt(withFarm, 19, 19), null);
  assert.equal(findByUid(withFarm, 1).type, 'castle');
});
