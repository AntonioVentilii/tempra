// Lets `node --test` import source files through the `$lib/...` alias that
// SvelteKit resolves at build time, so specs and app code share one import style.
import { register } from 'node:module';

register('./lib-resolver.mjs', import.meta.url);
