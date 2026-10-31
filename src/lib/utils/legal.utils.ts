import { LEGAL_EMAIL, LEGAL_OWNER } from '$lib/constants/legal.constants';
import type { Locale } from '$lib/constants/locale.constants';
import { t } from '$lib/utils/i18n.utils';
import { isNullish } from '$lib/utils/nullish.utils';

export const LEGAL_DRAFT = isNullish(LEGAL_OWNER) || isNullish(LEGAL_EMAIL);

/** `{owner}` and `{contact}` for the legal copy, or the placeholder while they are unset. */
export const legalValues = (locale: Locale): { owner: string; contact: string } => ({
	owner: LEGAL_OWNER ?? t({ locale, key: 'legal.owner.pending' }),
	contact: LEGAL_EMAIL ?? t({ locale, key: 'legal.contact.pending' })
});
