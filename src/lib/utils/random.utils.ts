export const randomInt = (n: number): number => Math.floor(Math.random() * n);

export const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)];

export const shuffle = <T>(items: readonly T[]): T[] => {
	const out = items.slice();

	for (let i = out.length - 1; i > 0; i--) {
		const j = randomInt(i + 1);
		[out[i], out[j]] = [out[j], out[i]];
	}

	return out;
};

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));
