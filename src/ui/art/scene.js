/**
 * ساخت صحنه‌ی ایزومتریک دهکده به‌صورت یک SVG کامل.
 * لایه‌ها: زمین و جزیره، تزئینات، ساختمان‌ها (مرتب‌شده بر اساس عمق)، نشان‌ها.
 */
import { BUILDINGS } from '../../data/buildings.js';
import { createRng } from '../../utils/random.js';
import { cameraTransform, DEFAULT_CAMERA } from './camera.js';
import { faNumber, faCountdown } from '../../utils/format.js';
import { progressRatio, remainingMs, isBusy } from '../../core/village.js';
import { drawBuilding, scaffold, SPRITE_HEIGHT, SPRITES } from './sprites.js';
import {
  PALETTE,
  HALF_W,
  box,
  shadow,
  HALF_H,
  TILE_W,
  project,
  diamond,
  diamondPoints,
  poly,
  cypress,
  palm,
  bush,
  rock,
  coins,
} from './geo.js';

export const BOARD_SIZE = 20;
export { DEFAULT_CAMERA, drawBuilding, scaffold, SPRITES, SPRITE_HEIGHT };
export const SCENE_SEED = 4242;

/** قاب دوربین پیش‌فرض برای کل جزیره. */
export const SCENE_VIEW = { x: -720, y: -320, width: 1440, height: 1040 };

/** کادر محتوای جزیره (بدون حاشیه‌ی اضافه). */
export const CONTENT_BOX = { x: -660, y: -205, width: 1320, height: 880 };

/**
 * قاب نمایش را متناسب با نسبت تصویر صفحه تنظیم می‌کند
 * تا کل جزیره بدون کشیدگی در هر صفحه‌ای جا شود.
 */
export function fitView(width = 1440, height = 1040, box = CONTENT_BOX) {
  const safeWidth = Math.max(320, Number(width) || 1440);
  const safeHeight = Math.max(320, Number(height) || 1040);
  const aspect = safeWidth / safeHeight;
  const boxAspect = box.width / box.height;

  // روی نمایشگرهای باریک، کمی نزدیک‌تر می‌بینیم و با کشیدن جابه‌جا می‌شویم (حس بازی موبایلی)
  const zoom = aspect < 0.8 ? 2.0 : aspect < 1.05 ? 1.65 : aspect < 1.4 ? 1.25 : 1;

  let base;
  if (aspect >= boxAspect) {
    const w = box.height * aspect;
    base = { x: box.x - (w - box.width) / 2, y: box.y, width: w, height: box.height };
  } else {
    const h = box.width / aspect;
    base = { x: box.x, y: box.y - (h - box.height) / 2, width: box.width, height: h };
  }

  const w = base.width / zoom;
  const h = base.height / zoom;
  const cx = base.x + base.width / 2;
  const cy = base.y + base.height / 2;
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
}

/** نقطه‌ی بالای ساختمان روی صفحه (برای نشان سطح و شمارش معکوس). */
export function buildingAnchor(building) {
  const def = BUILDINGS[building.type];
  const cx = building.x + def.size.w / 2;
  const cy = building.y + def.size.h / 2;
  const base = project(cx, cy);
  return { x: base.x, y: base.y - (SPRITE_HEIGHT[building.type] || 60) };
}

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** خانه‌های اشغال‌شده (با حاشیه‌ی امن) برای تزئینات. */
export function occupancyMap(village) {
  const map = new Set();
  for (const building of village.buildings) {
    const def = BUILDINGS[building.type];
    for (let dx = -1; dx <= def.size.w; dx += 1) {
      for (let dy = -1; dy <= def.size.h; dy += 1) {
        map.add(`${building.x + dx}:${building.y + dy}`);
      }
    }
  }
  return map;
}

/** آیا این خانه بخشی از جزیره است؟ */
export const inBoard = (x, y, size = BOARD_SIZE) => x >= 0 && y >= 0 && x < size && y < size;

