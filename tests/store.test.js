import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/ui/store.js';
import { createMemoryStorage, STORAGE_KEY, createGameState } from '../src/core/persistence.js';

test('نخستین اجرا وضعیت تازه می‌سازد', () => {
  const store = createStore({ storage: createMemoryStorage(), now: () => 1_700_000_000_000 });
  const state = store.getState();
  assert.equal(state.village.buildings[0].type, 'castle');
  assert.equal(store.getOfflineReport().seconds, 0);
});

test('تغییر وضعیت ذخیره و به شنونده‌ها خبر داده می‌شود', () => {
  const storage = createMemoryStorage();
  const now = 1_700_000_000_000;
  const store = createStore({ storage, now: () => now });
  let calls = 0;
  const unsubscribe = store.subscribe(() => { calls += 1; });

  const next = { ...store.getState(), resources: { gold: 777, wheat: 0, gems: 0 } };
  store.setState(next);
  assert.equal(calls, 1);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).resources.gold, 777);

  unsubscribe();
  store.setState({ ...next, resources: { gold: 1, wheat: 0, gems: 0 } });
  assert.equal(calls, 1);
});

test('وضعیت ذخیره‌شده در اجرای بعدی بازخوانی می‌شود', () => {
  const storage = createMemoryStorage();
  const now = 1_700_000_000_000;
  const first = createStore({ storage, now: () => now });
  first.setState({ ...first.getState(), resources: { gold: 3210, wheat: 100, gems: 9 } });

  const second = createStore({ storage, now: () => now });
  assert.equal(second.getState().resources.gold, 3210);
});

test('advance بازی را جلو می‌برد و reset وضعیت را تازه می‌کند', () => {
  const storage = createMemoryStorage();
  let clock = 1_700_000_000_000;
  const store = createStore({ storage, now: () => clock });
  clock += 60 * 60 * 1000;
  store.advance();
  assert.equal(store.getState().lastSeen, clock);
  store.reset();
  assert.equal(store.getState().createdAt, clock);
  assert.equal(store.getState().resources.gold, createGameState(clock).resources.gold);
});
