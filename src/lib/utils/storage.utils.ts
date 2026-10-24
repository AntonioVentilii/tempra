import { browser } from '$app/environment';
import { isNullish } from '$lib/utils/nullish.utils';

const PREFIX = 'tempra.';

/** localStorage can throw (private mode, blocked storage): never let it break the page. */
export const readLocal = <T>(key: string): T | undefined => {
	if (!browser) {
		return;
	}

	try {
		const raw = localStorage.getItem(PREFIX + key);

		return isNullish(raw) ? undefined : (JSON.parse(raw) as T);
	} catch {
		return;
	}
};

export const writeLocal = (key: string, value: unknown) => {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	} catch {
		// Storage unavailable: the in-memory state still works for this visit.
	}
};

export const removeLocal = (key: string) => {
	if (!browser) {
		return;
	}

	try {
		localStorage.removeItem(PREFIX + key);
	} catch {
		// Nothing to clean when storage is unavailable.
	}
};
