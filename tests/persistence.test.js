import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_VERSION,
  STORAGE_KEY,
  MAX_OFFLINE_SECONDS,
  createMemoryStorage,
  createGameState,
  advanceGame,
  saveState,
  loadState,
  clearState,
  migrate,
  sanitizeVillage,
  summarize,
} from '../src/core/persistence.js';
import { addBuilding, tick, GRID_SIZE } from '../src/core/village.js';

const HOUR = 3600 * 1000;

test('وضعیت تازه معتبر و کامل است', () => {
  const state = createGameState(1000);
  assert.equal(state.version, SAVE_VERSION);
  assert.equal(state.village.size, GRID_SIZE);
  assert.equal(state.village.buildings[0].type, 'castle');
  assert.equal(state.resources.gold > 0, true);
  assert.equal(state.lastSeen, 1000);
});

test('ذخیره و بازخوانی چرخه‌ی کامل دارد', () => {
  const storage = createMemoryStorage();
  const state = createGameState(5000);
  state.resources.gold = 4321;
  assert.equal(saveState(storage, state), true);
  assert.ok(storage.getItem(STORAGE_KEY));

  const loaded = loadState(storage);
  assert.equal(loaded.resources.gold, 4321);
  assert.equal(loaded.village.buildings.length, 1);
  assert.equal(loaded.version, SAVE_VERSION);
});

test('ذخیره‌ی خراب یا خالی باعث کرش نمی‌شود', () => {
  assert.equal(loadState(createMemoryStorage()), null);
  assert.equal(loadState(createMemoryStorage({ [STORAGE_KEY]: '{oops' })), null);
  assert.equal(loadState(createMemoryStorage({ [STORAGE_KEY]: 'null' })), null);
  assert.equal(loadState(null), null);
});

test('ذخیره‌ی نسخه‌ی بالاتر رد می‌شود', () => {
  const future = { ...createGameState(), version: SAVE_VERSION + 5 };
  assert.equal(migrate(future), null);
});

test('ذخیره‌ی قدیمی و ناقص مهاجرت می‌شود', () => {
  const legacy = {
    version: 0,
    village: { buildings: [{ type: 'farm', x: 0, y: 0, level: 2 }] },
    resources: { gold: 10 },
  };
  const migrated = migrate(legacy);
  assert.equal(migrated.version, SAVE_VERSION);
  assert.equal(migrated.resources.gold, 10);
  assert.equal(migrated.resources.wheat, 600, 'مقدار پیش‌فرض جایگزین می‌شود');
  assert.ok(migrated.village.buildings.some((b) => b.type === 'castle'), 'ارگ بازسازی می‌شود');
  assert.ok(migrated.village.buildings.some((b) => b.type === 'farm'));
});

test('ساختمان‌های نامعتبر و روی‌هم‌افتاده حذف می‌شوند', () => {
  const village = sanitizeVillage({
    size: 20,
    buildings: [
      { uid: 1, type: 'castle', x: 8, y: 8, level: 1 },
      { uid: 2, type: 'farm', x: 0, y: 0, level: 3 },
      { uid: 3, type: 'farm', x: 0, y: 0, level: 2 },
      { uid: 4, type: 'ghost', x: 5, y: 5 },
      { uid: 5, type: 'goldMine', x: 30, y: 30, level: 1 },
      { uid: 6, type: 'farm', x: 2, y: 2, level: 999 },
      { uid: 7, type: 'farm', x: 3, y: 3, level: 1 },
    ],
  });
  const types = village.buildings.map((b) => b.type);
  assert.ok(types.includes('castle'));
  assert.equal(village.buildings.filter((b) => b.type === 'farm').length, 2, 'دو کشتزار معتبر می‌مانند');
  assert.equal(village.buildings.find((b) => b.uid === 6).level, 10, 'سطح بالا به سقف محدود می‌شود');
  assert.equal(village.buildings.length, 3, 'ارگ + دو کشتزار معتبر');
});

test('پیشرفت آفلاین منابع را تولید می‌کند و تایمرها را تسویه می‌کند', () => {
  const start = 1_700_000_000_000;
  let state = createGameState(start);
  const placed = addBuilding(
    { ...state.village, buildings: state.village.buildings },
    { type: 'goldMine', x: 0, y: 0, now: start },
  ).village;
  state = { ...state, village: placed };

  const { state: advanced, report } = advanceGame(state, start + 2 * HOUR);
  assert.equal(advanced.village.buildings.find((b) => b.type === 'goldMine').state, 'idle');
  assert.ok(report.seconds > 0);
  assert.ok(report.gold > 0, 'معدن طلای آفلاین تولید می‌کند');
  assert.ok(advanced.resources.gold > state.resources.gold);
  assert.equal(advanced.lastSeen, start + 2 * HOUR);
  assert.ok(advanced.stats.totalGoldEarned >= report.gold);
});

test('درآمد آفلاین سقف‌دار است', () => {
  const start = 1_700_000_000_000;
  const state = createGameState(start);
  const { report, state: advanced } = advanceGame(state, start + 100 * HOUR);
  assert.equal(report.seconds, MAX_OFFLINE_SECONDS);
  assert.equal(report.cappedOut, true);
  assert.ok(advanced.resources.gold <= 1500, 'از سقف پایه‌ی خزانه عبور نمی‌کند');
});

test('عقب رفتن ساعت، منابع را کاهش نمی‌دهد', () => {
  const now = 1_700_000_000_000;
  const state = createGameState(now);
  const { report, state: advanced } = advanceGame(state, now - 5 * HOUR);
  assert.equal(report.seconds, 0);
  assert.equal(advanced.resources.gold, state.resources.gold);
  assert.equal(advanced.lastSeen, now, 'lastSeen عقب نمی‌رود');
});

test('پاک کردن ذخیره کار می‌کند', () => {
  const storage = createMemoryStorage();
  saveState(storage, createGameState());
  assert.equal(clearState(storage), true);
  assert.equal(loadState(storage), null);
});

test('خلاصه‌ی وضعیت نرخ و سقف‌ها را نشان می‌دهد', () => {
  const state = createGameState();
  const summary = summarize(state);
  assert.equal(summary.castleLevel, 1);
  assert.equal(summary.buildings, 1);
  assert.ok(summary.caps.gold >= 1500);
  assert.deepEqual(tick(state.village, Date.now()), state.village);
});
