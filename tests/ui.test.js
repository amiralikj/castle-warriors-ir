import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeHref, DEFAULT_ROUTE } from '../src/ui/router.js';
import { renderShell, SCREENS, SCREEN_IDS, trophiesOf } from '../src/ui/shell.js';
import { renderSheet, statRow } from '../src/ui/sheet.js';
import { icon, ICON_NAMES } from '../src/ui/art/icons.js';
import { emblem, troopFigure, coinBadge } from '../src/ui/art/figures.js';
import { createGameState } from '../src/core/persistence.js';

test('hash به مسیر تبدیل می‌شود', () => {
  assert.deepEqual(parseRoute('#/village'), { name: 'village', params: {} });
  assert.deepEqual(parseRoute('#/army'), { name: 'army', params: {} });
  assert.equal(parseRoute('').name, DEFAULT_ROUTE);
  assert.equal(parseRoute('#/').name, DEFAULT_ROUTE);
  assert.deepEqual(parseRoute('#/battle?slot=2').params, { slot: '2' });
  assert.equal(parseRoute('#/battle?slot=2').name, 'battle');
  assert.equal(routeHref('more'), '#/more');
});

test('پنج بخش ناوبری تعریف شده و شناسه‌ها یکتا هستند', () => {
  assert.equal(SCREENS.length, 5);
  assert.equal(new Set(SCREEN_IDS).size, 5);
  for (const screen of SCREENS) {
    assert.ok(screen.label.length > 0);
    assert.ok(ICON_NAMES.includes(screen.icon), `آیکون ${screen.icon} تعریف نشده`);
    assert.ok(screen.wave >= 1 && screen.wave <= 50);
  }
});

test('پوسته منابع، نشان بازیکن، جام و ناوبری فعال را رندر می‌کند', () => {
  const state = createGameState(1_700_000_000_000);
  state.resources = { gold: 1200, wheat: 300, gems: 7 };
  state.stats.battlesWon = 3;
  const html = renderShell({ active: 'army', state, content: '<p>محتوا</p>' });
  assert.match(html, /class="hud"/);
  assert.match(html, /۱٬۲۰۰/);
  assert.match(html, /۳۰۰/);
  assert.match(html, /class="dock__btn is-active" data-tab="army"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /<main class="views" id="screen"[^>]*><p>محتوا<\/p>/);
  assert.match(html, /جنگاوران قلعه/);
  assert.match(html, /data-action="zoom-in"/);
  assert.equal(trophiesOf(state), 36);
});

test('برگه‌ی پایین‌کش عنوان، بدنه و دکمه‌ی بستن دارد', () => {
  const html = renderSheet({ title: 'عنوان', body: '<div>x</div>', footer: '<button>ok</button>' });
  assert.match(html, /class="sheet/);
  assert.match(html, /عنوان/);
  assert.match(html, /<div>x<\/div>/);
  assert.match(html, /aria-label="بستن"/);
  assert.match(html, /data-action="close-sheet"/);
  assert.match(statRow('جان', '۱۲۰', 'shield'), /stat-row/);
});

test('آیکون‌ها و پیکره‌ها SVG درون‌خطی و دسترس‌پذیر تولید می‌کنند', () => {
  assert.match(icon('village'), /^<svg[^>]+aria-hidden="true"/);
  assert.match(icon('coin', { label: 'طلا' }), /aria-label="طلا"/);
  assert.match(icon('swords'), /<svg/, 'نام قدیمی آیکون هم کار می‌کند');
  assert.match(icon('unknown'), /<svg/);
  assert.match(emblem({ size: 40 }), /<svg[^>]+width="40"/);
  assert.match(troopFigure('spearman'), /class="figure"/);
  assert.match(coinBadge({ size: 20 }), /width="20"/);
});
