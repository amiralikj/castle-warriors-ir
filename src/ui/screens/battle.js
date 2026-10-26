/**
 * صفحه‌ی نبرد: انتخاب حریف، حمله با کل سپاه، کارت نتیجه و تاریخچه.
 */
import { createOpponents, enemyPower } from '../../core/battle.js';
import { totalUnits, armyPower, roster } from '../../core/army.js';
import { castleLevel } from '../../core/village.js';
import { faNumber, faDateTime } from '../../utils/format.js';
import { icon } from '../icons.js';

function starsMarkup(stars) {
  return `<span class="stars" aria-label="${faNumber(stars)} ستاره از ۳">${[1, 2, 3]
    .map((n) => `<span class="star${n <= stars ? ' is-on' : ''}" aria-hidden="true">★</span>`)
    .join('')}</span>`;
}

function opponentCard(enemy) {
  const power = enemyPower(enemy);
  return `
    <article class="opponent">
      <div class="opponent__head">
        <span class="opponent__emoji" aria-hidden="true">🏯</span>
        <div>
          <h3>${enemy.name}</h3>
          <p class="muted">سطح ${faNumber(enemy.level)} • ${faNumber(enemy.buildings.length)} ساختمان</p>
        </div>
        <span class="chip">${icon('swords', { size: 14 })} ${faNumber(power)}</span>
      </div>
      <div class="opponent__loot">
        <span class="cost cost--gold">${icon('gold', { size: 14 })} ${faNumber(enemy.loot.gold)}</span>
        <span class="cost cost--wheat">${icon('wheat', { size: 14 })} ${faNumber(enemy.loot.wheat)}</span>
        <span class="muted">${icon('castle', { size: 14 })} دفاع ${faNumber(enemy.defenseDps)}</span>
      </div>
      <button class="btn btn--primary" data-attack="${enemy.seed}" data-level="${enemy.level}">
        ${icon('swords', { size: 16 })} حمله با کل سپاه
      </button>
    </article>`;
}

function resultCard(result, enemyName) {
  return `
    <section class="battle-result${result.win ? ' is-win' : ' is-loss'}" role="dialog" aria-label="نتیجه‌ی نبرد">
      <div class="battle-result__head">
        <div>
          <p class="muted">${enemyName}</p>
          <h3>${result.win ? 'پیروزی!' : 'عقب‌نشینی'}</h3>
        </div>
        ${starsMarkup(result.stars)}
        <button class="btn btn--ghost btn--sm" data-action="close-result" aria-label="بستن">✕</button>
      </div>
      <div class="battle-result__grid">
        <div class="result-stat"><span>تخریب</span><strong>${faNumber(Math.round(result.destruction * 100))}٪</strong></div>
        <div class="result-stat"><span>غنیمت طلا</span><strong>${faNumber(result.loot.gold)}</strong></div>
        <div class="result-stat"><span>غنیمت گندم</span><strong>${faNumber(result.loot.wheat)}</strong></div>
        <div class="result-stat"><span>تلفات</span><strong>${faNumber(result.attackerLosses)}</strong></div>
      </div>
      <ul class="battle-log">
        ${result.log.map((line) => `<li>${line}</li>`).join('')}
      </ul>
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
        .slice(0, 8)
        .map(
          (entry) => `
        <li class="history-item">
          <span class="history-item__stars">${starsMarkup(entry.stars)}</span>
          <span class="history-item__name">${entry.name}</span>
          <span class="muted">${faDateTime(entry.at)}</span>
          <span class="history-item__loot">
            <span class="cost cost--gold">${icon('gold', { size: 12 })} ${faNumber(entry.loot.gold)}</span>
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
  const opponents = createOpponents(level, state.battle?.seed ?? 7);
  const result = ui.battleResult;

  const armyLine =
    armyCount === 0
      ? `<section class="panel empty-state">
           <span class="empty-state__emoji" aria-hidden="true">⚔️</span>
           <h2>سپاهی نداری</h2>
           <p class="muted">پیش از حمله باید در سربازخانه سرباز آموزش بدهی.</p>
           <a class="btn btn--primary" href="#/army">رفتن به ارتش</a>
         </section>`
      : `<div class="battle-army">
           <span class="chip">${icon('army', { size: 14 })} ${faNumber(armyCount)} سرباز</span>
           <span class="chip">${icon('swords', { size: 14 })} توان ${faNumber(armyPower(state.army))}</span>
           ${roster(state.army)
             .map((unit) => `<span class="muted">${unit.troop.emoji} ${unit.troop.name}: ${faNumber(unit.count)}</span>`)
             .join('')}
         </div>`;

  return `
    <div class="battle">
      <div class="battle__head">
        <div>
          <h2>میدان نبرد</h2>
          <p class="muted">حمله با تمام سپاه انجام می‌شود؛ بازماندگان به دهکده برمی‌گردند.</p>
        </div>
        <button class="btn btn--sm" data-action="refresh-opponents">حریفان تازه</button>
      </div>

      ${armyLine}
      ${result ? resultCard(result, ui.battleEnemyName || 'دشمن') : ''}

      ${
        armyCount === 0
          ? ''
          : `<div class="opponents">${opponents.map((enemy) => opponentCard(enemy)).join('')}</div>`
      }

      <section class="panel panel--soft">
        <h3>تاریخچه‌ی نبردها</h3>
        ${historyList(state)}
      </section>
    </div>`;
}

export { starsMarkup };
