/**
 * صفحه‌ی دهکده: شبکه‌ی ۲۰×۲۰، انتخاب ساختمان، ساخت و ارتقا.
 * این ماژول فقط HTML می‌سازد؛ رفتار در src/main.js با واگذاری رویدادها وصل می‌شود.
 */
import { BUILDINGS, costFor, productionFor, capacityFor, constructionSeconds, isUnlocked } from '../../data/buildings.js';
import { GRID_SIZE, castleLevel, findByUid, canPlace, isBusy, progressRatio, remainingMs } from '../../core/village.js';
import { upgradePreview } from '../../core/actions.js';
import { canAfford } from '../../core/economy.js';
import { faNumber, faDuration, faCountdown } from '../../utils/format.js';
import { icon } from '../icons.js';

export const BUILDING_EMOJI = {
  castle: '🏰',
  goldMine: '⛏️',
  farm: '🌾',
  goldStorage: '🏦',
  wheatStorage: '🏚️',
  barracks: '⚔️',
  watchtower: '🗼',
  fireTemple: '🔥',
  workshop: '🛠️',
};

function costChips(cost = {}) {
  const entries = Object.entries(cost).filter(([, value]) => value > 0);
  if (!entries.length) return '<span class="cost cost--free">رایگان</span>';
  return entries
    .map(
      ([key, value]) => `
      <span class="cost cost--${key}">
        ${icon(key === 'gold' ? 'gold' : key === 'wheat' ? 'wheat' : 'gems', { size: 14 })}
        ${faNumber(value)}
      </span>`,
    )
    .join('');
}

function board(state, ui) {
  const cells = [];
  for (let y = 0; y < state.village.size; y += 1) {
    for (let x = 0; x < state.village.size; x += 1) {
      const occupied = state.village.buildings.some((building) => {
        const def = BUILDINGS[building.type];
        return x >= building.x && x < building.x + def.size.w && y >= building.y && y < building.y + def.size.h;
      });
      cells.push(`<div class="board__cell${occupied ? ' is-busy' : ''}" data-cell="${x},${y}" role="gridcell"></div>`);
    }
  }

  const buildings = state.village.buildings
    .map((building) => {
      const def = BUILDINGS[building.type];
      const busy = isBusy(building);
      const selected = ui.selectedUid === building.uid;
      const ratio = busy ? progressRatio(building, ui.now) : 1;
      const levelLabel = building.state === 'upgrading' ? `${faNumber(building.level)}→${faNumber(building.targetLevel)}` : faNumber(building.level);
      return `
        <button class="building building--${def.category}${selected ? ' is-selected' : ''}${busy ? ' is-building' : ''}"
          style="--x:${building.x};--y:${building.y};--w:${def.size.w};--h:${def.size.h}"
          data-uid="${building.uid}" data-started-at="${building.startedAt ?? ''}"
          aria-label="${def.name}، سطح ${faNumber(building.level)}${busy ? '، در حال ساخت' : ''}">
          <span class="building__emoji" aria-hidden="true">${BUILDING_EMOJI[building.type] || '🏠'}</span>
          <span class="building__name">${def.name}</span>
          <span class="building__level">سطح ${levelLabel}</span>
          ${
            busy
              ? `<span class="building__progress" data-progress="${building.completeAt}" style="--p:${ratio}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio * 100)}"></span>
                 <span class="building__timer" data-timer="${building.completeAt}">${faCountdown(remainingMs(building, ui.now))}</span>`
              : ''
          }
        </button>`;
    })
    .join('');

  return `
    <div class="board" style="--cols:${state.village.size}" role="grid" aria-label="زمین دهکده ${faNumber(state.village.size)} در ${faNumber(state.village.size)}">
      <div class="board__cells" aria-hidden="true">${cells.join('')}</div>
      ${buildings}
    </div>`;
}

