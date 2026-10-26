import { SCREENS } from '../shell.js';
import { faNumber } from '../../utils/format.js';

const NOTES = {
  village: 'شبکه‌ی روستا، ساخت ساختمان و ارتقا در این صفحه می‌آید.',
  army: 'سربازخانه، صف آموزش و ظرفیت سپاه در این صفحه می‌آید.',
  battle: 'انتخاب حریف، پیاده‌کردن سپاه و نتیجه‌ی نبرد اینجا نمایش داده می‌شود.',
  more: 'مأموریت‌ها، دستاوردها و تنظیمات از این بخش باز می‌شوند.',
};

/** صفحه‌ی موقت برای بخش‌هایی که هنوز ساخته نشده‌اند. */
export function renderPlaceholder(screenId) {
  const screen = SCREENS.find((item) => item.id === screenId) || SCREENS[0];
  return `
    <section class="panel placeholder">
      <span class="chip">در دست ساخت</span>
      <h2>${screen.label}</h2>
      <p>${NOTES[screen.id] || 'این بخش به‌زودی آماده می‌شود.'}</p>
      <p class="placeholder__wave">
        قرار است در <strong>موج ${faNumber(screen.wave)}</strong> از ۵۰ موج ساخته شود.
      </p>
    </section>
  `;
}
