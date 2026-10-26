import test from 'node:test';
import assert from 'node:assert/strict';
import { renderArmy } from '../src/ui/screens/army.js';
import { createGameState } from '../src/core/persistence.js';
import { addBuilding, tick } from '../src/core/village.js';
import { createArmy, enqueueTraining } from '../src/core/army.js';

const NOW = 1_700_000_000_000;

function villageWithBarracks() {
  const state = { ...createGameState(NOW), resources: { gold: 5000, wheat: 5000, gems: 20 } };
  const raised = { ...state.village, buildings: state.village.buildings.map((b) => ({ ...b, level: 2 })) };
  const { village } = addBuilding(raised, { type: 'barracks', x: 0, y: 0, now: NOW });
  return tick(village, NOW + 3600_000);
}

test('بدون سربازخانه حالت خالی با راهنما نمایش داده می‌شود', () => {
  const html = renderArmy(createGameState(NOW), { now: NOW });
  assert.match(html, /سربازخانه نداری/);
  assert.match(html, /href="#\/village"/);
  assert.doesNotMatch(html, /data-train=/);
});

test('با سربازخانه کارت سربازها و ظرفیت رندر می‌شود', () => {
  const state = { ...createGameState(NOW), resources: { gold: 5000, wheat: 5000, gems: 20 }, village: villageWithBarracks() };
  const html = renderArmy(state, { now: NOW });
  assert.match(html, /سپاه من/);
  assert.match(html, /سربازخانه سطح ۱/);
  assert.match(html, /data-train="spearman"/);
  assert.match(html, /data-train="archer"/);
  assert.match(html, /ظرفیت سپاه/);
  assert.match(html, /صف آموزش/);
  assert.match(html, /صف خالی است/);
  assert.doesNotMatch(html, /گندم کافی نیست/);
});

test('صف آموزش با شمارش معکوس و نوار پیشرفت نمایش می‌شود', () => {
  const village = villageWithBarracks();
  const queued = enqueueTraining(createArmy(), { type: 'spearman', count: 3, now: NOW, barracksLevel: 1 });
  const state = {
    ...createGameState(NOW),
    village,
    army: queued.army,
    resources: { gold: 5000, wheat: 5000, gems: 0 },
  };
  const html = renderArmy(state, { now: NOW });
  assert.match(html, /data-timer=/);
  assert.match(html, /data-progress=/);
  assert.match(html, /۳ نیزه‌دار/);
});

test('کمبود گندم و ظرفیت دلیل غیرفعال بودن آموزش را نشان می‌دهد', () => {
  const village = villageWithBarracks();
  const broke = renderArmy({ ...createGameState(NOW), village, resources: { gold: 0, wheat: 0, gems: 0 } }, { now: NOW });
  assert.match(broke, /گندم کافی نیست/);

  const fullArmy = { units: { spearman: 40 }, queue: [] };
  const full = renderArmy({ ...createGameState(NOW), village, army: fullArmy, resources: { gold: 5000, wheat: 5000, gems: 0 } }, { now: NOW });
  assert.match(full, /ظرفیت سپاه پر است/);
});
