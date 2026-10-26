/**
 * نقاشی ساختمان‌ها و اجزای دهکده به سبک ایزومتریک.
 * هر تابع، ساختمان را در مختصات خانه‌ای (x,y) با ابعاد w×d می‌کشد
 * و رشته‌ی SVG برمی‌گرداند. بدون تصویر خارجی، بدون کانواس.
 */
import {
  PALETTE,
  OUTLINE,
  project,
  diamond,
  diamondPoints,
  poly,
  box,
  roof,
  pyramid,
  cylinder,
  flag,
  opening,
  coins,
  wheatSheaf,
  sack,
  fenceLine,
  flame,
  smoke,
  bush,
  rock,
  cypress,
  palm,
  groundShadow,
  shadow,
  stoneCourses,
  tileBand,
  dome,
  HALF_W,
} from './geo.js';

const pad = (x, y, w, d, fill = '#c9b28c', edge = '#8d7457') =>
  diamond(x, y, w, d, fill, `stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"`);

const padShadow = (x, y, w, d) =>
  poly(
    diamondPoints(x + 0.08, y + 0.14, w, d),
    '#000000',
    'opacity="0.16"',
  );

/* ------------------------------------------------------------------ ارگ */

export function castleSprite(x, y, w = 4, d = 4) {
  const t = { top: PALETTE.stoneTop, left: PALETTE.stoneLeft, right: PALETTE.stoneRight };
  const roofColors = { roofTop: PALETTE.roofTop, roofRight: PALETTE.roofRight, roofLeft: PALETTE.roofLeft };
  const crenel = (cx, cy, z) => box(cx, cy, 0.3, 0.3, { z, h: 7, ...t });

  let out = groundShadow(x, y, w, d, 0.2);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#cdb691', '#8a7154');

  // پله‌های ورودی
  out += box(x + 1.5, y + 3.25, 1.1, 0.55, { h: 8, z: 0, top: '#e3d0ae', left: '#b8a17e', right: '#a58e6d' });
  out += box(x + 1.7, y + 3.05, 0.75, 0.4, { h: 8, z: 8, top: '#ecd9b8', left: '#c6b08d', right: '#b09a78' });

  // برج‌های پشتی
  for (const tx of [x + 0.3, x + 2.85]) {
    out += box(tx, y + 0.3, 0.85, 0.85, { z: 0, h: 74, ...t });
    out += pyramid(tx, y + 0.3, 0.85, 0.85, { z: 74, rise: 22, ...roofColors });
    out += flag(tx + 0.42, y + 0.3, 96, 18, '#e8b44a', '#a9761a');
  }

  // دیوارهای جانبی
  out += box(x + 0.3, y + 1.1, 0.4, 2.1, { z: 0, h: 40, ...t });
  out += box(x + 3.3, y + 1.1, 0.4, 2.1, { z: 0, h: 40, ...t });

  // ارگ میانی
  out += box(x + 1.05, y + 0.95, 1.9, 1.9, { z: 0, h: 56, ...t });
  out += stoneCourses(x + 0.3, y + 1.1 + 2.1, 0.4, 0, 0, 40, 3);
  out += stoneCourses(x + 1.05, y + 2.85, 1.9, 0, 0, 56, 4);
  out += tileBand(x + 1.05, y + 2.85, 1.9, 40, 7);
  out += tileBand(x + 1.05, y + 2.85, 1.9, 52, 4);
  // کنگره‌های بالای ارگ
  for (let i = 0; i < 3; i += 1) {
    out += crenel(x + 1.1 + i * 0.62, y + 0.95, 56);
    out += crenel(x + 1.1 + i * 0.62, y + 2.55, 56);
  }
  out += crenel(x + 1.05, y + 1.05, 56);
  out += crenel(x + 2.65, y + 1.05, 56);

  // دروازه
  out += opening(x + 2.0, y + 2.85, 34, 34, { z: 0, fill: '#3d2a19' });
  out += `<path d="M ${project(x + 1.6, y + 2.85).x} ${project(x + 1.6, y + 2.85).y} h 46 v -3 h -46 Z" fill="#6f5334"/>`;
  out += `<circle cx="${project(x + 2.0, y + 2.85).x}" cy="${project(x + 2.0, y + 2.85).y - 36}" r="9" fill="#e8b44a" stroke="#8a5c12" stroke-width="1.2"/>`;
  out += `<path d="M ${project(x + 2.0, y + 2.85).x} ${project(x + 2.0, y + 2.85).y - 42} l 5 8 h -10 Z" fill="#a9761a"/>`;

  // برج‌های جلویی
  for (const tx of [x + 0.15, x + 3.0]) {
    out += box(tx, y + 2.75, 0.9, 0.9, { z: 0, h: 66, ...t });
    out += pyramid(tx, y + 2.75, 0.9, 0.9, { z: 66, rise: 24, ...roofColors });
    out += flag(tx + 0.45, y + 2.75, 92, 16, '#e05c4a', '#8f2f22');
    out += opening(tx + 0.45, y + 3.65, 12, 16, { z: 44, fill: '#33241a' });
  }

  // گنبد فیروزه‌ای روی ارگ
  out += dome(x + 2.0, y + 1.9, 0.62, { z: 56, height: 30 });

  // درفش مرکزی
  out += flag(x + 1.15, y + 1.05, 74, 26, '#2ec4b6', '#17786f');
  out += flag(x + 2.85, y + 1.05, 74, 26, '#e8b44a', '#a9761a');

  // بشکه و گونی کنار دیوار
  out += cylinder(x + 0.75, y + 3.15, 0.22, { h: 12, top: '#c98b4b', body: '#a36b34' });
  out += sack(x + 3.25, y + 2.45, 3, 0.9);
  return out;
}

