import { expect, test } from '@playwright/test';
import { mockSupabase, SQUAD_CODE } from './supabase-mock';

test('athlete joins with a code, sees the coach parameters and plays a block', async ({ page }) => {
	const state = await mockSupabase(page);
	state.config = { ...state.config, message: 'Precisione prima di tutto', block_duration_s: 60 };

	await page.goto(`/athlete?code=${SQUAD_CODE}`);
	await expect(page.locator('#join-code')).toHaveValue(SQUAD_CODE);
	await page.fill('#join-name', 'Giulia');
	await page.getByTestId('join-submit').click();

	await expect(page.getByTestId('athlete-home')).toBeVisible();
	await expect(page.getByTestId('squad-code')).toHaveText(SQUAD_CODE);
	await expect(page.getByTestId('coach-message')).toContainText('Precisione prima di tutto');
	await expect(page.getByTestId('athlete-kpis').locator('.kpi b').first()).toHaveText('3');

	// Details stay behind the "i": open on tap, gone on the next tap anywhere.
	await page.getByRole('button', { name: 'Dettagli: Blocco' }).click();
	await expect(page.getByRole('note')).toContainText('Pressione tempo: Sì');
	await page.getByRole('note').click();
	await expect(page.getByRole('note')).toBeHidden();

	await page.getByTestId('start-block').click();
	// Interstitial then the first game (Stroop): four colour buttons.
	await expect(page.locator('.answers .btn')).toHaveCount(4, { timeout: 10_000 });
	await page.locator('.answers .btn').first().click();
	await expect(page.locator('text=/\\d+ punti/')).toBeVisible();

	await page.getByRole('button', { name: 'Interrompi' }).click();
	await expect(page.getByTestId('start-block')).toBeVisible();
	await expect(page.getByTestId('athlete-history')).toHaveCount(0);
});

test('a short block ends on its own, shows the summary and submits the result', async ({
	page
}) => {
	const state = await mockSupabase(page);
	state.config = { ...state.config, block_duration_s: 60, game_duration_s: 20, games: ['trail'] };

	await page.goto('/athlete');
	await page.fill('#join-code', SQUAD_CODE.toLowerCase());
	await page.fill('#join-name', 'Marco');
	await page.getByTestId('join-submit').click();
	await expect(page.getByTestId('athlete-home')).toBeVisible();

	// Shrink the block from the client side: the runner trusts the config it is given.
	await page.evaluate(() => {
		const raw = localStorage.getItem('tempra.squad');
		const squad = JSON.parse(raw ?? '{}');
		squad.config.block_duration_s = 12;
		squad.config.game_duration_s = 8;
		localStorage.setItem('tempra.squad', JSON.stringify(squad));
	});
	await page.reload();
	await expect(page.getByTestId('athlete-home')).toBeVisible();
	await page.getByTestId('start-block').click();

	// Tap the Trail grid in order while it lasts.
	await expect(page.locator('.grid .btn').first()).toBeVisible({ timeout: 10_000 });
	for (let n = 1; n <= 3; n++) {
		await page
			.locator('.grid .btn', { hasText: new RegExp(`^${n}$`) })
			.click({ timeout: 3000 })
			.catch(() => undefined);
	}

	await expect(page.getByRole('heading', { name: 'Blocco completato' })).toBeVisible({
		timeout: 30_000
	});
	await expect(page.locator('.kpi b').first()).not.toHaveText('');
	expect(state.calls.some((c) => c.fn === 'submit_result' && c.body.p_athlete === 'Marco')).toBe(
		true
	);

	await page.getByRole('button', { name: 'Pronto per il prossimo' }).click();
	await expect(page.getByTestId('athlete-history')).toBeVisible();
});

test('unknown code is rejected with a readable error', async ({ page }) => {
	await mockSupabase(page);
	await page.goto('/athlete');
	await page.fill('#join-code', 'NOPE12');
	await page.fill('#join-name', 'Giulia');
	await page.getByTestId('join-submit').click();
	await expect(page.getByTestId('join-error')).toContainText('Codice non trovato');
});
