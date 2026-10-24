import type { Difficulty, GameKey } from '$lib/types/config';

export interface TrialOutcome {
	correct: boolean;
	rt_ms: number | null;
}

export interface GameStats {
	game: GameKey;
	correct: number;
	wrong: number;
	rts_ms: number[];
	score: number;
}

export interface BlockResult {
	at: string;
	athlete: string;
	difficulty: Difficulty;
	score: number;
	accuracy: number;
	mean_rt_ms: number | null;
	index: number;
	duration_ms: number;
	games: GameStats[];
}

/** Row shape of `public.results` as returned by `list_results`. */
export interface RemoteResult {
	id: string;
	code: string;
	athlete: string;
	game: string;
	difficulty: number;
	score: number;
	accuracy: number;
	mean_rt_ms: number | null;
	trials: number;
	duration_ms: number;
	params: { index?: number; games?: GameKey[] };
	created_at: string;
}
