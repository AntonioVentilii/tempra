import type { Difficulty } from '$lib/types/config';
import type { BlockResult } from '$lib/types/result';
import { readLocal, writeLocal } from '$lib/utils/storage.utils';
import { writable } from 'svelte/store';

const KEY = 'results';
const ADAPT_KEY = 'adapt';
const MAX_LOCAL_RESULTS = 200;

/** Local history: the athlete's own blocks, kept on the device even when offline. */
export const resultsStore = writable<BlockResult[]>(readLocal<BlockResult[]>(KEY) ?? []);

export const addResult = (result: BlockResult) => {
	resultsStore.update((list) => {
		const next = [result, ...list].slice(0, MAX_LOCAL_RESULTS);
		writeLocal(KEY, next);

		return next;
	});
};

type AdaptMap = Record<string, Difficulty>;

export const readAdaptedDifficulty = ({ athlete }: { athlete: string }): Difficulty | undefined =>
	readLocal<AdaptMap>(ADAPT_KEY)?.[athlete];

export const writeAdaptedDifficulty = ({
	athlete,
	difficulty
}: {
	athlete: string;
	difficulty: Difficulty;
}) => {
	writeLocal(ADAPT_KEY, { ...(readLocal<AdaptMap>(ADAPT_KEY) ?? {}), [athlete]: difficulty });
};
