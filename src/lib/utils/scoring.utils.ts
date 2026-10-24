import type { Difficulty } from '$lib/types/config';
import type { GameStats } from '$lib/types/result';
import { isNullish } from '$lib/utils/nullish.utils';

export const POINTS_PER_CORRECT = 10;
export const PENALTY_PER_ERROR = 5;

/** Reaction-time window used to map speed onto a 0..1 scale. */
const RT_SLOW_MS = 2200;
const RT_FAST_MS = 400;

export const gameScore = ({
	correct,
	wrong,
	penalty
}: {
	correct: number;
	wrong: number;
	penalty: boolean;
}): number => Math.max(0, correct * POINTS_PER_CORRECT - (penalty ? wrong * PENALTY_PER_ERROR : 0));

export const accuracyOf = (games: GameStats[]): number => {
	const correct = games.reduce((s, g) => s + g.correct, 0);
	const wrong = games.reduce((s, g) => s + g.wrong, 0);

	return correct + wrong > 0 ? correct / (correct + wrong) : 0;
};

export const meanRtOf = (games: GameStats[]): number | null => {
	const rts = games.flatMap((g) => g.rts_ms);

	return rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
};

/**
 * Tempra index: 0..100-ish composite of accuracy (60%) and speed (40%),
 * scaled by difficulty so a clean block at level 5 outranks one at level 1.
 */
export const tempraIndex = ({
	accuracy,
	meanRt,
	difficulty
}: {
	accuracy: number;
	meanRt: number | null;
	difficulty: Difficulty;
}): number => {
	const speed = isNullish(meanRt)
		? 0.5
		: Math.max(0, Math.min(1, (RT_SLOW_MS - meanRt) / (RT_SLOW_MS - RT_FAST_MS)));

	return Math.round((accuracy * 0.6 + speed * 0.4) * 100 * (0.8 + difficulty * 0.08));
};

export const ADAPT_UP_ACCURACY = 0.9;
export const ADAPT_DOWN_ACCURACY = 0.6;

export const adaptDifficulty = ({
	current,
	accuracy
}: {
	current: Difficulty;
	accuracy: number;
}): Difficulty => {
	if (accuracy >= ADAPT_UP_ACCURACY) {
		return Math.min(5, current + 1) as Difficulty;
	}

	if (accuracy < ADAPT_DOWN_ACCURACY) {
		return Math.max(1, current - 1) as Difficulty;
	}

	return current;
};
