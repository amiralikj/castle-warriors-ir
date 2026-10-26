#!/usr/bin/env node
/**
 * ابزار مدیریت ۵۰ موج ساخت «جنگاوران قلعه»
 *
 *   node scripts/wave.mjs status            # وضعیت موج جاری و درصد پیشرفت
 *   node scripts/wave.mjs start 3           # موج ۳ را فعال می‌کند
 *   node scripts/wave.mjs finish 3          # موج ۳ را تمام‌شده ثبت می‌کند
 *   node scripts/wave.mjs verify            # تست‌ها + بررسی سلامت مستندات موج‌ها
 *   node scripts/wave.mjs docs              # بازتولید docs/WAVES.md از روی داده
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'docs', 'waves.json');
const DOCS_FILE = path.join(ROOT, 'docs', 'WAVES.md');
const CHANGELOG_FILE = path.join(ROOT, 'docs', 'CHANGELOG.md');

const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const fa = (value) => String(value).replace(/\d/g, (d) => FA[Number(d)]);

function load() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(data) {
  data.waves.sort((a, b) => a.n - b.n);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
}

const STATUS_LABEL = { done: 'انجام شد', active: 'در حال ساخت', todo: 'در انتظار' };
const STATUS_ICON = { done: '✅', active: '🛠️', todo: '⬜' };

function changelogText() {
  if (!fs.existsSync(CHANGELOG_FILE)) return '';
  return fs.readFileSync(CHANGELOG_FILE, 'utf8');
}

function hasChangelogEntry(n) {
  // شماره‌ی موج ممکن است با ارقام لاتین یا فارسی در چنج‌لاگ نوشته شده باشد.
  const digits = [...String(n)].map((d) => `[${d}${FA[Number(d)]}]`).join('');
  return new RegExp(`^##\\s*موج\\s*${digits}(\\s|$|—|-)`, 'm').test(changelogText());
}

function writeDocs(data) {
  const done = data.waves.filter((w) => w.status === 'done').length;
  const active = data.waves.filter((w) => w.status === 'active');
  const percent = Math.round((done / data.waves.length) * 100);
  const filled = Math.round((done / data.waves.length) * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

  const lines = [];
  lines.push('# نقشه‌راه ۵۰ موج — جنگاوران قلعه');
  lines.push('');
  lines.push('> این فایل به‌صورت خودکار از `docs/waves.json` ساخته می‌شود. برای ویرایش، دیتا را تغییر دهید و `npm run wave:docs` را اجرا کنید.');
  lines.push('');
  lines.push('## وضعیت کلی');
  lines.push('');
  lines.push('```text');
  lines.push(`${bar}  ${fa(percent)}٪`);
  lines.push('```');
  lines.push('');
  lines.push(`- موج‌های تمام‌شده: **${fa(done)} از ${fa(data.waves.length)}**`);
  lines.push(`- موج در حال ساخت: **${active.length ? active.map((w) => `موج ${fa(w.n)} — ${w.title}`).join('، ') : 'هیچ (می‌توانید با `npm run wave start <شماره>` یکی را شروع کنید)'}**`);
  lines.push('- معنی وضعیت‌ها: ✅ انجام شد · 🛠️ در حال ساخت · ⬜ در انتظار');
  lines.push('');

  for (const phase of data.phases) {
    const waves = data.waves.filter((w) => w.n >= phase.from && w.n <= phase.to);
    const phaseDone = waves.filter((w) => w.status === 'done').length;
    lines.push(`## ${phase.name} (موج ${fa(phase.from)} تا ${fa(phase.to)})`);
    lines.push('');
    lines.push(`${STATUS_ICON.done} ${fa(phaseDone)} از ${fa(waves.length)} موج کامل شده است.`);
    lines.push('');
    lines.push('| موج | عنوان | هدف | خروجی‌ها | وضعیت |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const w of waves) {
      const outputs = (w.deliverables || []).map((d) => `• ${d}`).join('<br>');
      lines.push(
        `| ${fa(w.n)} | ${w.title} | ${w.goal} | ${outputs} | ${STATUS_ICON[w.status]} ${STATUS_LABEL[w.status]} |`,
      );
    }
    lines.push('');
  }

  lines.push('## روش کار هر موج');
  lines.push('');
  lines.push('1. `npm run wave start <n>` — موج را فعال کن.');
  lines.push('2. کد و تست همان موج را بنویس و `npm test` را سبز کن.');
  lines.push('3. یادداشت موج را در `docs/CHANGELOG.md` بنویس.');
  lines.push('4. `npm run wave finish <n>` — موج را تحویل بده (فقط اگر تست‌ها سبز باشند).');
  lines.push('5. کامیت موج با پیام `wave <n>: <عنوان>` ثبت می‌شود.');
  lines.push('6. `npm run wave verify` — بررسی نهایی سلامت پروژه و مستندات.');
  lines.push('');

  fs.writeFileSync(DOCS_FILE, lines.join('\n'));
  return DOCS_FILE;
}

function status() {
  const data = load();
  const done = data.waves.filter((w) => w.status === 'done');
  const active = data.waves.filter((w) => w.status === 'active');
  const next = data.waves.find((w) => w.status === 'todo');

  console.log('');
  console.log('⚔️  جنگاوران قلعه — وضعیت موج‌ها');
  console.log('────────────────────────────────────────');
  console.log(`پیشرفت: ${fa(done.length)} از ${fa(data.waves.length)} موج (${fa(Math.round((done.length / data.waves.length) * 100))}٪)`);
  console.log(`آخرین موج کامل‌شده: ${done.length ? `موج ${fa(done.at(-1).n)} — ${done.at(-1).title}` : '—'}`);
  if (active.length) {
    for (const w of active) {
      console.log(`موج جاری: ${fa(w.n)} — ${w.title}`);
      console.log(`  شروع شده؟ ${hasChangelogEntry(w.n) ? 'بله (یادداشت موج در CHANGELOG هست)' : 'نه (یادداشت موج در CHANGELOG نیست)'}`);
      console.log(`  هدف: ${w.goal}`);
    }
  } else {
    console.log('موج جاری: ندارد');
  }
  console.log(`موج بعدی: ${next ? `موج ${fa(next.n)} — ${next.title}` : 'همه‌ی موج‌ها تمام شده‌اند 🎉'}`);
  console.log('────────────────────────────────────────');
  console.log('برای شروع: npm run wave start <شماره>');
  console.log('');
}

function start(nRaw) {
  const n = Number(nRaw);
  const data = load();
  const wave = data.waves.find((w) => w.n === n);
  if (!wave) fail(`موج ${fa(nRaw)} در نقشه‌راه پیدا نشد.`);
  if (wave.status === 'done') fail(`موج ${fa(n)} قبلاً تمام شده است.`);

  const unfinishedBefore = data.waves.filter((w) => w.n < n && w.status !== 'done');
  if (unfinishedBefore.length) {
    fail(
      `موج‌های قبلی هنوز تمام نشده‌اند: ${unfinishedBefore.map((w) => fa(w.n)).join('، ')}. ترتیب موج‌ها را رعایت کن.`,
    );
  }

  for (const w of data.waves) if (w.status === 'active') w.status = 'todo';
  wave.status = 'active';
  save(data);
  writeDocs(data);
  console.log(`🛠️  موج ${fa(n)} شروع شد: ${wave.title}`);
  console.log(`هدف: ${wave.goal}`);
  console.log('وقتی تست‌ها سبز شد و یادداشت موج را در docs/CHANGELOG.md نوشتی، بزن: npm run wave finish ' + n);
}

function finish(nRaw) {
  const n = Number(nRaw);
  const data = load();
  const wave = data.waves.find((w) => w.n === n);
  if (!wave) fail(`موج ${fa(nRaw)} پیدا نشد.`);
  if (wave.status === 'done') fail(`موج ${fa(n)} قبلاً تمام شده است.`);
  if (!hasChangelogEntry(n)) {
    fail(`یادداشت موج ${fa(n)} در docs/CHANGELOG.md نیست. اول «## موج ${fa(n)} — ${wave.title}» را بنویس.`);
  }
  const result = runTests();
  if (result.status !== 0) fail('تست‌ها سبز نیستند؛ تا رفع باگ، موج نباید تحویل داده شود.', result.status);

  wave.status = 'done';
  save(data);
  writeDocs(data);
  console.log(`✅ موج ${fa(n)} تحویل شد: ${wave.title}`);
}

function runTests() {
  console.log('🧪 اجرای تست‌ها...');
  return spawnSync(process.execPath, ['--test', 'tests/**/*.test.js'], { cwd: ROOT, stdio: 'inherit' });
}

