export const SUPPORTED_LOCALES = ['it', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'it';

export const LOCALE_TAG: Record<Locale, string> = { it: 'it-IT', en: 'en-GB' };
