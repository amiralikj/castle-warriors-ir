import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.textContent = '';
    this.className = '';
    this.dataset = {};
    this.style = { setProperty() {} };
    this.children = [];
  }
  setAttribute(name, value) {
    this[name] = value;
  }
  removeAttribute(name) {
    delete this[name];
  }
  getAttribute(name) {
    return this[name] ?? null;
  }
  addEventListener() {}
  removeEventListener() {}
  append() {}
  replaceChildren(...nodes) {
    this.children = nodes;
  }
  focus() {}
  remove() {}
  closest() {
    return null;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
}

function installFakeDom() {
  const app = new FakeElement('div');
  const screen = new FakeElement('main');
  const toasts = new FakeElement('div');
  const storage = new Map();

  app.querySelector = (selector) => {
    if (selector === '#screen') return screen;
    if (selector === '#toasts') return toasts;
    return null;
  };

  const document = {
    documentElement: { lang: '', dir: '' },
    title: '',
    body: { dataset: {} },
    visibilityState: 'visible',
    querySelector: (selector) => (selector === '#app' ? app : null),
    createElement: (tag) => new FakeElement(tag),
    addEventListener() {},
    removeEventListener() {},
  };

  const window = {
    location: { hash: '#/village' },
    addEventListener() {},
    removeEventListener() {},
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  };

  return { app, screen, toasts, document, window, storage };
}

test('بازی بدون خطا بالا می‌آید و صفحه‌ی دهکده را رندر می‌کند', async () => {
  const fake = installFakeDom();
  const original = {
    document: globalThis.document,
    window: globalThis.window,
    setInterval: globalThis.setInterval,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };

  globalThis.document = fake.document;
  globalThis.window = fake.window;
  globalThis.setInterval = () => 1;
  globalThis.setTimeout = () => 1;
  globalThis.clearTimeout = () => {};

  try {
    await import(pathToFileURL(path.join(ROOT, 'src/main.js')).href + `?boot=${Date.now()}`);
    assert.match(fake.app.innerHTML, /جنگاوران قلعه/, 'پوسته ساخته می‌شود');
    assert.match(fake.app.innerHTML, /دهکده‌ی من/, 'صفحه‌ی دهکده رندر می‌شود');
    assert.match(fake.app.innerHTML, /data-cell=/, 'صحنه‌ی دهکده ساخته می‌شود');
    assert.match(fake.app.innerHTML, /class="dock"/, 'ناوبری وجود دارد');
    assert.match(fake.app.innerHTML, /class="hud"/, 'نوار منابع وجود دارد');
    assert.equal(fake.document.documentElement.dir, 'rtl');
    assert.equal(fake.document.documentElement.lang, 'fa');
    assert.ok(fake.storage.has('castle-warriors-ir:save'), 'وضعیت ذخیره می‌شود');
  } finally {
    globalThis.document = original.document;
    globalThis.window = original.window;
    globalThis.setInterval = original.setInterval;
    globalThis.setTimeout = original.setTimeout;
    globalThis.clearTimeout = original.clearTimeout;
  }
});
