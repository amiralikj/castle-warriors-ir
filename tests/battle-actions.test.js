import test from 'node:test';
import assert from 'node:assert/strict';
import { attackEnemy, refreshOpponents } from '../src/core/actions.js';
import { generateEnemy } from '../src/core/battle.js';
import { createGameState } from '../src/core/persistence.js';
import { storageCaps } from '../src/core/economy.js';

const NOW = 1_700_000_000_000;

function stateWithArmy(units = { spearman: 40, archer: 20 }) {
  const base = createGameState(NOW);
  return {
    ...base,
    resources: { gold: 100, wheat: 100, gems: 10 },
    army: { units: { ...units }, queue: [] },
    battle: { seed: 21, history: [] },
  };
}

test('حمله بدون سرباز رد می‌شود', () => {
  const state = { ...createGameState(NOW), battle: { seed: 1, history: [] } };
  const result = attackEnemy(state, { enemy: generateEnemy({ seed: 1, level: 1 }), now: NOW });
  assert.equal(result.code, 'NO_UNITS');
});

test('حمله با سرباز بیشتر از موجود رد می‌شود', () => {
  const state = stateWithArmy({ spearman: 2 });
  const result = attackEnemy(state, {
    enemy: generateEnemy({ seed: 1, level: 1 }),
    units: { spearman: 5 },
    now: NOW,
  });
  assert.equal(result.code, 'NOT_ENOUGH');
});

test('حمله‌ی موفق غنیمت می‌دهد، بازماندگان را نگه می‌دارد و ثبت می‌شود', () => {
  const state = stateWithArmy();
  const enemy = generateEnemy({ seed: 4, level: 1 });
  const result = attackEnemy(state, { enemy, units: { spearman: 40, archer: 20 }, now: NOW, seed: 4 });
  assert.equal(result.ok, true);
  assert.equal(result.result.stars, 3);
  assert.ok(result.state.resources.gold > state.resources.gold);
  assert.ok(result.state.resources.wheat > state.resources.wheat);
  assert.equal(result.state.stats.battlesWon, 1);
  assert.equal(result.state.stats.battlesLost, 0);
  assert.equal(result.state.battle.history.length, 1);

  const entry = result.state.battle.history[0];
  assert.equal(entry.name, enemy.name);
  assert.equal(entry.stars, 3);
  assert.equal(entry.sent, 60);
  assert.ok(entry.loot.gold > 0);
  assert.ok(entry.losses >= 0);

  // سربازان بازمانده جایگزین شده‌اند و بیش از اولیه نمی‌شوند
  assert.ok((result.state.army.units.spearman || 0) <= 40);
  assert.ok((result.state.army.units.archer || 0) <= 20);
  // شیء اولیه تغییر نمی‌کند
  assert.equal(state.army.units.spearman, 40);
});

test('غنیمت از سقف انبار عبور نمی‌کند', () => {
  const state = stateWithArmy();
  const caps = storageCaps(state.village.buildings);
  const nearlyFull = {
    ...state,
    resources: { gold: caps.gold - 1, wheat: caps.wheat - 1, gems: 0 },
  };
  const enemy = generateEnemy({ seed: 8, level: 1 });
  const result = attackEnemy(nearlyFull, { enemy, units: { spearman: 40 }, now: NOW, seed: 8 });
  assert.equal(result.state.resources.gold, caps.gold);
  assert.equal(result.state.resources.wheat, caps.wheat);
});

test('تاریخچه حداکثر ۲۰ نبرد نگه می‌دارد و جدیدترین اول است', () => {
  let state = stateWithArmy();
  const enemy = generateEnemy({ seed: 4, level: 1 });
  for (let i = 0; i < 22; i += 1) {
    state = {
      ...state,
      army: { units: { spearman: 40 }, queue: [] },
      resources: { gold: 100, wheat: 100, gems: 0 },
    };
    const result = attackEnemy(state, { enemy, now: NOW + i, seed: 4 });
    assert.equal(result.ok, true);
    state = result.state;
  }
  assert.equal(state.battle.history.length, 20);
  assert.equal(state.battle.history[0].at, NOW + 21);
});

test('حریفان تازه بذر را تغییر می‌دهند', () => {
  const state = stateWithArmy();
  const refreshed = refreshOpponents(state);
  assert.notEqual(refreshed.seed, state.battle.seed);
  assert.equal(refreshed.opponents.length, 3);
  assert.equal(refreshed.state.battle.seed, refreshed.seed);
});
