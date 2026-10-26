/**
 * صفحه‌ی «ساختن»: فروشگاه کامل ساختمان‌ها با پیش‌نمایش گرافیکی.
 */
import { castleLevel } from '../../core/village.js';
import { costFor, productionFor, constructionSeconds } from '../../data/buildings.js';
import { faNumber, faDuration } from '../../utils/format.js';
import { shopContent } from './village.js';

export function renderBuild(state) {
  const level = castleLevel(state.village);
  const count = state.village.buildings.length;
  const cheapest = Object.entries(state.village.buildings).length;
  return `
    <div class="page page--build">
      <section class="panel">
        <div class="army-head__row">
          <div>
            <h2>ساختن</h2>
            <p class="muted">سطح ارگ ${faNumber(level)} • ${faNumber(count)} ساختمان در دهکده</p>
          </div>
          <span class="chip">${faNumber(cheapest)} قطعه زمین</span>
        </div>
        <div class="stat-list">
          <div class="stat-row">
            <span class="stat-row__label">هزینه‌ی معدن طلا</span>
            <strong class="stat-row__value">${faNumber(costFor('goldMine', 1).gold || 0)} طلا</strong>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">تولید معدن سطح ۱</span>
            <strong class="stat-row__value">${faNumber(productionFor('goldMine', 1).perHour)} در ساعت</strong>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">زمان ساخت کشتزار</span>
            <strong class="stat-row__value">${faDuration(constructionSeconds('farm', 1))}</strong>
          </div>
        </div>
      </section>
      <div class="shop">${shopContent(state)}</div>
    </div>`;
}
