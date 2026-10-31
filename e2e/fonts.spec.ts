import { expect, test } from '@playwright/test';
import { mockSupabase } from './supabase-mock';

test('fonts load from this site, never from a CDN', async ({ page }) => {
	await mockSupabase(page);
	const fonts: string[] = [];
	page.on('request', (request) => {
		if (request.resourceType() === 'font') {
			fonts.push(request.url());
		}
	});

	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);

	expect(fonts.length).toBeGreaterThan(0);
	expect(fonts.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});
