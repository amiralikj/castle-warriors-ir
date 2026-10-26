/**
 * منطق خالص دهکده: شبکه، جای‌گذاری، ساخت و ارتقا.
 * همه‌ی توابع بدون عارضه‌ی جانبی هستند و زمان به‌صورت پارامتر می‌آید.
 */
import { costFor, constructionSeconds, getBuilding, isUnlocked } from '../data/buildings.js';

export const GRID_SIZE = 20;
export const CASTLE_START = { x: 8, y: 8 };

/** یک دهکده‌ی تازه با ارگ سطح ۱ در مرکز. */
export function createVillage({ size = GRID_SIZE } = {}) {
  const start = CASTLE_START;
  return {
    size,
    nextUid: 2,
    buildings: [
      {
        uid: 1,
        type: 'castle',
        level: 1,
        x: start.x,
        y: start.y,
        state: 'idle',
        startedAt: null,
        completeAt: null,
        targetLevel: null,
      },
    ],
  };
}

/** خانه‌های اشغال‌شده توسط یک ساختمان. */
export function footprint(building) {
  const def = getBuilding(building.type);
  const cells = [];
  for (let dx = 0; dx < def.size.w; dx += 1) {
    for (let dy = 0; dy < def.size.h; dy += 1) {
      cells.push({ x: building.x + dx, y: building.y + dy });
    }
  }
  return cells;
}

/** سطح ارگ دهکده. */
export function castleLevel(village) {
  const castle = village.buildings.find((b) => b.type === 'castle');
  return castle ? castle.level : 1;
}

export function findByUid(village, uid) {
  return village.buildings.find((b) => b.uid === uid) || null;
}

/** ساختمانی که خانه‌ی مشخصی را اشغال کرده است. */
export function buildingAt(village, x, y) {
  return (
    village.buildings.find((building) =>
      footprint(building).some((cell) => cell.x === x && cell.y === y),
    ) || null
  );
}

export function countOfType(village, type) {
  return village.buildings.filter((b) => b.type === type).length;
}

/**
 * بررسی امکان جای‌گذاری ساختمان.
 * @returns {{ok: boolean, code?: string, message?: string}}
 */
export function canPlace(village, type, x, y) {
  const def = getBuilding(type);
  if (def.unique && countOfType(village, type) > 0) {
    return { ok: false, code: 'UNIQUE', message: `${def.name} فقط یک بار ساخته می‌شود.` };
  }
  if (!isUnlocked(type, castleLevel(village))) {
    return {
      ok: false,
      code: 'LOCKED',
      message: `${def.name} به سطح ${def.unlockAt} ارگ نیاز دارد.`,
    };
  }
  if (x < 0 || y < 0 || x + def.size.w > village.size || y + def.size.h > village.size) {
    return { ok: false, code: 'OUT_OF_BOUNDS', message: 'بیرون از محدوده‌ی دهکده است.' };
  }
  for (let dx = 0; dx < def.size.w; dx += 1) {
    for (let dy = 0; dy < def.size.h; dy += 1) {
      if (buildingAt(village, x + dx, y + dy)) {
        return { ok: false, code: 'OCCUPIED', message: 'این زمین قبلاً ساخته شده است.' };
      }
    }
  }
  return { ok: true };
}

function nextUid(village) {
  return village.nextUid || village.buildings.length + 1;
}

/**
 * ساختمان جدید می‌سازد (بدون کسر منابع؛ کسر در لایه‌ی اکشن انجام می‌شود).
 * اگر زمان ساخت صفر باشد، ساختمان همان لحظه آماده است.
 */
export function addBuilding(village, { type, x, y, now = 0 }) {
  const check = canPlace(village, type, x, y);
  if (!check.ok) return { ok: false, ...check };

  const uid = nextUid(village);
  const seconds = constructionSeconds(type, 1);
  const building = {
    uid,
    type,
    level: 1,
    x,
    y,
    state: seconds > 0 ? 'building' : 'idle',
    startedAt: seconds > 0 ? now : null,
    completeAt: seconds > 0 ? now + seconds * 1000 : null,
    targetLevel: seconds > 0 ? 1 : null,
  };

  return {
    ok: true,
    village: { ...village, nextUid: uid + 1, buildings: [...village.buildings, building] },
    building,
  };
}

