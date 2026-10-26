/**
 * نگه‌دارنده‌ی وضعیت بازی در لایه‌ی رابط.
 * ذخیره‌سازی و پیشرفت آفلاین را مدیریت می‌کند و شنونده‌ها را خبر می‌کند.
 */
import {
  advanceGame,
  createGameState,
  loadState,
  saveState,
} from '../core/persistence.js';

export function createStore({ storage, now = () => Date.now() } = {}) {
  const loaded = loadState(storage);
  let state = loaded ?? createGameState(now());
  const listeners = new Set();
  let offline = { seconds: 0, gold: 0, wheat: 0, completed: 0, cappedOut: false };
  let dirty = false;

  // اولین پیشرفت آفلاین همان لحظه‌ی باز شدن بازی
  const bootstrapped = advanceGame(state, now());
  state = bootstrapped.state;
  offline = bootstrapped.report;
  // ذخیره‌ی تازه هم نوشته می‌شود تا زمان آخرین بازدید از همان ابتدا ثبت شود
  if (!loaded) saveState(storage, state);

  function emit() {
    for (const listener of listeners) listener(state);
  }

  return {
    getState: () => state,
    getOfflineReport: () => offline,
    setState(next) {
      state = next;
      dirty = true;
      saveState(storage, state);
      emit();
      return state;
    },
    /** بازی را تا لحظه‌ی جاری جلو می‌برد؛ گزارش تغییر برمی‌گرداند. */
    advance() {
      const { state: next, report } = advanceGame(state, now());
      const changed =
        next.village !== state.village ||
        next.resources.gold !== state.resources.gold ||
        next.resources.wheat !== state.resources.wheat;
      state = next;
      if (changed) dirty = true;
      return report;
    },
    save() {
      if (!dirty) return false;
      const saved = saveState(storage, state);
      dirty = !saved;
      return saved;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = createGameState(now());
      offline = { seconds: 0, gold: 0, wheat: 0, completed: 0, cappedOut: false };
      return this.setState(state);
    },
  };
}
