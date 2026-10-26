import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuilding, upgradeBuilding, upgradePreview } from '../src/core/actions.js';
import { createGameState } from '../src/core/persistence.js';
import { tick, findByUid, castleLevel } from '../src/core/village.js';
import { costFor, constructionSeconds } from '../src/data/buildings.js';

const NOW = 1_700_000_000_000;

test('ساخت ساختمان هزینه را کسر می‌کند و تایمر می‌گذارد', () => {
  const state = createGameState(NOW);
  const before = state.resources.gold;
  const result = buildBuilding(state, { type: 'farm', x: 0, y: 0, now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.state.resources.gold, before - costFor('farm', 1).gold);
  assert.equal(result.state.village.buildings.length, 2);
  assert.equal(result.building.state, 'building');
  assert.equal(result.state.resources.gold, state.resources.gold - result.cost.gold, 'شیء اصلی تغییر نمی‌کند');
  assert.equal(result.state.stats.buildingsBuilt, 2);
});

test('ساخت با منابع ناکافی رد می‌شود', () => {
  const state = { ...createGameState(NOW), resources: { gold: 0, wheat: 0, gems: 0 } };
  const result = buildBuilding(state, { type: 'farm', x: 0, y: 0, now: NOW });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NO_RESOURCES');
  assert.match(result.message, /منابع/);
});

test('ساخت ساختمان قفل‌شده یا روی زمین اشغال رد می‌شود', () => {
  const state = createGameState(NOW);
  assert.equal(buildBuilding(state, { type: 'barracks', x: 0, y: 0, now: NOW }).code, 'LOCKED');
  assert.equal(buildBuilding(state, { type: 'farm', x: 8, y: 8, now: NOW }).code, 'OCCUPIED');
  assert.equal(buildBuilding(state, { type: 'farm', x: 19, y: 19, now: NOW }).code, 'OUT_OF_BOUNDS');
  assert.throws(() => buildBuilding(state, { type: 'ghost', x: 0, y: 0 }), /ناشناخته/);
});

test('ارتقا هزینه می‌گیرد، قفل می‌کند و سپس سطح را بالا می‌برد', () => {
  const state = { ...createGameState(NOW), resources: { gold: 5000, wheat: 5000, gems: 50 } };
  const castle = state.village.buildings[0];
  const result = upgradeBuilding(state, { uid: castle.uid, now: NOW });
  assert.equal(result.ok, true);
  assert.deepEqual(result.cost, costFor('castle', 2));
  assert.equal(result.seconds, constructionSeconds('castle', 2));
  assert.equal(result.state.resources.gold, 5000 - result.cost.gold);
  assert.equal(findByUid(result.state.village, castle.uid).state, 'upgrading');

  const after = tick(result.state.village, NOW + constructionSeconds('castle', 2) * 1000 + 10);
  const upgraded = { ...result.state, village: after };
  assert.equal(castleLevel(upgraded.village), 2);

  // بعد از ارتقا، سربازخانه باز می‌شود
  assert.equal(buildBuilding(upgraded, { type: 'barracks', x: 0, y: 0, now: NOW }).ok, true);
});

test('ارتقای در حال انجام و سطح حداکثر رد می‌شوند', () => {
  const state = { ...createGameState(NOW), resources: { gold: 5000, wheat: 5000, gems: 0 } };
  const castle = state.village.buildings[0];
  const first = upgradeBuilding(state, { uid: castle.uid, now: NOW });
  assert.equal(upgradeBuilding(first.state, { uid: castle.uid, now: NOW }).code, 'BUSY');

  const maxed = {
    ...state,
    village: { ...state.village, buildings: state.village.buildings.map((b) => ({ ...b, level: 10 })) },
  };
  assert.equal(upgradeBuilding(maxed, { uid: castle.uid, now: NOW }).code, 'MAX_LEVEL');
  assert.equal(upgradeBuilding(state, { uid: 999, now: NOW }).code, 'NOT_FOUND');
});

test('ارتقای بدون منابع رد می‌شود و هزینه‌ای کسر نمی‌شود', () => {
  const state = { ...createGameState(NOW), resources: { gold: 10, wheat: 10, gems: 0 } };
  const castle = state.village.buildings[0];
  const result = upgradeBuilding(state, { uid: castle.uid, now: NOW });
  assert.equal(result.code, 'NO_RESOURCES');
  assert.equal(state.resources.gold, 10);
});

test('پیش‌نمایش ارتقا هزینه، زمان و سقف را نشان می‌دهد', () => {
  const state = createGameState(NOW);
  const castled = state.village.buildings[0];
  const preview = upgradePreview(state.village, castled.uid);
  assert.equal(preview.atMax, false);
  assert.deepEqual(preview.cost, costFor('castle', 2));
  assert.ok(preview.seconds > 0);
  assert.equal(preview.busy, false);
  const missing = upgradePreview(state.village, 12345);
  assert.equal(missing, null);
});
