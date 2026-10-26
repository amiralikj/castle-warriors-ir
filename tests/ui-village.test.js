import test from 'node:test';
import assert from 'node:assert/strict';
import { renderVillage } from '../src/ui/screens/village.js';
import { createGameState } from '../src/core/persistence.js';
import { addBuilding, tick } from '../src/core/village.js';

const NOW = 1_700_000_000_000;

function stateWithFarm() {
  const state = createGameState(NOW);
  const { village, building } = addBuilding(state.village, { type: 'farm', x: 0, y: 0, now: NOW });
  return { state: { ...state, village }, farm: building };
}

test('صحنه‌ی ایزومتریک با همه‌ی خانه‌ها و ساختمان‌ها رندر می‌شود', () => {
  const { state } = stateWithFarm();
  const html = renderVillage(state, { now: NOW, viewport: { width: 430, height: 900 } });
  assert.equal((html.match(/data-cell=/g) || []).length, 400);
  assert.match(html, /<svg class="scene"/);
  assert.match(html, /data-uid="1"/);
  assert.match(html, /aria-label="ارگ/);
  assert.match(html, /aria-label="کشتزار گندم/);
  assert.match(html, /data-action="open-build"/);
  assert.match(html, /data-timer=/);
});

test('برگه‌ی جزئیات ساختمان انتخاب‌شده با هزینه‌ی ارتقا نمایش داده می‌شود', () => {
  const { state } = stateWithFarm();
  const html = renderVillage(state, { now: NOW, selectedUid: 1 });
  assert.match(html, /aria-label="جزئیات ساختمان"/);
  assert.match(html, /data-action="upgrade"/);
  assert.match(html, /ارتقا به سطح ۲/);
  assert.match(html, /data-action="move" disabled/);
  assert.match(html, /class="sheet/);
});

test('فروشگاه ساخت فقط ساختمان‌های باز و قابل پرداخت را فعال می‌کند', () => {
  const state = createGameState(NOW);
  const html = renderVillage(state, { now: NOW, buildOpen: true });
  assert.match(html, /چه بسازیم/);
  assert.match(html, /data-build="farm"/);
  assert.match(html, /data-build="barracks"[^>]*disabled/);
  assert.match(html, /ارگ سطح ۲/);
  assert.match(html, /class="mini"/, 'پیش‌نمایش گرافیکی ساختمان‌ها دیده می‌شود');
});

test('راهنمای ساخت و حالت انصراف نمایش داده می‌شود', () => {
  const { state } = stateWithFarm();
  const html = renderVillage(state, { now: NOW, buildType: 'goldMine' });
  assert.match(html, /روی زمین خالی بزن/);
  assert.match(html, /data-action="cancel-mode"/);
  assert.match(html, /حالت جای‌گذاری|is-placing|hint-bar/);
});

test('ساختمان در حال ساخت شمارش معکوس دارد و دکمه‌ی ارتقا ندارد', () => {
  const { state } = stateWithFarm();
  const goldMine = addBuilding(state.village, { type: 'goldMine', x: 5, y: 5, now: NOW });
  const html = renderVillage({ ...state, village: goldMine.village }, { now: NOW, selectedUid: goldMine.building.uid });
  assert.match(html, /در حال ساخت/);
  assert.doesNotMatch(html, /data-action="upgrade"/);
});

test('پس از پایان ساخت، ساختمان آماده و قابل ارتقاست', () => {
  const { state, farm } = stateWithFarm();
  const done = tick(state.village, NOW + 10 * 60 * 1000);
  const html = renderVillage({ ...state, village: done }, { now: NOW + 10 * 60 * 1000, selectedUid: farm.uid });
  assert.doesNotMatch(html, /در حال ساخت/);
  assert.match(html, /data-action="upgrade"/);
});
