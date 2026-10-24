import { submitResult } from '$lib/services/squad.service';
import type { BlockResult } from '$lib/types/result';
import { readLocal, writeLocal } from '$lib/utils/storage.utils';
import { get, writable } from 'svelte/store';

const KEY = 'outbox';

interface QueuedResult {
	code: string;
	result: BlockResult;
}

/** Results that could not reach the server yet. Flushed on load and when the device comes back online. */
export const outboxStore = writable<QueuedResult[]>(readLocal<QueuedResult[]>(KEY) ?? []);

const persist = (items: QueuedResult[]) => {
	writeLocal(KEY, items);
	outboxStore.set(items);
};

export const queueResult = (item: QueuedResult) => {
	persist([...get(outboxStore), item]);
};

let flushing = false;

/** Sends queued results in order; stops at the first failure so order is kept. Returns how many were sent. */
export const flushOutbox = async (): Promise<number> => {
	if (flushing) {
		return 0;
	}

	flushing = true;
	let sent = 0;

	try {
		let pending = get(outboxStore);

		while (pending.length > 0) {
			try {
				await submitResult(pending[0]);
			} catch {
				break;
			}

			pending = pending.slice(1);
			persist(pending);
			sent++;
		}
	} finally {
		flushing = false;
	}

	return sent;
};
