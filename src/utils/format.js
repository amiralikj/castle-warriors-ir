/**
 * ابزارهای نمایش فارسی
 * همه‌ی ذخیره‌سازی‌ها با ارقام لاتین انجام می‌شود؛ فقط لایه‌ی نمایش فارسی می‌کند.
 */
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** ارقام لاتین را به فارسی تبدیل می‌کند. */
export function faDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * عدد را با جداکننده‌ی هزارگان فارسی (٬) و ارقام فارسی برمی‌گرداند.
 * @param {number} value
 * @param {{decimals?: number, grouping?: boolean}} options
 */
export function faNumber(value, { decimals = 0, grouping = true } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
  const negative = fixed.startsWith('-');
  const [intPart, fracPart] = fixed.replace('-', '').split('.');
  const grouped = grouping ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬') : intPart;
  const body = fracPart ? `${grouped}٫${fracPart}` : grouped;
  return `${negative ? '−' : ''}${faDigits(body)}`;
}

/** درصد را با ارقام فارسی برمی‌گرداند. */
export function faPercent(ratio, { decimals = 0 } = {}) {
  if (!Number.isFinite(Number(ratio))) return '—';
  return `${faNumber(Number(ratio) * 100, { decimals })}٪`;
}

const UNIT_SECONDS = [
  ['روز', 86400],
  ['ساعت', 3600],
  ['دقیقه', 60],
  ['ثانیه', 1],
];

/**
 * مدت زمان را به فارسی و خوانا برمی‌گرداند: «۲ ساعت و ۵ دقیقه».
 * @param {number} seconds
 * @param {{maxParts?: number}} options
 */
export function faDuration(seconds, { maxParts = 2 } = {}) {
  let remaining = Math.max(0, Math.round(Number(seconds) || 0));
  if (remaining === 0) return '۰ ثانیه';
  const parts = [];
  for (const [label, size] of UNIT_SECONDS) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      remaining -= count * size;
      parts.push(`${faNumber(count)} ${label}`);
    }
    if (parts.length >= maxParts) break;
  }
  return parts.join(' و ');
}

/** شمارش معکوس به شکل «۰۱:۲۳» با ارقام فارسی. */
export function faCountdown(ms) {
  const total = Math.max(0, Math.ceil(Number(ms) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (v) => faDigits(String(v).padStart(2, '0'));
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`;
}

const JALALI_DATE = new Intl.DateTimeFormat('fa-IR', {
  calendar: 'persian',
  dateStyle: 'medium',
});

const JALALI_DATETIME = new Intl.DateTimeFormat('fa-IR', {
  calendar: 'persian',
  dateStyle: 'short',
  timeStyle: 'short',
});

function toDate(input) {
  const date = input instanceof Date ? input : new Date(Number(input) || Date.parse(input));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** تاریخ شمسی: «۴ آبان ۱۴۰۵». */
export function faDate(input = new Date()) {
  const date = toDate(input);
  return date ? JALALI_DATE.format(date) : '—';
}

/** تاریخ و ساعت شمسی. */
export function faDateTime(input = new Date()) {
  const date = toDate(input);
  return date ? JALALI_DATETIME.format(date) : '—';
}

/** فاصله‌ی زمانی نسبی: «همین حالا»، «۳ دقیقه پیش». */
export function faRelative(input, now = Date.now()) {
  const date = toDate(input);
  if (!date) return '—';
  const diff = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(diff);
  if (abs < 30) return 'همین حالا';
  const text = faDuration(abs);
  return diff > 0 ? `${text} بعد` : `${text} پیش`;
}
