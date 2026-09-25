/** Read-only browser acceptance of the built export. No live forms or MOS navigation. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { createRequire } from 'node:module';
const repo = path.resolve(import.meta.dirname, '..');
const root = path.join(repo, 'apps/web/out');
const require = createRequire(path.join(repo, 'apps/web/package.json'));
const { chromium, expect } = require('@playwright/test');
process.env.TSX_TSCONFIG_PATH = path.join(repo, 'apps/web/tsconfig.json');
const { require: tsRequire } = await import('tsx/cjs/api');
const { mosAvailabilityBinding } = tsRequire('../apps/web/lib/offers/mos-availability.ts', import.meta.url);
let syntheticAvailability = null, syntheticLeadOk = false, syntheticLeadPosts = 0, holdLead = false;
const heldLeads = [];
const output = await fs.mkdtemp(path.join(os.tmpdir(), 'questhub-polish-browser-'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    let status = 200;
    try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); await fs.access(file); }
    catch { file = path.join(root, '404.html'); status = 404; }
    const bytes = await fs.readFile(file);
    res.writeHead(status, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const report = { origin, output, at: new Date().toISOString(), scope: 'local static export; missing availability simulated; all external writes blocked', scans: [], checks: {}, blockedWrites: [], failures: [] };
async function protect(context) {
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      report.blockedWrites.push({ method: request.method(), path: url.origin + url.pathname });
      if (request.postData()?.includes('"submittedAt"') && request.postData()?.includes('bm-questhub-static')) {
        syntheticLeadPosts++;
        if (holdLead) { heldLeads.push(route); return; }
        return route.fulfill({ status: syntheticLeadOk ? 200 : 502, contentType: 'application/json', body: JSON.stringify({ ok: syntheticLeadOk }) });
      }
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' });
    }
    if (url.pathname.endsWith('/mos-availability.json')) return route.fulfill({ status: syntheticAvailability ? 200 : 404, contentType: 'application/json', body: JSON.stringify(syntheticAvailability ?? {}) });
    if (/^(?:www\.)?mos\.ru$/.test(url.hostname)) return route.abort();
    return route.continue();
  });
}
async function navigate(page, pathname) {
  await page.goto(origin + pathname, { waitUntil: 'networkidle', timeout: 45000 });
  const consent = page.getByRole('button', { name: 'Только необходимое' });
  if (await consent.isVisible()) await consent.click();
}
async function scan(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary, html: n.html.slice(0,350) })) })));
}
try {
  const schoolSlugs = ['37','937','17','875','1212','1383','1517','2044','2103'].map(n => `school-${n}`).concat(['mduc-ekt','bm-base-moscow']);
  const tasks = schoolSlugs.flatMap(school => [{ path: `/sites/${school}/`, width: 390 }, { path: `/sites/${school}/agenda/?view=catalogue`, width: 390 }]);
  tasks.push(...['/', '/sites/', '/catalog/', '/agenda/?view=catalogue', '/year-courses/', '/year-courses/shmi/', '/year-courses/it-academy/', '/year-courses/projects/', '/year-courses/olympiad-league/', '/quests/shmi/'].map(path => ({ path, width: 1440 })));
  tasks.push({ path: '/sites/school-2044/agenda/?view=catalogue', width: 320 });
  let next = 0;
  async function worker() {
    const context = await browser.newContext(); await protect(context);
    while (next < tasks.length) {
      const task = tasks[next++], page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        await page.setViewportSize({ width: task.width, height: 900 }); await navigate(page, task.path);
        if (task.path.includes('/agenda/')) await page.getByTestId('finder-count').waitFor();
        const row = { ...task, errors, ...await page.evaluate(() => ({
          h1: [...document.querySelectorAll('h1')].map(e => e.textContent), main: document.querySelectorAll('main').length,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          count: document.querySelector('[data-testid=finder-count]')?.textContent,
          brokenImages: [...document.querySelectorAll('main img')].filter(i => i.complete && !i.naturalWidth).map(i => i.src),
        })), violations: await scan(page) };
        report.scans.push(row);
        await page.screenshot({ path: path.join(output, task.path.replace(/[^a-zA-Z0-9]+/g, '-') + task.width + '.png'), fullPage: task.path.includes('2044') });
        if (row.overflow || row.errors.length || row.violations.length || row.main !== 1 || row.brokenImages.length) report.failures.push({ task, row });
        console.log(JSON.stringify({ ...task, count: row.count, overflow: row.overflow, violations: row.violations.map(v => v.id), errors }));
      } catch (e) { report.failures.push({ task, error: e.stack }); }
      finally { await page.close(); }
    }
    await context.close();
  }
  if (process.env.POLISH_SCENARIOS_ONLY !== '1') await Promise.all([worker(), worker()]);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read','clipboard-write'] }); await protect(context);
  const page = await context.newPage();
  await navigate(page, '/agenda/?view=catalogue');
  assert.equal(await page.getByTestId('finder-count').innerText(), '62');
  assert.equal(await page.getByLabel('Площадка', { exact: true }).inputValue(), 'all');
  await page.getByLabel('Площадка', { exact: true }).selectOption('school-2044');
  await page.waitForFunction(() => document.querySelector('[data-testid=finder-count]')?.textContent === '11');
  await page.getByRole('button', { name: 'Поделиться', exact: true }).click();
  const share = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(new URL(share).pathname === '/sites/school-2044/agenda/' || new URL(share).searchParams.get('school') === 'school-2044');
  assert.ok(share.length < 150);
  const sharedPage = await context.newPage(); await navigate(sharedPage, new URL(share).pathname + new URL(share).search);
  assert.equal(await sharedPage.getByTestId('finder-count').innerText(), '11'); await sharedPage.close();
  await page.getByLabel('День занятий', { exact: true }).selectOption('3');
  await page.waitForFunction(() => document.querySelector('[data-testid=finder-count]')?.textContent === '5');
  await page.goBack(); assert.equal(await page.getByLabel('День занятий', { exact: true }).inputValue(), 'all');
  await page.goForward(); assert.equal(await page.getByLabel('День занятий', { exact: true }).inputValue(), '3');
  await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.getByTestId('finder-count').innerText(), '5');
  report.checks.navigation = { global: 62, school2044: 11, wednesday2044: 5, share, historyAndReload: true };
  await navigate(page, '/sites/school-2044/agenda/?view=catalogue');
  assert.equal(await page.getByTestId('availability-notice').count(), 1);
  assert.match(await page.locator('main').innerText(), /Было свободно/);
  const trigger = page.getByRole('link', { name: /Проверить на mos.ru/ }).first();
  await trigger.click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
  const seconds = Number(await page.getByTestId('mos-seconds').innerText()); assert.ok(seconds >= 13 && seconds <= 15);
  assert.match(await page.getByTestId('mos-proceed-now').getAttribute('href'), /^https:\/\/www\.mos\.ru\/pgu2\/activity\/card\/\d+$/);
  await dialog.getByRole('button', { name: /Остановить|Пауза/ }).click();
  const dialogViolations = await scan(page); assert.deepEqual(dialogViolations, []);
  await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Проверить на mos.ru'));
  await trigger.click(); await dialog.getByRole('button', { name: 'Заполнить анкету', exact: true }).click();
  assert.equal(await page.getByTestId('mos-seconds').count(), 0);
  await dialog.locator('#parentName').fill('Тестовый Родитель');
  await dialog.locator('#contact').fill('79990000000');
  await dialog.locator('#childName').fill('Тестовый Ребёнок');
  await dialog.locator('#childAge').fill('9');
  await dialog.getByRole('checkbox').check();
  await dialog.locator('button[type=submit]').click();
  await expect(dialog.getByTestId('booking-submit-error')).toContainText('Заявка могла поступить');
  assert.equal(syntheticLeadPosts, 1);
  assert.equal(await dialog.locator('#parentName').inputValue(), 'Тестовый Родитель');
  assert.equal(await dialog.getByTestId('mos-success').count(), 0);
  syntheticLeadOk = true;
  await dialog.locator('button[type=submit]').click();
  await dialog.getByTestId('mos-success').waitFor();
  assert.equal(syntheticLeadPosts, 2);
  report.checks.syntheticForm = { errorPreservesValues: true, noAutomaticRetry: true, jsonAcknowledgementRequired: true, interceptedPosts: syntheticLeadPosts };
  await page.keyboard.press('Escape');
  report.checks.popup = { seconds, directLink: true, pause: true, escapeAndFocus: true, formStopsTimer: true };
  // A timed-out POST is uncertain, not an invitation to an automatic resend.
  await page.clock.install(); holdLead = true;
  const fillSynthetic = async () => {
    await dialog.locator('#parentName').fill('Тестовый Родитель'); await dialog.locator('#contact').fill('79990000000');
    await dialog.locator('#childName').fill('Тестовый Ребёнок'); await dialog.locator('#childAge').fill('9'); await dialog.getByRole('checkbox').check();
  };
  await trigger.click(); await dialog.getByRole('button', { name: 'Заполнить анкету', exact: true }).click(); await fillSynthetic();
  await dialog.locator('button[type=submit]').click(); await expect.poll(()=>heldLeads.length).toBe(1);
  await page.clock.fastForward(35_001);
  await expect(dialog.getByTestId('booking-submit-error')).toContainText('Заявка могла поступить');
  await expect(dialog.locator('button[type=submit]')).toBeEnabled();
  assert.equal(await dialog.locator('#parentName').inputValue(), 'Тестовый Родитель');
  assert.equal(syntheticLeadPosts, 3); await heldLeads.shift().abort().catch(()=>{});
  await page.keyboard.press('Escape');
  // Complete an old request only after a different form session has been opened.
  await trigger.click(); await dialog.getByRole('button', { name: 'Заполнить анкету', exact: true }).click(); await fillSynthetic();
  await dialog.locator('button[type=submit]').click(); await expect.poll(()=>heldLeads.length).toBe(1);
  await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
  await trigger.click(); await dialog.getByRole('button', { name: 'Заполнить анкету', exact: true }).click();
  await dialog.locator('#parentName').fill('Новая Сессия');
  await heldLeads.shift().fulfill({ status:200, contentType:'application/json', body:'{"ok":true}' });
  await page.waitForLoadState('networkidle');
  assert.equal(await dialog.locator('#parentName').inputValue(), 'Новая Сессия');
  assert.equal(await dialog.getByTestId('mos-success').count(), 0);
  await page.keyboard.press('Escape'); holdLead = false;
  report.checks.formLifecycle = { deadline35s: true, reenabled: true, noLateSuccessOrResetAfterReopen: true };
  await navigate(page, '/sites/mduc-ekt/');
  report.checks.inactiveVenueText = (await page.locator('main').innerText()).slice(0,4000);
  const aliases = [['К4046-26','К4061-26'], ['К4048-26','К4062-26'], ['К4049-26','К4063-26'], ['К4050-26','К4064-26'], ['К4051-26','К4065-26'], ['К4052-26','К4066-26'], ['К4053-26','К4067-26'], ['К4054-26','К4068-26']];
  for (const [from,to] of aliases) {
    await navigate(page, `/sites/school-2044/agenda/?view=catalogue&offer=${encodeURIComponent('year:'+from)}`);
    const selected = await page.locator(`[data-annual-group="year:${to}"]`).count();
    // The old identifier must never reintroduce an archived duplicate in the rendered cards.
    assert.equal(await page.locator(`[data-annual-group="year:${from}"]`).count(), 0);
    assert.ok(selected > 0, `replacement ${to} visible`);
    assert.equal(await page.locator(`[data-annual-group="year:${to}"]`).getAttribute('data-selected'), 'true');
  }
  report.checks.aliases = 8;
  await navigate(page, '/quests/shmi/?school=school-2044&offer=' + encodeURIComponent('year:К4046-26'));
  const selectedQuestGroup = page.locator('[data-testid=annual-programmes] [data-annual-group="year:К4061-26"]');
  await expect(selectedQuestGroup.locator(':scope > details')).toHaveAttribute('open', '');
  assert.equal(await page.locator('[data-annual-group="year:К4046-26"]').count(), 0);
  report.checks.questAlias = true;
  const source = JSON.parse(await fs.readFile(path.join(repo, 'apps/web/data/offers-snapshot.json'), 'utf8'));
  const offer = source.offersByQuest.shmi.find(o => o.id === 'year:К7648-26');
  const binding = mosAvailabilityBinding(offer);
  const makeAvailability = (freeSeats, error) => {
    const checkedAt = new Date().toISOString();
    return { version: 1, attemptedAt: checkedAt, completedAt: checkedAt, expected: 1, verified: error ? 0 : 1, archived: 0,
      errors: error ? [{ offerId: offer.id, code: error }] : [], entries: { [offer.id]: { binding, availability: { checkedAt, totalSeats: 15, freeSeats, admission: 'open' }, ...(error ? { error } : {}) } } };
  };
  syntheticAvailability = makeAvailability(2);
  await navigate(page, '/sites/school-1517/agenda/?view=catalogue');
  const card = page.locator(`[data-annual-group="${offer.id}"]`);
  await expect(card.getByTestId('schedule-capacity')).toContainText('Свободно 2 из 15');
  assert.equal(await card.getByRole('meter').getAttribute('aria-valuenow'), '13');
  assert.equal(await card.getByTestId('schedule-capacity').getAttribute('data-stale'), null);
  syntheticAvailability = makeAvailability(0); await page.reload({ waitUntil: 'networkidle' });
  await expect(card.getByTestId('schedule-capacity')).toContainText('Свободных мест нет');
  assert.equal(await card.getByRole('meter').getAttribute('aria-valuenow'), '15');
  syntheticAvailability = makeAvailability(2, 'MOS_IDENTITY_CHANGED'); await page.reload({ waitUntil: 'networkidle' });
  await expect(card).toContainText('Карточка на проверке');
  assert.equal(await card.locator('[data-mos-booking-link]').count(), 0);
  syntheticAvailability = null; await page.reload({ waitUntil: 'networkidle' });
  await expect(card.getByTestId('schedule-capacity')).toContainText('Было свободно');
  report.checks.syntheticAvailability = { freshCounts: true, zeroNotUnknown: true, identityErrorBlocksBooking: true, missingIsDated: true };
  // Freeze source bytes while moving only the browser clock across the freshness threshold.
  const clockBase = new Date(); await page.clock.setSystemTime(clockBase);
  syntheticAvailability = makeAvailability(2); syntheticAvailability.entries[offer.id].availability.admission='closed';
  await navigate(page, '/quests/shmi/?school=school-1517&offer=' + encodeURIComponent(offer.id));
  const questCard = page.locator(`[data-testid=annual-programmes] [data-annual-group="${offer.id}"]`);
  await expect(questCard.getByRole('button', { name:'Приём закрыт', exact:true }).first()).toBeDisabled();
  await page.clock.fastForward(16 * 60_000);
  await expect(questCard.getByRole('link', { name:/Проверить на mos.ru/ }).first()).toBeVisible();
  await expect(questCard).toContainText('Приём уточняется');
  report.checks.questClockAgeing = true;
  await context.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false }); await protect(nojs);
  const staticPage = await nojs.newPage();
  report.checks.initialHtml = [];
  for (const route of ['/','/catalog/','/agenda/','/sites/school-2044/agenda/','/sites/school-2044/catalog/']) {
    await staticPage.goto(origin + route);
    const selector = route.includes('/agenda/') ? 'static-agenda' : 'static-catalog';
    const fallback = staticPage.getByTestId(selector); assert.ok(await fallback.isVisible());
    const links = await fallback.locator('a').count(); assert.ok(links > 0);
    if (selector === 'static-agenda') {
      const ids = await fallback.locator('[data-static-offer]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-static-offer')));
      assert.equal(ids.length, route.includes('school-2044') ? 11 : 62);
      assert.equal(new Set(ids).size, ids.length);
      for (const [from] of aliases) assert.ok(!ids.includes('year:'+from));
      if (route.includes('school-2044')) assert.ok(ids.every(id=>source.offersByQuest.shmi.find(o=>o.id===id)?.venueSlug.startsWith('school-2044-')));
    } else {
      assert.equal(await fallback.locator('li').count(), 1);
      assert.match(await fallback.innerText(), /Школа Молодого IT-Инженера/);
    }
    report.checks.initialHtml.push({ route, links });
  }
  await nojs.close();
  const seoHtml = await (await fetch(origin + '/sites/school-2044/agenda/')).text();
  const canonical = seoHtml.match(/<link rel="canonical" href="([^"]+)"/)[1];
  const canonicalOrigin = new URL(canonical).origin;
  const robots = await fetch(origin + '/robots.txt'); assert.equal(robots.status,200); assert.ok((await robots.text()).includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
  const sitemap = await fetch(origin + '/sitemap.xml'); assert.equal(sitemap.status,200); assert.ok((await sitemap.text()).includes(canonical));
  const missing = await fetch(origin + '/audit-this-page-does-not-exist/'); assert.equal(missing.status,404); assert.match(await missing.text(), /404/);
  report.checks.staticRoutes = true;
} catch (e) { report.failures.push({ error: e.stack }); }
finally {
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({ output, scans: report.scans.length, checks: Object.keys(report.checks), failures: report.failures.length }));
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
if (report.failures.length) process.exitCode = 1;
