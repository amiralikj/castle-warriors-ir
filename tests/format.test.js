import test from 'node:test';
import assert from 'node:assert/strict';
import {
  faDigits,
  faNumber,
  faPercent,
  faDuration,
  faCountdown,
  faDate,
  faDateTime,
  faRelative,
} from '../src/utils/format.js';

test('ارقام لاتین به فارسی تبدیل می‌شوند', () => {
  assert.equal(faDigits('1405 / 08 / 04'), '۱۴۰۵ / ۰۸ / ۰۴');
  assert.equal(faDigits(''), '');
});

test('اعداد با جداکننده‌ی هزارگان فارسی نمایش داده می‌شوند', () => {
  assert.equal(faNumber(0), '۰');
  assert.equal(faNumber(1234), '۱٬۲۳۴');
  assert.equal(faNumber(1234567), '۱٬۲۳۴٬۵۶۷');
  assert.equal(faNumber(-42), '−۴۲');
  assert.equal(faNumber(12.5, { decimals: 1 }), '۱۲٫۵');
  assert.equal(faNumber(1234, { grouping: false }), '۱۲۳۴');
  assert.equal(faNumber(Number.NaN), '—');
});

test('درصد فارسی درست محاسبه می‌شود', () => {
  assert.equal(faPercent(0.5), '۵۰٪');
  assert.equal(faPercent(0.075, { decimals: 1 }), '۷٫۵٪');
});

test('مدت زمان به فارسی خوانا نوشته می‌شود', () => {
  assert.equal(faDuration(0), '۰ ثانیه');
  assert.equal(faDuration(45), '۴۵ ثانیه');
  assert.equal(faDuration(3600), '۱ ساعت');
  assert.equal(faDuration(3660), '۱ ساعت و ۱ دقیقه');
  assert.equal(faDuration(90000), '۱ روز و ۱ ساعت');
  assert.equal(faDuration(90061, { maxParts: 3 }), '۱ روز و ۱ ساعت و ۱ دقیقه');
});

test('شمارش معکوس با ارقام فارسی و صفرِ پیشوندی', () => {
  assert.equal(faCountdown(65_000), '۰۱:۰۵');
  assert.equal(faCountdown(3_725_000), '۰۱:۰۲:۰۵');
  assert.equal(faCountdown(-500), '۰۰:۰۰');
});

test('تاریخ شمسی و تاریخ‌وزمان ساخته می‌شوند', () => {
  const date = new Date('2026-10-26T10:00:00Z');
  assert.match(faDate(date), /آبان/);
  assert.match(faDate(date), /[۰-۹]/);
  assert.match(faDateTime(date), /[۰-۹]/);
  assert.equal(faDate('نامعتبر'), '—');
});

test('زمان نسبی فارسی درست است', () => {
  const now = Date.parse('2026-10-26T12:00:00Z');
  assert.equal(faRelative(now, now), 'همین حالا');
  assert.equal(faRelative(now + 3 * 60_000, now), '۳ دقیقه بعد');
  assert.equal(faRelative(now - 2 * 3600_000, now), '۲ ساعت پیش');
});
