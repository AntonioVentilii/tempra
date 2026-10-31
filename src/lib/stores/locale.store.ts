import { browser } from '$app/environment';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '$lib/constants/locale.constants';
import { matchLocale } from '$lib/utils/i18n.utils';
import { nonNullish } from '$lib/utils/nullish.utils';
import { readLocal, writeLocal } from '$lib/utils/storage.utils';
import { writable } from 'svelte/store';

const KEY = 'locale';

// A choice saved on the device wins; otherwise the browser languages in order of preference.
const detect = (): Locale => {
	const saved = readLocal<Locale>(KEY);

	if (nonNullish(saved) && SUPPORTED_LOCALES.includes(saved)) {
		return saved;
	}

	if (browser) {
		return matchLocale(navigator.languages ?? [navigator.language]) ?? DEFAULT_LOCALE;
	}

	return DEFAULT_LOCALE;
};

export const localeStore = writable<Locale>(detect());

export const setLocale = (locale: Locale) => {
	writeLocal(KEY, locale);
	localeStore.set(locale);
};
