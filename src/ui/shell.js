import { faDate } from '../utils/format.js';
import { icon } from './icons.js';

/** صفحه‌های برنامه و موجی که هرکدام در آن ساخته می‌شود. */
export const SCREENS = [
  { id: 'village', label: 'روستا', icon: 'castle', wave: 6 },
  { id: 'army', label: 'ارتش', icon: 'army', wave: 8 },
  { id: 'battle', label: 'نبرد', icon: 'swords', wave: 9 },
  { id: 'more', label: 'بیشتر', icon: 'more', wave: 17 },
];

export const SCREEN_IDS = SCREENS.map((screen) => screen.id);

const RESOURCES = [
  { id: 'gold', label: 'طلا', icon: 'gold' },
  { id: 'wheat', label: 'گندم', icon: 'wheat' },
  { id: 'gems', label: 'گوهر', icon: 'gems' },
];

function resourceChip({ id, label, icon: iconName }, value) {
  const shown = value === undefined || value === null ? '—' : value;
  return `
    <div class="resource" data-resource="${id}">
      <span class="resource__icon">${icon(iconName, { size: 18 })}</span>
      <span class="resource__value">${shown}</span>
      <span class="resource__label">${label}</span>
    </div>
  `;
}

function navItem(screen, active) {
  const current = screen.id === active;
  return `
    <a class="nav__item${current ? ' is-active' : ''}" href="#/${screen.id}"
       ${current ? 'aria-current="page"' : ''}>
      ${icon(screen.icon, { size: 24 })}
      <span>${screen.label}</span>
    </a>
  `;
}

/**
 * پوسته‌ی اصلی برنامه را می‌سازد.
 * @param {{active?: string, resources?: Record<string, string>, date?: Date}} options
 */
export function renderShell({ active = 'village', resources = {}, date = new Date() } = {}) {
  return `
    <header class="topbar">
      <div class="topbar__brand">
        <span class="topbar__crest" aria-hidden="true">🏰</span>
        <div>
          <h1 class="topbar__title">جنگاوران قلعه</h1>
          <p class="topbar__date">${icon('clock', { size: 14 })} ${faDate(date)}</p>
        </div>
      </div>
      <div class="topbar__resources" aria-label="منابع">
        ${RESOURCES.map((resource) => resourceChip(resource, resources[resource.id])).join('')}
      </div>
    </header>

    <main class="screen" id="screen" tabindex="-1"></main>

    <div class="toasts" id="toasts" aria-live="polite" aria-atomic="false"></div>

    <nav class="nav" aria-label="ناوبری اصلی">
      <div class="nav__inner">
        ${SCREENS.map((screen) => navItem(screen, active)).join('')}
      </div>
    </nav>
  `;
}