function verify() {
  const data = load();
  const problems = [];

  for (const w of data.waves) {
    if (w.status === 'done' && !hasChangelogEntry(w.n)) problems.push(`موج ${fa(w.n)} انجام‌شده است ولی یادداشت CHANGELOG ندارد.`);
    if (w.status === 'active' && !hasChangelogEntry(w.n)) problems.push(`موج ${fa(w.n)} فعال است ولی هنوز یادداشت شروع ندارد.`);
  }
  if (data.waves.filter((w) => w.status === 'active').length > 1) problems.push('بیش از یک موج هم‌زمان فعال است.');
  if (!fs.existsSync(DOCS_FILE)) problems.push('docs/WAVES.md ساخته نشده است.');

  const testResult = runTests();
  if (testResult.status !== 0) problems.push('تست‌ها شکست خوردند.');

  console.log('');
  if (problems.length) {
    console.log('❌ بررسی موج‌ها با مشکل روبه‌رو شد:');
    for (const p of problems) console.log(` - ${p}`);
    process.exitCode = 1;
    return;
  }
  const done = data.waves.filter((w) => w.status === 'done').length;
  console.log(`✅ همه‌چیز سالم است — ${fa(done)} از ${fa(data.waves.length)} موج تکمیل شده و تست‌ها سبزند.`);
}

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  process.exit(code);
}

const [command, arg] = process.argv.slice(2);
const commands = {
  status,
  docs: () => {
    const file = writeDocs(load());
    console.log(`📄 مستندات موج‌ها بازتولید شد: ${path.relative(ROOT, file)}`);
  },
  start: () => start(arg),
  finish: () => finish(arg),
  verify,
};

if (!commands[command]) {
  console.log('دستورهای موجود: status | start <n> | finish <n> | verify | docs');
  process.exit(command ? 1 : 0);
}
commands[command]();