/* ------------------------------------------------------------- معدن طلا */

export function goldMineSprite(x, y, w = 2, d = 2) {
  let out = groundShadow(x, y, w, d, 0.2);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#b9a07c', '#7d6247');

  // تپه‌ی سنگی
  out += box(x + 0.15, y + 0.15, 1.7, 1.7, { h: 26, top: '#c2ab89', left: '#95795a', right: '#af9776' });
  out += box(x + 0.5, y + 0.45, 1.05, 1.1, { z: 26, h: 16, top: '#bfa987', left: '#8d7255', right: '#a99070' });

  // دهانه‌ی معدن با قاب چوبی
  const mouth = project(x + 1.1, y + 1.95, 0);
  out += `<path d="M ${mouth.x - 20} ${mouth.y} v -20 a 20 20 0 0 1 40 0 v 20 Z" fill="#241812" stroke="#5b4227" stroke-width="1.6"/>`;
  out += `<path d="M ${mouth.x - 20} ${mouth.y - 20} a 20 20 0 0 1 40 0" fill="none" stroke="#8a5a30" stroke-width="3.4"/>`;
  out += `<rect x="${mouth.x - 24}" y="${mouth.y - 22}" width="5" height="24" rx="1.5" fill="#a9713f" stroke="#6e4525"/>`;
  out += `<rect x="${mouth.x + 19}" y="${mouth.y - 22}" width="5" height="24" rx="1.5" fill="#a9713f" stroke="#6e4525"/>`;

  // ریل و ارابه‌ی معدن
  out += `<path d="M ${mouth.x - 8} ${mouth.y + 2} l -26 10 M ${mouth.x + 8} ${mouth.y + 2} l 26 10" stroke="#6b5236" stroke-width="2" opacity="0.7"/>`;
  out += box(x + 1.35, y + 1.25, 0.4, 0.32, { h: 9, top: '#7d6146', left: '#5d4a35', right: '#6d5540' });
  out += coins(x + 1.5, y + 1.45, 10, 4, 0.85);

  // سنگ‌های طلا و ابزار
  out += rock(x + 0.35, y + 1.65, { scale: 0.7 });
  out += coins(x + 0.55, y + 1.75, 4, 4, 0.8);
  out += `<line x1="${project(x + 0.3, y + 0.35).x}" y1="${project(x + 0.3, y + 0.35).y}" x2="${project(x + 0.55, y + 0.5).x}" y2="${project(x + 0.55, y + 0.5).y - 22}" stroke="#8a5a30" stroke-width="3" stroke-linecap="round"/>`;
  out += `<path d="M ${project(x + 0.55, y + 0.5).x - 7} ${project(x + 0.55, y + 0.5).y - 24} q 7 -5 14 0" fill="none" stroke="#b8b8c0" stroke-width="3" stroke-linecap="round"/>`;
  return out;
}

