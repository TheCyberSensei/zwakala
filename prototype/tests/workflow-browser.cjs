// Fictional local acceptance journey. Never point this at a real service or dataset.
const { chromium } = require(process.argv[2] || 'playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const baseURL = process.env.DEMO_TEST_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Local server required.');
const dataDir = resolve(process.env.DEMO_DATA_DIR || '.demo/milestone2-acceptance');
const credentials = Object.fromEntries([...readFileSync(resolve(dataDir, 'account-keys.local.txt'), 'utf8').matchAll(/Account: ([^\r\n]+)\r?\nDemo key: ([^\r\n]+)/g)].map(m => [m[1], m[2]]));
const artifacts = resolve(dataDir, 'milestone2-screenshots'); mkdirSync(artifacts, { recursive: true });
let checks = 0; const pass = s => { console.log('PASS ' + s); checks++; };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.DEMO_BROWSER_CHANNEL || 'msedge' });
  const errors = [], external = [];
  try {
    async function login(account) {
      const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!r.url().startsWith(baseURL)) external.push(r.url()); });
      await page.goto('/'); await page.getByLabel('Demo account', { exact: true }).selectOption(account); await page.getByLabel('Local demo key').fill(credentials[account]);
      await page.getByRole('button', { name: 'Sign in to demo', exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor(); return { page, context };
    }
    const a = await login('contributor-a'), b = await login('contributor-b'), mod = await login('moderator'), bank = await login('institution-bank'), mobile = await login('institution-mobile');
    const click = (p, name) => p.getByRole('button', { name, exact: true }).click();
    const get = async (c, path) => (await c.request.get('/api/' + path)).json();
    async function report(p, title, original, publicText) {
      await click(p, 'Try a fictional example'); await p.getByLabel('Your experience', { exact: true }).fill(original); await p.getByLabel('Give your report a short title').fill(title);
      await p.getByLabel('What were you asked to do?').selectOption('share_code');
      await click(p, 'Continue to organisations'); await click(p, 'Continue to sharing choices'); await p.getByRole('radio', { name: /^Organisations and community/ }).check();
      await p.locator('.recipient input').nth(0).check(); await p.locator('.recipient input').nth(1).check();
      await p.getByLabel('Proposed community version').fill(publicText); await p.getByLabel('Text for selected organisations').fill('FICTIONAL organisation version: a message impersonated Example Bank and requested a code.');
      await click(p, 'Approve this exact version'); await p.getByRole('button', { name: 'This version is approved', exact: true }).waitFor();
      await click(p, 'Approve organisation text and recipients'); await p.getByRole('button', { name: 'Organisation version approved', exact: true }).waitFor();
      await click(p, 'Review your report'); await p.getByRole('checkbox', { name: 'I confirm this report uses only fictional demonstration data.' }).check(); await click(p, 'Save private report');
      await p.getByRole('status').filter({ hasText: 'Saved privately' }).waitFor(); await click(p, 'Submit approved version for review'); await p.getByRole('button', { name: 'Submitted for review', exact: true }).waitFor();
    }
    const privateA = 'FICTIONAL PRIVATE ORIGINAL A: a message asked for a security code. Ngithole umyalezo. Private context stays here.';
    const privateB = 'FICTIONAL PRIVATE ORIGINAL B: a different message asked me for a security code. This account is made up.';
    const sharedA = 'FICTIONAL shared experience A: a message asked for a code. I did not reply. Ngiyabonga.';
    await report(a.page, 'Fictional M2 experience A', privateA, sharedA);
    await report(b.page, 'Fictional M2 experience B', privateB, 'FICTIONAL shared experience B: another message asked for a code.');
    const ra = (await get(a.context, 'reports')).reports.find(r => r.title === 'Fictional M2 experience A');
    pass('both contributors complete exact audience approval, private saving and explicit submission through the UI');
    await click(mod.page, 'Refresh review queue');
    const review = title => mod.page.locator('.review-item').filter({ has: mod.page.getByRole('heading', { name: title, exact: true }) });
    const row = review('Fictional M2 experience A');
    await row.getByLabel('Review reason', { exact: true }).fill('Fictional review: details need clarification.');
    await row.getByRole('button', { name: 'Withhold sharing', exact: true }).click(); await row.getByText('Withheld —', { exact: false }).waitFor();
    assert.equal((await get(a.context, 'community')).experiences.length, 0);
    await row.getByRole('button', { name: 'Request clarification', exact: true }).click(); await row.getByText('Clarification requested —', { exact: false }).waitFor();
    await a.page.reload(); await a.page.getByLabel('Your saved reports').selectOption(ra.id); await a.page.getByText('Clarification requested · version 1', { exact: true }).waitFor();
    pass('withholding and clarification are recorded and visible to the contributor without community release');
    for (const title of ['Fictional M2 experience A', 'Fictional M2 experience B']) {
      const r = review(title); await r.getByLabel('Review reason', { exact: true }).fill('Fictional moderator checked exact approved audience versions.'); await r.getByRole('button', { name: 'Approve sharing', exact: true }).click(); await r.getByText('Approved for sharing —', { exact: false }).waitFor();
    }
    await row.getByRole('button', { name: 'Approve sharing', exact: true }).click(); await row.getByRole('status').waitFor();
    const notifications = (await get(bank.context, 'inbox')).notifications; assert.equal(notifications.length, 2); assert.equal((await get(mobile.context, 'inbox')).notifications.length, 2);
    assert(!JSON.stringify(notifications).includes(privateA)); assert(notifications.every(n => n.relationships.includes('impersonated')));
    pass('review triggers deduplicated institution-specific delivery, including an impersonated institution');
    const connection = mod.page.locator('.review-item').filter({ has: mod.page.getByRole('button', { name: 'Confirm possible relationship', exact: true }) });
    await connection.getByLabel('Association or notice reason').fill('Fictional pair review: similarities do not prove a campaign.');
    await connection.getByRole('button', { name: 'Mark as duplicate', exact: true }).click(); await connection.getByText('duplicate', { exact: true }).waitFor();
    assert.equal((await get(a.context, 'community')).notices.length, 0);
    await connection.getByRole('button', { name: 'Reject association', exact: true }).click(); await connection.getByText('rejected', { exact: true }).waitFor();
    await connection.getByRole('button', { name: 'Confirm possible relationship', exact: true }).click(); await connection.getByRole('button', { name: 'Display qualified community notice', exact: true }).click(); await connection.getByRole('status').waitFor();
    await click(a.page, 'Community'); await a.page.getByText(sharedA, { exact: true }).waitFor(); assert.equal(await a.page.locator('.community-story').count(), 2); assert.equal(await a.page.locator('.pattern-notice').count(), 1);
    assert(!(await a.page.locator('main').innerText()).includes(privateA)); assert(!(await a.page.locator('main').innerText()).includes('PRIVATE TITLE'));
    await a.page.screenshot({ path: resolve(artifacts, 'desktop-community.png'), fullPage: true }); pass('reviewed associations and qualified notices connect only the exact shared community experiences');
    await click(bank.page, 'Refresh inbox'); const item = bank.page.locator('.notification').first();
    await item.getByLabel('Update for the contributor').fill('Fictional bank acknowledges receipt.'); await item.getByRole('button', { name: 'Acknowledge receipt', exact: true }).click(); await item.getByRole('heading', { name: 'Acknowledged', exact: true }).waitFor();
    for (const [kind, text] of [['investigating', 'Fictional bank is investigating impersonation.'], ['action_reported', 'Fictional bank reports issuing a customer warning.'], ['resolution_reported', 'Fictional bank reports this example resolved.']]) {
      await item.getByLabel('Update stage').selectOption(kind); await item.getByLabel('Update for the contributor').fill(text); await item.getByRole('button', { name: 'Record update', exact: true }).click(); await item.locator('.timeline').getByText(text, { exact: true }).waitFor();
    }
    const bankItems = (await get(bank.context, 'inbox')).notifications;
    const targeted = bankItems.find(n => n.updates.length); const journeys = await Promise.all([get(a.context, 'reports/' + ra.id + '/journey'), get(b.context, 'reports/' + (await get(b.context, 'reports')).reports[0].id + '/journey')]);
    const who = journeys[0].notifications.some(n => n.id === targeted.id) ? a : b; const targetReport = (await get(who.context, 'reports')).reports.find(r => r.title.startsWith('Fictional M2'));
    await click(who.page, 'My reports'); await who.page.getByLabel('Your saved reports').selectOption(targetReport.id); await click(who.page, 'Refresh progress');
    await who.page.getByRole('heading', { name: 'Resolution reported — not independently verified', exact: true }).waitFor();
    const outcome = who.page.locator('.timeline > li').filter({ has: who.page.getByRole('heading', { name: 'Resolution reported — not independently verified', exact: true }) });
    await outcome.getByText('Confirm or dispute this outcome', { exact: true }).click(); await outcome.getByLabel('Your experience of this outcome').fill('Fictional contributor still needs assistance.'); await outcome.getByRole('button', { name: 'Dispute outcome', exact: true }).click(); await outcome.getByText('Contributor disputes outcome', { exact: true }).waitFor();
    await outcome.getByLabel('Your experience of this outcome').fill('Fictional contributor now confirms a later satisfactory outcome.'); await outcome.getByRole('button', { name: 'Confirm outcome', exact: true }).click(); await outcome.getByText('Contributor confirms outcome', { exact: true }).waitFor();
    pass('institution acknowledgement, investigation, action and reported resolution reach the contributor, who can dispute and confirm attributable outcomes');
    assert.equal((await mobile.context.request.post('/api/inbox/' + targeted.id + '/updates', { headers: { Origin: baseURL }, data: { kind: 'acknowledged', message: 'FICTIONAL unauthorised attempt.' } })).status(), 404);
    assert.equal((await bank.context.request.get('/api/reports/' + ra.id + '/journey')).status(), 404);
    assert.equal((await a.context.request.get('/api/moderation')).status(), 403); pass('real HTTP routes reject cross-institution and contributor privilege escalation');
    await mod.page.screenshot({ path: resolve(artifacts, 'desktop-review.png'), fullPage: true }); await bank.page.screenshot({ path: resolve(artifacts, 'desktop-inbox.png'), fullPage: true });
    for (const p of [a.page, mod.page, bank.page]) {
      await p.setViewportSize({ width: 390, height: 844 });
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); assert.equal(await p.locator('input,select,textarea').evaluateAll(nodes => nodes.filter(n => !n.labels?.length).length), 0);
      await p.setViewportSize({ width: 320, height: 800 }); await p.evaluate(() => document.documentElement.style.fontSize = '200%'); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await p.evaluate(() => document.documentElement.style.fontSize = '');
      await p.setViewportSize({ width: 390, height: 844 });
    }
    assert(await mod.page.locator('.review-item .actions').first().evaluate(el => getComputedStyle(el).flexDirection === 'column'));
    await mod.page.screenshot({ path: resolve(artifacts, 'mobile-review.png'), fullPage: true }); await bank.page.screenshot({ path: resolve(artifacts, 'mobile-inbox.png'), fullPage: true });
    await a.page.getByRole('button', { name: 'Community', exact: true }).focus(); await a.page.keyboard.press('Enter'); await a.page.getByRole('heading', { name: 'Experiences we can learn from', exact: true }).waitFor(); await a.page.screenshot({ path: resolve(artifacts, 'mobile-community.png'), fullPage: true });
    pass('community, moderation and inbox support keyboard navigation, labelled controls, 390/320px screens and 200% text without horizontal overflow');
    await click(a.page, 'My reports'); await a.page.getByLabel('Your saved reports').selectOption(ra.id); await click(a.page, 'Change sharing choices');
    await a.page.locator('.recipient input').nth(1).uncheck(); await a.page.getByLabel('Text for selected organisations').fill('FICTIONAL corrected organisation version, now for Example Bank only.');
    await click(a.page, 'Approve organisation text and recipients'); await a.page.getByRole('button', { name: 'Organisation version approved', exact: true }).waitFor(); await click(a.page, 'Review your report'); await click(a.page, 'Save private report'); await a.page.getByRole('status').filter({ hasText: 'Saved privately' }).waitFor();
    let community = await get(a.context, 'community'); assert.equal(community.experiences.length, 1); assert.equal(community.notices.length, 0); assert((await get(a.context, 'reports/' + ra.id + '/journey')).notifications.every(n => n.staleReason));
    await click(a.page, 'Submit approved version for review'); await a.page.getByRole('button', { name: 'Submitted for review', exact: true }).waitFor();
    await click(mod.page, 'Refresh review queue'); await row.getByText('Version 2 · SMS · 2026-11-01', { exact: true }).waitFor(); await row.getByLabel('Review reason', { exact: true }).fill('Fictional corrected version and permissions reviewed.'); await row.getByRole('button', { name: 'Approve sharing', exact: true }).click(); await row.getByText('Approved for sharing —', { exact: false }).waitFor();
    assert.equal((await get(mobile.context, 'inbox')).notifications.length, 2); assert.equal((await get(bank.context, 'inbox')).notifications.length, 3);
    pass('correction removes old community display/notices and sends a newly reviewed version only to still-authorised recipients');
    await a.page.getByText('Withdraw this report from further sharing', { exact: true }).click(); await a.page.getByLabel('Why are you withdrawing?').fill('Fictional contributor withdraws this example.'); await click(a.page, 'Withdraw report'); await a.page.getByText('Withdrawn. Further sharing has stopped;', { exact: false }).waitFor();
    community = await get(a.context, 'community'); assert.equal(community.experiences.length, 1); assert.equal(community.notices.length, 0); const history = await get(a.context, 'reports/' + ra.id + '/journey'); assert(history.notifications.every(n => n.status === 'delivered' && n.staleReason));
    await click(bank.page, 'Refresh inbox'); await bank.page.getByText('This historical copy is read-only.', { exact: false }).first().waitFor(); assert((await bank.page.locator('main').innerText()).includes('historical copy is read-only')); pass('withdrawal removes visibility, stops further sharing and keeps delivered copies explicitly historical');
    assert.deepEqual(errors, []); assert.deepEqual(external, []); pass('no browser exceptions or external requests');
    console.log(checks + ' Milestone 2 browser checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
