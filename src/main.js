/**
 * نقطه‌ی ورود بازی «جنگاوران قلعه»
 * موج ۲: پوسته‌ی راست‌چین فارسی، ناوبری و روتر hash.
 */
import { renderShell, SCREEN_IDS } from './ui/shell.js';
import { renderPlaceholder } from './ui/screens/placeholder.js';
import { createRouter } from './ui/router.js';

const app = document.querySelector('#app');

/** @type {Record<string, () => string>} */
const views = {
  village: () => renderPlaceholder('village'),
  army: () => renderPlaceholder('army'),
  battle: () => renderPlaceholder('battle'),
  more: () => renderPlaceholder('more'),
};

function paint(route) {
  app.innerHTML = renderShell({ active: route.name });
  const screen = app.querySelector('#screen');
  screen.innerHTML = views[route.name]();
  screen.focus({ preventScroll: true });
  const label = route.name;
  document.body.dataset.screen = label;
}

function boot() {
  if (!app) return;
  document.documentElement.lang = 'fa';
  document.documentElement.dir = 'rtl';
  document.title = 'جنگاوران قلعه | بازی استراتژی ایرانی';
  createRouter({ known: SCREEN_IDS, onChange: paint });
}

boot();

export { views };
