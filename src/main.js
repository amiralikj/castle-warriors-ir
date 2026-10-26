/**
 * نقطه‌ی ورود بازی «جنگاوران قلعه»
 * موج ۱۱: صحنه‌ی ایزومتریک، پوسته‌ی بازی‌گونه، دوربین و برگه‌های موبایلی.
 */
import { renderShell, updateHud, SCREEN_IDS } from './ui/shell.js';
import { renderVillage, updateTimers } from './ui/screens/village.js';
import { renderBuild } from './ui/screens/build.js';
import { renderArmy, updateTrainingProgress } from './ui/screens/army.js';
import { renderBattle } from './ui/screens/battle.js';
import { renderMore } from './ui/screens/more.js';
import { createRouter } from './ui/router.js';
import { createStore } from './ui/store.js';
import { browserStorage } from './core/persistence.js';
import { buildBuilding, upgradeBuilding, trainUnits, attackEnemy, refreshOpponents } from './core/actions.js';
import { moveBuilding, findByUid } from './core/village.js';
import { BUILDINGS, constructionSeconds } from './data/buildings.js';
import { TROOPS } from './data/troops.js';
import { generateEnemy } from './core/battle.js';
import { faDuration, faNumber } from './utils/format.js';
import { attachCamera, applyCamera, zoomBy, DEFAULT_CAMERA, clampCamera } from './ui/art/camera.js';

const app = document.querySelector('#app');
const store = createStore({ storage: browserStorage() });

const ui = {
  selectedUid: null,
  buildType: null,
  buildOpen: false,
  moveUid: null,
  battleResult: null,
  battleEnemyName: null,
  camera: { ...DEFAULT_CAMERA },
  now: Date.now(),
};

let routeName = 'village';
let toastTimer = null;
let router = null;

/* ------------------------------------------------------------- اندازه‌ها */

function viewport() {
  const width = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1440;
  const height = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1040;
  return { width, height };
}

/* ------------------------------------------------------------- رندر صفحه‌ها */

function viewFor(name) {
  const state = store.getState();
  switch (name) {
    case 'build':
      return renderBuild(state, ui);
    case 'army':
      return renderArmy(state, ui);
    case 'battle':
      return renderBattle(state, ui);
    case 'more':
      return renderMore(state, ui);
    case 'village':
    default:
      return renderVillage(state, { ...ui, viewport: viewport() });
  }
}

function paint() {
  const state = store.getState();
  app.innerHTML = renderShell({ active: routeName, state, content: viewFor(routeName) });
  document.body.dataset.screen = routeName;
  if (routeName === 'village') wireStage();
}

/** اتصال دوربین به صحنه‌ی تازه‌رندرشده. */
function wireStage() {
  const stage = app.querySelector('.stage');
  if (!stage) return;
  attachCamera(stage, {
    getCamera: () => ui.camera,
    setCamera: (camera) => {
      ui.camera = clampCamera(camera);
    },
  });
  const svg = app.querySelector('svg.scene');
  if (svg) applyCamera(svg, ui.camera);
}

function currentSvg() {
  return app.querySelector('svg.scene');
}

/* ------------------------------------------------------------- اعلان‌ها */

function toast(message, kind = 'info') {
  const stack = app.querySelector('#toasts');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.textContent = message;
  stack.replaceChildren(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), kind === 'error' ? 4400 : 3000);
}

/* ----------------------------------------------------------------- اکشن‌ها */

function go(name) {
  if (routeName === name) {
    paint();
    return;
  }
  if (typeof window !== 'undefined' && window.location) window.location.hash = `#/${name}`;
  else {
    routeName = name;
    paint();
  }
}

function selectBuild(id) {
  const def = BUILDINGS[id];
  if (!def) return;
  ui.buildType = id;
  ui.buildOpen = false;
  ui.selectedUid = null;
  ui.moveUid = null;
  routeName = 'village';
  if (typeof window !== 'undefined' && window.location) window.location.hash = '#/village';
  paint();
  toast(`${def.name} را انتخاب کردی؛ زمین سبز را لمس کن.`);
}

function placeAt(x, y) {
  const result = buildBuilding(store.getState(), { type: ui.buildType, x, y, now: Date.now() });
  if (!result.ok) {
    toast(result.message || 'ساخت ممکن نشد.', 'error');
    return;
  }
  store.setState(result.state);
  const def = BUILDINGS[ui.buildType];
  ui.buildType = null;
  paint();
  toast(`ساخت ${def.name} آغاز شد — ${faDuration(constructionSeconds(def.id, 1))}`, 'success');
}

