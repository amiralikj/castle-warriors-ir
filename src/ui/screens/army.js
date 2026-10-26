/**
 * صفحه‌ی ارتش: آموزش سرباز، ظرفیت سپاه و صف آموزش.
 */
import { TROOPS, troopCost, trainingSeconds, unlockedTroops } from '../../data/troops.js';
import {
  armyCapacity,
  armyPower,
  housingFree,
  housingUsed,
  jobProgress,
  jobRemaining,
  queueLimit,
  roster,
} from '../../core/army.js';
import { barracksLevel } from '../../core/actions.js';
import { canAfford } from '../../core/economy.js';
import { faNumber, faDuration, faCountdown } from '../../utils/format.js';
import { icon } from '../icons.js';

function capacityBar(used, cap) {
  const ratio = cap > 0 ? Math.min(1, used / cap) : 0;
  return `
    <div class="capacity" role="progressbar" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${used}" aria-label="ظرفیت سپاه">
      <span class="capacity__fill" style="--p:${ratio}"></span>
      <span class="capacity__text">${faNumber(used)} از ${faNumber(cap)} نفر</span>
    </div>`;
}

function rosterLine(state) {
  const units = roster(state.army);
  if (!units.length) return '<p class="muted">هنوز سربازی آموزش ندیده است.</p>';
  return `<div class="roster">${units
    .map(
      (unit) => `
      <span class="roster__item">
        <span aria-hidden="true">${unit.troop.emoji}</span>
        ${unit.troop.name}
        <strong>${faNumber(unit.count)}</strong>
      </span>`,
    )
    .join('')}</div>`;
}

function troopCard(state, troop, level) {
  const locked = troop.unlockBarracks > level;
  const cost = troopCost(troop.id, 1);
  const affordable = canAfford(state.resources, cost);
  const capacityLeft = housingFree(state.army, level);
  const queueFull = (state.army.queue?.length || 0) >= queueLimit(level);
  const disabled = locked || !affordable || queueFull || capacityLeft < troop.housing;

  const reason = locked
    ? `نیازمند سربازخانه‌ی سطح ${faNumber(troop.unlockBarracks)}`
    : queueFull
      ? 'صف آموزش پر است'
      : capacityLeft < troop.housing
        ? 'ظرفیت سپاه پر است'
        : !affordable
          ? 'گندم کافی نیست'
          : '';

  return `
    <article class="troop${locked ? ' is-locked' : ''}">
      <div class="troop__head">
        <span class="troop__emoji" aria-hidden="true">${troop.emoji}</span>
        <div class="troop__title">
          <h3>${troop.name}</h3>
          <p class="muted">${troop.description}</p>
        </div>
        <span class="troop__count" title="تعداد در سپاه">${faNumber(state.army.units?.[troop.id] || 0)}</span>
      </div>
      <div class="troop__stats">
        <span>${icon('army', { size: 14 })} جان ${faNumber(troop.stats.hp)}</span>
        <span>${icon('swords', { size: 14 })} آسیب ${faNumber(troop.stats.dps)}</span>
        <span>${icon('castle', { size: 14 })} برد ${faNumber(troop.stats.range)}</span>
      </div>
      <div class="troop__foot">
        <span class="cost cost--wheat">${icon('wheat', { size: 14 })} ${faNumber(troop.cost.wheat)}</span>
        <span class="troop__time">${icon('clock', { size: 14 })} ${faDuration(trainingSeconds(troop.id, 1, level))}</span>
        <div class="troop__actions">
          <button class="btn btn--primary btn--sm" data-train="${troop.id}" data-count="1" ${disabled ? 'disabled' : ''}>آموزش ۱</button>
          <button class="btn btn--sm" data-train="${troop.id}" data-count="5" ${disabled ? 'disabled' : ''}>۵</button>
        </div>
      </div>
      ${reason ? `<p class="troop__reason">${reason}</p>` : ''}
    </article>`;
}

function queuePanel(state, now) {
  const queue = state.army.queue || [];
  if (!queue.length) {
    return `
      <section class="panel panel--soft">
        <h3>صف آموزش</h3>
        <p class="muted">صف خالی است؛ از کارت‌های بالا سرباز آموزش بده.</p>
      </section>`;
  }
  return `
    <section class="panel panel--soft">
      <h3>صف آموزش</h3>
      <ul class="jobs">
        ${queue
          .map((job) => {
            const ratio = jobProgress(job, now);
            return `
            <li class="job" data-started-at="${job.startedAt}">
              <div class="job__row">
                <span class="job__name">
                  <span aria-hidden="true">${TROOPS[job.type]?.emoji || '🛡️'}</span>
                  ${faNumber(job.count)} ${TROOPS[job.type]?.name || job.type}
                </span>
                <span class="job__timer" data-timer="${job.completeAt}">${faCountdown(jobRemaining(job, now))}</span>
              </div>
              <span class="job__bar" data-progress="${job.completeAt}" style="--p:${ratio}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio * 100)}"></span>
            </li>`;
          })
          .join('')}
      </ul>
    </section>`;
}

/** صفحه‌ی کامل ارتش. */
export function renderArmy(state, ui = {}) {
  const level = barracksLevel(state.village);
  const now = ui.now || Date.now();

  if (level === 0) {
    return `
      <section class="panel empty-state">
        <span class="empty-state__emoji" aria-hidden="true">⚔️</span>
        <h2>سربازخانه نداری</h2>
        <p class="muted">برای آموزش سپاه، اول در دهکده یک سربازخانه بساز. سربازخانه از سطح ۲ ارگ باز می‌شود.</p>
        <a class="btn btn--primary" href="#/village">رفتن به دهکده</a>
      </section>`;
  }

  const cap = armyCapacity(level);
  const used = housingUsed(state.army);
  const troops = unlockedTroops(level);

  return `
    <div class="army">
      <div class="army__head">
        <div>
          <h2>سپاه من</h2>
          <p class="muted">سربازخانه سطح ${faNumber(level)} • توان رزمی ${faNumber(armyPower(state.army))}</p>
        </div>
        <span class="chip">${icon('army', { size: 14 })} ${faNumber(used)} سرباز</span>
      </div>

      ${capacityBar(used, cap)}

      <section class="panel panel--soft">
        <h3>سربازان در سپاه</h3>
        ${rosterLine(state)}
      </section>

      <div class="troops">
        ${troops.map((troop) => troopCard(state, troop, level)).join('')}
      </div>

      ${queuePanel(state, now)}
    </div>`;
}

/** تایمر و نوار پیشرفت صف آموزش را به‌روز می‌کند. */
export function updateTrainingProgress(root, now) {
  let completed = 0;
  for (const el of root.querySelectorAll('.job [data-timer]')) {
    const completeAt = Number(el.dataset.timer);
    if (!Number.isFinite(completeAt)) continue;
    if (completeAt - now <= 0) completed += 1;
  }
  for (const el of root.querySelectorAll('.job [data-progress]')) {
    const completeAt = Number(el.dataset.progress);
    const job = el.closest('.job');
    const startedAt = Number(job?.dataset.startedAt);
    const total = completeAt - startedAt;
    const ratio = total > 0 ? Math.max(0, Math.min(1, (now - startedAt) / total)) : 1;
    el.style.setProperty('--p', String(ratio));
    el.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    const timer = job?.querySelector('[data-timer]');
    if (timer) timer.textContent = faCountdown(Math.max(0, completeAt - now));
  }
  return completed;
}
