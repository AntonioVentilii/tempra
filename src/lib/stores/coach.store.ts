import type { CoachSession } from '$lib/types/config';
import { readLocal, removeLocal, writeLocal } from '$lib/utils/storage.utils';
import { writable } from 'svelte/store';

const KEY = 'coach';

/** Code + coach key of the squad this device manages. The key is the only credential. */
export const coachStore = writable<CoachSession | undefined>(readLocal<CoachSession>(KEY));

export const setCoachSession = (session: CoachSession) => {
	writeLocal(KEY, session);
	coachStore.set(session);
};

export const clearCoachSession = () => {
	removeLocal(KEY);
	coachStore.set(undefined);
};
