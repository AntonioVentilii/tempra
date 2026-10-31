import { en } from '$lib/constants/messages/en';
import { it as itCatalog } from '$lib/constants/messages/it';
import { ptBR } from '$lib/constants/messages/pt-BR';
import { matchLocale, t } from '$lib/utils/i18n.utils';
import { createTrialGate } from '$lib/utils/trial.utils';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('t', () => {
	it('translates and fills placeholders', () => {
		assert.equal(t({ locale: 'it', key: 'session.points', values: { n: 30 } }), '30 punti');
		assert.equal(t({ locale: 'en', key: 'session.points', values: { n: 30 } }), '30 points');
		assert.equal(t({ locale: 'pt-BR', key: 'session.points', values: { n: 30 } }), '30 pontos');
	});

	it('leaves an unknown placeholder untouched', () => {
		assert.equal(t({ locale: 'en', key: 'session.points' }), '{n} points');
	});

	it('keeps every catalog aligned', () => {
		for (const catalog of [en, ptBR]) {
			assert.deepEqual(Object.keys(catalog).sort(), Object.keys(itCatalog).sort());
		}
	});

	it('has no empty strings', () => {
		for (const catalog of [en, ptBR]) {
			for (const [key, value] of Object.entries(catalog)) {
				assert.ok(value.length > 0, key);
			}
		}
	});

	it('keeps the Stroop button labels distinct in every catalog', () => {
		for (const catalog of [itCatalog, en, ptBR]) {
			const labels = [
				catalog['color.red.short'],
				catalog['color.green.short'],
				catalog['color.blue.short'],
				catalog['color.yellow.short']
			];
			assert.equal(new Set(labels).size, labels.length, labels.join(','));
		}
	});
});

describe('matchLocale', () => {
	it('maps any Portuguese to the Brazilian catalog', () => {
		assert.equal(matchLocale(['pt-BR']), 'pt-BR');
		assert.equal(matchLocale(['pt-PT']), 'pt-BR');
		assert.equal(matchLocale(['pt']), 'pt-BR');
	});

	it('follows the order of preference and skips unsupported languages', () => {
		assert.equal(matchLocale(['de-DE', 'en-US', 'it-IT']), 'en');
		assert.equal(matchLocale(['IT-it']), 'it');
	});

	it('returns undefined when nothing matches', () => {
		assert.equal(matchLocale(['fr-FR', 'de']), undefined);
		assert.equal(matchLocale([]), undefined);
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