/* --------------------------------------------------------------- کشتزار */

export function farmSprite(x, y, w = 2, d = 2) {
  let out = groundShadow(x, y, w, d, 0.16);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#7b5a34', '#5a3f24');

  // خاک شخم‌خورده و ردیف‌های گندم
  for (let row = 0; row < 4; row += 1) {
    const ry = 0.2 + row * 0.44;
    out += box(x + 0.15, y + ry, 1.7, 0.3, { h: 4, top: '#8a6438', left: '#6a4a29', right: '#7a5731' });
    for (let i = 0; i < 5; i += 1) {
      const wx = x + 0.4 + i * 0.3;
      out += wheatSheaf(wx, y + ry + 0.28, 4, 0.95);
    }
  }

  // نرده‌ی چوبی دور کشتزار
  out += fenceLine(x + 0.05, y + 1.95, x + 1.95, y + 1.95, 0, 5);
  out += fenceLine(x + 1.95, y + 0.1, x + 1.95, y + 1.95, 0, 5);

  // مترسک
  const sc = project(x + 0.4, y + 0.4);
  out += `<line x1="${sc.x}" y1="${sc.y}" x2="${sc.x}" y2="${sc.y - 30}" stroke="#8a5a30" stroke-width="2.4" stroke-linecap="round"/>`;
  out += `<path d="M ${sc.x - 10} ${sc.y - 24} h 20 M ${sc.x - 7} ${sc.y - 30} h 14 l -2 8 h -10 Z" stroke="#c9a05a" stroke-width="2" fill="#e6c98a"/>`;
  out += `<circle cx="${sc.x}" cy="${sc.y - 34}" r="5" fill="#f0d69b" stroke="#8a6a3a"/>`;
  return out;
}

/* ---------------------------------------------------------- خزانه‌ی طلا */

export function goldStorageSprite(x, y, w = 3, d = 3) {
  let out = groundShadow(x, y, w, d, 0.18);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#c2a97f', '#82684a');

  out += box(x + 0.25, y + 0.25, 2.5, 2.5, { h: 30, top: '#d3bd97', left: '#a68a68', right: '#bda182' });
  out += stoneCourses(x + 0.25, y + 2.75, 2.5, 0, 0, 30, 3);
  out += tileBand(x + 0.25, y + 2.75, 2.5, 24, 5, '#2ec4b6', '#146b63');
  out += roof(x + 0.2, y + 0.2, 2.6, 2.6, { z: 30, rise: 20, roofTop: '#c98546', roofRight: '#a5672f', roofLeft: '#7f4d22' });

  // درِ چوبی با قاب طلایی روی وجه رو به دوربین
  const door = project(x + 1.5, y + 2.75);
  out += `<path d="M ${door.x - 26} ${door.y} v -30 a 26 26 0 0 1 52 0 v 30 Z" fill="#8a5a30" stroke="#5d3a1b" stroke-width="2"/>`;
  out += `<path d="M ${door.x - 20} ${door.y} v -26 a 20 20 0 0 1 40 0 v 26" fill="none" stroke="#e8b44a" stroke-width="3"/>`;
  out += `<circle cx="${door.x}" cy="${door.y - 16}" r="5.5" fill="#ffd75e" stroke="#a7740c" stroke-width="1.4"/>`;
  out += `<path d="M ${door.x - 2.5} ${door.y - 14} h 5 v 8 h -5 Z" fill="#8a5c12"/>`;

  // سکه‌های سرریز
  out += coins(x + 0.55, y + 2.6, 2, 5, 1.1);
  out += coins(x + 2.3, y + 2.5, 2, 4, 1);
  out += cylinder(x + 2.55, y + 1.55, 0.24, { h: 14, top: '#c98b4b', body: '#a36b34' });
  out += flag(x + 2.1, y + 0.35, 50, 20, '#e8b44a', '#a9761a');
  return out;
}

