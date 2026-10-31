import { LEGAL_EMAIL, LEGAL_OWNER } from '$lib/constants/legal.constants';
import type { Locale } from '$lib/constants/locale.constants';
import { t } from '$lib/utils/i18n.utils';
import { isNullish } from '$lib/utils/nullish.utils';

interface LegalContact {
	owner?: string;
	email?: string;
}

/** A draft until both are set: one alone still leaves a placeholder on the page. */
export const isLegalDraft = ({
	owner = LEGAL_OWNER,
	email = LEGAL_EMAIL
}: LegalContact = {}): boolean => isNullish(owner) || isNullish(email);

/** `{owner}` and `{contact}` for the legal copy, or the placeholder while they are unset. */
export const legalValues = ({
	locale,
	owner = LEGAL_OWNER,
	email = LEGAL_EMAIL
}: LegalContact & { locale: Locale }): { owner: string; contact: string } => ({
	owner: owner ?? t({ locale, key: 'legal.owner.pending' }),
	contact: email ?? t({ locale, key: 'legal.contact.pending' })
});
