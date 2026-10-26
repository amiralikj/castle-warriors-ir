/**
 * برگه‌های پایین‌کش (Bottom Sheet) در سبک بازی‌های موبایلی.
 */
import { icon } from './icons.js';

/**
 * @param {{title?: string, subtitle?: string, body?: string, footer?: string, variant?: string,
 *          closeAction?: string, label?: string, full?: boolean}} options
 */
export function renderSheet({
  title = '',
  subtitle = '',
  body = '',
  footer = '',
  variant = '',
  closeAction = 'close-sheet',
  label,
  full = false,
}) {
  return `
    <div class="sheet-wrap${full ? ' sheet-wrap--full' : ''}" role="dialog" aria-modal="true" aria-label="${label || title}">
      <div class="sheet-backdrop" data-action="${closeAction}"></div>
      <section class="sheet ${variant ? `sheet--${variant}` : ''}">
        <div class="sheet__grip" aria-hidden="true"></div>
        <header class="sheet__head">
          <div>
            <h3>${title}</h3>
            ${subtitle ? `<p class="sheet__subtitle">${subtitle}</p>` : ''}
          </div>
          <button class="sheet__close" data-action="${closeAction}" aria-label="بستن">${icon('plus', { size: 18, className: 'rot45' })}</button>
        </header>
        <div class="sheet__body">${body}</div>
        ${footer ? `<footer class="sheet__foot">${footer}</footer>` : ''}
      </section>
    </div>`;
}

/** ردیف آمار برای برگه‌ها. */
export function statRow(label, value, iconName) {
  return `
    <div class="stat-row">
      <span class="stat-row__label">${iconName ? icon(iconName, { size: 16 }) : ''}${label}</span>
      <strong class="stat-row__value">${value}</strong>
    </div>`;
}
