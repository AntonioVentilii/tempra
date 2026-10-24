import { defineConfig, devices } from '@playwright/test';

const isCI = process.env.CI === 'true';

const BASE_URL = 'http://localhost:5173';

export default defineConfig({
	testDir: 'e2e',
	testMatch: ['**/*.spec.ts'],
	timeout: 60_000,
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',
	use: {
		baseURL: BASE_URL,
		// The UI follows the browser language; the specs are written against the Italian copy.
		locale: 'it-IT',
		testIdAttribute: 'data-tid',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [
		{ name: 'chromium', use: devices['Desktop Chrome'] },
		{ name: 'phone', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } }
	],
	webServer: {
		command: 'npm run dev -- --port 5173 --strictPort',
		url: BASE_URL,
		reuseExistingServer: !isCI,
		timeout: 120_000
	}
});
