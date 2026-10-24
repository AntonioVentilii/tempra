import type { Squad } from '$lib/types/config';
import { readLocal, removeLocal, writeLocal } from '$lib/utils/storage.utils';
import { writable } from 'svelte/store';

const SQUAD_KEY = 'squad';
const NAME_KEY = 'athlete.name';

/** The squad this device joined as an athlete, cached so a reload keeps working offline. */
export const squadStore = writable<Squad | undefined>(readLocal<Squad>(SQUAD_KEY));

export const setSquad = (squad: Squad) => {
	writeLocal(SQUAD_KEY, squad);
	squadStore.set(squad);
};

export const leaveSquad = () => {
	removeLocal(SQUAD_KEY);
	squadStore.set(undefined);
};

export const athleteNameStore = writable<string>(readLocal<string>(NAME_KEY) ?? '');

export const setAthleteName = (name: string) => {
	writeLocal(NAME_KEY, name);
	athleteNameStore.set(name);
};
