import { expect, test, type Page } from '@playwright/test';
import { mockSupabase, SQUAD_CODE } from './supabase-mock';

const queued = (athlete: string) => ({
	code: SQUAD_CODE,
	result: {
		athlete,
		difficulty: 3,
		score: 40,
		accuracy: 0.8,
		mean_rt_ms: 600,
		duration_ms: 60_000,
		index: 70,
		games: [{ game: 'stroop', correct: 4, wrong: 1, score: 40 }]
	}
});

const seedOutbox = (page: Page, items: ReturnType<typeof queued>[]) =>
	page.addInitScript((list) => {
		localStorage.setItem('tempra.outbox', JSON.stringify(list));
	}, items);

const outbox = (page: Page): Promise<string[]> =>
	page.evaluate(() =>
		JSON.parse(localStorage.getItem('tempra.outbox') ?? '[]').map(
			(item: { result: { athlete: string } }) => item.result.athlete
		)
	);

test('queued results for a deleted squad are all dropped, not retried forever', async ({
	page
}) => {
	const state = await mockSupabase(page);
	state.squadDeleted = true;
	await seedOutbox(page, [queued('Giulia'), queued('Marco')]);

	await page.goto('/athlete');
	await expect.poll(() => outbox(page)).toEqual([]);
	expect(state.calls.filter((c) => c.fn === 'submit_result')).toHaveLength(2);
	expect(state.results).toHaveLength(0);
});

test('queued results stay queued, in order, while the network is down', async ({ page }) => {
	const state = await mockSupabase(page);
	await page.route('**/rest/v1/rpc/submit_result', (route) => route.abort());
	await seedOutbox(page, [queued('Giulia'), queued('Marco')]);

	const failed = page.waitForEvent('requestfailed', (r) => r.url().endsWith('/submit_result'));
	await page.goto('/athlete');
	await failed;
	expect(await outbox(page)).toEqual(['Giulia', 'Marco']);
	expect(state.results).toHaveLength(0);
});

test('a block queued while another result is in flight is not lost', async ({ page }) => {
	const state = await mockSupabase(page);
	state.config = { ...state.config, block_duration_s: 60, game_duration_s: 20, games: ['trail'] };

	await page.goto('/athlete');
	await page.fill('#join-code', SQUAD_CODE);
	await page.fill('#join-name', 'Marco');
	await page.getByTestId('join-submit').click();
	await expect(page.getByTestId('athlete-home')).toBeVisible();

	// A short block, as in athlete.spec.ts, and one older result waiting to go.
	await page.evaluate((item) => {
		const squad = JSON.parse(localStorage.getItem('tempra.squad') ?? '{}');
		squad.config.block_duration_s = 12;
		squad.config.game_duration_s = 8;
		localStorage.setItem('tempra.squad', JSON.stringify(squad));
		localStorage.setItem('tempra.outbox', JSON.stringify([item]));
	}, queued('Giulia'));

	// The older result hangs in flight; the block's own send fails, so it joins the queue.
	let release = () => {};
	const held = new Promise<void>((resolve) => (release = resolve));
	let attempts = 0;
	await page.route('**/rest/v1/rpc/submit_result', async (route) => {
		attempts += 1;

		if (attempts === 1) {
			await held;
			await route.fallback();

			return;
		}

		await route.abort();
	});

	await page.reload();
	await expect(page.getByTestId('athlete-home')).toBeVisible();
	await page.getByTestId('start-block').click();
	await expect(page.getByRole('heading', { name: 'Blocco completato' })).toBeVisible({
		timeout: 30_000
	});
	await expect.poll(() => outbox(page)).toEqual(['Giulia', 'Marco']);

	release();
	await expect.poll(() => state.results.length).toBe(1);
	await expect.poll(() => outbox(page)).toEqual(['Marco']);
});
