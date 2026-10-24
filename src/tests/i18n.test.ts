import { en } from '$lib/constants/messages/en';
import { it as itCatalog } from '$lib/constants/messages/it';
import { t } from '$lib/utils/i18n.utils';
import { createTrialGate } from '$lib/utils/trial.utils';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('t', () => {
	it('translates and fills placeholders', () => {
		assert.equal(t({ locale: 'it', key: 'session.points', values: { n: 30 } }), '30 punti');
		assert.equal(t({ locale: 'en', key: 'session.points', values: { n: 30 } }), '30 points');
	});

	it('leaves an unknown placeholder untouched', () => {
		assert.equal(t({ locale: 'en', key: 'session.points' }), '{n} points');
	});

	it('keeps both catalogs aligned', () => {
		assert.deepEqual(Object.keys(en).sort(), Object.keys(itCatalog).sort());
	});

	it('has no empty strings', () => {
		for (const [key, value] of Object.entries(en)) {
			assert.ok(value.length > 0, key);
		}
	});
});

describe('createTrialGate', () => {
	it('resolves once and ignores later answers', async () => {
		const gate = createTrialGate<string>();
		const pending = gate.wait();
		gate.answer('first');
		gate.answer('second');
		assert.equal(await pending, 'first');
	});

	it('resolves with null on expiry', async () => {
		const gate = createTrialGate<string>();
		const pending = gate.wait();
		gate.answer(null);
		assert.equal(await pending, null);
	});
});
