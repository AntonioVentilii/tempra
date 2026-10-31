import { expect, test, type Page } from '@playwright/test';
import { mockSupabase, SQUAD_CODE } from './supabase-mock';

const queued = {
	code: SQUAD_CODE,
	result: {
		athlete: 'Giulia',
		difficulty: 3,
		score: 40,
		accuracy: 0.8,
		mean_rt_ms: 600,
		duration_ms: 60_000,
		index: 70,
		games: [{ game: 'stroop', correct: 4, wrong: 1, score: 40 }]
	}
};

const seedOutbox = (page: Page) =>
	page.addInitScript((item) => {
		localStorage.setItem('tempra.outbox', JSON.stringify([item]));
	}, queued);

const outbox = (page: Page) =>
	page.evaluate(() => JSON.parse(localStorage.getItem('tempra.outbox') ?? '[]').length);

test('a queued result for a deleted squad is dropped, not retried forever', async ({ page }) => {
	const state = await mockSupabase(page);
	state.squadDeleted = true;
	await seedOutbox(page);

	await page.goto('/athlete');
	await expect.poll(() => outbox(page)).toBe(0);
	expect(state.calls.filter((c) => c.fn === 'submit_result')).toHaveLength(1);
	expect(state.results).toHaveLength(0);
});

test('a queued result stays queued while the network is down', async ({ page }) => {
	await mockSupabase(page);
	await page.route('**/rest/v1/rpc/submit_result', (route) => route.abort());
	await seedOutbox(page);

	const failed = page.waitForEvent('requestfailed', (r) => r.url().endsWith('/submit_result'));
	await page.goto('/athlete');
	await failed;
	expect(await outbox(page)).toBe(1);
});
