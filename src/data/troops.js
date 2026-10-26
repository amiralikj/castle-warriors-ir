/**
 * کاتالوگ سربازان «جنگاوران قلعه».
 * هزینه با گندم پرداخت می‌شود و هر سرباز بخشی از ظرفیت سپاه را می‌گیرد.
 */
export const TROOPS = {
  spearman: {
    id: 'spearman',
    name: 'نیزه‌دار',
    description: 'سرباز پایه با نیزه‌ی بلند؛ ارزان، پرتعداد و مناسب خط مقدم.',
    emoji: '🛡️',
    cost: { wheat: 40 },
    housing: 1,
    trainSeconds: 20,
    unlockBarracks: 1,
    stats: { hp: 120, dps: 18, speed: 1, range: 1 },
    role: 'melee',
  },
  archer: {
    id: 'archer',
    name: 'کماندار',
    description: 'از فاصله تیر می‌اندازد؛ جان کم اما آسیب زیاد و برد بلند.',
    emoji: '🏹',
    cost: { wheat: 60 },
    housing: 1,
    trainSeconds: 30,
    unlockBarracks: 1,
    stats: { hp: 80, dps: 24, speed: 1.1, range: 5 },
    role: 'ranged',
  },
};

export const TROOP_IDS = Object.keys(TROOPS);

export function getTroop(id) {
  const troop = TROOPS[id];
  if (!troop) throw new Error(`سرباز ناشناخته: ${id}`);
  return troop;
}

export function isTroopId(id) {
  return Object.prototype.hasOwnProperty.call(TROOPS, id);
}

/** هزینه‌ی آموزش تعداد مشخصی سرباز. */
export function troopCost(id, count = 1) {
  const troop = getTroop(id);
  const n = Math.max(0, Math.floor(count));
  return {
    ...(troop.cost.wheat ? { wheat: troop.cost.wheat * n } : {}),
  };
}

/** زمان آموزش یک دسته، با کمی کاهش به‌ازای سطح سربازخانه. */
export function trainingSeconds(id, count = 1, barracksLevel = 1) {
  const troop = getTroop(id);
  const factor = Math.max(0.55, 1 - 0.06 * (Math.max(1, barracksLevel) - 1));
  return Math.max(1, Math.round(troop.trainSeconds * Math.max(1, Math.floor(count)) * factor));
}

/** سربازان بازشده با سطح سربازخانه. */
export function unlockedTroops(barracksLevel = 1) {
  return TROOP_IDS.map(getTroop).filter((troop) => troop.unlockBarracks <= Math.max(1, barracksLevel));
}
