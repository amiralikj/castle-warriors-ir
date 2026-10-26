/**
 * صفحه‌ی سپاه: کارت سربازها با پیکره‌ی گرافیکی، ظرفیت و صف آموزش.
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
import { troopFigure } from '../art/figures.js';
import { pedestalArt } from '../art/scene.js';

function capacityHeader(state, level) {
  const cap = armyCapacity(level);
  const used = housingUsed(state.army);
  const ratio = cap > 0 ? Math.min(1, used / cap) : 0;
  return `
    <section class="army-head panel">
      <div class="army-head__row">
        <div>
          <h2>سپاه من</h2>
          <p class="muted">سربازخانه سطح ${faNumber(level)} • توان رزمی ${faNumber(armyPower(state.army))}</p>
        </div>
        <span class="chip chip--power">${icon('sword', { size: 14 })} ${faNumber(armyPower(state.army))}</span>
      </div>
      <div class="capacity" role="progressbar" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${used}" aria-label="ظرفیت سپاه">
        <span class="capacity__fill" style="--p:${ratio}"></span>
        <span class="capacity__text">${icon('shield', { size: 13 })} ${faNumber(used)} / ${faNumber(cap)}</span>
      </div>
    </section>`;
}

function rosterStrip(state) {
  const units = roster(state.army);
  if (!units.length) {
    return `<p class="muted roster-empty">هنوز سربازی در سپاه نیست؛ از کارت‌های پایین آموزش بده.</p>`;
  }
  return `<div class="roster">${units
    .map(
      (unit) => `
      <span class="roster__item">
        <span class="roster__art">${troopFigure(unit.type)}</span>
        <span class="roster__text">${unit.troop.name}<strong>${faNumber(unit.count)}</strong></span>
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
    ? `سربازخانه سطح ${faNumber(troop.unlockBarracks)} لازم است`
    : queueFull
      ? 'صف آموزش پر است'
      : capacityLeft < troop.housing
        ? 'ظرفیت سپاه پر است'
        : !affordable
          ? 'گندم کافی نیست'
          : '';

  return `
    <article class="troop-card${locked ? ' is-locked' : ''}">
      <div class="troop-card__art">${troopFigure(troop.id)}</div>
      <div class="troop-card__body">
        <div class="troop-card__head">
          <h3>${troop.name}</h3>
          <span class="troop-card__owned">${faNumber(state.army.units?.[troop.id] || 0)}</span>
        </div>
        <div class="troop-card__stats">
          <span>${icon('shield', { size: 13 })} ${faNumber(troop.stats.hp)}</span>
          <span>${icon('sword', { size: 13 })} ${faNumber(troop.stats.dps)}</span>
          <span>${icon('target', { size: 13 })} ${faNumber(troop.stats.range)}</span>
          <span>${icon('clock', { size: 13 })} ${faDuration(trainingSeconds(troop.id, 1, level))}</span>
        </div>
        <div class="troop-card__foot">
          <span class="cost cost--wheat">${icon('wheat', { size: 13 })} ${faNumber(troop.cost.wheat)}</span>
          <div class="troop-card__buttons">
            <button class="btn btn--primary btn--sm" data-train="${troop.id}" data-count="1" ${disabled ? 'disabled' : ''}>آموزش</button>
            <button class="btn btn--sm" data-train="${troop.id}" data-count="5" ${disabled ? 'disabled' : ''}>×۵</button>
          </div>
        </div>
        ${reason ? `<p class="troop-card__reason">${reason}</p>` : ''}
      </div>
    </article>`;
}

function queuePanel(state, now) {
  const queue = state.army.queue || [];
  if (!queue.length) {
    return `
      <section class="panel panel--soft queue">
        <h3>صف آموزش</h3>
        <p class="muted">صف خالی است؛ روی «آموزش» بزن تا سرباز تازه بسازی.</p>
      </section>`;
  }
  return `
    <section class="panel panel--soft queue">
      <h3>صف آموزش</h3>
      <ul class="jobs">
        ${queue
          .map((job) => {
            const ratio = jobProgress(job, now);
            return `
            <li class="job" data-started-at="${job.startedAt}">
              <span class="job__art">${troopFigure(job.type)}</span>
              <div class="job__main">
                <div class="job__row">
                  <span class="job__name">${faNumber(job.count)} ${TROOPS[job.type]?.name || job.type}</span>
                  <span class="job__timer" data-timer="${job.completeAt}">${faCountdown(jobRemaining(job, now))}</span>
                </div>
                <span class="job__bar" data-progress="${job.completeAt}" style="--p:${ratio}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio * 100)}"></span>
              </div>
            </li>`;
          })
          .join('')}
      </ul>
    </section>`;
}

/** صفحه‌ی کامل سپاه. */
export function renderArmy(state, ui = {}) {
  const level = barracksLevel(state.village);
  const now = ui.now || Date.now();

  if (level === 0) {
    return `
      <div class="page">
        <section class="panel empty-state">
          ${pedestalArt('barracks', { size: 156 })}
          <h2>سربازخانه نداری</h2>
          <p class="muted">برای آموزش سپاه اول یک سربازخانه بساز؛ از سطح ۲ ارگ باز می‌شود.</p>
          <a class="btn btn--primary" href="#/village" data-action="go-build">رفتن به فروشگاه ساخت</a>
        </section>
      </div>`;
  }

  return `
    <div class="page page--army">
      ${capacityHeader(state, level)}
      <section class="panel panel--soft">
        <h3>سربازان در سپاه</h3>
        ${rosterStrip(state)}
      </section>
      <div class="troops">
        ${unlockedTroops(level)
          .map((troop) => troopCard(state, troop, level))
          .join('')}
      </div>
      ${queuePanel(state, now)}
    </div>`;
}

/** به‌روزرسانی تایمر و نوار صف آموزش. */
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