/* ----------------------------------------------------------- انبار گندم */

export function wheatStorageSprite(x, y, w = 3, d = 3) {
  let out = groundShadow(x, y, w, d, 0.18);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#c2a97f', '#82684a');

  // انبار چوبی
  out += box(x + 0.25, y + 0.3, 2.0, 2.0, { h: 30, top: '#d9c39d', left: '#ac9070', right: '#c3a889' });
  out += stoneCourses(x + 0.25, y + 2.3, 2.0, 0, 0, 30, 3);
  out += roof(x + 0.2, y + 0.25, 2.1, 2.1, { z: 30, rise: 22, roofTop: '#d8a24e', roofRight: '#b07d31', roofLeft: '#8a5f22' });

  // سیلوی گندم
  out += cylinder(x + 2.55, y + 1.1, 0.5, { h: 52, top: '#e6d2ae', body: '#c9ae86' });
  out += `<path d="M ${project(x + 2.55, y + 1.1).x - 20} ${project(x + 2.55, y + 1.1).y - 52} q 20 -22 40 0 Z" fill="#b0563a" stroke="#7d3521" stroke-width="1.4"/>`;

  // گونی‌ها و خوشه‌ها
  out += sack(x + 0.5, y + 2.6, 2, 1.1);
  out += sack(x + 0.95, y + 2.72, 2, 1);
  out += sack(x + 1.4, y + 2.62, 2, 0.95);
  out += wheatSheaf(x + 2.2, y + 2.6, 0, 1.2);
  out += wheatSheaf(x + 1.75, y + 2.35, 0, 1.1);
  return out;
}

/* ------------------------------------------------------------ سربازخانه */

