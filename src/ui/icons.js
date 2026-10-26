/** آیکون‌های SVG درون‌خطی — بدون فایل خارجی و بدون شبکه. */
const paths = {
  castle: `<path d="M4 20h16M6 20V9l3-2 3 2 3-2 3 2v11M9 20v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 9V5h2v2M16 9V5h2v2M11 7h2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  swords: `<path d="M4 4l7 7M20 4l-7 7M7 20l-3-3 6-6 3 3-6 6zM17 20l3-3-6-6-3 3 6 6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  army: `<circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5M16 6.5a3 3 0 010 5.6M17 14c2.2.5 3.6 2.3 4 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  more: `<circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/>`,
  gold: `<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v8M9.5 10h5M9.5 14h5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  wheat: `<path d="M12 20V9M12 9c0-2 1.4-3.6 3.2-4M12 9C12 7 10.6 5.4 8.8 5M12 13c0-2 1.4-3.6 3.2-4M12 13c0-2-1.4-3.6-3.2-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  gems: `<path d="M7 4h10l4 5-9 11L3 9l4-5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 9h18M9.5 9L12 20l2.5-11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>`,
  clock: `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v4.5l3 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
};

/** @param {keyof typeof paths} name */
export function icon(name, { size = 22, label } = {}) {
  const body = paths[name] || paths.castle;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" ${aria} focusable="false">${body}</svg>`;
}

export const ICON_NAMES = Object.keys(paths);
