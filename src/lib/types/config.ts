export const GAME_KEYS = ['stroop', 'gonogo', 'nback', 'flanker', 'math', 'trail'] as const;

export type GameKey = (typeof GAME_KEYS)[number];

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/**
 * The parameters a coach controls remotely. Stored as JSON in
 * `squad_config.config` and pushed to athletes over realtime.
 */
export interface SquadConfig {
	difficulty: Difficulty;
	games: GameKey[];
	block_duration_s: number;
	game_duration_s: number;
	time_pressure: boolean;
	distractors: boolean;
	penalty_on_error: boolean;
	auto_adapt: boolean;
	message: string;
}

export interface Squad {
	code: string;
	name: string;
	config: SquadConfig;
	updated_at: string;
}

export interface CoachSession {
	code: string;
	name: string;
	coach_key: string;
}
