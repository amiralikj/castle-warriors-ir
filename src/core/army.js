/**
 * منطق خالص ارتش: ظرفیت، صف آموزش و تکمیل دسته‌ها.
 */
import { TROOPS, getTroop, trainingSeconds } from '../data/troops.js';

export const BASE_CAPACITY = 20;
export const CAPACITY_PER_LEVEL = 10;
export const QUEUE_BASE = 2;

/** حالت ارتش تازه. */
export function createArmy() {
  return { units: {}, queue: [] };
}

/** ظرفیت سپاه بر پایه‌ی سطح سربازخانه. */
export function armyCapacity(barracksLevel = 1) {
  const level = Math.max(1, Math.min(6, Number(barracksLevel) || 1));
  return BASE_CAPACITY + CAPACITY_PER_LEVEL * level;
}

/** تعداد سرباز از یک نوع. */
export function unitCount(army, type) {
  return Math.max(0, Math.floor(army?.units?.[type] || 0));
}

/** مجموع نفرات ارتش. */
export function totalUnits(army) {
  return Object.values(army?.units || {}).reduce((sum, n) => sum + Math.max(0, Math.floor(n)), 0);
}

/** خانه‌های مصرف‌شده، شامل صف آموزش. */
export function housingUsed(army) {
  let used = 0;
  for (const [type, count] of Object.entries(army?.units || {})) {
    used += (TROOPS[type]?.housing || 1) * Math.max(0, Math.floor(count));
  }
  for (const job of army?.queue || []) {
    used += (TROOPS[job.type]?.housing || 1) * Math.max(0, Math.floor(job.count));
  }
  return used;
}

/** جای خالی ظرفیت ارتش. */
export function housingFree(army, barracksLevel = 1) {
  return Math.max(0, armyCapacity(barracksLevel) - housingUsed(army));
}

/** حداکثر دسته‌های هم‌زمان صف آموزش. */
export function queueLimit(barracksLevel = 1) {
  return QUEUE_BASE + Math.floor((Math.max(1, barracksLevel) - 1) / 2);
}

/**
 * یک دسته‌ی آموزش به صف اضافه می‌کند (بدون کسر منابع).
 * @returns {{ok:boolean, code?:string, message?:string, army?:object, job?:object}}
 */
export function enqueueTraining(army, { type, count = 1, now = 0, barracksLevel = 1 }) {
  const troop = getTroop(type);
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, code: 'INVALID_COUNT', message: 'تعداد سرباز نامعتبر است.' };
  }
  if (troop.unlockBarracks > barracksLevel) {
    return { ok: false, code: 'LOCKED', message: `${troop.name} به سربازخانه‌ی سطح ${troop.unlockBarracks} نیاز دارد.` };
  }
  if ((army.queue?.length || 0) >= queueLimit(barracksLevel)) {
    return { ok: false, code: 'QUEUE_FULL', message: 'صف آموزش پر است؛ چند لحظه صبر کن.' };
  }
  if (housingUsed(army) + troop.housing * n > armyCapacity(barracksLevel)) {
    return { ok: false, code: 'FULL', message: 'ظرفیت سپاه پر است؛ ابتدا پادگان را ارتقا بده.' };
  }

  const seconds = trainingSeconds(type, n, barracksLevel);
  const lastEnd = (army.queue || []).reduce((max, job) => Math.max(max, Number(job.completeAt) || 0), now);
  const startedAt = Math.max(now, lastEnd);
  const job = {
    id: `job-${now}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    count: n,
    startedAt,
    completeAt: startedAt + seconds * 1000,
    seconds,
  };
  return { ok: true, army: { ...army, queue: [...(army.queue || []), job] }, job, seconds };
}

/**
 * دسته‌های تمام‌شده را به ارتش اضافه می‌کند.
 * @returns {{army: object, completed: Array<{type:string,count:number}>}}
 */
export function tickArmy(army, now) {
  const queue = Array.isArray(army?.queue) ? army.queue : [];
  const units = { ...(army?.units || {}) };
  const done = [];
  const remaining = [];

  for (const job of queue) {
    if (job.completeAt > now) {
      remaining.push(job);
      continue;
    }
    units[job.type] = (units[job.type] || 0) + job.count;
    done.push({ type: job.type, count: job.count });
  }

  if (!done.length) return { army, completed: [] };
  return { army: { ...army, units, queue: remaining }, completed: done };
}

/** درصد پیشرفت یک دسته‌ی آموزشی (۰ تا ۱). */
export function jobProgress(job, now) {
  if (!job) return 0;
  const total = job.completeAt - job.startedAt;
  if (total <= 0) return 1;
  return Math.max(0, Math.min(1, (now - job.startedAt) / total));
}

/** زمان باقی‌مانده‌ی دسته به میلی‌ثانیه. */
export function jobRemaining(job, now) {
  if (!job) return 0;
  return Math.max(0, job.completeAt - now);
}

/** توان رزمی تقریبی ارتش برای مقایسه و نمایش. */
export function armyPower(army) {
  let power = 0;
  for (const [type, count] of Object.entries(army?.units || {})) {
    const stats = TROOPS[type]?.stats;
    if (!stats) continue;
    power += (stats.hp * 0.5 + stats.dps * 4) * Math.max(0, count);
  }
  return Math.round(power);
}

/** شناسه‌ی سربازان موجود برای نمایش. */
export function roster(army) {
  return Object.entries(army?.units || {})
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ type, count, troop: TROOPS[type] }));
}
