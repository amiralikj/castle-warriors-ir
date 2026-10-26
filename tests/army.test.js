import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createArmy,
  armyCapacity,
  housingUsed,
  housingFree,
  queueLimit,
  enqueueTraining,
  tickArmy,
  jobProgress,
  jobRemaining,
  armyPower,
  totalUnits,
  roster,
} from '../src/core/army.js';
import { TROOPS, trainingSeconds, troopCost, unlockedTroops, getTroop } from '../src/data/troops.js';
import { barracksLevel, trainUnits } from '../src/core/actions.js';
import { createGameState } from '../src/core/persistence.js';
import { addBuilding, tick } from '../src/core/village.js';

const NOW = 1_700_000_000_000;

test('ارتش تازه خالی است و ظرفیت با سطح سربازخانه رشد می‌کند', () => {
  const army = createArmy();
  assert.deepEqual(army, { units: {}, queue: [] });
  assert.equal(totalUnits(army), 0);
  assert.equal(housingUsed(army), 0);
  assert.ok(armyCapacity(2) > armyCapacity(1));
  assert.equal(housingFree(army, 1), armyCapacity(1));
  assert.ok(queueLimit(3) >= queueLimit(1));
});

test('کاتالوگ سربازان معتبر و هزینه‌شان درست است', () => {
  for (const id of Object.keys(TROOPS)) {
    const troop = getTroop(id);
    assert.equal(troop.id, id);
    assert.ok(troop.stats.hp > 0 && troop.stats.dps > 0);
    assert.ok(troop.cost.wheat > 0);
    assert.equal(troopCost(id, 3).wheat, troop.cost.wheat * 3);
  }
  assert.throws(() => getTroop('ghost'), /ناشناخته/);
  assert.deepEqual(unlockedTroops(1).map((t) => t.id).sort(), ['archer', 'spearman']);
});

test('زمان آموزش با تعداد و سطح سربازخانه تغییر می‌کند', () => {
  assert.ok(trainingSeconds('spearman', 5) > trainingSeconds('spearman', 1));
  assert.ok(trainingSeconds('spearman', 5, 4) < trainingSeconds('spearman', 5, 1));
});

test('افزودن دسته به صف آموزش و تکمیل آن', () => {
  const army = createArmy();
  const result = enqueueTraining(army, { type: 'spearman', count: 3, now: NOW, barracksLevel: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.army.queue.length, 1);
  assert.equal(housingUsed(result.army), 3);

  const early = tickArmy(result.army, NOW + 1000);
  assert.equal(early.completed.length, 0);
  assert.equal(jobRemaining(result.job, NOW), result.job.seconds * 1000);
  assert.equal(jobProgress(result.job, NOW), 0);

  const done = tickArmy(result.army, result.job.completeAt);
  assert.deepEqual(done.completed, [{ type: 'spearman', count: 3 }]);
  assert.equal(done.army.units.spearman, 3);
  assert.equal(done.army.queue.length, 0);
  assert.equal(jobProgress(result.job, result.job.completeAt + 5000), 1);
});

test('دسته‌های صف به ترتیب پشت سر هم آموزش می‌بینند', () => {
  const army = createArmy();
  const first = enqueueTraining(army, { type: 'spearman', count: 2, now: NOW, barracksLevel: 1 });
  const second = enqueueTraining(first.army, { type: 'archer', count: 1, now: NOW, barracksLevel: 1 });
  assert.equal(second.ok, true);
  assert.ok(second.job.startedAt >= first.job.completeAt - 1, 'دسته‌ی دوم بعد از اولی شروع می‌شود');
});

test('محدودیت ظرفیت و صف و سرباز قفل‌شده اعمال می‌شود', () => {
  const army = createArmy();
  const tooMany = enqueueTraining(army, { type: 'spearman', count: armyCapacity(1) + 1, now: NOW, barracksLevel: 1 });
  assert.equal(tooMany.code, 'FULL');

  let full = army;
  for (let i = 0; i < queueLimit(1); i += 1) {
    const result = enqueueTraining(full, { type: 'spearman', count: 1, now: NOW + i, barracksLevel: 1 });
    assert.equal(result.ok, true);
    full = result.army;
  }
  assert.equal(enqueueTraining(full, { type: 'spearman', count: 1, now: NOW + 100, barracksLevel: 1 }).code, 'QUEUE_FULL');
  assert.equal(enqueueTraining(army, { type: 'spearman', count: 0 }).code, 'INVALID_COUNT');
});

test('توان رزمی و فهرست سربازان محاسبه می‌شود', () => {
  const army = { units: { spearman: 4, archer: 2 }, queue: [] };
  assert.ok(armyPower(army) > 0);
  assert.deepEqual(roster(army).map((r) => r.type).sort(), ['archer', 'spearman']);
  assert.equal(totalUnits(army), 6);
});

test('آموزش بدون سربازخانه رد می‌شود', () => {
  const state = createGameState(NOW);
  assert.equal(barracksLevel(state.village), 0);
  const result = trainUnits(state, { type: 'spearman', count: 1, now: NOW });
  assert.equal(result.code, 'NO_BARRACKS');
});

test('آموزش با سربازخانه گندم کسر می‌کند و در صف می‌گذارد', () => {
  const state = {
    ...createGameState(NOW),
    resources: { gold: 5000, wheat: 5000, gems: 0 },
  };
  const { village } = addBuilding(
    { ...state.village, buildings: state.village.buildings.map((b) => ({ ...b, level: 2 })) },
    { type: 'barracks', x: 0, y: 0, now: NOW },
  );
  const readyVillage = tick(village, NOW + 10 * 60 * 1000);
  const ready = { ...state, village: readyVillage };
  assert.equal(barracksLevel(readyVillage), 1);

  const result = trainUnits(ready, { type: 'spearman', count: 2, now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.state.resources.wheat, 5000 - troopCost('spearman', 2).wheat);
  assert.equal(result.state.army.queue.length, 1);

  const noMoney = trainUnits({ ...ready, resources: { gold: 0, wheat: 0, gems: 0 } }, { type: 'spearman', count: 1, now: NOW });
  assert.equal(noMoney.code, 'NO_RESOURCES');
});
