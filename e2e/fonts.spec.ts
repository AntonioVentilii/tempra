import { expect, test } from '@playwright/test';
import { mockSupabase } from './supabase-mock';

test('fonts and stylesheets load from this site, never from a CDN', async ({ page }) => {
	await mockSupabase(page);
	const fonts: string[] = [];
	const stylesheets: string[] = [];
	page.on('request', (request) => {
		if (request.resourceType() === 'font') {
			fonts.push(request.url());
		}

		// A CDN stylesheet leaks the visitor's IP even when local fonts win over it.
		if (request.resourceType() === 'stylesheet') {
			stylesheets.push(request.url());
		}
	});

	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);

	expect(fonts.length).toBeGreaterThan(0);
	const { origin } = new URL(page.url());
	expect([...fonts, ...stylesheets].filter((url) => new URL(url).origin !== origin)).toEqual([]);
});
