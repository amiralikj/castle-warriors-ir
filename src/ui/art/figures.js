/**
 * پیکره‌ها و نشان‌های گرافیکی بازی: سربازها، نشان دهکده و پرچم.
 * همه SVG درون‌خطی و بدون فایل خارجی.
 */
import { PALETTE, OUTLINE } from './geo.js';

/** نشان دهکده (سپر با برجک و ستاره). */
export function emblem({ size = 56 } = {}) {
  return `
    <svg class="emblem" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="emblemGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffe391"/>
          <stop offset="100%" stop-color="#dfa32b"/>
        </linearGradient>
      </defs>
      <path d="M32 3l24 8v18c0 15-10.6 26.6-24 32C18.6 55.6 8 44 8 29V11z" fill="#2b3a55" stroke="#101a2b" stroke-width="2.5"/>
      <path d="M32 7.4l19.6 6.6v14.8c0 12.6-8.7 22.6-19.6 27.3C21.1 51.4 12.4 41.4 12.4 28.8V14z" fill="url(#emblemGold)" stroke="#a9761a" stroke-width="1.4"/>
      <path d="M19.5 39V25l4-3 4 3v3h9v-3l4-3 4 3v14z" fill="#3c2a12" opacity="0.9"/>
      <circle cx="32" cy="17" r="3" fill="#fff4c9"/>
      <path d="M32 22l1.7 3.4 3.8.6-2.8 2.7.7 3.8L32 30.7l-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#fff4c9" opacity="0.95"/>
    </svg>`;
}

/** نشان سکه‌ی طلا با درخشش. */
export function coinBadge({ size = 34 } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="22" r="15" fill="#b97a13"/>
      <circle cx="20" cy="19" r="15" fill="#f2b134"/>
      <circle cx="20" cy="19" r="10.6" fill="none" stroke="#b97a13" stroke-width="2" opacity="0.65"/>
      <path d="M14.4 19h11.2M20 13.4v11.2" stroke="#ffe07a" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M10 12a12 12 0 016.8-5" stroke="#fff6d2" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
    </svg>`;
}

/** جواهر با درخشش. */
export function gemBadge({ size = 34 } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M12 6h16l6 8.6L20 35 6 14.6z" fill="#2ec4b6" stroke="#0f5f58" stroke-width="1.6"/>
      <path d="M12 6h16l6 8.6H6z" fill="#8ff0e2"/>
      <path d="M20 35L6 14.6h8.6z" fill="#14766e" opacity="0.6"/>
      <path d="M6 14.6h28M15.6 14.6L20 35l4.4-20.4" fill="none" stroke="#0f5f58" stroke-width="1.1" opacity="0.5"/>
    </svg>`;
}

/** گندم. */
export function wheatBadge({ size = 34 } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 35V15" stroke="#a8761a" stroke-width="3" stroke-linecap="round"/>
      <path d="M20 17c0-4.6 2.8-7.8 6.6-9-.4 4.8-2.6 7.8-6.6 9z" fill="#f0c04b"/>
      <path d="M20 17c0-4.6-2.8-7.8-6.6-9 .4 4.8 2.6 7.8 6.6 9z" fill="#ffe08a"/>
      <path d="M20 25c0-4.6 2.8-7.8 6.6-9-.4 4.8-2.6 7.8-6.6 9z" fill="#f0c04b"/>
      <path d="M20 25c0-4.6-2.8-7.8-6.6-9 .4 4.8 2.6 7.8 6.6 9z" fill="#ffe08a"/>
      <path d="M20 33c0-4.4 2.6-7.4 6.2-8.6-.4 4.6-2.4 7.4-6.2 8.6z" fill="#f0c04b"/>
    </svg>`;
}

/** جام پیروزی. */
export function trophyBadge({ size = 30 } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M11 6h18v8a9 9 0 01-18 0z" fill="#f2b134" stroke="#a9761a" stroke-width="1.6"/>
      <path d="M11 9H6v2.6A6 6 0 0012 17M29 9h5v2.6A6 6 0 0128 17" fill="none" stroke="#a9761a" stroke-width="2"/>
      <path d="M20 23v5M14 34h12l-1.8-6H15.8z" fill="#f2b134" stroke="#a9761a" stroke-width="1.6"/>
    </svg>`;
}

/* --------------------------------------------------------------- سربازها */

const SKIN = '#e8bf8f';
const SKIN_SHADE = '#c99c6c';

function figureBase({ shield = '#2ec4b6', tunic = '#e05c4a', helmet = '#c3b191' } = {}) {
  return `
    <ellipse cx="32" cy="72" rx="15" ry="5" fill="#1b1208" opacity="0.22"/>
    <path d="M26 44h12l3 24h-4l-1-14-2 14h-4l-1-14-1 14h-4z" fill="#3f4a5e" stroke="#26303f" stroke-width="1.2"/>
    <path d="M24 30h16l3 16H21z" fill="${tunic}" stroke="#8f2f22" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M24 36h16v3H24z" fill="#8f2f22" opacity="0.5"/>
    <circle cx="32" cy="22" r="8" fill="${SKIN}" stroke="#96693c" stroke-width="1.2"/>
    <path d="M24 21a8 8 0 0116 0z" fill="${helmet}" stroke="#6d6350" stroke-width="1.2"/>
    <path d="M29 22h6" stroke="${SKIN_SHADE}" stroke-width="1.4"/>
    <circle cx="29" cy="21" r="1.1" fill="#3b2a1c"/>
    <circle cx="35" cy="21" r="1.1" fill="#3b2a1c"/>
    <circle cx="21" cy="30" r="4.4" fill="${shield}" stroke="#0f5f58" stroke-width="1.4"/>
  `;
}

