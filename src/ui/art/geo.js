/**
 * پایه‌های هندسه‌ی ایزومتریک برای نقاشی صحنه‌ی دهکده.
 * همه‌ی شکل‌ها SVG رشته‌ای برمی‌گردانند تا بدون وابستگی و قابل تست باشند.
 *
 * صفحه‌ی زمین: هر خانه ۶۴×۳۲ پیکسل نمایش داده می‌شود (ایزومتریک ۲:۱).
 * محور x به راست-پایین و محور y به چپ-پایین می‌رود؛ بلندی روی محور عمودی (بالا) است.
 */

export const TILE_W = 64;
export const TILE_H = 32;
export const HALF_W = TILE_W / 2;
export const HALF_H = TILE_H / 2;

/** خط دور تیره برای همه‌ی اجزای بازی (حس نقاشی دستی). */
export const OUTLINE = '#4a3223';

export const PALETTE = {
  stoneTop: '#d8c4a3',
  stoneRight: '#b59c79',
  stoneLeft: '#96795a',
  stoneDark: '#7d6146',
  woodTop: '#c98b4b',
  woodRight: '#a36b34',
  woodLeft: '#7f5227',
  roofTop: '#e0714f',
  roofRight: '#bd503a',
  roofLeft: '#983a2b',
  goldTop: '#ffd75e',
  goldRight: '#e2a526',
  goldLeft: '#b57c12',
  leafTop: '#8fca5f',
  leafRight: '#6aa843',
  leafLeft: '#4d8030',
  waterTop: '#5ec7d8',
  waterDeep: '#2b7f93',
  sand: '#e5c48c',
  sandDark: '#d3ad72',
  grass: '#86c05a',
  grassDark: '#6ba045',
};

const round = (value) => Math.round(value * 100) / 100;
const pt = (p) => `${round(p.x)},${round(p.y)}`;

/** تبدیل مختصات خانه به نقطه‌ی صفحه (z = ارتفاع به بالا). */
export function project(tx, ty, z = 0) {
  return { x: (tx - ty) * HALF_W, y: (tx + ty) * HALF_H - z };
}

/** چهار گوشه‌ی الماس یک خانه یا مستطیل خانه‌ای. */
export function diamondPoints(tx, ty, w = 1, d = 1, z = 0) {
  const a = project(tx, ty, z);
  const b = project(tx + w, ty, z);
  const c = project(tx + w, ty + d, z);
  const e = project(tx, ty + d, z);
  return [a, b, c, e];
}

/** چندضلعی از نقاط صفحه. */
export function poly(points, fill, extra = '') {
  return `<polygon points="${points.map(pt).join(' ')}" fill="${fill}" ${extra}/>`;
}

/**
 * چندضلعی با لبه‌های کمی ناهموار (حس نقاشی کورلی).
 * @param {{x:number,y:number}[]} points
 * @param {string} fill
 * @param {{seed?: number, stroke?: string, strokeWidth?: number, jitter?: number, extra?: string}} options
 */
