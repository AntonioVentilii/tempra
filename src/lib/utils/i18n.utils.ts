import { DEFAULT_LOCALE, type Locale } from '$lib/constants/locale.constants';
import { en } from '$lib/constants/messages/en';
import { it, type I18nKey } from '$lib/constants/messages/it';
import { ptBR } from '$lib/constants/messages/pt-BR';
import { nonNullish } from '$lib/utils/nullish.utils';

const CATALOGS: Record<Locale, Record<I18nKey, string>> = { it, en, 'pt-BR': ptBR };

// Primary language subtag to the catalog that serves it: any Portuguese gets the Brazilian copy.
const BY_LANGUAGE: Record<string, Locale> = { it: 'it', en: 'en', pt: 'pt-BR' };

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

/**
 * First supported locale among the browser languages, in order of preference
 * (`navigator.languages`); `undefined` when none matches.
 */
export const matchLocale = (languages: readonly string[]): Locale | undefined => {
	for (const tag of languages) {
		const match = BY_LANGUAGE[tag.toLowerCase().split('-')[0]];

		if (nonNullish(match)) {
			return match;
		}
	}

	return undefined;
};
