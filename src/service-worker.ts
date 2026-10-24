/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Offline shell: the app, its assets and the prerendered pages are cached at
// install, so an athlete on a track with no signal still opens Tempra and
// plays with the last config the device saw. API calls are never cached here;
// squad config and results live in localStorage via the stores.
import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `tempra-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;

	if (request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);

	if (url.origin !== sw.location.origin) {
		return;
	}

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Hashed build assets and static files: cache first, they never change under one version.
			if (ASSETS.includes(url.pathname)) {
				const cached = await cache.match(url.pathname);

				if (cached) {
					return cached;
				}
			}

			// Pages: network first so a fresh deploy wins, cache (then the shell) when offline.
			try {
				const response = await fetch(request);

				if (response.ok && request.mode === 'navigate') {
					void cache.put(request, response.clone());
				}

				return response;
			} catch {
				const cached = (await cache.match(request)) ?? (await cache.match('/404.html'));

				if (cached) {
					return cached;
				}

				throw new Error('offline and not cached');
			}
		})()
	);
});
