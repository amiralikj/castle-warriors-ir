/**
 * مولد شبه‌تصادفی بذردار (mulberry32)
 * برای تولید دشمن و شبیه‌سازی نبرد قطعی و قابل تکرار.
 */
export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.abs(Math.floor(seed)) || 1;
  const text = String(seed ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed = 1) {
  let a = hashSeed(seed);
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** عدد صحیح در بازه‌ی [min, max]. */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** انتخاب یک عضو از آرایه. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** درهم‌ریختن آرایه به‌صورت قطعی. */
export function shuffle(rng, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
