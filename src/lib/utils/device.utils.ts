import { readLocal, writeLocal } from '$lib/utils/storage.utils';
import { isNullish } from '$lib/utils/nullish.utils';

const KEY = 'device.id';

/** Stable per-browser id: the presence key, so two tabs of one phone count once. */
export const deviceId = (): string => {
	const saved = readLocal<string>(KEY);

	if (!isNullish(saved)) {
		return saved;
	}

	const fresh =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2) + Date.now().toString(36);
	writeLocal(KEY, fresh);

	return fresh;
};