/** رنگ زمین هر خانه (شن، چمن، جاده، آب). */
export function terrainAt(x, y, seed = SCENE_SEED) {
  const noise = hash2(x + seed * 0.13, y - seed * 0.07);
  const pond = x >= 15 && x <= 17 && y >= 2 && y <= 4;
  if (pond) return 'water';
  const road = (x === 10 && y >= 11) || (x >= 11 && x <= 15 && y === 10 - 0 && false);
  if (road) return 'road';
  const dx = x - 9.5;
  const dy = y - 9.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 5.6 + noise * 1.7) return 'grass';
  if (noise > 0.94) return 'grass';
  return noise > 0.82 ? 'sandLight' : 'sand';
}

const TERRAIN_FILL = {
  sand: '#e2c088',
  sandLight: '#eccd97',
  road: '#cfae79',
  grass: '#8cc35f',
  grassDark: '#77b04e',
  water: '#57c3d6',
};

function groundLayer(village) {
  const size = village.size || BOARD_SIZE;

  // لبه‌ی صخره‌ای جزیره (ضخامت زمین)
  const cliff = [
    poly(diamondPoints(0, 0, size, size), '#6d5237', 'opacity="0.9"'),
    poly(
      diamondPoints(0, 0, size, size).map((p) => ({ x: p.x, y: p.y + 30 })),
      '#4c3826',
      'opacity="0.55"',
    ),
  ].join('');

  let tiles = '';
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const terrain = terrainAt(x, y);
      const fill = TERRAIN_FILL[terrain] || TERRAIN_FILL.sand;
      const edge = terrain === 'water' ? '#2f8ea0' : 'rgba(90, 60, 30, 0.16)';
      const gridStroke =
        terrain === 'water'
          ? 'rgba(30, 110, 130, 0.28)'
          : terrain === 'grass'
            ? 'rgba(64, 104, 46, 0.18)'
            : 'rgba(160, 120, 70, 0.12)';
      const pts = diamondPoints(x, y)
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');
      const shade = hash2(x * 5.3, y * 9.1);
      tiles += `<polygon points="${pts}" fill="${fill}" stroke="${gridStroke}" stroke-width="0.6" data-cell="${x},${y}"/>`;
      if (shade > 0.62) {
        tiles += `<polygon points="${pts}" fill="#000000" opacity="${((shade - 0.62) * 0.16).toFixed(3)}" pointer-events="none"/>`;
      } else if (shade < 0.3) {
        tiles += `<polygon points="${pts}" fill="#ffffff" opacity="${((0.3 - shade) * 0.1).toFixed(3)}" pointer-events="none"/>`;
      }
      if (terrain === 'grass' && hash2(x * 3.1, y * 7.7) > 0.72) {
        const p = project(x + 0.5, y + 0.5);
        tiles += `<path d="M ${p.x - 3} ${p.y + 1} l 1.5 -4 M ${p.x} ${p.y + 1} l 0.5 -5 M ${p.x + 3} ${p.y + 1} l -1 -3.5"
          stroke="#5f9a3c" stroke-width="1.2" stroke-linecap="round" opacity="0.75" pointer-events="none"/>`;
      }
      if (terrain === 'water') {
        const p = project(x + 0.5, y + 0.5);
        tiles += `<path class="wave-line" d="M ${p.x - 12} ${p.y} q 6 -4 12 0 q 6 4 12 0" fill="none" stroke="#bff0f8" stroke-width="1.4" opacity="0.6" pointer-events="none"/>`;
      }
    }
  }

  // برکه: لبه‌ی شنی
  const pondRim = diamond(14.9, 1.9, 3.2, 3.2, 'rgba(230, 200, 140, 0.7)', 'stroke="rgba(120,90,50,0.35)" stroke-width="1"');
  return `${cliff}${pondRim}${tiles}`;
}