/**
 * ارتقای ساختمان را شروع می‌کند.
 * @returns {{ok: boolean, code?: string, message?: string, village?: object, cost?: object, seconds?: number}}
 */
export function startUpgrade(village, uid, now = 0) {
  const building = findByUid(village, uid);
  if (!building) return { ok: false, code: 'NOT_FOUND', message: 'ساختمان پیدا نشد.' };
  if (building.state !== 'idle') {
    return { ok: false, code: 'BUSY', message: 'این ساختمان مشغول ساخت یا ارتقاست.' };
  }
  const def = getBuilding(building.type);
  if (building.level >= def.maxLevel) {
    return { ok: false, code: 'MAX_LEVEL', message: `${def.name} در بالاترین سطح است.` };
  }
  const targetLevel = building.level + 1;
  const seconds = constructionSeconds(building.type, targetLevel);
  const updated = {
    ...building,
    state: 'upgrading',
    startedAt: now,
    completeAt: now + seconds * 1000,
    targetLevel,
  };
  return {
    ok: true,
    village: {
      ...village,
      buildings: village.buildings.map((b) => (b.uid === uid ? updated : b)),
    },
    building: updated,
    cost: costFor(building.type, targetLevel),
    seconds,
  };
}

/** تایمرهای تمام‌شده را تسویه می‌کند و دهکده‌ی جدید برمی‌گرداند. */
export function tick(village, now) {
  let changed = false;
  const buildings = village.buildings.map((building) => {
    if (building.state === 'idle' || building.completeAt === null) return building;
    if (building.completeAt > now) return building;
    changed = true;
    return {
      ...building,
      level: building.targetLevel ?? building.level,
      state: 'idle',
      startedAt: null,
      completeAt: null,
      targetLevel: null,
    };
  });
  return changed ? { ...village, buildings } : village;
}

/** زمان باقی‌مانده‌ی ساخت/ارتقا به میلی‌ثانیه. */
export function remainingMs(building, now) {
  if (!building || building.completeAt === null) return 0;
  return Math.max(0, building.completeAt - now);
}

/** آیا ساختمان در حال ساخت یا ارتقاست؟ */
export function isBusy(building) {
  return Boolean(building) && building.state !== 'idle';
}

/** درصد پیشرفت ساخت (۰ تا ۱). */
export function progressRatio(building, now) {
  if (!isBusy(building) || building.completeAt === null || building.startedAt === null) return 1;
  const total = building.completeAt - building.startedAt;
  if (total <= 0) return 1;
  return Math.max(0, Math.min(1, (now - building.startedAt) / total));
}

/** فهرست ساختمان‌های در حال ساخت/ارتقا. */
export function busyBuildings(village) {
  return village.buildings.filter(isBusy);
}

/** جابه‌جایی ساختمان به یک جای خالی (ارتقا هم درگیر نمی‌شود). */
export function moveBuilding(village, uid, x, y) {
  const building = findByUid(village, uid);
  if (!building) return { ok: false, code: 'NOT_FOUND', message: 'ساختمان پیدا نشد.' };
  if (isBusy(building)) return { ok: false, code: 'BUSY', message: 'در حال ساخت است و جابه‌جا نمی‌شود.' };
  const def = getBuilding(building.type);
  if (x < 0 || y < 0 || x + def.size.w > village.size || y + def.size.h > village.size) {
    return { ok: false, code: 'OUT_OF_BOUNDS', message: 'بیرون از محدوده‌ی دهکده است.' };
  }
  for (let dx = 0; dx < def.size.w; dx += 1) {
    for (let dy = 0; dy < def.size.h; dy += 1) {
      const other = buildingAt(village, x + dx, y + dy);
      if (other && other.uid !== uid) {
        return { ok: false, code: 'OCCUPIED', message: 'این زمین قبلاً ساخته شده است.' };
      }
    }
  }
  return {
    ok: true,
    village: {
      ...village,
      buildings: village.buildings.map((b) => (b.uid === uid ? { ...b, x, y } : b)),
    },
  };
}
