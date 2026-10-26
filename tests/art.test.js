import test from 'node:test';
import assert from 'node:assert/strict';
import { project, diamondPoints, box, roof, pyramid, cylinder, flag, flame, smoke, palm, cypress, dome, tileBand, stoneCourses, HALF_W, HALF_H } from '../src/ui/art/geo.js';
import { drawBuilding, scaffold, miniBuilding } from '../src/ui/art/scene.js';
import { SPRITES, SPRITE_HEIGHT } from '../src/ui/art/sprites.js';
import { renderScene, fitView, terrainAt, occupancyMap, buildingAnchor, SCENE_VIEW, enemyPreview, pedestalArt } from '../src/ui/art/scene.js';
import { BUILDINGS, BUILDING_IDS } from '../src/data/buildings.js';
import { generateEnemy } from '../src/core/battle.js';
import { createVillage, addBuilding } from '../src/core/village.js';
import { clampCamera, cameraTransform, DEFAULT_CAMERA, MIN_ZOOM, MAX_ZOOM, zoomBy, readView } from '../src/ui/art/camera.js';

test('تصویر ایزومتریک مختصات را درست تبدیل می‌کند', () => {
  assert.deepEqual(project(0, 0), { x: 0, y: 0 });
  assert.deepEqual(project(1, 0), { x: HALF_W, y: HALF_H });
  assert.deepEqual(project(0, 1), { x: -HALF_W, y: HALF_H });
  assert.deepEqual(project(1, 1, 32), { x: 0, y: 0 }, 'ارتفاع به سمت بالا کم می‌کند');
  const diamond = diamondPoints(0, 0, 1, 1);
  assert.equal(diamond.length, 4);
  assert.equal(new Set(diamond.map((p) => `${p.x},${p.y}`)).size, 4);
});

test('شکل‌های پایه SVG معتبر تولید می‌کنند', () => {
  for (const art of [
    box(0, 0, 1, 1, { h: 20 }),
    roof(0, 0, 2, 2, { rise: 18 }),
    pyramid(0, 0, 2, 2, { rise: 18 }),
    cylinder(1, 1, 0.4, { h: 30 }),
    flag(1, 1, 40),
    flame(1, 1, 10),
    smoke(1, 1, 10),
    palm(1, 1),
    cypress(1, 1),
    dome(1, 1, 0.5, { z: 20 }),
    tileBand(0, 0, 2, 10),
    stoneCourses(0, 0, 2, 0, 0, 30),
  ]) {
    assert.equal(typeof art, 'string');
    assert.ok(art.trim().length > 20);
    assert.ok(!art.includes('NaN'), 'هیچ مختصاتی نباید NaN باشد');
  }
  assert.match(flag(1, 1, 40), /class="flag"/, 'پرچم انیمیشن دارد');
  assert.match(flame(1, 1, 10), /class="flame"/);
  assert.match(smoke(1, 1, 10), /class="smoke"/);
});

test('هر ساختمان کاتالوگ نقاشی مخصوص خودش را دارد', () => {
  for (const id of BUILDING_IDS) {
    assert.equal(typeof SPRITES[id], 'function', `نقاشی ${id} تعریف نشده`);
    assert.ok(SPRITE_HEIGHT[id] > 30);
    const art = drawBuilding(id, 2, 2, BUILDINGS[id].size.w, BUILDINGS[id].size.h);
    assert.ok(art.length > 400, `نقاشی ${id} خیلی کوچک است`);
    assert.ok(!art.includes('NaN'));
  }
  assert.ok(drawBuilding('unknown-type', 0, 0, 1, 1).length > 50, 'نوع ناشناخته هم نقاشی می‌شود');
});

test('پیش‌نمایش کوچک و داربست ساخته می‌شوند', () => {
  const mini = miniBuilding('castle');
  assert.match(mini, /class="mini"/);
  assert.match(mini, /viewBox/);
  assert.match(scaffold(0, 0, 2, 2, 60), /line/);
  assert.match(pedestalArt('barracks'), /class="empty-art"/);
  assert.match(pedestalArt('barracks'), /میدان|viewBox/);
});

