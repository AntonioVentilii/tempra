import { DEFAULT_LOCALE, type Locale } from '$lib/constants/locale.constants';
import { en } from '$lib/constants/messages/en';
import { it, type I18nKey } from '$lib/constants/messages/it';
import { nonNullish } from '$lib/utils/nullish.utils';

const CATALOGS: Record<Locale, Record<I18nKey, string>> = { it, en };

export type { I18nKey };

/**
 * Translate a key; `{name}` placeholders are replaced from `values`.
 * Missing keys fall back to the default locale, then to the key itself,
 * so a catalog gap never blanks the UI.
 */
export const t = ({
	locale,
	key,
	values
}: {
	locale: Locale;
	key: I18nKey;
	values?: Record<string, string | number>;
}): string => {
	const raw = CATALOGS[locale][key] ?? CATALOGS[DEFAULT_LOCALE][key] ?? key;

	if (!nonNullish(values)) {
		return raw;
	}

	return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
		nonNullish(values[name]) ? String(values[name]) : match
	);
};