function decorationLayer(village) {
  const size = village.size || BOARD_SIZE;
  const taken = occupancyMap(village);
  const rng = createRng(`props-${village.buildings.length}-${size}`);
  const props = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (taken.has(`${x}:${y}`)) continue;
      const terrain = terrainAt(x, y);
      if (terrain === 'water' || terrain === 'road') continue;
      const roll = hash2(x * 13.7 + rng() * 0.0001, y * 7.3);
      if (roll > 0.9) {
        const cx = x + 0.5;
        const cy = y + 0.5;
        const kind = roll > 0.972 ? 'cypress' : roll > 0.955 ? 'palm' : roll > 0.93 ? 'rock' : 'bush';
        const art =
          kind === 'cypress'
            ? cypress(cx, cy, { scale: 1 })
            : kind === 'palm'
              ? palm(cx, cy, { scale: 0.95 })
              : kind === 'rock'
                ? rock(cx, cy, { scale: 0.8 })
                : bush(cx, cy, { scale: 0.85 });
        props.push({ depth: x + y + 1, art: `${shadow(cx, cy, 14, 7, 0.16)}${art}` });
      }
    }
  }

  // خوشه‌های ثابت تزئینی گوشه‌ها
  const fixed = [
    [0.6, 0.6, 'palm'],
    [1.6, 0.4, 'bush'],
    [0.4, 17.4, 'cypress'],
    [18.6, 18.2, 'rock'],
    [18.4, 0.5, 'cypress'],
    [17.4, 1.2, 'bush'],
    [4.4, 0.4, 'rock'],
    [0.5, 6.4, 'bush'],
    [19.3, 8.5, 'palm'],
    [12.5, 18.6, 'bush'],
  ];
  for (const [x, y, kind] of fixed) {
    if (taken.has(`${Math.floor(x)}:${Math.floor(y)}`)) continue;
    const art =
      kind === 'palm'
        ? palm(x, y, { scale: 1.05 })
        : kind === 'cypress'
          ? cypress(x, y, { scale: 1.05 })
          : kind === 'rock'
            ? rock(x, y, { scale: 0.9 })
            : bush(x, y, { scale: 0.95 });
    props.push({ depth: x + y + 1, art: `${shadow(x, y, 15, 7, 0.16)}${art}` });
  }

  // خزانه‌ی سکه‌های تزئینی نزدیک معدن‌ها
  props.sort((a, b) => a.depth - b.depth);
  return props.map((p) => `<g pointer-events="none">${p.art}</g>`).join('');
}

function levelBadge(building, def) {
  const anchor = buildingAnchor(building);
  const level = building.state === 'upgrading' ? building.targetLevel : building.level;
  const busy = isBusy(building);
  const badgeY = anchor.y - (busy ? 4 : 0);
  return `
    <g class="badge" pointer-events="none" transform="translate(${anchor.x.toFixed(1)} ${badgeY.toFixed(1)})">
      <rect x="-13" y="-13" width="26" height="26" rx="7" fill="#1b2a42" stroke="#e8b44a" stroke-width="1.6"/>
      <text x="0" y="5" text-anchor="middle" font-size="14" font-weight="800" fill="#ffe9ad">${faNumber(level)}</text>
    </g>`;
}

function constructionBadge(building, now) {
  const anchor = buildingAnchor(building);
  const ratio = progressRatio(building, now);
  const remaining = remainingMs(building, now);
  const y = anchor.y + 12;
  return `
    <g class="work-badge" pointer-events="none" transform="translate(${anchor.x.toFixed(1)} ${y.toFixed(1)})">
      <rect x="-40" y="-12" width="80" height="24" rx="12" fill="rgba(12, 20, 34, 0.86)" stroke="#e8b44a" stroke-width="1.2"/>
      <rect x="-34" y="4" width="68" height="5" rx="2.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="-34" y="4" width="${(68 * ratio).toFixed(1)}" height="5" rx="2.5" fill="#e8b44a"/>
      <text x="0" y="-1" text-anchor="middle" font-size="11" font-weight="700" fill="#ffe9ad" data-timer="${building.completeAt}">${faCountdown(remaining)}</text>
    </g>`;
}

function selectionMark(building) {
  const def = BUILDINGS[building.type];
  const [a, b, c, e] = diamondPoints(building.x, building.y, def.size.w, def.size.h);
  return `
    <polygon points="${[a, b, c, e].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"
      fill="rgba(232, 180, 74, 0.18)" stroke="#ffd45e" stroke-width="2.4" stroke-dasharray="8 5"
      pointer-events="none"/>`;
}

