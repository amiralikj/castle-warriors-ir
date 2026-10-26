/**
 * نقطه‌ی ورود بازی «جنگاوران قلعه»
 * موج ۱: نمایش شالوده و بررسی سالم‌بودن محیط اجرا.
 * در موج‌های بعدی، موتور بازی و صفحه‌ها اینجا سوار می‌شوند.
 */
const app = document.querySelector('#app');

const WAVE = 1;
const TITLE = 'جنگاوران قلعه';
const TAGLINE = 'بازی استراتژی و آبادانی روستا، با حال‌وهوای ایرانی';

function renderSplash() {
  if (!app) return;
  app.innerHTML = `
    <section class="splash">
      <div class="splash__badge" aria-hidden="true">🏰</div>
      <h1>${TITLE}</h1>
      <p>${TAGLINE}</p>
      <p class="splash__meta">شالوده‌ی پروژه آماده است — موج ۱ از ۵۰</p>
      <p>به‌زودی روستایت را می‌سازی، سپاهت را آموزش می‌دهی و به دشمنان می‌تازی.</p>
    </section>
  `;
  document.title = `${TITLE} | بازی استراتژی ایرانی`;
}

renderSplash();

export { WAVE, renderSplash };
