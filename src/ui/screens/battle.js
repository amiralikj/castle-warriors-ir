/**
 * صفحه‌ی نبرد: انتخاب حریف با پیش‌نمایش دهکده، حمله با کل سپاه،
 * کارت نتیجه و تاریخچه‌ی نبردها.
 */
import { createOpponents, enemyPower } from '../../core/battle.js';
import { totalUnits, armyPower, roster } from '../../core/army.js';
import { castleLevel } from '../../core/village.js';
import { faNumber, faDateTime } from '../../utils/format.js';
import { icon } from '../icons.js';
import { enemyPreview } from '../art/scene.js';
import { troopFigure as figure } from '../art/figures.js';
import { troopFigure } from '../art/figures.js';

export function starsMarkup(stars) {
  return `<span class="stars" aria-label="${faNumber(stars)} ستاره از ۳">${[1, 2, 3]
    .map((n) => `<span class="star${n <= stars ? ' is-on' : ''}" aria-hidden="true">★</span>`)
    .join('')}</span>`;
}

function armyStrip(state) {
  const count = totalUnits(state.army);
  return `
    <section class="panel army-strip">
      <div class="army-strip__row">
        <span class="chip">${icon('shield', { size: 14 })} ${faNumber(count)} سرباز</span>
        <span class="chip chip--power">${icon('sword', { size: 14 })} توان ${faNumber(armyPower(state.army))}</span>
        <button class="chip chip--action" data-action="refresh-opponents">حریفان تازه ⟳</button>
      </div>
      <div class="army-strip__units">
        ${roster(state.army)
          .map(
            (unit) => `
          <span class="army-strip__unit">
            <span class="army-strip__art">${troopFigure(unit.type)}</span>
            <span>${unit.troop.name}</span>
            <strong>${faNumber(unit.count)}</strong>
          </span>`,
          )
          .join('')}
      </div>
    </section>`;
}

function enemyCard(enemy, playerPower) {
  const power = enemyPower(enemy);
  const ratio = playerPower > 0 ? Math.min(1, power / (playerPower * 1.6)) : 0;
  const tone = power <= playerPower * 0.9 ? 'easy' : power <= playerPower * 1.5 ? 'fair' : 'hard';
  const label = tone === 'easy' ? 'آسان' : tone === 'fair' ? 'متوسط' : 'سخت';
  return `
    <article class="enemy-card enemy-card--${tone}">
      <div class="enemy-card__art">
        ${enemyPreview(enemy, { size: 220 })}
        <span class="tone tone--${tone}">${label}</span>
        <span class="enemy-card__name">${enemy.name}</span>
      </div>
      <div class="enemy-card__body">
        <div class="enemy-card__meta">
          <span>سطح ${faNumber(enemy.level)}</span>
          <span>${faNumber(enemy.buildings.length)} ساختمان</span>
          <span>${icon('shield', { size: 12 })} دفاع ${faNumber(enemy.defenseDps)}</span>
        </div>
        <div class="enemy-card__power">
          <span class="enemy-card__bar"><i style="--p:${ratio}"></i></span>
        </div>
        <div class="enemy-card__foot">
          <div class="enemy-card__loot">
            <span class="cost cost--gold">${icon('coin', { size: 14 })} ${faNumber(enemy.loot.gold)}</span>
            <span class="cost cost--wheat">${icon('wheat', { size: 14 })} ${faNumber(enemy.loot.wheat)}</span>
          </div>
          <button class="btn btn--primary btn--sm" data-attack="${enemy.seed}" data-level="${enemy.level}">
            ${icon('sword', { size: 15 })} حمله
          </button>
        </div>
      </div>
    </article>`;
}

function resultCard(result, enemyName) {
  return `
    <section class="battle-result${result.win ? ' is-win' : ' is-loss'}" role="dialog" aria-label="نتیجه‌ی نبرد">
      <div class="battle-result__banner">
        <h3>${result.win ? 'پیروزی!' : 'عقب‌نشینی'}</h3>
        ${starsMarkup(result.stars)}
      </div>
      <p class="battle-result__enemy muted">${enemyName}</p>
      <div class="battle-result__grid">
        <div class="result-stat"><span>تخریب</span><strong>${faNumber(Math.round(result.destruction * 100))}٪</strong></div>
        <div class="result-stat"><span>غنیمت طلا</span><strong>${faNumber(result.loot.gold)}</strong></div>
        <div class="result-stat"><span>غنیمت گندم</span><strong>${faNumber(result.loot.wheat)}</strong></div>
        <div class="result-stat"><span>تلفات</span><strong>${faNumber(result.attackerLosses)}</strong></div>
      </div>
      <ul class="battle-log">${result.log.slice(0, 4).map((line) => `<li>${line}</li>`).join('')}</ul>
      <button class="btn btn--ghost" data-action="close-result" aria-label="بستن">بستن</button>
    </section>`;
}

function historyList(state) {
  const history = state.battle?.history || [];
  if (!history.length) {
    return '<p class="muted">هنوز نبردی ثبت نشده است. اولین حمله‌ات را شروع کن!</p>';
  }
  return `
    <ul class="battle-history">
      ${history
        .slice(0, 6)
        .map(
          (entry) => `
        <li class="history-item">
          ${starsMarkup(entry.stars)}
          <span class="history-item__name">${entry.name}</span>
          <span class="muted history-item__date">${faDateTime(entry.at)}</span>
          <span class="history-item__loot">
            <span class="cost cost--gold">${icon('coin', { size: 12 })} ${faNumber(entry.loot.gold)}</span>
            <span class="cost cost--wheat">${icon('wheat', { size: 12 })} ${faNumber(entry.loot.wheat)}</span>
          </span>
        </li>`,
        )
        .join('')}
    </ul>`;
}

/** صفحه‌ی کامل نبرد. */
export function renderBattle(state, ui = {}) {
  const level = castleLevel(state.village);
  const armyCount = totalUnits(state.army);
  const playerPower = armyPower(state.army);
  const opponents = createOpponents(level, state.battle?.seed ?? 7);
  const result = ui.battleResult;

  if (result) {
    return `<div class="page page--battle">${resultCard(result, ui.battleEnemyName || 'دشمن')}</div>`;
  }

  if (armyCount === 0) {
    return `
      <div class="page">
        <section class="panel empty-state">
          <div class="empty-art" style="display:flex;gap:6px;justify-content:center;height:96px">
            <span style="width:70px;display:block">${figure('spearman')}</span>
            <span style="width:70px;display:block">${figure('archer')}</span>
          </div>
          <h2>سپاهی نداری</h2>
          <p class="muted">پیش از حمله باید در سربازخانه سرباز آموزش بدهی.</p>
          <a class="btn btn--primary" href="#/army">رفتن به سپاه</a>
        </section>
      </div>`;
  }

  return `
    <div class="page page--battle">
      <div class="battle-head">
        <div>
          <h2>میدان نبرد</h2>
          <p class="muted">حریف را انتخاب کن؛ کل سپاه حمله می‌کند و بازماندگان برمی‌گردند.</p>
        </div>
      </div>

      ${armyStrip(state)}

      <div class="enemies">
        ${opponents.map((enemy) => enemyCard(enemy, playerPower)).join('')}
      </div>

      <section class="panel panel--soft">
        <h3>تاریخچه‌ی نبردها</h3>
        ${historyList(state)}
      </section>
    </div>`;
}
