export const SUPPORTED_LOCALES = ['it', 'en', 'pt-BR'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'it';

export const LOCALE_TAG: Record<Locale, string> = { it: 'it-IT', en: 'en-GB', 'pt-BR': 'pt-BR' };

/** Each language named in itself, so the picker reads the same in every locale. */
export const LOCALE_NAME: Record<Locale, string> = {
	it: 'Italiano',
	en: 'English',
	'pt-BR': 'Português (Brasil)'
};
