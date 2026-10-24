import { browser } from '$app/environment';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '$lib/constants/locale.constants';
import { readLocal, writeLocal } from '$lib/utils/storage.utils';
import { writable } from 'svelte/store';

const KEY = 'locale';

const detect = (): Locale => {
	const saved = readLocal<Locale>(KEY);

	if (saved && SUPPORTED_LOCALES.includes(saved)) {
		return saved;
	}

	if (browser) {
		const lang = navigator.language.slice(0, 2) as Locale;

		if (SUPPORTED_LOCALES.includes(lang)) {
			return lang;
		}
	}

	return DEFAULT_LOCALE;
};

export const localeStore = writable<Locale>(detect());

export const setLocale = (locale: Locale) => {
	writeLocal(KEY, locale);
	localeStore.set(locale);
};