function placementHints(village, ui) {
  if (!ui.buildType && !ui.moveUid) return '';
  let out = '';
  const occupied = new Set();
  for (const building of village.buildings) {
    const def = BUILDINGS[building.type];
    for (let dx = 0; dx < def.size.w; dx += 1) {
      for (let dy = 0; dy < def.size.h; dy += 1) {
        occupied.add(`${building.x + dx}:${building.y + dy}`);
      }
    }
  }
  const size = village.size || BOARD_SIZE;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (occupied.has(`${x}:${y}`)) continue;
      const [a, b, c, e] = diamondPoints(x, y);
      out += `<polygon points="${[a, b, c, e].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"
        fill="rgba(95, 201, 138, 0.22)" stroke="rgba(150, 255, 190, 0.5)" stroke-width="1" pointer-events="none"/>`;
    }
  }
  return out;
}

/** لایه‌ی ساختمان‌ها با مرتب‌سازی عمق. */
function buildingLayer(village, ui, now) {
  const items = [...village.buildings].sort((a, b) => {
    const da = a.x + a.y + (BUILDINGS[a.type].size.w + BUILDINGS[a.type].size.h) / 2;
    const db = b.x + b.y + (BUILDINGS[b.type].size.w + BUILDINGS[b.type].size.h) / 2;
    return da - db;
  });

  let out = '';
  for (const building of items) {
    const def = BUILDINGS[building.type];
    const selected = ui.selectedUid === building.uid;
    const busy = isBusy(building);
    const art = drawBuilding(building.type, building.x, building.y, def.size.w, def.size.h);
    out += `
      <g class="obj ${building.type === 'castle' ? 'obj--castle' : ''}${selected ? ' is-selected' : ''}${busy ? ' is-busy' : ''}"
         data-uid="${building.uid}" role="button" tabindex="0"
         aria-label="${def.name}، سطح ${faNumber(building.level)}${busy ? '، در حال ساخت' : ''}">
        ${selected ? selectionMark(building) : ''}
        ${art}
        ${busy ? `<g opacity="0.9">${scaffold(building.x, building.y, def.size.w, def.size.h, (SPRITE_HEIGHT[building.type] || 60) * 0.9)}</g>` : ''}
      </g>`;
    out += levelBadge(building, def);
    if (busy) out += constructionBadge(building, now);
  }
  return out;
}

/** پیش‌نمایش کوچک یک ساختمان برای کارت‌های فروشگاه و برگه‌ها. */
export function miniBuilding(type, { size = 96 } = {}) {
  const def = BUILDINGS[type];
  if (!def) return '';
  const c = project(def.size.w / 2, def.size.h / 2);
  const height = (SPRITE_HEIGHT[type] || 70) + 30;
  const halfW = (def.size.w + def.size.h) * HALF_W * 0.5 + 34;
  return `
    <svg class="mini" viewBox="${(-halfW).toFixed(0)} ${(-height).toFixed(0)} ${(halfW * 2).toFixed(0)} ${(height + 26).toFixed(0)}"
         width="${size}" height="${Math.round((size * (height + 26)) / (halfW * 2))}" aria-hidden="true">
      <g transform="translate(${(-c.x).toFixed(1)} ${(-c.y + 4).toFixed(1)})">
        ${drawBuilding(type, 0, 0, def.size.w, def.size.h)}
      </g>
    </svg>`;
}

export function skyDefs() {
  return `
    <defs>
      <radialGradient id="islandGlow" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#f6d79a" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#f6d79a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="groundTint" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
      </linearGradient>
    </defs>`;
}

/**
 * کل صحنه را می‌سازد.
 * @param {object} village
 * @param {{selectedUid?:number, buildType?:string|null, moveUid?:number|null, now?:number, camera?:{x:number,y:number,zoom:number}}} ui
 */
