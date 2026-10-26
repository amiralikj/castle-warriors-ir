import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeHref, DEFAULT_ROUTE } from '../src/ui/router.js';
import { renderShell, SCREENS, SCREEN_IDS } from '../src/ui/shell.js';
import { renderPlaceholder } from '../src/ui/screens/placeholder.js';
import { icon, ICON_NAMES } from '../src/ui/icons.js';

test('hash به مسیر تبدیل می‌شود', () => {
  assert.deepEqual(parseRoute('#/village'), { name: 'village', params: {} });
  assert.deepEqual(parseRoute('#/army'), { name: 'army', params: {} });
  assert.equal(parseRoute('').name, DEFAULT_ROUTE);
  assert.equal(parseRoute('#/').name, DEFAULT_ROUTE);
  assert.deepEqual(parseRoute('#/battle?slot=2').params, { slot: '2' });
  assert.equal(parseRoute('#/battle?slot=2').name, 'battle');
  assert.equal(routeHref('more'), '#/more');
});

test('چهار صفحه‌ی اصلی تعریف شده و شناسه‌ها یکتا هستند', () => {
  assert.equal(SCREENS.length, 4);
  assert.equal(new Set(SCREEN_IDS).size, 4);
  for (const screen of SCREENS) {
    assert.ok(screen.label.length > 0);
    assert.ok(ICON_NAMES.includes(screen.icon), `آیکون ${screen.icon} تعریف نشده`);
    assert.ok(screen.wave >= 1 && screen.wave <= 50);
  }
});

test('پوسته راست‌چین با ناوبری فعال و منابع رندر می‌شود', () => {
  const html = renderShell({ active: 'army', resources: { gold: '۱٬۲۰۰', wheat: '۳۰۰' } });
  assert.match(html, /رنگ|class="topbar"/);
  assert.match(html, /class="nav__item is-active" href="#\/army"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /۱٬۲۰۰/);
  assert.match(html, /۳۰۰/);
  assert.match(html, /id="screen"/);
  assert.match(html, /dir="rtl"|جنگاوران قلعه/);
});

test('صفحه‌ی جایگزین شماره‌ی موج را نشان می‌دهد', () => {
  const html = renderPlaceholder('battle');
  assert.match(html, /نبرد/);
  assert.match(html, /موج ۹/);
});

test('آیکون‌ها SVG درون‌خطی و دسترس‌پذیر تولید می‌کنند', () => {
  assert.match(icon('castle'), /^<svg[^>]+aria-hidden="true"/);
  assert.match(icon('gold', { label: 'طلا' }), /aria-label="طلا"/);
  assert.match(icon('unknown-name'), /<svg/);
});