function relocateTo(uid, x, y) {
  const result = moveBuilding(store.getState().village, uid, x, y);
  if (!result.ok) {
    toast(result.message || 'جابه‌جایی ممکن نشد.', 'error');
    return;
  }
  store.setState({ ...store.getState(), village: result.village });
  ui.moveUid = null;
  paint();
  toast('ساختمان جابه‌جا شد.', 'success');
}

function upgrade(uid) {
  const result = upgradeBuilding(store.getState(), { uid, now: Date.now() });
  if (!result.ok) {
    toast(result.message || 'ارتقا ممکن نشد.', 'error');
    return;
  }
  store.setState(result.state);
  paint();
  toast(`ارتقا آغاز شد — ${faDuration(result.seconds)}`, 'success');
}

function train(type, count) {
  const result = trainUnits(store.getState(), { type, count: Number(count) || 1, now: Date.now() });
  if (!result.ok) {
    toast(result.message || 'آموزش ممکن نشد.', 'error');
    return;
  }
  store.setState(result.state);
  paint();
  toast(`${faNumber(result.job.count)} ${TROOPS[type].name} در صف آموزش قرار گرفت.`, 'success');
}

function attack(seed, level) {
  const enemy = generateEnemy({ seed: Number(seed), level: Number(level) });
  const result = attackEnemy(store.getState(), { enemy, now: Date.now(), seed: Number(seed) });
  if (!result.ok) {
    toast(result.message || 'حمله ممکن نشد.', 'error');
    return;
  }
  store.setState(result.state);
  ui.battleResult = result.result;
  ui.battleEnemyName = enemy.name;
  paint();
  if (result.result.win) {
    toast(
      `پیروزی! ${faNumber(result.result.loot.gold)} طلا و ${faNumber(result.result.loot.wheat)} گندم غنیمت`,
      'reward',
    );
  } else {
    toast('سپاه عقب نشست؛ نیروی بیشتری آموزش بده.', 'error');
  }
}

function resetSave() {
  store.reset();
  ui.selectedUid = null;
  ui.buildOpen = false;
  ui.buildType = null;
  ui.moveUid = null;
  ui.battleResult = null;
  ui.camera = { ...DEFAULT_CAMERA };
  paint();
  toast('دهکده از نو ساخته شد.', 'success');
}

/* ------------------------------------------------------------- رویدادها */

