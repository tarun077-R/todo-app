/* Browser verification for the TaskFlow redesign.
 * Run from frontend/:  node verify-browser.mjs
 * Requires the Vite dev server on :5173 (proxying /api to :4000).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = new URL('./verify-shots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const email = `verify-${Date.now()}@example.com`;
const reg = await fetch(`${BASE}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Verify User', email, password: 'password123' }),
});
const { token } = await reg.json();
if (!token) throw new Error('register failed: ' + (await reg.text()));
console.log(`Seeded account ${email}`);

const api = async (path, opts = {}) =>
  fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const seed = [
  { title: 'Review Q4 roadmap', priority: 'high', dueDate: day(-1), category: 'Work' },
  { title: 'Pay electricity bill', priority: 'medium', dueDate: day(0), category: 'Home' },
  { title: 'Team standup notes', priority: 'low', category: 'Work' },
  { title: 'Book dentist appointment', priority: 'medium', dueDate: day(1), category: 'Health' },
  { title: 'Ship release notes', priority: 'high', dueDate: day(3), category: 'Work' },
  { title: 'Old chore', status: 'completed', priority: 'low', category: 'Home' },
];
for (const t of seed) {
  const res = await api('/tasks', { method: 'POST', body: JSON.stringify(t) });
  if (res.status !== 201) throw new Error('seed task failed: ' + (await res.text()));
}

const browser = await chromium.launch();
const consoleErrors = [];

function track(page) {
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`);
  });
}

async function assertActiveNav(page, expected) {
  const active = page.locator('.sidebar-nav [aria-current="page"]');
  const n = await active.count();
  const text = n === 1 ? (await active.first().innerText()).trim() : '';
  check(`exactly one active nav${expected ? ` = "${expected}"` : ''}`, n === 1 && (!expected || text.includes(expected)), `found ${n}${text ? ` (${text})` : ''}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const m = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  check(`no horizontal overflow (${label})`, m.scrollW <= m.clientW + 1, `scrollW=${m.scrollW} clientW=${m.clientW}`);
}

async function assertSingleScrollArea(page, label) {
  const info = await page.evaluate(() => {
    const main = document.querySelector('.main-content');
    return main ? getComputedStyle(main).overflowY : 'missing';
  });
  check(`main content has no nested scroll (${label})`, info === 'visible', `overflowY=${info}`);
}

// ---------- authenticated desktop ----------
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await desktop.addInitScript((t) => localStorage.setItem('todo_auth_token', t), token);
const page = await desktop.newPage();
track(page);

// Dashboard
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.stat-strip');
await assertActiveNav(page, 'Dashboard');
await assertNoHorizontalOverflow(page, 'desktop dashboard');
await assertSingleScrollArea(page, 'desktop dashboard');
const stats = await page.$$eval('.stat-cell', (els) =>
  els.map((e) => ({
    label: e.querySelector('.stat-label').textContent.trim(),
    value: e.querySelector('.stat-value').textContent.trim(),
  }))
);
const stat = (name) => stats.find((s) => s.label === name)?.value;
check('dashboard stats show real data (total = 6)', stat('Total Tasks') === '6', JSON.stringify(stats));
check('dashboard stats: pending 5 / completed 1', stat('Pending') === '5' && stat('Completed') === '1', JSON.stringify(stats));
check('overdue excludes tasks with no due date (overdue = 1)', stat('Overdue') === '1', JSON.stringify(stats));
await page.screenshot({ path: `${SHOTS}desktop-dashboard.png`, fullPage: true });

// My Tasks
await page.click('.sidebar a[href="/tasks"]');
await page.waitForSelector('.task-row');
await assertActiveNav(page, 'My Tasks');
await assertNoHorizontalOverflow(page, 'desktop my-tasks');
const pendingTitles = await page.locator('.task-row-title').allInnerTexts();
check('My Tasks shows only pending tasks (5)', pendingTitles.length === 5, JSON.stringify(pendingTitles));
check('My Tasks hides completed tasks', !pendingTitles.includes('Old chore'));
const taskCount = await page.locator('.page-header-subtitle').innerText();
check('task count shown in header', /5 tasks open/.test(taskCount), taskCount);
await page.screenshot({ path: `${SHOTS}desktop-my-tasks.png`, fullPage: true });

// Quick add
await page.fill('.quick-add-input', 'Verify quick add task');
await page.press('.quick-add-input', 'Enter');
await page.waitForSelector('.task-row-title:has-text("Verify quick add task")');
check('quick add creates a task inline', true);
await page.screenshot({ path: `${SHOTS}desktop-my-tasks-quickadd.png`, fullPage: true });

// Complete a task from the row
const firstRow = page.locator('.task-row', { hasText: 'Pay electricity bill' }).first();
await firstRow.locator('.task-checkbox').check();
await page.waitForSelector('.task-row:has-text("Pay electricity bill")', { state: 'detached' });
check('checkbox completes task and it leaves the pending list', true);

// Completed view
await page.click('.sidebar a[href="/tasks/completed"]');
// The component instance is reused across sibling routes, so wait for the
// fetched *completed* rows rather than any pre-existing row.
await page.waitForSelector('.task-row-title:has-text("Old chore")');
await assertActiveNav(page, 'Completed');
const doneTitles = await page.locator('.task-row-title').allInnerTexts();
check('Completed shows only completed tasks (2)', doneTitles.length === 2, JSON.stringify(doneTitles));
check('Completed includes newly completed task', doneTitles.includes('Pay electricity bill'));
check('Completed includes seeded completed task', doneTitles.includes('Old chore'));
await assertNoHorizontalOverflow(page, 'desktop completed');
await page.screenshot({ path: `${SHOTS}desktop-completed.png`, fullPage: true });

// Restore from completed view
const restoreRow = page.locator('.task-row', { hasText: 'Old chore' }).first();
await restoreRow.locator('.task-checkbox').uncheck();
await page.waitForSelector('.task-row:has-text("Old chore")', { state: 'detached' });
check('restore checkbox returns task to pending', true);

// Task detail + save confirmation
await page.click('.sidebar a[href="/tasks"]');
await page.waitForSelector('.task-row');
await page.locator('.task-row-title', { hasText: 'Ship release notes' }).first().click();
await page.waitForSelector('#task-title');
await assertActiveNav(page, 'My Tasks');
await page.click('button:has-text("Save Changes")');
await page.waitForSelector('.inline-notice');
const notice = await page.locator('.inline-notice-text').innerText();
check('save shows confirmation notice', /Changes saved/i.test(notice), notice);
await assertNoHorizontalOverflow(page, 'desktop task detail');
await page.screenshot({ path: `${SHOTS}desktop-task-detail.png`, fullPage: true });

// New task form
await page.goto(`${BASE}/tasks/new`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#task-title');
await assertActiveNav(page, 'My Tasks');
await assertNoHorizontalOverflow(page, 'desktop new task');
await page.screenshot({ path: `${SHOTS}desktop-new-task.png`, fullPage: true });

// Search + filters
await page.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.task-row');
await page.fill('.toolbar-search input', 'roadmap');
await page.waitForFunction(() => document.querySelectorAll('.task-row').length === 1);
check('search filters the task list', true);
await page.fill('.toolbar-search input', '');
await page.selectOption('#priority-filter', 'high');
await page.waitForFunction(() => document.querySelectorAll('.task-row').length >= 1);
const highRows = await page.locator('.task-row-title').allInnerTexts();
check('priority filter narrows the list', highRows.every((t) => /roadmap|release/i.test(t)), JSON.stringify(highRows));
await page.selectOption('#priority-filter', '');

// ---------- tablet ----------
const tablet = await browser.newContext({ viewport: { width: 820, height: 1180 } });
await tablet.addInitScript((t) => localStorage.setItem('todo_auth_token', t), token);
const tpage = await tablet.newPage();
track(tpage);
await tpage.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
await tpage.waitForSelector('.task-row');
await assertActiveNav(tpage, 'My Tasks');
await assertNoHorizontalOverflow(tpage, 'tablet my-tasks');
await assertSingleScrollArea(tpage, 'tablet my-tasks');
await tpage.screenshot({ path: `${SHOTS}tablet-my-tasks.png`, fullPage: true });
await tpage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await tpage.waitForSelector('.stat-strip');
await assertNoHorizontalOverflow(tpage, 'tablet dashboard');
await tpage.screenshot({ path: `${SHOTS}tablet-dashboard.png`, fullPage: true });

// ---------- mobile ----------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.addInitScript((t) => localStorage.setItem('todo_auth_token', t), token);
const mpage = await mobile.newPage();
track(mpage);

await mpage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await mpage.waitForSelector('.stat-strip');
await assertActiveNav(mpage, 'Dashboard');
await assertNoHorizontalOverflow(mpage, 'mobile dashboard');
await assertSingleScrollArea(mpage, 'mobile dashboard');
const sidebarW = await mpage.evaluate(() => document.querySelector('.sidebar').getBoundingClientRect().width);
check('mobile sidebar spans viewport width (top bar)', Math.abs(sidebarW - 390) <= 2, `width=${Math.round(sidebarW)}`);
await mpage.screenshot({ path: `${SHOTS}mobile-dashboard.png`, fullPage: true });

await mpage.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
await mpage.waitForSelector('.task-row');
await assertActiveNav(mpage, 'My Tasks');
await assertNoHorizontalOverflow(mpage, 'mobile my-tasks');
await mpage.screenshot({ path: `${SHOTS}mobile-my-tasks.png`, fullPage: true });

await mpage.goto(`${BASE}/tasks/completed`, { waitUntil: 'domcontentloaded' });
await mpage.waitForSelector('.task-row');
await assertActiveNav(mpage, 'Completed');
await assertNoHorizontalOverflow(mpage, 'mobile completed');
await mpage.screenshot({ path: `${SHOTS}mobile-completed.png`, fullPage: true });

await mpage.goto(`${BASE}/tasks/new`, { waitUntil: 'domcontentloaded' });
await mpage.waitForSelector('#task-title');
await assertActiveNav(mpage, 'My Tasks');
await assertNoHorizontalOverflow(mpage, 'mobile new task');
await mpage.screenshot({ path: `${SHOTS}mobile-new-task.png`, fullPage: true });

// ---------- guest: login / register ----------
const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const gpage = await guest.newPage();
track(gpage);
await gpage.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await gpage.waitForSelector('#email');
check('login page renders', await gpage.locator('h1:has-text("Welcome back")').isVisible());
await assertNoHorizontalOverflow(gpage, 'desktop login');
await gpage.screenshot({ path: `${SHOTS}desktop-login.png`, fullPage: true });

await gpage.click('a:has-text("Create one")');
await gpage.waitForSelector('#name');
check('register page renders', await gpage.locator('h1:has-text("Create your account")').isVisible());
await gpage.screenshot({ path: `${SHOTS}desktop-register.png`, fullPage: true });

// real login flow through the UI
await gpage.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await gpage.fill('#email', email);
await gpage.fill('#password', 'password123');
await gpage.click('button[type="submit"]');
await gpage.waitForSelector('.task-row, .stat-strip', { timeout: 10000 });
check('UI login lands on the app with data', true, gpage.url());

const mguest = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mgpage = await mguest.newPage();
track(mgpage);
await mgpage.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await mgpage.waitForSelector('#email');
await assertNoHorizontalOverflow(mgpage, 'mobile login');
await mgpage.screenshot({ path: `${SHOTS}mobile-login.png`, fullPage: true });

// ---------- console errors ----------
const realErrors = consoleErrors.filter(
  (e) => !/favicon|fonts\.googleapis|fonts\.gstatic|net::ERR_NAME_NOT_RESOLVED|Failed to load resource.*fonts/i.test(e)
);
check('no console/page errors during flows', realErrors.length === 0, realErrors.slice(0, 5).join(' | ') || 'clean');

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('Failures:');
  failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
  process.exit(1);
}