function buildMenu(state, ui) {
  const level = castleLevel(state.village);
  const items = Object.values(BUILDINGS)
    .filter((def) => !def.unique)
    .map((def) => {
      const unlocked = isUnlocked(def.id, level);
      const cost = costFor(def.id, 1);
      const affordable = canAfford(state.resources, cost);
      const disabled = !unlocked || !affordable;
      const detail = productionFor(def.id, 1)
        ? `تولید ${faNumber(productionFor(def.id, 1).perHour)} در ساعت`
        : capacityFor(def.id, 1)
          ? `ظرفیت ${faNumber(capacityFor(def.id, 1).amount)}`
          : def.description;
      return `
        <li class="build-item">
          <button class="build-item__btn" data-build="${def.id}" ${disabled ? 'disabled' : ''}>
            <span class="build-item__emoji" aria-hidden="true">${BUILDING_EMOJI[def.id] || '🏠'}</span>
            <span class="build-item__body">
              <span class="build-item__title">${def.name}</span>
              <span class="build-item__detail">${detail}</span>
              <span class="build-item__meta">
                ${unlocked ? costChips(cost) : `<span class="cost cost--lock">${icon('castle', { size: 14 })} ارگ سطح ${faNumber(def.unlockAt)}</span>`}
                <span class="build-item__time">${icon('clock', { size: 14 })} ${faDuration(constructionSeconds(def.id, 1))}</span>
              </span>
            </span>
          </button>
        </li>`;
    })
    .join('');

  return `
    <div class="modal" role="dialog" aria-modal="true" aria-label="انتخاب ساختمان برای ساخت">
      <div class="modal__backdrop" data-action="close-build"></div>
      <div class="modal__sheet">
        <div class="modal__head">
          <h3>چه بسازیم؟</h3>
          <button class="btn btn--ghost btn--sm" data-action="close-build" aria-label="بستن">✕</button>
        </div>
        <ul class="build-list">${items}</ul>
      </div>
    </div>`;
}

function detailPanel(state, ui) {
  const building = findByUid(state.village, ui.selectedUid);
  if (!building) return '';
  const def = BUILDINGS[building.type];
  const preview = upgradePreview(state.village, building.uid);
  const affordable = preview.cost ? canAfford(state.resources, preview.cost) : false;
  const busy = isBusy(building);
  const production = productionFor(building.type, building.level);
  const capacity = capacityFor(building.type, building.level);

  let stats = '';
  if (production) stats = `تولید: ${faNumber(production.perHour)} ${production.resource === 'gold' ? 'طلا' : 'گندم'} در ساعت`;
  if (capacity) stats = `ظرفیت: ${faNumber(capacity.amount)} ${capacity.resource === 'gold' ? 'طلا' : 'گندم'}`;
  if (building.type === 'castle') stats = `قفل ساختمان‌ها با سطح ارگ باز می‌شود.`;

  return `
    <section class="detail" aria-label="جزئیات ساختمان">
      <div class="detail__head">
        <span class="detail__emoji" aria-hidden="true">${BUILDING_EMOJI[building.type] || '🏠'}</span>
        <div>
          <h3>${def.name} <span class="detail__level">سطح ${faNumber(building.level)}</span></h3>
          <p class="muted">${stats || def.description}</p>
        </div>
        <button class="btn btn--ghost btn--sm" data-action="close-detail" aria-label="بستن">✕</button>
      </div>
      ${
        busy
          ? `<div class="detail__busy">
               ${icon('clock', { size: 16 })}
               ${building.state === 'building' ? 'در حال ساخت' : 'در حال ارتقا'}
               — <span data-timer="${building.completeAt}">${faCountdown(remainingMs(building, ui.now))}</span>
             </div>`
          : `<div class="detail__actions">
               <button class="btn btn--primary" data-action="upgrade" ${preview.atMax || !affordable ? 'disabled' : ''}>
                 ${preview.atMax ? 'بالاترین سطح' : `ارتقا به سطح ${faNumber(building.level + 1)}`}
               </button>
               <button class="btn" data-action="move" ${building.type === 'castle' ? 'disabled' : ''}>جابه‌جایی</button>
               <div class="detail__cost">
                 ${
                   preview.atMax
                     ? '<span class="muted">سطح نهایی</span>'
                     : `${costChips(preview.cost)} <span class="muted">${icon('clock', { size: 14 })} ${faDuration(preview.seconds)}</span>`
                 }
               </div>
             </div>`
      }
    </section>`;
}