export function renderScene(village, ui = {}) {
  const now = ui.now || Date.now();
  const camera = ui.camera || DEFAULT_CAMERA;
  const viewport = ui.viewport || { width: 1440, height: 1040 };
  const view = fitView(viewport.width, viewport.height);
  const transform = cameraTransform(camera, view);

  return `
    <svg class="scene" viewBox="${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.width.toFixed(1)} ${view.height.toFixed(1)}"
         data-view="${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.width.toFixed(1)} ${view.height.toFixed(1)}"
         preserveAspectRatio="xMidYMid meet" role="application" aria-label="دهکده‌ی ایزومتریک">
      ${skyDefs()}
      <g class="world" data-camera transform="${transform}">
        <g class="ground">
          <g transform="translate(0 6)" opacity="0.5">${poly(diamondPoints(0, 0, village.size || BOARD_SIZE, village.size || BOARD_SIZE).map((p) => ({ x: p.x, y: p.y + 16 })), '#3a2814')}</g>
          ${groundLayer(village)}
          ${placementHints(village, ui)}
        </g>
        <g class="decor">${decorationLayer(village)}</g>
        <g class="objects">${buildingLayer(village, ui, now)}</g>
      </g>
    </svg>`;
}

export { TILE_W, HALF_W, HALF_H, PALETTE, coins };

/**
 * پیش‌نمایش کوچک دهکده‌ی دشمن برای کارت‌های نبرد.
 * سبک و بدون تزئینات سنگین تا فهرست حریفان سریع رندر شود.
 */
export function enemyPreview(enemy, { size = 220, zone = { x: 4, y: 4, size: 12 } } = {}) {
  const parts = [];
  const ground = diamond(
    zone.x,
    zone.y,
    zone.size,
    zone.size,
    'url(#enemySand)',
    'stroke="#a8845a" stroke-width="7" stroke-linejoin="round"',
  );
  const rim = diamond(
    zone.x - 0.25,
    zone.y - 0.25,
    zone.size + 0.5,
    zone.size + 0.5,
    'none',
    'stroke="rgba(70, 48, 24, 0.35)" stroke-width="10"',
  );

  const sorted = [...enemy.buildings].sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const building of sorted) {
    const def = BUILDINGS[building.type];
    if (!def) continue;
    parts.push(`<g>${drawBuilding(building.type, building.x, building.y, def.size.w, def.size.h)}</g>`);
  }

  const top = project(zone.x, zone.y, 0);
  const bottom = project(zone.x + zone.size, zone.y + zone.size, 0);
  const minX = top.x - 34;
  const maxX = project(zone.x + zone.size, zone.y, 0).x + 34;
  const minY = top.y - 130;
  const maxY = bottom.y + 26;

  return `
    <svg class="enemy-preview" viewBox="${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}"
         width="${size}" height="${Math.round((size * (maxY - minY)) / (maxX - minX))}" aria-hidden="true">
      <defs>
        <linearGradient id="enemySand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e8cd97"/>
          <stop offset="100%" stop-color="#cfa970"/>
        </linearGradient>
      </defs>
      ${rim}
      ${ground}
      ${parts.join('')}
    </svg>`;
}

/**
 * تصویر تزئینی برای حالت‌های خالی: ساختمان روی هاله‌ی نوری.
 */
export function pedestalArt(type, { size = 150 } = {}) {
  const def = BUILDINGS[type];
  const height = (SPRITE_HEIGHT[type] || 70) + 40;
  const halfW = (def ? (def.size.w + def.size.h) * HALF_W * 0.5 : 80) + 40;
  return `
    <svg class="empty-art" viewBox="${(-halfW).toFixed(0)} ${(-height).toFixed(0)} ${(halfW * 2).toFixed(0)} ${(height + 30).toFixed(0)}"
         width="${size}" height="${Math.round((size * (height + 30)) / (halfW * 2))}" aria-hidden="true">
      <defs>
        <radialGradient id="pedestalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f7d79a" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#f7d79a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="-14" rx="${(halfW * 0.7).toFixed(0)}" ry="${(halfW * 0.32).toFixed(0)}" fill="url(#pedestalGlow)"/>
      <g transform="translate(0 4)">
        ${drawBuilding(type, 0, 0, def.size.w, def.size.h)}
      </g>
    </svg>`;
}