export function roughPoly(points, fill, { seed = 1, stroke = OUTLINE, strokeWidth = 1.2, jitter = 0.9, extra = '' } = {}) {
  const pts = points.map((p, i) => {
    const r = 0.5 + 0.5 * Math.sin(seed * 12.9898 + i * 78.233);
    return { x: p.x + (r - 0.5) * jitter * 2, y: p.y + (r - 0.5) * jitter * 2 };
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)}`).join(' ');
  return `<path d="${d} Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}

/** الماس یک خانه (برای زمین و پد ساختمان). */
export function diamond(tx, ty, w, d, fill, extra = '') {
  return poly(diamondPoints(tx, ty, w, d), fill, extra);
}

/**
 * مکعب ایزومتریک: کف در (x,y) با ابعاد w×d خانه و ارتفاع h پیکسل.
 * وجه‌های دیده‌شده: سقف روشن، وجه چپ (رو به y) متوسط، وجه راست (رو به x) تیره.
 */
export function box(tx, ty, w, d, {
  z = 0,
  h = 20,
  top = PALETTE.stoneTop,
  left = PALETTE.stoneLeft,
  right = PALETTE.stoneRight,
  outline = OUTLINE,
  outlineWidth = 1.4,
  extra = '',
} = {}) {
  const stroke = outline ? `stroke="${outline}" stroke-width="${outlineWidth}" stroke-linejoin="round"` : '';
  const b = project(tx + w, ty, z);
  const c = project(tx + w, ty + d, z);
  const e = project(tx, ty + d, z);
  const bt = { x: b.x, y: b.y - h };
  const ct = { x: c.x, y: c.y - h };
  const et = { x: e.x, y: e.y - h };
  const a = project(tx, ty, z);
  const at = { x: a.x, y: a.y - h };

  return [
    roughPoly([b, c, ct, bt], right, { seed: tx * 3 + ty * 5 + 1, strokeWidth: outlineWidth }),
    roughPoly([e, c, ct, et], left, { seed: tx * 7 + ty * 2 + 3, strokeWidth: outlineWidth }),
    roughPoly([at, bt, ct, et], top, { seed: tx * 5 + ty * 11 + 5, strokeWidth: outlineWidth, extra: '' }),
    extra,
  ].join('');
}

/** سایه‌ی بیضی روی زمین. */
export function shadow(cx, cy, rx, ry = rx * 0.5, opacity = 0.22) {
  const p = project(cx, cy);
  return `<ellipse cx="${round(p.x)}" cy="${round(p.y)}" rx="${round(rx)}" ry="${round(ry)}" fill="#1b1208" opacity="${opacity}"/>`;
}

/** سایه‌ی الماسی هم‌اندازه‌ی کف ساختمان. */
export function groundShadow(tx, ty, w, d, opacity = 0.18) {
  const [a, b, c, e] = diamondPoints(tx, ty, w, d);
  const push = 5;
  const shade = [
    { x: a.x + push, y: a.y + push * 0.5 },
    { x: b.x + push, y: b.y + push * 0.5 },
    { x: c.x + push, y: c.y + push },
    { x: e.x + push, y: e.y + push * 0.5 },
  ];
  return poly(shade, '#1b1208', `opacity="${opacity}"`);
}

/** سقف شیروانی (محور ridge افقی در جهت x). */
export function roof(tx, ty, w, d, {
  z = 0,
  rise = 22,
  roofTop = PALETTE.roofTop,
  roofRight = PALETTE.roofRight,
  roofLeft = PALETTE.roofLeft,
  outline = OUTLINE,
} = {}) {
  const stroke = `stroke="${outline}" stroke-width="1.3" stroke-linejoin="round"`;
  const eaveA = project(tx, ty + d, z);
  const eaveB = project(tx + w, ty + d, z);
  const ridgeA = project(tx, ty + d / 2, z + rise);
  const ridgeB = project(tx + w, ty + d / 2, z + rise);
  const backA = project(tx, ty, z);
  const backB = project(tx + w, ty, z);
  // شیب پشتی (کمی از پشت بام دیده می‌شود)
  const backSlope = poly([backA, backB, ridgeB, ridgeA], roofLeft, stroke);
  // شیب جلو
  const frontSlope = poly([eaveA, eaveB, ridgeB, ridgeA], roofTop, stroke);
  // شیروانی سمت راست
  const gableRight = poly([project(tx + w, ty, z), project(tx + w, ty + d, z), ridgeB], roofRight, stroke);
  return `${backSlope}${gableRight}${frontSlope}`;
}

/** هرم/سقف مخروطی چهاروجهی. */
export function pyramid(tx, ty, w, d, {
  z = 0,
  rise = 24,
  top = PALETTE.roofTop,
  right = PALETTE.roofRight,
  left = PALETTE.roofLeft,
  back = PALETTE.roofLeft,
  outline = OUTLINE,
} = {}) {
  const stroke = `stroke="${outline}" stroke-width="1.2" stroke-linejoin="round"`;
  const a = project(tx, ty, z);
  const b = project(tx + w, ty, z);
  const c = project(tx + w, ty + d, z);
  const e = project(tx, ty + d, z);
  const apex = project(tx + w / 2, ty + d / 2, z + rise);
  return [
    poly([a, b, apex], back, stroke),
    poly([b, c, apex], right, stroke),
    poly([c, e, apex], top, stroke),
    poly([e, a, apex], left, stroke),
  ].join('');
}

/** استوانه (سیلو/برج گرد). */
export function cylinder(cx, cy, r, {
  z = 0,
  h = 40,
  top = PALETTE.stoneTop,
  body = PALETTE.stoneRight,
  outline = OUTLINE,
} = {}) {
  const p = project(cx, cy, z);
  const rx = r * HALF_W * 1.25;
  const ry = r * HALF_H * 1.25;
  const stroke = `stroke="${outline}" stroke-width="1.3"`;
  const bodyPath = [
    `M ${round(p.x - rx)} ${round(p.y - h)}`,
    `L ${round(p.x - rx)} ${round(p.y)}`,
    `A ${round(rx)} ${round(ry)} 0 0 0 ${round(p.x + rx)} ${round(p.y)}`,
    `L ${round(p.x + rx)} ${round(p.y - h)}`,
    'Z',
  ].join(' ');
  return `
    <path d="${bodyPath}" fill="${body}" ${stroke}/>
    <ellipse cx="${round(p.x)}" cy="${round(p.y - h)}" rx="${round(rx)}" ry="${round(ry)}" fill="${top}" ${stroke}/>
  `;
}

/** پرچم روی میله؛ x,y خانه و z ارتفاع پای میله. */
export function flag(x, y, z, height = 34, color = '#e8b44a', accent = '#b9761b') {
  const base = project(x, y, z);
  const top = { x: base.x, y: base.y - height };
  const wave = 15;
  return `
    <line x1="${round(base.x)}" y1="${round(base.y)}" x2="${round(top.x)}" y2="${round(top.y)}" stroke="#5d4126" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M ${round(top.x)} ${round(top.y)} q ${wave * 0.6} 3 ${wave} 1 q -${wave * 0.35} 7 ${wave * 0.1} 12 q -${wave * 0.6} -2 -${wave * 0.1} 1 Z"
          transform="translate(0 0)" fill="${color}" stroke="${accent}" stroke-width="1"/>
    <circle cx="${round(top.x)}" cy="${round(top.y)}" r="2.4" fill="${accent}"/>
  `.replace('<path d="M', '<path class="flag" d="M');
}

/** پنجره/روزنه‌ی تیره روی وجه رو به دوربین. */
export function opening(x, y, w, h, {
  z = 0,
  fill = '#3a2a1c',
  arch = true,
  outline = '#2a1c11',
} = {}) {
  const p = project(x, y, z);
  const width = w;
  if (arch) {
    return `<path d="M ${round(p.x - width / 2)} ${round(p.y)} v ${-h + width / 2} a ${round(width / 2)} ${round(width / 2)} 0 0 1 ${round(width)} 0 v ${h - width / 2} Z"
      fill="${fill}" stroke="${outline}" stroke-width="1.1"/>`;
  }
  return `<rect x="${round(p.x - width / 2)}" y="${round(p.y - h)}" width="${round(width)}" height="${round(h)}" rx="2" fill="${fill}" stroke="${outline}" stroke-width="1.1"/>`;
}

/** درخت سرو. */
export function cypress(x, y, { scale = 1, z = 0 } = {}) {
  const p = project(x, y, z);
  const s = scale;
  return `
    <ellipse cx="${round(p.x + 2 * s)}" cy="${round(p.y)}" rx="${round(11 * s)}" ry="${round(4 * s)}" fill="#1b1208" opacity="0.16"/>
    <line x1="${round(p.x)}" y1="${round(p.y)}" x2="${round(p.x)}" y2="${round(p.y - 10 * s)}" stroke="#6b4a2a" stroke-width="${round(3 * s)}" stroke-linecap="round"/>
    <path d="M ${round(p.x)} ${round(p.y - 44 * s)} q ${round(10 * s)} ${round(16 * s)} ${round(7 * s)} ${round(30 * s)} q ${round(-7 * s)} ${round(6 * s)} ${round(-14 * s)} 0 q ${round(-3 * s)} ${round(-14 * s)} ${round(7 * s)} ${round(-30 * s)} Z"
      fill="${PALETTE.leafRight}" stroke="#3f6b26" stroke-width="1.2"/>
    <path d="M ${round(p.x)} ${round(p.y - 44 * s)} q ${round(-6 * s)} ${round(18 * s)} ${round(-3 * s)} ${round(32 * s)}"
      fill="none" stroke="#a8d47a" stroke-width="${round(1.6 * s)}" opacity="0.8"/>
  `;
}

/** درخت نخل. */
export function palm(x, y, { scale = 1, z = 0 } = {}) {
  const p = project(x, y, z);
  const s = scale;
  const top = { x: p.x + 6 * s, y: p.y - 52 * s };
  // برگ‌های آویزان: هر برگ یک شکل بسته‌ی قوس‌دار
  const frond = (angle, length, width, light, dark) => {
    const rad = (angle * Math.PI) / 180;
    const tipX = top.x + Math.cos(rad) * length * s;
    const tipY = top.y + Math.sin(rad) * length * s * 0.72;
    const midX = top.x + Math.cos(rad) * length * s * 0.55;
    const midY = top.y + Math.sin(rad) * length * s * 0.55 - 7 * s;
    const nx = -Math.sin(rad) * width * s;
    const ny = Math.cos(rad) * width * s * 0.5;
    return `<path d="M ${round(top.x)} ${round(top.y)}
        Q ${round(midX + nx)} ${round(midY + ny)} ${round(tipX)} ${round(tipY)}
        Q ${round(midX - nx)} ${round(midY - ny)} ${round(top.x)} ${round(top.y)} Z"
        fill="${light}" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
  };
  return `
    <ellipse cx="${round(p.x + 4 * s)}" cy="${round(p.y)}" rx="${round(14 * s)}" ry="${round(5 * s)}" fill="#1b1208" opacity="0.18"/>
    <path d="M ${round(p.x - 5 * s)} ${round(p.y)} C ${round(p.x - 3 * s)} ${round(p.y - 22 * s)} ${round(p.x + 4 * s)} ${round(p.y - 36 * s)} ${round(top.x)} ${round(top.y)}"
      fill="none" stroke="#a5733c" stroke-width="${round(6 * s)}" stroke-linecap="round"/>
    <path d="M ${round(p.x - 5 * s)} ${round(p.y)} C ${round(p.x - 3 * s)} ${round(p.y - 22 * s)} ${round(p.x + 4 * s)} ${round(p.y - 36 * s)} ${round(top.x)} ${round(top.y)}"
      fill="none" stroke="#c99455" stroke-width="${round(3 * s)}" stroke-linecap="round" opacity="0.55"/>
    ${frond(200, 26, 8, s > 0 ? '#4d8030' : '#4d8030', '#2f5a1e')}
    ${frond(232, 28, 8, '#5f9a3c', '#2f5a1e')}
    ${frond(300, 30, 8, '#8fca5f', '#356022')}
    ${frond(340, 28, 8, '#6aa843', '#2f5a1e')}
    ${frond(20, 26, 8, '#5f9a3c', '#2f5a1e')}
    ${frond(160, 22, 7, '#4d8030', '#2f5a1e')}
    <circle cx="${round(top.x - 3 * s)}" cy="${round(top.y + 5 * s)}" r="${round(2.8 * s)}" fill="#c2701f" stroke="#8d4c10" stroke-width="0.7"/>
    <circle cx="${round(top.x + 4 * s)}" cy="${round(top.y + 6 * s)}" r="${round(2.6 * s)}" fill="#a95b16" stroke="#8d4c10" stroke-width="0.7"/>
  `;
}

/** بوته. */
export function bush(x, y, { scale = 1 } = {}) {
  const p = project(x, y);
  const s = scale;
  return `
    <ellipse cx="${round(p.x + 2 * s)}" cy="${round(p.y + 1 * s)}" rx="${round(13 * s)}" ry="${round(5 * s)}" fill="#1b1208" opacity="0.18"/>
    <circle cx="${round(p.x - 7 * s)}" cy="${round(p.y - 5 * s)}" r="${round(7.5 * s)}" fill="#4d8030" stroke="#356022" stroke-width="1"/>
    <circle cx="${round(p.x + 7 * s)}" cy="${round(p.y - 4 * s)}" r="${round(7 * s)}" fill="#4d8030" stroke="#356022" stroke-width="1"/>
    <circle cx="${round(p.x - 3 * s)}" cy="${round(p.y - 10 * s)}" r="${round(8 * s)}" fill="#6aa843" stroke="#356022" stroke-width="1"/>
    <circle cx="${round(p.x + 4 * s)}" cy="${round(p.y - 11 * s)}" r="${round(7 * s)}" fill="#8fca5f" stroke="#356022" stroke-width="1"/>
    <circle cx="${round(p.x + 1 * s)}" cy="${round(p.y - 15 * s)}" r="${round(5 * s)}" fill="#a9dd7a"/>
    <circle cx="${round(p.x - 4 * s)}" cy="${round(p.y - 4 * s)}" r="${round(2.6 * s)}" fill="#e0607a"/>
  `;
}

/** صخره. */
export function rock(x, y, { scale = 1 } = {}) {
  const p = project(x, y);
  const s = scale;
  return `
    <path d="M ${round(p.x - 14 * s)} ${round(p.y)} l ${round(5 * s)} ${round(-13 * s)} l ${round(11 * s)} ${round(-4 * s)} l ${round(10 * s)} ${round(9 * s)} l ${round(-4 * s)} ${round(8 * s)} Z"
      fill="${PALETTE.stoneRight}" stroke="#6a5540" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M ${round(p.x - 9 * s)} ${round(p.y - 13 * s)} l ${round(9 * s)} ${round(-4 * s)} l ${round(9 * s)} ${round(7 * s)} l ${round(-11 * s)} ${round(3 * s)} Z"
      fill="${PALETTE.stoneTop}" opacity="0.9"/>
  `;
}

/** حباب دود/گرد و غبار. */
export function smoke(x, y, z, scale = 1, opacity = 0.35) {
  const p = project(x, y, z);
  return `<g class="smoke" opacity="${opacity}"><circle cx="${round(p.x)}" cy="${round(p.y)}" r="${round(6 * scale)}" fill="#f1e7d4"/>` +
    `<circle cx="${round(p.x + 7 * scale)}" cy="${round(p.y - 8 * scale)}" r="${round(4.5 * scale)}" fill="#f1e7d4"/>` +
    `<circle cx="${round(p.x - 6 * scale)}" cy="${round(p.y - 12 * scale)}" r="${round(3.5 * scale)}" fill="#f1e7d4"/></g>`;
}

/** شعله. */
export function flame(x, y, z, scale = 1) {
  const p = project(x, y, z);
  const s = scale;
  return `
    <g class="flame">
    <path d="M ${round(p.x)} ${round(p.y - 26 * s)} q ${round(10 * s)} ${round(12 * s)} ${round(6 * s)} ${round(18 * s)} q ${round(-3 * s)} ${round(6 * s)} ${round(-6 * s)} ${round(6 * s)} q ${round(-4 * s)} ${round(0)} ${round(-6 * s)} ${round(-6 * s)} q ${round(-4 * s)} ${round(-6 * s)} ${round(6 * s)} ${round(-18 * s)} Z"
      fill="#ffb43a" stroke="#c86a10" stroke-width="1.1"/>
    <path d="M ${round(p.x)} ${round(p.y - 18 * s)} q ${round(5 * s)} ${round(7 * s)} ${round(2 * s)} ${round(11 * s)} q ${round(-2 * s)} ${round(3 * s)} ${round(-3 * s)} ${round(0)} q ${round(-3 * s)} ${round(-4 * s)} ${round(1 * s)} ${round(-11 * s)} Z"
      fill="#ffe89a"/>
    </g>
  `;
}

/** سکه‌های طلا. */
export function coins(x, y, z, count = 5, scale = 1) {
  const p = project(x, y, z);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const dx = (i % 3) * 7 * scale - 7 * scale;
    const dy = -Math.floor(i / 3) * 5 * scale;
    out += `<ellipse cx="${round(p.x + dx)}" cy="${round(p.y + dy)}" rx="${round(5 * scale)}" ry="${round(3 * scale)}" fill="${PALETTE.goldTop}" stroke="#a7740c" stroke-width="0.9"/>`;
  }
  return out;
}

/** خوشه‌ی گندم. */
export function wheatSheaf(x, y, z, scale = 1) {
  const p = project(x, y, z);
  const s = scale;
  const stalk = (dx, lean) =>
    `<path d="M ${round(p.x + dx * s)} ${round(p.y)} q ${round(lean * s)} ${round(-12 * s)} ${round(lean * 1.4 * s)} ${round(-20 * s)}" fill="none" stroke="#c9972f" stroke-width="${round(2 * s)}" stroke-linecap="round"/>`;
  return `${stalk(-4, -3)}${stalk(0, 1)}${stalk(4, 3)}
    <ellipse cx="${round(p.x)}" cy="${round(p.y - 18 * s)}" rx="${round(7 * s)}" ry="${round(4 * s)}" fill="#f0c04b" stroke="#bd8a1c" stroke-width="0.9"/>`;
}

/** کیسه/گونی. */
export function sack(x, y, z, scale = 1, fill = '#e0cfae') {
  const p = project(x, y, z);
  const s = scale;
  return `
    <path d="M ${round(p.x - 7 * s)} ${round(p.y)} q ${round(-2 * s)} ${round(-10 * s)} ${round(3 * s)} ${round(-12 * s)} q ${round(4 * s)} ${round(4 * s)} ${round(8 * s)} 0 q ${round(5 * s)} ${round(2 * s)} ${round(3 * s)} ${round(12 * s)} Z"
      fill="${fill}" stroke="#8a7350" stroke-width="1.1"/>
  `;
}

/** نرده‌ی چوبی ساده. */
export function fenceLine(x1, y1, x2, y2, z = 0, posts = 4) {
  let out = '';
  for (let i = 0; i < posts; i += 1) {
    const t = posts === 1 ? 0 : i / (posts - 1);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const p = project(x, y, z);
    out += `<rect x="${round(p.x - 1.6)}" y="${round(p.y - 16)}" width="3.2" height="16" rx="1" fill="#a9713f" stroke="#6e4525" stroke-width="0.8"/>`;
  }
  return out;
}

/** کلاف‌های سنگی افقی روی وجه رو به دوربین. */
export function stoneCourses(tx, ty, w, d, z, h, rows = 3, color = 'rgba(74, 50, 35, 0.35)') {
  let out = '';
  const step = h / rows;
  for (let i = 1; i < rows; i += 1) {
    const zz = z + step * i;
    const a = project(tx, ty + d, zz);
    const b = project(tx + w, ty + d, zz);
    out += `<path d="M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}" stroke="${color}" stroke-width="0.9" opacity="0.75"/>`;
  }
  return out;
}

/** کاشی‌کاری فیروزه‌ای (نشانه‌ی معماری ایرانی). */
export function tileBand(tx, ty, w, z, h = 6, color = '#2ec4b6', edge = '#17786f') {
  const a = project(tx, ty, z);
  const b = project(tx + w, ty, z);
  return `
    <path d="M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)} L ${round(b.x)} ${round(b.y - h)} L ${round(a.x)} ${round(a.y - h)} Z"
      fill="${color}" stroke="${edge}" stroke-width="0.9"/>
    ${Array.from({ length: 4 }, (_, i) => {
      const px = a.x + ((b.x - a.x) / 4) * (i + 0.5);
      const py = a.y + ((b.y - a.y) / 4) * (i + 0.5);
      return `<circle cx="${round(px)}" cy="${round(py - h / 2)}" r="1.5" fill="#ffe9ad" opacity="0.9"/>`;
    }).join('')}`;
}

/** گنبد فیروزه‌ای ایرانی. */
export function dome(tx, ty, radius, { z = 0, height = 26, color = '#2ec4b6', edge = '#146b63', gold = '#e8b44a' } = {}) {
  const p = project(tx, ty, z);
  const rx = radius * HALF_W * 1.15;
  const ry = radius * HALF_H * 1.15;
  return `
    <ellipse cx="${round(p.x)}" cy="${round(p.y)}" rx="${round(rx)}" ry="${round(ry * 0.6)}" fill="#20303f" opacity="0.25"/>
    <path d="M ${round(p.x - rx)} ${round(p.y)} a ${round(rx)} ${round(ry)} 0 0 1 ${round(rx * 2)} 0
      q ${round(-rx * 0.3)} ${round(-height)} ${round(-rx)} ${round(-height)}
      q ${round(-rx * 0.7)} 0 ${round(-rx)} ${round(height)} Z" fill="${color}" stroke="${edge}" stroke-width="1.3"/>
    <path d="M ${round(p.x - rx * 0.55)} ${round(p.y - height * 0.55)} q ${round(rx * 0.35)} ${round(-height * 0.5)} ${round(rx * 0.75)} ${round(-height * 0.35)}"
      fill="none" stroke="#9ff0e5" stroke-width="1.6" opacity="0.75"/>
    <line x1="${round(p.x)}" y1="${round(p.y - height)}" x2="${round(p.x)}" y2="${round(p.y - height - 9)}" stroke="${gold}" stroke-width="2"/>
    <circle cx="${round(p.x)}" cy="${round(p.y - height - 11)}" r="3" fill="${gold}" stroke="#a7740c" stroke-width="0.9"/>
  `;
}
