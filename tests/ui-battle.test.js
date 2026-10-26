import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBattle } from '../src/ui/screens/battle.js';
import { createGameState } from '../src/core/persistence.js';
import { attackEnemy } from '../src/core/actions.js';
import { generateEnemy } from '../src/core/battle.js';

const NOW = 1_700_000_000_000;

function stateWithArmy() {
  const base = createGameState(NOW);
  return {
    ...base,
    resources: { gold: 100, wheat: 100, gems: 5 },
    army: { units: { spearman: 30, archer: 10 }, queue: [] },
    battle: { seed: 11, history: [] },
  };
}

test('بدون سپاه حالت خالی نمایش داده می‌شود', () => {
  const html = renderBattle(createGameState(NOW), { now: NOW });
  assert.match(html, /سپاهی نداری/);
  assert.match(html, /href="#\/army"/);
  assert.doesNotMatch(html, /data-attack=/);
});

test('با سپاه، سه حریف و دکمه‌ی حمله رندر می‌شود', () => {
  const html = renderBattle(stateWithArmy(), { now: NOW });
  assert.match(html, /میدان نبرد/);
  assert.equal((html.match(/data-attack=/g) || []).length, 3);
  assert.match(html, /data-attack=/);
  assert.match(html, /هنوز نبردی ثبت نشده/);
  assert.match(html, /توان/);
  assert.match(html, /class="enemy-preview"/, 'پیش‌نمایش دهکده‌ی دشمن دیده می‌شود');
});

test('کارت نتیجه با ستاره، غنیمت و گزارش نمایش داده می‌شود', () => {
  const state = stateWithArmy();
  const enemy = generateEnemy({ seed: 4, level: 1 });
  const battle = attackEnemy(state, { enemy, units: state.army.units, now: NOW, seed: 4 });
  const html = renderBattle(battle.state, { now: NOW, battleResult: battle.result, battleEnemyName: enemy.name });
  assert.match(html, /پیروزی!/);
  assert.match(html, /تخریب/);
  assert.match(html, /غنیمت طلا/);
  assert.match(html, /تلفات/);
  assert.match(html, /بازگشت|بستن/);
  assert.ok((html.match(/star is-on/g) || []).length >= 3, 'کارت نتیجه و تاریخچه هر دو ستاره دارند');
});

test('تاریخچه‌ی نبردها و ستاره‌ها نمایش داده می‌شود', () => {
  const state = stateWithArmy();
  const enemy = generateEnemy({ seed: 4, level: 1 });
  const battle = attackEnemy(state, { enemy, units: state.army.units, now: NOW, seed: 4 });
  const html = renderBattle(battle.state, { now: NOW });
  assert.match(html, /تاریخچه‌ی نبردها/);
  assert.match(html, new RegExp(enemy.name));
  assert.match(html, /star is-on/);
});
