/**
 * آیکون‌های گرافیکی بازی — SVG درون‌خطی با رنگ و سایه‌ی بازی‌گونه.
 * برای سازگاری، امضای icon(name, options) همانند قبل است.
 */
const C = {
  goldLight: '#ffe07a',
  gold: '#f2b134',
  goldDark: '#b97a13',
  wheatLight: '#ffe08a',
  wheat: '#e3a92c',
  wheatDark: '#a8761a',
  gemLight: '#8ff0e2',
  gem: '#2ec4b6',
  gemDark: '#14766e',
  stoneLight: '#e9dcc4',
  stone: '#c3b191',
  stoneDark: '#8b7a5f',
  wood: '#a9713f',
  woodDark: '#6e4525',
  blood: '#e05c4a',
  ink: '#20304a',
};

const SHAPES = {
  coin: `
    <circle cx="12" cy="12" r="9.2" fill="${C.goldDark}"/>
    <circle cx="12" cy="11.4" r="9.2" fill="${C.gold}"/>
    <circle cx="12" cy="11.4" r="6.4" fill="none" stroke="${C.goldDark}" stroke-width="1.4" opacity="0.8"/>
    <path d="M9.6 11.4h4.8M12 9v4.8" stroke="${C.goldLight}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M5.6 7.2a7.4 7.4 0 014.2-3.1" stroke="#fff4c9" stroke-width="1.3" stroke-linecap="round" opacity="0.85" fill="none"/>`,
  wheat: `
    <path d="M12 21V9.5" stroke="${C.wheatDark}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M12 10.5c0-2.6 1.6-4.4 3.7-5.1-.2 2.7-1.4 4.4-3.7 5.1z" fill="${C.wheat}"/>
    <path d="M12 10.5c0-2.6-1.6-4.4-3.7-5.1.2 2.7 1.4 4.4 3.7 5.1z" fill="${C.wheatLight}"/>
    <path d="M12 15c0-2.6 1.6-4.4 3.7-5.1-.2 2.7-1.4 4.4-3.7 5.1z" fill="${C.wheat}"/>
    <path d="M12 15c0-2.6-1.6-4.4-3.7-5.1.2 2.7 1.4 4.4 3.7 5.1z" fill="${C.wheatLight}"/>
    <path d="M12 19.4c0-2.4 1.5-4.1 3.4-4.7-.2 2.5-1.3 4.1-3.4 4.7z" fill="${C.wheat}"/>`,
  gem: `
    <path d="M7.2 3.6h9.6l3.6 5.1L12 20.8 1.6 8.7z" fill="${C.gem}"/>
    <path d="M7.2 3.6h9.6l3.6 5.1H3.6z" fill="${C.gemLight}"/>
    <path d="M12 20.8L3.6 8.7h5.2z" fill="${C.gemDark}" opacity="0.55"/>
    <path d="M12 20.8L16.8 8.7h5.2z" fill="#ffffff" opacity="0.18"/>
    <path d="M3.6 8.7h16.8M9.6 8.7L12 20.8l2.4-12.1" fill="none" stroke="#0e5d57" stroke-width="0.9" opacity="0.55"/>`,
  star: `
    <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"
      fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M12 5.4l1.8 3.7 4 .6-2.9 2.8" fill="none" stroke="${C.goldLight}" stroke-width="1.2" stroke-linecap="round"/>`,
  sword: `
    <path d="M6 18.4l8.8-8.8 2.6 2.6L8.6 21z" fill="${C.stone}" stroke="${C.stoneDark}" stroke-width="1"/>
    <path d="M14 8.6L19.8 2.8l1.4 1.4-5.8 5.8z" fill="${C.stoneLight}" stroke="${C.stoneDark}" stroke-width="1"/>
    <path d="M4.2 21.8l2-2M2.8 16.2l2.6 2.6" stroke="${C.woodDark}" stroke-width="2" stroke-linecap="round"/>`,
  castle: `
    <path d="M3.4 21V8.4l2.6-1.8 2.6 1.8v2.2h6.8V8.4l2.6-1.8 2.6 1.8V21z" fill="${C.stone}" stroke="${C.stoneDark}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M9.2 21v-5.4a2.8 2.8 0 015.6 0V21z" fill="${C.woodDark}"/>
    <path d="M6 4.2V2.2h2v2M16 4.2V2.2h2v2" stroke="${C.stoneLight}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M12 1.4l1.1 2.2h-2.2z" fill="${C.blood}"/>`,
  shield: `
    <path d="M12 2.4l8 2.8v6.2c0 4.6-3.2 8.2-8 10.2-4.8-2-8-5.6-8-10.2V5.2z" fill="${C.stone}" stroke="${C.stoneDark}" stroke-width="1.2"/>
    <path d="M12 5.4l5.4 1.9v4.1c0 3.2-2.2 5.8-5.4 7.3-3.2-1.5-5.4-4.1-5.4-7.3V7.3z" fill="${C.blood}" opacity="0.85"/>
    <path d="M12 8.2v6M9 11.2h6" stroke="${C.goldLight}" stroke-width="1.5" stroke-linecap="round"/>`,
  hammer: `
    <path d="M6.4 20.6l7.8-7.8 2.4 2.4-7.8 7.8z" fill="${C.wood}" stroke="${C.woodDark}" stroke-width="1"/>
    <path d="M13 10.4l3.6-3.6 1.2-4 2.8 2.8-4 1.2-3.6 3.6z" fill="${C.stone}" stroke="${C.stoneDark}" stroke-width="1"/>
    <path d="M8.6 3.4l4.2 4.2-1.8 1.8-4.2-4.2z" fill="${C.stoneLight}" stroke="${C.stoneDark}" stroke-width="1"/>`,
  clock: `
    <circle cx="12" cy="12" r="9.2" fill="${C.stoneLight}" stroke="${C.stoneDark}" stroke-width="1.4"/>
    <circle cx="12" cy="12" r="6.6" fill="#fffdf6"/>
    <path d="M12 8v4.4l3 1.8" stroke="${C.ink}" stroke-width="1.7" stroke-linecap="round" fill="none"/>`,
  plus: `<circle cx="12" cy="12" r="9" fill="${C.gemDark}"/><circle cx="12" cy="11.4" r="8.4" fill="${C.gem}"/><path d="M12 7.4v8M8 11.4h8" stroke="#eafffb" stroke-width="2.1" stroke-linecap="round"/>`,
  lock: `
    <rect x="4.6" y="10.4" width="14.8" height="10.8" rx="2.6" fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1.2"/>
    <path d="M8.4 10.4V8a3.6 3.6 0 017.2 0v2.4" fill="none" stroke="${C.stoneDark}" stroke-width="2"/>
    <circle cx="12" cy="15.4" r="1.8" fill="${C.goldDark}"/>`,
  army: `
    <circle cx="9" cy="7.4" r="3.4" fill="${C.stoneLight}" stroke="${C.stoneDark}" stroke-width="1.1"/>
    <path d="M2.6 20.4c.5-3.9 3.1-6.4 6.4-6.4s5.9 2.5 6.4 6.4z" fill="${C.blood}" stroke="#8f2f22" stroke-width="1.1"/>
    <circle cx="17" cy="8.6" r="2.8" fill="${C.stoneLight}" stroke="${C.stoneDark}" stroke-width="1.1"/>
    <path d="M14.4 20.4c.4-3 2-5.2 4.4-5.8-1.2 1.5-1.7 3.4-1.6 5.8z" fill="#c94a3b" stroke="#8f2f22" stroke-width="1"/>`,
  village: `
    <path d="M2.6 12.4l9.4-8 9.4 8" fill="none" stroke="${C.woodDark}" stroke-width="2" stroke-linecap="round"/>
    <rect x="5" y="12" width="14" height="9" rx="1.6" fill="${C.stone}" stroke="${C.stoneDark}" stroke-width="1.2"/>
    <rect x="9.6" y="14.8" width="4.8" height="6.2" rx="1" fill="${C.wood}" stroke="${C.woodDark}" stroke-width="1"/>`,
  more: `
    <circle cx="5.6" cy="12" r="2.2" fill="${C.stoneLight}"/>
    <circle cx="12" cy="12" r="2.2" fill="${C.stoneLight}"/>
    <circle cx="18.4" cy="12" r="2.2" fill="${C.stoneLight}"/>`,
  trophy: `
    <path d="M7 3.6h10v3.2a5 5 0 01-10 0z" fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1.2"/>
    <path d="M7 5.2H4.2v1.6A3.6 3.6 0 007.8 10.4M17 5.2h2.8v1.6a3.6 3.6 0 01-3.6 3.6" fill="none" stroke="${C.goldDark}" stroke-width="1.3"/>
    <path d="M12 12.2v3.4M8.6 20.4h6.8l-1-4.4H9.6z" fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1.2"/>`,
  target: `
    <circle cx="12" cy="12" r="9" fill="#f5e7c9" stroke="${C.stoneDark}" stroke-width="1.3"/>
    <circle cx="12" cy="12" r="5.6" fill="${C.blood}" opacity="0.9"/>
    <circle cx="12" cy="12" r="2.2" fill="#fff6e2"/>`,
};

// نام‌های جایگزین برای سازگاری با کدهای قبلی
const ALIASES = {
  swords: 'sword',
  gold: 'coin',
  gems: 'gem',
  wheat: 'wheat',
  castle: 'castle',
  army: 'army',
};

/** @param {keyof typeof SHAPES} name */
export function icon(name, { size = 22, label, className = '' } = {}) {
  const key = ALIASES[name] || name;
  const body = SHAPES[key] || SHAPES.village;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  const cls = `icon${className ? ` ${className}` : ''}`;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" ${aria} focusable="false">${body}</svg>`;
}

export const ICON_NAMES = Object.keys(SHAPES);