export function barracksSprite(x, y, w = 3, d = 3) {
  let out = groundShadow(x, y, w, d, 0.2);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#bfa57d', '#7d6247');

  out += box(x + 0.2, y + 0.25, 2.6, 2.5, { h: 12, top: '#cbb492', left: '#9c8264', right: '#b69c7c' });
  out += box(x + 0.45, y + 0.5, 2.0, 1.8, { z: 12, h: 32, top: '#e3cfa8', left: '#b59a74', right: '#cbb08c' });
  out += stoneCourses(x + 0.45, y + 2.3, 2.0, 0, 12, 32, 3);
  out += tileBand(x + 0.45, y + 2.3, 2.0, 40, 5, '#e05c4a', '#8f2f22');
  out += roof(x + 0.35, y + 0.4, 2.2, 2.0, { z: 44, rise: 24, roofTop: '#cf5f45', roofRight: '#a8442f', roofLeft: '#83301f' });

  // ورودی و پنجره‌ها
  out += opening(x + 1.45, y + 2.3, 24, 26, { z: 12, fill: '#3b2717' });
  out += opening(x + 0.85, y + 2.3, 10, 12, { z: 30, fill: '#4a3623' });
  out += opening(x + 2.05, y + 2.3, 10, 12, { z: 30, fill: '#4a3623' });

  // نیزه‌های تکیه‌داده و سپر
  const rack = project(x + 2.55, y + 2.35);
  out += `<line x1="${rack.x - 4}" y1="${rack.y}" x2="${rack.x + 6}" y2="${rack.y - 34}" stroke="#8a5a30" stroke-width="2.6" stroke-linecap="round"/>`;
  out += `<line x1="${rack.x + 6}" y1="${rack.y}" x2="${rack.x - 4}" y2="${rack.y - 34}" stroke="#8a5a30" stroke-width="2.6" stroke-linecap="round"/>`;
  out += `<path d="M ${rack.x + 8} ${rack.y - 36} l 6 2 l -6 8 l -6 -8 Z" fill="#c8ccd6" stroke="#6d7280" stroke-width="1"/>`;
  out += `<circle cx="${rack.x - 12}" cy="${rack.y - 18}" r="9" fill="#2ec4b6" stroke="#146b63" stroke-width="2"/>`;
  out += `<circle cx="${rack.x - 12}" cy="${rack.y - 18}" r="3.4" fill="#e8b44a"/>`;

  // پرچم و آدمک تمرین
  out += flag(x + 0.5, y + 0.5, 56, 30, '#e05c4a', '#8f2f22');
  const dummy = project(x + 0.75, y + 2.55);
  out += `<line x1="${dummy.x}" y1="${dummy.y}" x2="${dummy.x}" y2="${dummy.y - 20}" stroke="#8a5a30" stroke-width="3"/>`;
  out += `<circle cx="${dummy.x}" cy="${dummy.y - 26}" r="6" fill="#e0c58f" stroke="#8a6a3a"/>`;
  out += `<path d="M ${dummy.x - 8} ${dummy.y - 18} h 16" stroke="#c9a05a" stroke-width="3" stroke-linecap="round"/>`;
  return out;
}

/* -------------------------------------------------------- برج دیده‌بانی */

export function watchtowerSprite(x, y, w = 2, d = 2) {
  let out = groundShadow(x, y, w, d, 0.2);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#bda684', '#7d6247');

  out += box(x + 0.25, y + 0.25, 1.5, 1.5, { h: 16, top: '#cdb692', left: '#9b8163', right: '#b49c7b' });
  out += box(x + 0.55, y + 0.55, 0.9, 0.9, { z: 16, h: 74, top: '#d6c1a0', left: '#a68c6c', right: '#bda484' });
  out += stoneCourses(x + 0.55, y + 1.45, 0.9, 0, 16, 74, 5);

  // کنگره‌های بالای برج
  const z = 90;
  out += box(x + 0.42, y + 0.42, 1.16, 1.16, { z, h: 10, top: '#e0cbaa', left: '#b09676', right: '#c8ae8c' });
  for (const [cx, cy] of [
    [x + 0.42, y + 0.42],
    [x + 1.12, y + 0.42],
    [x + 0.42, y + 1.12],
    [x + 1.12, y + 1.12],
  ]) {
    out += box(cx, cy, 0.34, 0.34, { z: z + 10, h: 8, top: '#e6d2b2', left: '#b69c7c', right: '#cdb493' });
  }

  // روزنه‌ها و نردبان
  out += opening(x + 1.0, y + 1.45, 9, 14, { z: 60, fill: '#3b2a1c', arch: false });
  out += opening(x + 1.0, y + 1.45, 9, 14, { z: 36, fill: '#3b2a1c', arch: false });
  const lad = project(x + 0.62, y + 1.55);
  out += `<path d="M ${lad.x} ${lad.y} l 8 -66 M ${lad.x + 12} ${lad.y} l 8 -66" stroke="#8a5a30" stroke-width="2"/>`;
  for (let i = 0; i < 6; i += 1) {
    out += `<line x1="${lad.x + i * 1.3}" y1="${lad.y - 8 - i * 10}" x2="${lad.x + 12 + i * 1.3}" y2="${lad.y - 8 - i * 10}" stroke="#8a5a30" stroke-width="2"/>`;
  }

  // مشعل
  out += flame(x + 1.4, y + 0.55, 108, 0.75);
  out += flag(x + 0.6, y + 0.6, 110, 18, '#2ec4b6', '#146b63');
  return out;
}

