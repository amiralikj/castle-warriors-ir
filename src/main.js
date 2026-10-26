/**
 * نقطه‌ی ورود بازی «جنگاوران قلعه»
 * موج ۶: اتصال وضعیت، ذخیره‌سازی، صفحه‌ی تعاملی دهکده و ناوبری.
 */
import { renderShell, SCREEN_IDS, SCREENS } from './ui/shell.js';
import { renderPlaceholder } from './ui/screens/placeholder.js';
import { renderVillage, updateTimers, updateResourceBar } from './ui/screens/village.js';
import { createRouter, routeHref } from './ui/router.js';
import { createStore } from './ui/store.js';
import { browserStorage } from './core/persistence.js';
import { buildBuilding, upgradeBuilding } from './core/actions.js';
import { moveBuilding, findByUid } from './core/village.js';
import { BUILDINGS } from './data/buildings.js';
import { faDuration, faNumber } from './utils/format.js';

const app = document.querySelector('#app');

const store = createStore({ storage: browserStorage() });
const ui = {
  selectedUid: null,
  buildType: null,
  buildOpen: false,
  moveUid: null,
  now: Date.now(),
};
let routeName = 'village';
let toastTimer = null;

/* ---------- نمایش ---------- */

function renderOnce() {
  app.innerHTML = renderShell({ active: routeName });
  paintScreen();
}

function paintScreen() {
  const state = store.getState();
  const screen = app.querySelector('#screen');
  if (!screen) return;
  screen.innerHTML =
    routeName === 'village' ? renderVillage(state, ui) : renderPlaceholder(routeName);
  updateResourceBar(app, state);
  syncNav();
}

function syncNav() {
  for (const link of app.querySelectorAll('.nav__item')) {
    const name = link.getAttribute('href').replace('#/', '');
    const active = name === routeName;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.body.dataset.screen = routeName;
}

function toast(message, kind = 'info') {
  const stack = app.querySelector('#toasts');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.textContent = message;
  stack.replaceChildren(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), kind === 'error' ? 4200 : 2800);
}

/* ---------- رفتار ---------- */

function selectBuild(id) {
  const def = BUILDINGS[id];
  if (!def) return;
  ui.buildType = id;
  ui.buildOpen = false;
  ui.selectedUid = null;
  paintScreen();
  toast(`${def.name} را انتخاب کردی؛ روی زمین خالی بزن.`);
}

function placeAt(x, y) {
  const now = Date.now();
  const result = buildBuilding(store.getState(), { type: ui.buildType, x, y, now });
  if (!result.ok) {
    toast(result.message || 'ساخت ممکن نشد.', 'error');
    return;
  }
  store.setState(result.state);
  toast(`ساخت ${BUILDINGS[ui.buildType].name} شروع شد.`, 'success');
  ui.buildType = null;
  paintScreen();
}

function relocateTo(uid, x, y) {
  const result = moveBuilding(store.getState().village, uid, x, y);
  if (!result.ok) {
    toast(result.message || 'جابه‌جایی ممکن نشد.', 'error');
    return;
  }
  store.setState({ ...store.getState(), village: result.village });
  ui.moveUid = null;
  paintScreen();
  toast('ساختمان جابه‌جا شد.', 'success');
}

function upgrade(uid) {
  const result = upgradeBuilding(store.getState(), { uid, now: Date.now() });
  if (!result.ok) {
    toast(result.message || 'ارتقا ممکن نشد.', 'error');
    return;
  }
  store.setState(result.state);
  paintScreen();
  toast(`ارتقا شروع شد؛ ${faDuration(result.seconds)} طول می‌کشد.`, 'success');
}

function handleClick(event) {
  const target = event.target.closest('[data-action],[data-build],[data-uid],[data-cell]');
  if (!target) return;
  const state = store.getState();

  if (target.dataset.action) {
    switch (target.dataset.action) {
      case 'open-build':
        ui.buildOpen = true;
        ui.buildType = null;
        ui.moveUid = null;
        paintScreen();
        return;
      case 'close-build':
        ui.buildOpen = false;
        paintScreen();
        return;
      case 'close-detail':
        ui.selectedUid = null;
        paintScreen();
        return;
      case 'cancel-mode':
        ui.buildType = null;
        ui.moveUid = null;
        paintScreen();
        return;
      case 'upgrade':
        upgrade(ui.selectedUid);
        return;
      case 'move':
        ui.moveUid = ui.selectedUid;
        ui.buildType = null;
        paintScreen();
        toast('روی زمین خالی بزن تا ساختمان جابه‌جا شود.');
        return;
      default:
        return;
    }
  }

  if (target.dataset.build) {
    selectBuild(target.dataset.build);
    return;
  }

  if (target.dataset.uid) {
    const uid = Number(target.dataset.uid);
    if (!findByUid(state.village, uid)) return;
    if (ui.buildType) {
      toast('اینجا پر است؛ زمین خالی انتخاب کن.', 'error');
      return;
    }
    ui.selectedUid = uid;
    paintScreen();
    return;
  }

  if (target.dataset.cell) {
    const [x, y] = target.dataset.cell.split(',').map(Number);
    if (ui.buildType) placeAt(x, y);
    else if (ui.moveUid) relocateTo(ui.moveUid, x, y);
    else if (ui.selectedUid) {
      ui.selectedUid = null;
      paintScreen();
    }
  }
}

/* ---------- حلقه‌ی زمان ---------- */

function tickLoop() {
  const now = Date.now();
  ui.now = now;
  const report = store.advance();
  const state = store.getState();
  updateResourceBar(app, state);
  const completed = updateTimers(app, now);
  if (completed > 0 || report.completed > 0) {
    paintScreen();
    toast('ساخت‌وساز تمام شد. ✅', 'success');
  }
}

/* ---------- راه‌اندازی ---------- */

function boot() {
  if (!app) return;
  document.documentElement.lang = 'fa';
  document.documentElement.dir = 'rtl';
  document.title = 'جنگاوران قلعه | بازی استراتژی ایرانی';

  renderOnce();
  createRouter({
    known: SCREEN_IDS,
    onChange: (route) => {
      routeName = route.name;
      ui.selectedUid = null;
      ui.buildOpen = false;
      ui.buildType = null;
      paintScreen();
    },
  });

  app.addEventListener('click', handleClick);
  setInterval(tickLoop, 1000);
  setInterval(() => store.save(), 15_000);

  window.addEventListener('beforeunload', () => store.save());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.save();
    else tickLoop();
  });

  const offline = store.getOfflineReport();
  if (offline.seconds >= 60) {
    const gains = [];
    if (offline.gold > 0) gains.push(`${faNumber(offline.gold)} طلا`);
    if (offline.wheat > 0) gains.push(`${faNumber(offline.wheat)} گندم`);
    toast(`در غیاب تو ${faDuration(offline.seconds)} گذشت${gains.length ? ` و ${gains.join(' و ')} جمع شد` : ''}.`);
  }
}

// در محیط تست (بدون DOM) فقط ماژول بارگذاری می‌شود.
if (typeof document !== 'undefined') boot();

export { store, ui, routeHref, SCREENS };
