import { expect, test } from '@playwright/test';
import { COACH_KEY, mockSupabase, SQUAD_CODE } from './supabase-mock';

test('coach creates a squad, publishes parameters and sees the roster fill', async ({ page }) => {
	const state = await mockSupabase(page);

	await page.goto('/coach');
	await page.fill('#squad-name', 'Velocisti U20');
	await page.getByTestId('create-submit').click();

	await expect(page.getByTestId('squad-code')).toHaveText(SQUAD_CODE);
	await expect(page.getByTestId('roster')).toContainText('Nessun atleta ancora');

	await page.fill('#c-diff', '5');
	await page.selectOption('#c-block', '120');
	await page.getByLabel('Distrattori visivi').check();
	await page.fill('#c-msg', 'Oggi si soffre');
	await page.getByRole('button', { name: 'Pubblica alla squadra' }).click();
	await expect(page.getByRole('status')).toContainText('Parametri pubblicati');

	const publish = state.calls.find((c) => c.fn === 'update_squad_config');
	expect(publish?.body.p_coach_key).toBe(COACH_KEY);
	const config = publish?.body.p_config as Record<string, unknown>;
	expect(config.difficulty).toBe(5);
	expect(config.block_duration_s).toBe(120);
	expect(config.distractors).toBe(true);
	expect(config.message).toBe('Oggi si soffre');

	// A result lands on the server: the next poll or refresh shows the athlete.
	state.results.unshift({
		id: 'r-giulia',
		code: SQUAD_CODE,
		athlete: 'Giulia',
		game: 'block',
		difficulty: 5,
		score: 140,
		accuracy: 0.85,
		mean_rt_ms: 610,
		trials: 26,
		duration_ms: 120000,
		params: { index: 82 },
		created_at: new Date().toISOString()
	});
	await page.getByRole('button', { name: 'Aggiorna' }).click();
	await expect(page.getByTestId('roster')).toContainText('Giulia');
	await expect(page.getByTestId('roster')).toContainText('1 blocchi');

	await page
		.getByTestId('roster')
		.getByRole('button', { name: /Giulia/ })
		.click();
	await expect(page.getByTestId('athlete-history')).toContainText('Storico di Giulia');
	await expect(page.getByTestId('athlete-history').locator('tbody tr')).toHaveCount(1);

	page.once('dialog', (dialog) => void dialog.accept());
	await page.getByTestId('athlete-delete').click();
	await expect(page.getByRole('status')).toContainText('Risultati di Giulia cancellati');
	const erase = state.calls.find((c) => c.fn === 'delete_athlete_results');
	expect(erase?.body).toMatchObject({ p_coach_key: COACH_KEY, p_athlete: 'Giulia' });
	await expect(page.getByTestId('athlete-history')).toBeHidden();
	await expect(page.getByTestId('roster')).not.toContainText('Giulia');
});

const giuliaResult = () => ({
	id: 'r-giulia',
	code: SQUAD_CODE,
	athlete: 'Giulia',
	game: 'block',
	difficulty: 3,
	score: 140,
	accuracy: 0.85,
	mean_rt_ms: 610,
	trials: 26,
	duration_ms: 90000,
	params: { index: 82 },
	created_at: new Date().toISOString()
});

test('a load already in flight cannot bring deleted results back', async ({ page }) => {
	const state = await mockSupabase(page);
	state.results.unshift(giuliaResult());
	await page.goto(`/coach?code=${SQUAD_CODE}&key=${COACH_KEY}`);
	await page
		.getByTestId('roster')
		.getByRole('button', { name: /Giulia/ })
		.click();

	let release = () => {};
	state.holdListResults = new Promise((resolve) => (release = resolve));
	await page.getByRole('button', { name: 'Aggiorna' }).click();
	await expect.poll(() => state.calls.filter((c) => c.fn === 'list_results').length).toBe(2);

	page.once('dialog', (dialog) => void dialog.accept());
	await page.getByTestId('athlete-delete').click();
	await expect(page.getByRole('status')).toContainText('Risultati di Giulia cancellati');
	await expect(page.getByTestId('roster')).not.toContainText('Giulia');

	const stale = page.waitForResponse(/list_results/);
	release();
	await stale;
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 100)));
	await expect(page.getByTestId('roster')).not.toContainText('Giulia');
});

test('coach deletes the squad and every result', async ({ page }) => {
	const state = await mockSupabase(page);
	state.results.unshift(giuliaResult());
	await page.goto(`/coach?code=${SQUAD_CODE}&key=${COACH_KEY}`);
	await expect(page.getByTestId('squad-code')).toHaveText(SQUAD_CODE);
	await expect(page.getByTestId('roster')).toContainText('Giulia');

	page.once('dialog', (dialog) => void dialog.dismiss());
	await page.getByTestId('squad-delete').click();
	expect(state.calls.some((c) => c.fn === 'delete_squad')).toBe(false);

	page.once('dialog', (dialog) => void dialog.accept());
	await page.getByTestId('squad-delete').click();
	await expect(page.getByTestId('create-squad')).toBeVisible();
	expect(state.calls.find((c) => c.fn === 'delete_squad')?.body.p_coach_key).toBe(COACH_KEY);
	expect(state.results).toEqual([]);

	await page.goto(`/athlete?code=${SQUAD_CODE}`);
	await page.fill('#join-name', 'Giulia');
	await page.getByTestId('join-submit').click();
	await expect(page.getByTestId('join-error')).toContainText('Codice non trovato');
});

test('coach link restores the session on a new device', async ({ page }) => {
	await mockSupabase(page);
	await page.goto(`/coach?code=${SQUAD_CODE.toLowerCase()}&key=${COACH_KEY}`);
	await expect(page.getByTestId('squad-code')).toHaveText(SQUAD_CODE);
	expect(new URL(page.url()).search).toBe('');
	await page.getByTestId('coach-leave').click();
	await expect(page.getByTestId('create-squad')).toBeVisible();
});
