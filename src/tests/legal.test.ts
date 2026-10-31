import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLegalDraft, legalValues } from '$lib/utils/legal.utils';

const owner = 'Tempra Srl';
const email = 'ciao@example.com';

describe('legal values', () => {
	it('stays a draft until both the owner and the email are set', () => {
		assert.equal(isLegalDraft(), true);
		assert.equal(isLegalDraft({ owner }), true);
		assert.equal(isLegalDraft({ email }), true);
		assert.equal(isLegalDraft({ owner, email }), false);
	});

	it('shows the placeholders in the reader language while unset', () => {
		assert.deepEqual(legalValues({ locale: 'it' }), {
			owner: '[DA COMPLETARE: nome]',
			contact: '[DA COMPLETARE: email]'
		});
		assert.equal(legalValues({ locale: 'pt-BR' }).contact, '[A COMPLETAR: e-mail]');
	});

	it('uses a value as soon as it is set, keeping the placeholder for the other', () => {
		assert.deepEqual(legalValues({ locale: 'en', owner }), {
			owner,
			contact: '[TO COMPLETE: email]'
		});
		assert.deepEqual(legalValues({ locale: 'en', owner, email }), { owner, contact: email });
	});
});