/* ------------------------------------------------------------- آتشکده */

export function fireTempleSprite(x, y, w = 2, d = 2) {
  let out = groundShadow(x, y, w, d, 0.2);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#c3ab88', '#7d6247');

  out += box(x + 0.15, y + 0.15, 1.7, 1.7, { h: 10, top: '#d8c39f', left: '#a88e6b', right: '#c0a784' });
  out += box(x + 0.32, y + 0.32, 1.36, 1.36, { z: 10, h: 10, top: '#e2cdaa', left: '#b09876', right: '#c9b08e' });

  // ستون‌ها
  for (const [cx, cy] of [
    [x + 0.32, y + 0.32],
    [x + 1.18, y + 0.32],
    [x + 0.32, y + 1.18],
    [x + 1.18, y + 1.18],
  ]) {
    out += box(cx, cy, 0.16, 0.16, { z: 20, h: 34, top: '#f0dfc0', left: '#c2ab88', right: '#dcc7a6' });
  }

  // سقف و مشعل مرکزی
  out += box(x + 0.18, y + 0.18, 1.64, 1.64, { z: 54, h: 9, top: '#e8d5b4', left: '#b9a17e', right: '#d2bb99' });
  out += pyramid(x + 0.35, y + 0.35, 1.3, 1.3, { z: 63, rise: 20, roofTop: '#d8a24e', roofRight: '#b07d31', roofLeft: '#8a5f22' });
  out += box(x + 0.75, y + 0.75, 0.5, 0.5, { z: 20, h: 12, top: '#b98b3d', left: '#8a6526', right: '#a3762f' });
  out += flame(x + 1.0, y + 1.0, 76, 1.25);
  out += smoke(x + 1.0, y + 1.0, 100, 1, 0.22);
  out += `<circle cx="${project(x + 1.0, y + 0.15, 8).x}" cy="${project(x + 1.0, y + 0.15, 8).y}" r="4" fill="#e8b44a"/>`;
  return out;
}

/* --------------------------------------------------------------- کارگاه */

