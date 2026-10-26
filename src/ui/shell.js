/**
 * پوسته‌ی بازی: نوار منابع بالای صفحه، نشان بازیکن، جام،
 * دکمه‌های زوم و نوار پایین (Dock) با پنج بخش.
 */
import { faDate, faNumber } from '../utils/format.js';
import { icon } from './icons.js';
import { emblem, coinBadge, gemBadge, wheatBadge, trophyBadge, dockIcon } from './art/figures.js';

export const SCREENS = [
  { id: 'village', label: 'دهکده', icon: 'village', wave: 6 },
  { id: 'build', label: 'ساختن', icon: 'hammer', wave: 4 },
  { id: 'army', label: 'سپاه', icon: 'shield', wave: 8 },
  { id: 'battle', label: 'نبرد', icon: 'sword', wave: 10 },
  { id: 'more', label: 'بیشتر', icon: 'more', wave: 17 },
];

export const SCREEN_IDS = SCREENS.map((screen) => screen.id);

/** شهرت/جام: از تعداد بردها ساخته می‌شود. */
export function trophiesOf(state) {
  const won = state.stats?.battlesWon || 0;
  return won * 12;
}

function resourcePill(kind, art, value, label) {
  return `
    <button class="res res--${kind}" data-action="resource-${kind}" aria-label="${label}: ${value}">
      <span class="res__art">${art}</span>
      <span class="res__value">${value}</span>
      <span class="res__plus" aria-hidden="true">+</span>
    </button>`;
}

/**
 * پوسته‌ی اصلی. صحنه‌ی دهکده بیرون از این تابع گذاشته می‌شود (در بدنه‌ی صفحه).
 * @param {{active?: string, state?: object, camera?: object}} options
 */
export function renderShell({ active = 'village', state, camera, content = '' } = {}) {
  const level = state?.village?.buildings?.find((b) => b.type === 'castle')?.level ?? 1;
  const xp = Math.min(1, (state?.stats?.buildingsBuilt || 1) / 24 + level * 0.04);
  const resources = state?.resources || { gold: 0, wheat: 0, gems: 0 };
  const villageName = state?.settings?.villageName || 'دهکده‌ی من';
  const trophies = state ? trophiesOf(state) : 0;

  return `
    <span class="sr-only">جنگاوران قلعه — بازی استراتژی ایرانی</span>
    <header class="hud">
      <div class="hud__player">
        <button class="player" data-action="open-profile" aria-label="پروفایل بازیکن">
          <span class="player__crest">${emblem({ size: 52 })}</span>
          <span class="player__level">${faNumber(level)}</span>
        </button>
        <div class="hud__meta">
          <span class="hud__name">${villageName}</span>
          <span class="hud__xp" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(xp * 100)}" aria-label="پیشرفت سطح">
            <i style="--p:${xp.toFixed(3)}"></i>
          </span>
        </div>
      </div>

      <div class="hud__trophy" aria-label="جام‌ها">
        ${trophyBadge({ size: 26 })}
        <span>${faNumber(trophies)}</span>
      </div>

      <div class="hud__res">
        ${resourcePill('gold', coinBadge({ size: 30 }), faNumber(resources.gold), 'طلا')}
        ${resourcePill('wheat', wheatBadge({ size: 30 }), faNumber(resources.wheat), 'گندم')}
        ${resourcePill('gems', gemBadge({ size: 30 }), faNumber(resources.gems), 'گوهر')}
      </div>
    </header>

    <div class="zoom-bar" aria-label="بزرگ‌نمایی">
      <button class="zoom" data-action="zoom-in" aria-label="بزرگ‌تر">+</button>
      <button class="zoom" data-action="zoom-out" aria-label="کوچک‌تر">−</button>
      <button class="zoom zoom--home" data-action="camera-reset" aria-label="نمای کامل دهکده">${icon('village', { size: 20 })}</button>
    </div>

    <main class="views" id="screen" tabindex="-1">${content}</main>

    <div class="toasts" id="toasts" aria-live="polite" aria-atomic="false"></div>

    <nav class="dock" aria-label="ناوبری اصلی">
      <div class="dock__inner">
        ${SCREENS.map(
          (screen) => `
          <button class="dock__btn${screen.id === active ? ' is-active' : ''}" data-tab="${screen.id}"
            ${screen.id === active ? 'aria-current="page"' : ''}>
            <span class="dock__icon">${dockIcon(screen.icon, { size: 27 })}</span>
            <span class="dock__label">${screen.label}</span>
          </button>`,
        ).join('')}
      </div>
    </nav>

    <span class="sr-only">تاریخ امروز: ${faDate()}</span>
  `;
}

/** فقط مقدار منابع و جام را به‌روز می‌کند (بدون رندر دوباره). */
export function updateHud(root, state) {
  const values = {
    gold: faNumber(state.resources.gold),
    wheat: faNumber(state.resources.wheat),
    gems: faNumber(state.resources.gems),
  };
  for (const [kind, value] of Object.entries(values)) {
    const el = root.querySelector(`.res--${kind} .res__value`);
    if (el) el.textContent = value;
  }
  const trophies = root.querySelector('.hud__trophy span');
  if (trophies) trophies.textContent = faNumber(trophiesOf(state));
  const level = state.village.buildings.find((b) => b.type === 'castle')?.level ?? 1;
  const levelEl = root.querySelector('.player__level');
  if (levelEl) levelEl.textContent = faNumber(level);
}