function resourceSummary(state) {
  const buildings = state.village.buildings;
  return `
    <section class="village__summary" aria-label="خلاصه‌ی دهکده">
      <div class="summary-chip">🏯 ارگ سطح ${faNumber(castleLevel(state.village))}</div>
      <div class="summary-chip">🏠 ${faNumber(buildings.length)} ساختمان</div>
      <div class="summary-chip">🌾 ${faNumber(state.resources.wheat)} گندم</div>
    </section>`;
}

/** صفحه‌ی کامل دهکده. */
export function renderVillage(state, ui = {}) {
  const hint = ui.buildType
    ? `روی زمین خالی بزن تا ${BUILDINGS[ui.buildType].name} ساخته شود.`
    : ui.moveUid
      ? 'زمین خالی را برای جابه‌جایی انتخاب کن.'
      : null;

  return `
    <div class="village">
      <div class="village__head">
        <div>
          <h2>دهکده‌ی من</h2>
          <p class="muted">روی ساختمان بزن تا ارتقا بدهی یا جابه‌جا کنی.</p>
        </div>
        <button class="btn btn--primary" data-action="open-build">${icon('castle', { size: 18 })} ساختن</button>
      </div>

      ${resourceSummary(state)}
      ${hint ? `<div class="hint">${hint} <button class="btn btn--ghost btn--sm" data-action="cancel-mode">انصراف</button></div>` : ''}

      <div class="board-wrap">
        ${board(state, ui)}
      </div>

      ${detailPanel(state, ui)}
      ${ui.buildOpen ? buildMenu(state, ui) : ''}
    </div>`;
}

/** بروزرسانی متن تایمرها و نوار پیشرفت بدون رندر دوباره. */
export function updateTimers(root, now) {
  let completed = 0;
  for (const el of root.querySelectorAll('[data-timer]')) {
    const completeAt = Number(el.dataset.timer);
    if (!Number.isFinite(completeAt)) continue;
    const remaining = completeAt - now;
    el.textContent = faCountdown(Math.max(0, remaining));
    if (remaining <= 0) completed += 1;
  }
  for (const el of root.querySelectorAll('[data-progress]')) {
    const completeAt = Number(el.dataset.progress);
    const bar = el.closest('.building');
    const startedAt = Number(bar?.dataset.startedAt);
    const total = Number.isFinite(startedAt) ? completeAt - startedAt : 0;
    const ratio = total > 0 ? Math.max(0, Math.min(1, (now - startedAt) / total)) : 1;
    el.style.setProperty('--p', String(ratio));
    el.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }
  return completed;
}

/** مقدار منابع نوار بالا را به‌روز می‌کند. */
export function updateResourceBar(root, state) {
  for (const chip of root.querySelectorAll('.resource')) {
    const key = chip.dataset.resource;
    const valueEl = chip.querySelector('.resource__value');
    if (valueEl && state.resources[key] !== undefined) valueEl.textContent = faNumber(state.resources[key]);
  }
  for (const chip of root.querySelectorAll('.summary-chip')) {
    if (chip.textContent.includes('گندم')) chip.textContent = `🌾 ${faNumber(state.resources.wheat)} گندم`;
  }
}

/** خلاصه‌ی کوتاه برای اعلان. */
export function resourcesLine(state) {
  return `${faNumber(state.resources.gold)} طلا • ${faNumber(state.resources.wheat)} گندم`;
}