/** نیزه‌دار. */
export function spearmanSprite() {
  return `
    <svg class="figure" viewBox="0 0 64 80" width="100%" height="100%" aria-hidden="true">
      <line x1="46" y1="14" x2="46" y2="66" stroke="#8a5a30" stroke-width="3" stroke-linecap="round"/>
      <path d="M46 6l4.6 9h-9.2z" fill="#d6dae4" stroke="#6d7280" stroke-width="1.2"/>
      ${figureBase({ shield: '#2ec4b6', tunic: '#e05c4a' })}
    </svg>`;
}

/** کماندار. */
export function archerSprite() {
  return `
    <svg class="figure" viewBox="0 0 64 80" width="100%" height="100%" aria-hidden="true">
      <path d="M47 14q9 20 0 40" fill="none" stroke="#a9713f" stroke-width="3" stroke-linecap="round"/>
      <path d="M47 14q-6 20 0 40" fill="none" stroke="#e8dcc4" stroke-width="1.3"/>
      <path d="M47 34l-14 0" stroke="#8a5a30" stroke-width="1.8" stroke-linecap="round"/>
      ${figureBase({ shield: '#e8b44a', tunic: '#3f6b9c', helmet: '#8a7a5c' })}
    </svg>`;
}

export const FIGURES = { spearman: spearmanSprite, archer: archerSprite };

export function troopFigure(type) {
  const fn = FIGURES[type];
  return fn ? fn() : spearmanSprite();
}

/* --------------------------------------------------------- آیکون نوار پایین */

const DOCK_ART = {
  village: `
    <path d="M2 12.6l10-8.4 10 8.4" fill="none" stroke="#ffe4a6" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="4.4" y="12.2" width="15.2" height="9.4" rx="1.8" fill="#f6e6c4" stroke="#8a6a3a" stroke-width="1.4"/>
    <rect x="9.6" y="15.4" width="4.8" height="6.2" rx="1" fill="#c98546" stroke="#6e4525" stroke-width="1.2"/>
    <path d="M4.4 13.4h15.2" stroke="#c98546" stroke-width="1.6"/>`,
  hammer: `
    <path d="M7.6 21.4l8.6-8.6 2.8 2.8-8.6 8.6z" fill="#b9895a" stroke="#6e4525" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M14.4 10.6l3.4-3.4 1.4-4.6 3 3-4.6 1.4-3.4 3.4z" fill="#d9dde6" stroke="#6d7280" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M8.6 2.6l5 5-2.2 2.2-5-5z" fill="#f6e6c4" stroke="#8a6a3a" stroke-width="1.4" stroke-linejoin="round"/>`,
  shield: `
    <path d="M12 2.2l8.4 3v6.6c0 4.8-3.4 8.6-8.4 10.6-5-2-8.4-5.8-8.4-10.6V5.2z" fill="#3fd0c0" stroke="#125e58" stroke-width="1.6"/>
    <path d="M12 5l5.6 2v4.8c0 3.4-2.3 6.1-5.6 7.6-3.3-1.5-5.6-4.2-5.6-7.6V7z" fill="#2aa79b" opacity="0.7"/>
    <path d="M12 7.4v7.4M8.4 11h7.2" stroke="#fff6e2" stroke-width="2" stroke-linecap="round"/>`,
  sword: `
    <path d="M4.6 19.8l11-11 3 3-11 11z" fill="#dfe4ee" stroke="#5b6270" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M15.6 8.8l3.6-4.6 2.2 2.2-4.6 3.6z" fill="#f3f6fb" stroke="#5b6270" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M19.2 2.8l2 2-1.4 1.4-2-2z" fill="#f5c15a"/>
    <path d="M3 21l2.6-2.6M6.6 15.8l3.4 3.4" stroke="#c98546" stroke-width="2.4" stroke-linecap="round"/>`,
  more: `
    <circle cx="5.4" cy="12" r="2.6" fill="#dfe4ee"/>
    <circle cx="12" cy="12" r="2.6" fill="#dfe4ee"/>
    <circle cx="18.6" cy="12" r="2.6" fill="#dfe4ee"/>`,
};

/** آیکون بزرگ و پرکنتراست برای نوار پایین. */
export function dockIcon(name, { size = 26 } = {}) {
  const art = DOCK_ART[name] || DOCK_ART.village;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${art}</svg>`;
}

/** پرچم کوچک برای نوار بالا. */
export function pennant({ color = PALETTE.gold } = {}) {
  return `
    <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">
      <path d="M2 2h20l-4 8 4 8H2z" fill="${color}" stroke="${OUTLINE}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M6 6h10M6 10h12M6 14h8" stroke="rgba(0,0,0,0.28)" stroke-width="1.4"/>
    </svg>`;
}
