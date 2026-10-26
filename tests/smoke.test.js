import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('فایل‌های پایه‌ی پروژه وجود دارند', () => {
  for (const file of ['index.html', 'package.json', 'server.mjs', 'docs/waves.json', 'docs/WAVES.md', 'docs/CHANGELOG.md']) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} باید وجود داشته باشد`);
  }
});

test('نقشه‌راه دقیقاً ۵۰ موج پیوسته دارد', () => {
  const data = readJson('docs/waves.json');
  assert.equal(data.waves.length, 50);
  data.waves.forEach((wave, i) => {
    assert.equal(wave.n, i + 1, 'شماره‌ی موج‌ها باید پیوسته باشد');
    assert.ok(wave.title.length > 0);
    assert.ok(wave.goal.length > 10);
    assert.ok(Array.isArray(wave.deliverables) && wave.deliverables.length > 0);
    assert.ok(['todo', 'active', 'done'].includes(wave.status));
  });
});

test('فازها کل ۵۰ موج را پوشش می‌دهند', () => {
  const data = readJson('docs/waves.json');
  const covered = data.phases.flatMap((phase) =>
    data.waves.filter((w) => w.n >= phase.from && w.n <= phase.to).map((w) => w.n),
  );
  assert.equal(new Set(covered).size, 50);
});

test('هر موج انجام‌شده یادداشت چنج‌لاگ دارد', () => {
  const data = readJson('docs/waves.json');
  const changelog = fs.readFileSync(path.join(ROOT, 'docs/CHANGELOG.md'), 'utf8');
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  for (const wave of data.waves.filter((w) => w.status === 'done')) {
    const num = [...String(wave.n)].map((d) => `[${d}${faDigits[Number(d)]}]`).join('');
    assert.match(changelog, new RegExp(`^##\\s*موج\\s*${num}(\\s|$|—|-)`, 'm'), `موج ${wave.n} یادداشت ندارد`);
  }
});

test('سرور توسعه صفحه‌ی اصلی و فایل‌های استاتیک را سرو می‌کند', async () => {
  const server = createServer(ROOT);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const home = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /جنگاوران قلعه/);

    const script = await fetch(`http://127.0.0.1:${port}/src/main.js`);
    assert.equal(script.status, 200);
    assert.match(script.headers.get('content-type'), /javascript/);

    const missing = await fetch(`http://127.0.0.1:${port}/nope.png`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