function handleClick(event) {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    go(tab.dataset.tab);
    return;
  }

  const target = event.target.closest('[data-action],[data-build],[data-uid],[data-cell],[data-train],[data-attack]');
  if (!target) return;
  const state = store.getState();

  if (target.dataset.attack) {
    attack(target.dataset.attack, target.dataset.level);
    return;
  }

  if (target.dataset.train) {
    train(target.dataset.train, target.dataset.count);
    return;
  }

  if (target.dataset.build) {
    selectBuild(target.dataset.build);
    return;
  }

  if (target.dataset.action) {
    switch (target.dataset.action) {
      case 'open-build':
        ui.buildOpen = true;
        ui.buildType = null;
        ui.moveUid = null;
        paint();
        return;
      case 'close-sheet':
        ui.buildOpen = false;
        ui.selectedUid = null;
        paint();
        return;
      case 'close-result':
        ui.battleResult = null;
        ui.battleEnemyName = null;
        paint();
        return;
      case 'cancel-mode':
        ui.buildType = null;
        ui.moveUid = null;
        paint();
        return;
      case 'upgrade':
        if (ui.selectedUid) upgrade(ui.selectedUid);
        return;
      case 'move':
        ui.moveUid = ui.selectedUid;
        ui.selectedUid = null;
        ui.buildType = null;
        paint();
        toast('زمین خالی را لمس کن تا ساختمان جابه‌جا شود.');
        return;
      case 'zoom-in':
        ui.camera = zoomBy(ui.camera, 1.22);
        applyCamera(currentSvg(), ui.camera);
        return;
      case 'zoom-out':
        ui.camera = zoomBy(ui.camera, 0.82);
        applyCamera(currentSvg(), ui.camera);
        return;
      case 'camera-reset':
        ui.camera = { ...DEFAULT_CAMERA };
        applyCamera(currentSvg(), ui.camera);
        return;
      case 'refresh-opponents': {
        const refreshed = refreshOpponents(state);
        store.setState(refreshed.state);
        ui.battleResult = null;
        paint();
        toast('حریفان تازه‌ای به نقشه آمدند.');
        return;
      }
      case 'open-profile':
        go('more');
        return;
      case 'go-build':
        go('build');
        return;
      case 'toggle-sound':
        store.setState({ ...state, settings: { ...state.settings, sound: state.settings?.sound === false } });
        paint();
        toast(state.settings?.sound === false ? 'صدا روشن شد.' : 'صدا خاموش شد.');
        return;
      case 'show-help':
        toast('معدن و کشتزار بساز، ارگ را ارتقا بده، سپاه آموزش بده و حمله کن.');
        return;
      case 'reset-save':
        resetSave();
        return;
      case 'resource-gold':
      case 'resource-wheat':
        toast(`منابع در هر ساعت تولید می‌شوند؛ انبار بساز تا سقف بالا برود.`);
        return;
      case 'resource-gems':
        toast('خرید گوهر هنوز فعال نیست؛ فعلاً از جایزه‌ها گوهر بگیر.', 'error');
        return;
      default:
        return;
    }
  }

  if (target.dataset.uid) {
    const uid = Number(target.dataset.uid);
    if (!findByUid(state.village, uid)) return;
    if (ui.buildType) {
      toast('اینجا پر است؛ زمین خالی لمس کن.', 'error');
      return;
    }
    ui.selectedUid = uid;
    paint();
    return;
  }

  if (target.dataset.cell) {
    const [x, y] = target.dataset.cell.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (ui.buildType) placeAt(x, y);
    else if (ui.moveUid) relocateTo(ui.moveUid, x, y);
    else if (ui.selectedUid) {
      ui.selectedUid = null;
      paint();
    }
  }
}

/* ------------------------------------------------------------- حلقه‌ی زمان */

function tickLoop() {
  const now = Date.now();
  ui.now = now;
  const state = store.getState();
  const before = state.stats;
  const report = store.advance();
  const next = store.getState();

  updateHud(app, next);
  updateTimers(app, now);
  updateTrainingProgress(app, now);

  const shouldRepaint =
    report.completed > 0 ||
    (report.trained?.length || 0) > 0 ||
    before.buildingsBuilt !== next.stats.buildingsBuilt;
  if (shouldRepaint) {
    paint();
    if (report.trained?.length) {
      const names = report.trained
        .map((job) => `${faNumber(job.count)} ${TROOPS[job.type]?.name || job.type}`)
        .join(' و ');
      toast(`آموزش تمام شد: ${names} به سپاه پیوست.`, 'success');
    } else if (report.completed > 0) {
      toast('ساخت‌وساز تمام شد.', 'success');
    }
  }
}

/* ------------------------------------------------------------- راه‌اندازی */

function boot() {
  if (!app) return;
  document.documentElement.lang = 'fa';
  document.documentElement.dir = 'rtl';
  document.title = 'جنگاوران قلعه | بازی استراتژی ایرانی';

  paint();

  router = createRouter({
    known: SCREEN_IDS,
    onChange: (route) => {
      routeName = route.name === 'village' && ui.buildOpen ? 'village' : route.name;
      if (route.name !== 'village') {
        ui.selectedUid = null;
        ui.buildType = null;
        ui.buildOpen = false;
        ui.moveUid = null;
      }
      paint();
    },
  });

  app.addEventListener('click', handleClick);
  setInterval(tickLoop, 1000);
  setInterval(() => store.save(), 15_000);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => paint(), 180);
  });
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
    toast(
      `در غیاب تو ${faDuration(offline.seconds)} گذشت${gains.length ? ` و ${gains.join(' و ')} جمع شد` : ''}.`,
      'reward',
    );
  }
}

// در محیط تست (بدون DOM) فقط ماژول بارگذاری می‌شود.
if (typeof document !== 'undefined') {
  boot();
  // دسترسی برای اشکال‌زدایی در کنسول مرورگر
  if (typeof window !== 'undefined') window.__castle = { store, ui, go, paint };
}

export { store, ui, router, renderVillage, renderArmy, renderBattle, renderBuild, renderMore };
