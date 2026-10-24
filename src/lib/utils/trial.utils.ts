/**
 * A one-shot gate for a trial: the game awaits `wait()`, and whichever comes
 * first (a tap or the time-pressure timer) resolves it. Later calls are ignored.
 */
export const createTrialGate = <T>() => {
	let resolver: ((value: T | null) => void) | undefined;
	let settled = false;

	return {
		wait: (): Promise<T | null> =>
			new Promise<T | null>((resolve) => {
				resolver = resolve;
			}),
		answer: (value: T | null) => {
			if (settled) {
				return;
			}

			settled = true;
			resolver?.(value);
		}
	};
};
