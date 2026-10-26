/**
 * صفحه‌ی دهکده: صحنه‌ی ایزومتریک + برگه‌ی ساختمان + فروشگاه ساخت.
 */
import {
  BUILDINGS,
  costFor,
  productionFor,
  capacityFor,
  constructionSeconds,
  isUnlocked,
} from '../../data/buildings.js';
import {
  castleLevel,
  findByUid,
  canPlace,
  isBusy,
  progressRatio,
  remainingMs,
} from '../../core/village.js';
import { upgradePreview } from '../../core/actions.js';
import { canAfford } from '../../core/economy.js';
import { faNumber, faDuration, faCountdown } from '../../utils/format.js';
import { icon } from '../icons.js';
import { renderSheet, statRow } from '../sheet.js';
import { renderScene, miniBuilding, DEFAULT_CAMERA } from '../art/scene.js';

const CATEGORY_LABEL = {
  resource: 'منابع',
  storage: 'انبارها',
  army: 'سپاه',
  defense: 'دفاع',
  economy: 'صنعت',
  main: 'ارگ',
};

export function costChips(cost = {}) {
  const entries = Object.entries(cost).filter(([, value]) => value > 0);
  if (!entries.length) return '<span class="cost cost--free">رایگان</span>';
  return entries
    .map(
      ([key, value]) => `
      <span class="cost cost--${key}">
        ${icon(key === 'gold' ? 'coin' : key === 'wheat' ? 'wheat' : 'gem', { size: 14 })}
        ${faNumber(value)}
      </span>`,
    )
    .join('');
}

/* ------------------------------------------------------------ برگه‌ی ساختمان */

function detailSheet(state, ui) {
  const building = findByUid(state.village, ui.selectedUid);
  if (!building) return '';
  const def = BUILDINGS[building.type];
  const preview = upgradePreview(state.village, building.uid);
  const affordable = preview.cost ? canAfford(state.resources, preview.cost) : false;
  const busy = isBusy(building);
  const production = productionFor(building.type, building.level);
  const capacity = capacityFor(building.type, building.level);

  const stats = [
    production
      ? statRow(
          'تولید در ساعت',
          `${faNumber(production.perHour)} ${production.resource === 'gold' ? 'طلا' : 'گندم'}`,
          'coin',
        )
      : '',
    capacity
      ? statRow(
          'ظرفیت انبار',
          `${faNumber(capacity.amount)} ${capacity.resource === 'gold' ? 'طلا' : 'گندم'}`,
          'gem',
        )
      : '',
    statRow('سطح', `${faNumber(building.level)} از ${faNumber(def.maxLevel)}`, 'star'),
    statRow('دسته', CATEGORY_LABEL[def.category] || def.category, 'hammer'),
  ]
    .filter(Boolean)
    .join('');

  const body = `
    <div class="detail">
      <div class="detail__art">${miniBuilding(building.type, { size: 120 })}</div>
      <div class="detail__info">
        <h4 class="detail__name">${def.name}</h4>
        <p class="detail__desc">${def.description}</p>
        <div class="detail__stats">${stats}</div>
      </div>
    </div>
    ${
      busy
        ? `<div class="work-line">
             <span class="work-line__label">${icon('clock', { size: 16 })} ${building.state === 'building' ? 'در حال ساخت' : 'در حال ارتقا'}</span>
             <span class="work-line__timer" data-timer="${building.completeAt}">${faCountdown(remainingMs(building, ui.now))}</span>
             <span class="work-line__bar"><i style="--p:${progressRatio(building, ui.now)}"></i></span>
           </div>`
        : ''
    }
  `;

  const footer = busy
    ? ''
    : `
      <div class="sheet__cost">${
        preview.atMax ? '<span class="muted">در بالاترین سطح</span>' : `${costChips(preview.cost)}
        <span class="muted">${icon('clock', { size: 14 })} ${faDuration(preview.seconds)}</span>`
      }</div>
      <div class="sheet__actions">
        <button class="btn btn--ghost" data-action="move" ${building.type === 'castle' ? 'disabled' : ''}>
          ${icon('village', { size: 16 })} جابه‌جایی
        </button>
        <button class="btn btn--primary" data-action="upgrade" ${preview.atMax || !affordable ? 'disabled' : ''}>
          ${preview.atMax ? 'بالاترین سطح' : `ارتقا به سطح ${faNumber(building.level + 1)}`}
          ${icon('star', { size: 16 })}
        </button>
      </div>`;

  return renderSheet({
    title: `${def.name}`,
    subtitle: `${CATEGORY_LABEL[def.category] || ''} • سطح ${faNumber(building.level)}${busy ? ' • در حال کار' : ''}`,
    body,
    footer,
    label: 'جزئیات ساختمان',
    variant: 'detail',
  });
}

/* ------------------------------------------------------------- فروشگاه ساخت */

