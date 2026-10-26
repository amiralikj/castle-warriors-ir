/**
 * صفحه‌ی «بیشتر»: آمار دهکده، تنظیمات و راهنما.
 */
import { faDate, faDateTime, faNumber } from '../../utils/format.js';
import { castleLevel } from '../../core/village.js';
import { totalUnits } from '../../core/army.js';
import { productionRates, storageCaps } from '../../core/economy.js';
import { faDuration } from '../../utils/format.js';
import { icon } from '../icons.js';

export function renderMore(state) {
  const level = castleLevel(state.village);
  const rates = productionRates(state.village.buildings);
  const caps = storageCaps(state.village.buildings);
  const stats = state.stats || {};
  const played = Math.max(0, (Date.now() - (state.createdAt || Date.now())) / 1000);

  return `
    <div class="page page--more">
      <section class="panel">
        <div class="army-head__row">
          <div>
            <h2>آمار دهکده</h2>
            <p class="muted">از ${faDateTime(state.createdAt)} در حال آبادانی</p>
          </div>
          <span class="chip">${faDate()}</span>
        </div>
        <div class="stat-list">
          <div class="stat-row"><span class="stat-row__label">${icon('castle', { size: 14 })} سطح ارگ</span><strong class="stat-row__value">${faNumber(level)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('village', { size: 14 })} ساختمان‌ها</span><strong class="stat-row__value">${faNumber(state.village.buildings.length)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('shield', { size: 14 })} سربازان</span><strong class="stat-row__value">${faNumber(totalUnits(state.army))}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('sword', { size: 14 })} نبردهای پیروز</span><strong class="stat-row__value">${faNumber(stats.battlesWon || 0)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('coin', { size: 14 })} کل طلای جمع‌شده</span><strong class="stat-row__value">${faNumber(stats.totalGoldEarned || 0)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('wheat', { size: 14 })} کل گندم جمع‌شده</span><strong class="stat-row__value">${faNumber(stats.totalWheatEarned || 0)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('clock', { size: 14 })} زمان بازی</span><strong class="stat-row__value">${faDuration(played)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('hammer', { size: 14 })} تولید طلا/گندم در ساعت</span><strong class="stat-row__value">${faNumber(rates.gold)} / ${faNumber(rates.wheat)}</strong></div>
          <div class="stat-row"><span class="stat-row__label">${icon('gem', { size: 14 })} سقف انبارها</span><strong class="stat-row__value">${faNumber(caps.gold)} / ${faNumber(caps.wheat)}</strong></div>
        </div>
      </section>

      <div class="menu-grid">
        <button class="menu-card" data-action="toggle-sound">
          <strong>${state.settings?.sound === false ? 'صدای بازی: خاموش' : 'صدای بازی: روشن'}</strong>
          <span class="muted">افکت‌ها و موسیقی در موج ۳۲ می‌آید</span>
        </button>
        <button class="menu-card" data-action="show-help">
          <strong>راهنمای بازی</strong>
          <span class="muted">چرخه‌ی ساخت، آموزش و نبرد</span>
        </button>
        <a class="menu-card" href="#/village">
          <strong>بازگشت به دهکده</strong>
          <span class="muted">دیدن صحنه‌ی دهکده</span>
        </a>
        <button class="menu-card" data-action="reset-save">
          <strong>شروع دوباره</strong>
          <span class="muted">همه‌ی پیشرفت پاک می‌شود</span>
        </button>
      </div>

      <section class="panel panel--soft">
        <h3>این نسخه</h3>
        <p class="muted">
          موج ۱۱ از ۵۰ — گرافیک ایزومتریک، رابط بازی‌گونه و فونت فارسی وزیرمتن.
          گزارش ساخت هر موج در <code>docs/CHANGELOG.md</code> است.
        </p>
      </section>
    </div>`;
}