export function workshopSprite(x, y, w = 3, d = 3) {
  let out = groundShadow(x, y, w, d, 0.2);
  out += padShadow(x, y, w, d);
  out += pad(x, y, w, d, '#bda383', '#7d6247');

  out += box(x + 0.2, y + 0.2, 2.6, 2.6, { h: 10, top: '#c6ae8b', left: '#987f61', right: '#b09677' });
  // دیوارهای سنگی و سقف چوبی
  out += box(x + 1.15, y + 0.35, 1.5, 1.4, { z: 10, h: 34, top: '#d6bf9b', left: '#a78d6c', right: '#bfa684' });
  out += roof(x + 1.05, y + 0.25, 1.7, 1.55, { z: 44, rise: 18, roofTop: '#b8742f', roofRight: '#94551f', roofLeft: '#713f16' });

  // سایه‌بان چوبی روی اجاق
  const canA = project(x + 0.3, y + 2.6, 34);
  const canB = project(x + 1.5, y + 2.6, 34);
  out += `<path d="M ${canA.x} ${canA.y} L ${canB.x} ${canB.y} L ${canB.x - 10} ${canB.y + 16} L ${canA.x + 10} ${canA.y + 16} Z" fill="#c98b4b" stroke="#6e4525" stroke-width="1.3"/>`;
  out += `<line x1="${canA.x}" y1="${canA.y + 2}" x2="${project(x + 0.3, y + 2.6).x}" y2="${project(x + 0.3, y + 2.6).y}" stroke="#8a5a30" stroke-width="3"/>`;
  out += `<line x1="${canB.x}" y1="${canB.y + 2}" x2="${project(x + 1.5, y + 2.6).x}" y2="${project(x + 1.5, y + 2.6).y}" stroke="#8a5a30" stroke-width="3"/>`;

  // اجاق و سندان
  out += box(x + 0.55, y + 1.85, 0.55, 0.5, { z: 10, h: 12, top: '#6d5540', left: '#4c3a2a', right: '#5d4834' });
  out += flame(x + 0.8, y + 2.2, 22, 0.7);
  out += box(x + 1.5, y + 2.15, 0.42, 0.34, { z: 10, h: 8, top: '#8b8f9c', left: '#5e626d', right: '#767a86' });

  // دودکش و دود
  out += box(x + 2.25, y + 0.45, 0.32, 0.32, { z: 44, h: 26, top: '#b8a184', left: '#8a7257', right: '#a08a70' });
  out += smoke(x + 2.4, y + 0.6, 84, 1.05, 0.3);

  // تخته‌ها و بشکه
  out += cylinder(x + 0.55, y + 1.35, 0.22, { h: 12, top: '#c98b4b', body: '#a36b34' });
  out += cylinder(x + 0.9, y + 1.2, 0.2, { h: 11, top: '#c98b4b', body: '#a36b34' });
  const plank = project(x + 2.2, y + 2.5);
  out += `<rect x="${plank.x - 6}" y="${plank.y - 6}" width="26" height="6" rx="1.5" transform="rotate(-20 ${plank.x} ${plank.y})" fill="#c98b4b" stroke="#6e4525"/>`;
  return out;
}

/** نگاشت نوع ساختمان به تابع نقاشی. */
export const SPRITES = {
  castle: castleSprite,
  goldMine: goldMineSprite,
  farm: farmSprite,
  goldStorage: goldStorageSprite,
  wheatStorage: wheatStorageSprite,
  barracks: barracksSprite,
  watchtower: watchtowerSprite,
  fireTemple: fireTempleSprite,
  workshop: workshopSprite,
};

/** ارتفاع تقریبی هر ساختمان برای لایه‌بندی و قاب دوربین. */
export const SPRITE_HEIGHT = {
  castle: 150,
  goldMine: 60,
  farm: 46,
  goldStorage: 80,
  wheatStorage: 110,
  barracks: 96,
  watchtower: 140,
  fireTemple: 110,
  workshop: 100,
};

/** نقاشی ساختمان؛ برای نوع ناشناخته یک اتاقک ساده می‌کشد. */
export function drawBuilding(type, x, y, w, d) {
  const fn = SPRITES[type];
  if (fn) return fn(x, y, w, d);
  return box(x, y, w, d, { h: 26, top: '#d6bf9b', left: '#a78d6c', right: '#bfa684' });
}

/** داربست ساخت برای ساختمان در حال ساخت. */
export function scaffold(x, y, w, d, height = 60) {
  const corners = [
    [x + 0.1, y + 0.1],
    [x + w - 0.1, y + 0.1],
    [x + 0.1, y + d - 0.1],
    [x + w - 0.1, y + d - 0.1],
  ];
  let out = '';
  for (const [cx, cy] of corners) {
    const p = project(cx, cy);
    out += `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${p.y - height}" stroke="#a9713f" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  for (let level = 1; level <= 2; level += 1) {
    const zh = (height / 2) * level;
    const a = project(x + 0.1, y + 0.1, zh);
    const b = project(x + w - 0.1, y + 0.1, zh);
    const c = project(x + w - 0.1, y + d - 0.1, zh);
    const e = project(x + 0.1, y + d - 0.1, zh);
    out += `<path d="M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} L ${e.x} ${e.y}" fill="none" stroke="#c98b4b" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  return out;
}

/** پرچم‌های تزئینی و اجزای محیطی دهکده. */
export const PROPS = { bush, rock, cypress, palm, shadow };