test('صحنه‌ی دهکده SVG کامل با زمین، ساختمان و تزئینات می‌سازد', () => {
  const village = createVillage();
  const added = addBuilding(village, { type: 'farm', x: 0, y: 0, now: 0 });
  const svg = renderScene(added.village, { now: 50_000, viewport: { width: 430, height: 900 } });
  assert.match(svg, /<svg class="scene"/);
  assert.match(svg, /role="application"/);
  assert.equal((svg.match(/data-cell=/g) || []).length, 400);
  assert.match(svg, /data-uid="1"/);
  assert.match(svg, /class="badge"/);
  assert.ok((svg.match(/class="obj/g) || []).length >= 2);
  assert.match(svg, /data-timer=/, 'شمارش معکوس ساخت روی صحنه هست');
});

test('حالت جای‌گذاری خانه‌های آزاد را نشان می‌دهد', () => {
  const village = createVillage();
  const plain = renderScene(village, { now: 0 });
  const placing = renderScene(village, { now: 0, buildType: 'farm' });
  assert.ok(placing.length > plain.length, 'راهنمای جای‌گذاری به صحنه اضافه می‌شود');
  const selected = renderScene(village, { now: 0, selectedUid: 1 });
  assert.match(selected, /stroke-dasharray/, 'نشان انتخاب کشیده می‌شود');
});

test('قاب نمایش متناسب با صفحه تنظیم می‌شود', () => {
  const wide = fitView(1440, 900);
  const narrow = fitView(390, 844);
  // نزدیک‌تر شدن = کادر کوچک‌تر نسبت به عرض محتوا
  assert.ok(narrow.width < wide.width, 'صفحه‌ی باریک نزدیک‌تر می‌شود');
  assert.ok(narrow.width / narrow.height < 0.5, 'قاب باریک و بلند می‌شود');
  assert.ok(narrow.width > 300 && narrow.height > 200);
  const square = fitView(800, 800);
  assert.ok(square.width > 0 && square.height > 0);
  assert.equal(fitView(0, 0).width > 0, true, 'مقادیر نامعتبر هم قاب می‌گیرند');
});

test('زمین، اشغال و لنگر ساختمان محاسبه می‌شوند', () => {
  const terrains = new Set();
  for (let y = 0; y < 20; y += 1) for (let x = 0; x < 20; x += 1) terrains.add(terrainAt(x, y));
  assert.ok(terrains.has('sand'));
  assert.ok(terrains.has('grass'));
  assert.ok(terrains.has('water'));

  const village = createVillage();
  const map = occupancyMap(village);
  assert.ok(map.has('8:8'), 'خانه‌ی ارگ اشغال است');
  assert.ok(map.has('7:7'), 'حاشیه‌ی امن هم اشغال حساب می‌شود');
  assert.equal(map.has('0:0'), false);

  const anchor = buildingAnchor(village.buildings[0]);
  assert.equal(Number.isFinite(anchor.x), true);
  assert.equal(anchor.y, 170, 'لنگر بالای ارگ روی وسط کف آن است (۱۰۰ منهای ارتفاع ۱۵۰)');
  assert.equal(SPRITE_HEIGHT.castle, 150);
  assert.equal(SCENE_VIEW.width > 0, true);
});

test('دوربین محدود، قابل زوم و قابل اعمال است', () => {
  assert.deepEqual(clampCamera(DEFAULT_CAMERA), { x: 0, y: 0, zoom: 1 });
  const zoomed = clampCamera({ x: 0, y: 0, zoom: 99 });
  assert.equal(zoomed.zoom, MAX_ZOOM);
  assert.equal(clampCamera({ x: 0, y: 0, zoom: 0.01 }).zoom, MIN_ZOOM);
  const panned = clampCamera({ x: 99999, y: -99999, zoom: 1 });
  assert.ok(Number.isFinite(panned.x) && Number.isFinite(panned.y));
  assert.equal(zoomBy(DEFAULT_CAMERA, 1.2).zoom > 1, true);
  const transform = cameraTransform({ x: 40, y: -20, zoom: 1.5 });
  assert.match(transform, /translate\(/);
  assert.match(transform, /scale\(1\.500\)/);
  assert.deepEqual(readView({ dataset: { view: '-10 -20 300 400' } }), { x: -10, y: -20, width: 300, height: 400 });
  assert.deepEqual(readView(null), SCENE_VIEW);
});

test('پیش‌نمایش دهکده‌ی دشمن ساخته می‌شود', () => {
  const enemy = generateEnemy({ seed: 9, level: 3 });
  const svg = enemyPreview(enemy);
  assert.match(svg, /class="enemy-preview"/);
  assert.ok((svg.match(/<g>/g) || []).length >= enemy.buildings.length - 1);
  assert.ok(!svg.includes('NaN'));
  assert.match(svg, /viewBox/);
});
