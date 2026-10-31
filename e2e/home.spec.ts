import { expect, test } from '@playwright/test';
import { mockSupabase } from './supabase-mock';

test.beforeEach(async ({ page }) => {
	await mockSupabase(page);
});

test('landing shows both entry points and the six games', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Entra nella squadra' })).toHaveAttribute(
		'href',
		'/athlete'
	);
	await expect(page.getByRole('link', { name: 'Apri il pannello coach' })).toHaveAttribute(
		'href',
		'/coach'
	);
	await expect(page.locator('dl dt')).toHaveCount(6);
});

test('language switch flips the copy and sticks across navigation', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('locale-select').selectOption('en');
	await expect(page.getByRole('link', { name: 'Join the squad' })).toBeVisible();
	await page.getByRole('link', { name: 'Join the squad' }).click();
	await expect(page.getByRole('heading', { name: 'Join the squad' })).toBeVisible();

	await page.getByTestId('locale-select').selectOption('pt-BR');
	await expect(page.getByRole('heading', { name: 'Entrar na equipe' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Entrar na equipe' })).toBeVisible();
});

test.describe('Brazilian browser', () => {
	test.use({ locale: 'pt-BR' });

	test('opens in Brazilian Portuguese without a saved choice', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: 'Entrar na equipe' })).toBeVisible();
		await expect(page.getByTestId('locale-select')).toHaveValue('pt-BR');
	});
});

test('no horizontal overflow at phone width', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth
	);
	expect(overflow).toBeLessThanOrEqual(0);
});

test('footer links to the privacy page, readable at phone width', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByTestId('footer-privacy').click();
	await expect(page).toHaveURL(/\/privacy$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
	await expect(page.getByTestId('privacy')).toContainText('Atleti minorenni');
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth
	);
	expect(overflow).toBeLessThanOrEqual(0);
});

test('privacy page erases what this device saved, keeping the language', async ({ page }) => {
	await page.goto('/privacy');
	await page.evaluate(() => {
		localStorage.setItem('tempra.athlete.name', '"Giulia"');
		localStorage.setItem('tempra.results', '[]');
		localStorage.setItem('tempra.locale', '"it"');
	});
	page.once('dialog', (dialog) => void dialog.accept());
	await page.getByTestId('erase-device').click();
	await expect(page.getByRole('status')).toContainText('Dati cancellati');
	const left = await page.evaluate(() =>
		Object.keys(localStorage).filter((k) => k.startsWith('tempra.'))
	);
	expect(left).toEqual(['tempra.locale']);
});