function shopCard(state, def, level) {
  const unlocked = isUnlocked(def.id, level);
  const cost = costFor(def.id, 1);
  const affordable = canAfford(state.resources, cost);
  const disabled = !unlocked || !affordable;
  const production = productionFor(def.id, 1);
  const capacity = capacityFor(def.id, 1);
  const detail = production
    ? `${faNumber(production.perHour)} ${production.resource === 'gold' ? 'طلا' : 'گندم'} در ساعت`
    : capacity
      ? `ظرفیت ${faNumber(capacity.amount)}`
      : `${faNumber(def.size.w)}×${faNumber(def.size.h)} زمین`;

  return `
    <button class="card card--build" data-build="${def.id}" ${disabled ? 'disabled' : ''}>
      <span class="card__art">${miniBuilding(def.id, { size: 84 })}</span>
      <span class="card__title">${def.name}</span>
      <span class="card__note">${unlocked ? detail : `ارگ سطح ${faNumber(def.unlockAt)}`}</span>
      <span class="card__foot">
        ${unlocked ? costChips(cost) : `<span class="cost cost--lock">${icon('lock', { size: 13 })} قفل</span>`}
        <span class="card__time">${icon('clock', { size: 12 })} ${faDuration(constructionSeconds(def.id, 1))}</span>
      </span>
    </button>`;
}

/** محتوای فروشگاه ساخت (هم برای برگه و هم صفحه‌ی «ساختن»). */
export function shopContent(state) {
  const level = castleLevel(state.village);
  const groups = Object.values(BUILDINGS).filter((def) => !def.unique);
  const order = ['resource', 'storage', 'army', 'defense', 'economy'];
  const sections = order
    .map((category) => {
      const items = groups.filter((def) => def.category === category);
      if (!items.length) return '';
      return `
        <section class="shop-group">
          <h4 class="shop-group__title">${CATEGORY_LABEL[category]}</h4>
          <div class="cards">${items.map((def) => shopCard(state, def, level)).join('')}</div>
        </section>`;
    })
    .join('');
  return sections;
}

function buildSheet(state) {
  const level = castleLevel(state.village);
  return renderSheet({
    title: 'چه بسازیم؟',
    subtitle: `ارگ سطح ${faNumber(level)} • زمین آزاد انتخاب کن`,
    body: `<div class="shop">${shopContent(state)}</div>`,
    label: 'فروشگاه ساخت',
    variant: 'shop',
    full: true,
  });
}

/* -------------------------------------------------------------- صفحه‌ی دهکده */

/** نوار راهنما هنگام ساخت یا جابه‌جایی. */
function placementHint(ui) {
  if (ui.buildType) {
    return `
      <div class="hint-bar" role="status">
        <span>«${BUILDINGS[ui.buildType]?.name}» را روی زمین خالی بزن</span>
        <button class="btn btn--sm btn--ghost" data-action="cancel-mode">انصراف</button>
      </div>`;
  }
  if (ui.moveUid) {
    return `
      <div class="hint-bar" role="status">
        <span>ساختمان را با انتخاب زمین خالی جابه‌جا کن</span>
        <button class="btn btn--sm btn--ghost" data-action="cancel-mode">انصراف</button>
      </div>`;
  }
  if (ui.selectedUid) {
    return '';
  }
  return '';
}

export function renderVillage(state, ui = {}) {
  const now = ui.now || Date.now();
  const level = castleLevel(state.village);
  const scene = renderScene(state.village, {
    selectedUid: ui.selectedUid,
    buildType: ui.buildType,
    moveUid: ui.moveUid,
    now,
    camera: ui.camera || DEFAULT_CAMERA,
    viewport: ui.viewport,
  });

  return `
    <div class="world">
      <div class="stage" id="stage">${scene}</div>
      ${placementHint(ui)}
      <div class="quick-actions">
        <button class="fab" data-action="open-build" aria-label="ساختن ساختمان جدید">
          ${icon('hammer', { size: 24 })}
          <span>ساختن</span>
        </button>
      </div>
      <span class="sr-only">ارگ سطح ${faNumber(level)}</span>
      ${detailSheet(state, ui)}
      ${ui.buildOpen ? buildSheet(state) : ''}
    </div>
  `;
}

/* ------------------------------------------------------ به‌روزرسانی سبک DOM */

export function updateTimers(root, now) {
  let completed = 0;
  for (const el of root.querySelectorAll('[data-timer]')) {
    const completeAt = Number(el.dataset.timer);
    if (!Number.isFinite(completeAt)) continue;
    const remaining = completeAt - now;
    el.textContent = faCountdown(Math.max(0, remaining));
    if (remaining <= 0) completed += 1;
  }
  for (const el of root.querySelectorAll('.work-line__bar i, .job__bar')) {
    const holder = el.closest('[data-started-at], .job, .work-line');
    const completeAt = Number(
      el.closest('.work-line')?.querySelector('[data-timer]')?.dataset.timer ||
        holder?.querySelector?.('[data-timer]')?.dataset.timer,
    );
    const startedAt = Number(holder?.dataset.startedAt);
    if (!Number.isFinite(completeAt) || !Number.isFinite(startedAt)) continue;
    const total = completeAt - startedAt;
    const ratio = total > 0 ? Math.max(0, Math.min(1, (now - startedAt) / total)) : 1;
    el.style.setProperty('--p', String(ratio));
  }
  return completed;
}

export function updateResourceBar(root, state) {
  const values = {
    gold: faNumber(state.resources.gold),
    wheat: faNumber(state.resources.wheat),
    gems: faNumber(state.resources.gems),
  };
  for (const [kind, value] of Object.entries(values)) {
    const el = root.querySelector(`.res--${kind} .res__value`);
    if (el) el.textContent = value;
  }
}

export function resourcesLine(state) {
  return `${faNumber(state.resources.gold)} طلا • ${faNumber(state.resources.wheat)} گندم`;
}

export { canPlace, costChips as chips };
