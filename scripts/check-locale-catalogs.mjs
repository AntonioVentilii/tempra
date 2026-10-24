// Fails when a locale catalog under src/lib/constants/messages/ is missing a
// key the Italian catalog has, or carries an extra one. TypeScript already
// enforces this for `en` via `Record<I18nKey, string>`; this guard keeps the
// check runnable from `npm run lint` without a TS build.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../src/lib/constants/messages/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));

const keysOf = (file) => {
	const src = readFileSync(join(dir.pathname, file), 'utf8');
	const keys = new Set();

	for (const m of src.matchAll(/^\s*'([a-z0-9_.-]+)':/gim)) {
		keys.add(m[1]);
	}

	return keys;
};

const base = keysOf('it.ts');
let failed = false;

for (const file of files) {
	if (file === 'it.ts') {
		continue;
	}

	const keys = keysOf(file);
	const missing = [...base].filter((k) => !keys.has(k));
	const extra = [...keys].filter((k) => !base.has(k));

	if (missing.length > 0 || extra.length > 0) {
		failed = true;
		console.error(`${file}: missing ${JSON.stringify(missing)} extra ${JSON.stringify(extra)}`);
	}
}

if (failed) {
	process.exit(1);
}

console.log(`i18n catalogs in sync (${base.size} keys, ${files.length} locales).`);
