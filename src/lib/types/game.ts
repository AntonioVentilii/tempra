import type { Difficulty } from '$lib/types/config';
import type { TrialOutcome } from '$lib/types/result';

/**
 * Props every game component receives from the block runner. A game runs its
 * own trial loop while mounted and reports each trial through `onTrial`; the
 * runner unmounts it when the slot ends, so cleanup happens in `$effect`.
 */
export interface GameProps {
	difficulty: Difficulty;
	timePressure: boolean;
	onTrial: (outcome: TrialOutcome) => void;
}
