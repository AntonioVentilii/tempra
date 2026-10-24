import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// GitHub Pages serves 404.html for unknown paths, which is what makes
		// deep links (/athlete?code=…) work on a static host.
		adapter: adapter({ fallback: '404.html', precompress: false })
	}
};

export default config;
