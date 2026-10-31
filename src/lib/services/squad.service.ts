import { DEFAULT_SQUAD_CONFIG } from '$lib/constants/config.constants';
import { supabase } from '$lib/services/supabase.service';
import type { CoachSession, Squad, SquadConfig } from '$lib/types/config';
import type { BlockResult, RemoteResult } from '$lib/types/result';
import { isNullish } from '$lib/utils/nullish.utils';

const normaliseConfig = (raw: unknown): SquadConfig => ({
	...DEFAULT_SQUAD_CONFIG,
	...(typeof raw === 'object' && raw !== null ? (raw as Partial<SquadConfig>) : {}) // eslint-disable-line no-restricted-syntax
});

export const createSquad = async ({ name }: { name: string }): Promise<CoachSession> => {
	const { data, error } = await supabase().rpc('create_squad', { p_name: name });

	if (error || isNullish(data) || data.length === 0) {
		throw new Error(error?.message ?? 'create_squad returned no row');
	}

	const row = data[0] as { code: string; coach_key: string };

	return { code: row.code, coach_key: row.coach_key, name };
};

export const getSquad = async ({ code }: { code: string }): Promise<Squad | undefined> => {
	const { data, error } = await supabase().rpc('get_squad', { p_code: code });

	if (error) {
		throw new Error(error.message);
	}

	if (isNullish(data) || data.length === 0) {
		return;
	}

	const row = data[0] as { code: string; name: string; config: unknown; updated_at: string };

	return {
		code: row.code,
		name: row.name,
		config: normaliseConfig(row.config),
		updated_at: row.updated_at
	};
};

export const updateSquadConfig = async ({
	session,
	config
}: {
	session: CoachSession;
	config: SquadConfig;
}): Promise<{ config: SquadConfig; updated_at: string }> => {
	const { data, error } = await supabase().rpc('update_squad_config', {
		p_code: session.code,
		p_coach_key: session.coach_key,
		p_config: config
	});

	if (error || isNullish(data) || data.length === 0) {
		throw new Error(error?.message ?? 'update_squad_config returned no row');
	}

	const row = data[0] as { config: unknown; updated_at: string };

	return { config: normaliseConfig(row.config), updated_at: row.updated_at };
};

export const submitResult = async ({
	code,
	result
}: {
	code: string;
	result: BlockResult;
}): Promise<void> => {
	const trials = result.games.reduce((s, g) => s + g.correct + g.wrong, 0);
	const { error } = await supabase().rpc('submit_result', {
		p_code: code,
		p_athlete: result.athlete,
		p_game: 'block',
		p_difficulty: result.difficulty,
		p_score: result.score,
		p_accuracy: Number(result.accuracy.toFixed(4)),
		p_mean_rt_ms: result.mean_rt_ms,
		p_trials: trials,
		p_duration_ms: result.duration_ms,
		p_params: {
			index: result.index,
			games: result.games.map((g) => g.game),
			per_game: result.games.map(({ game, correct, wrong, score }) => ({
				game,
				correct,
				wrong,
				score
			}))
		}
	});

	if (error) {
		throw new Error(error.message);
	}
};

export const deleteAthleteResults = async ({
	session,
	athlete
}: {
	session: CoachSession;
	athlete: string;
}): Promise<number> => {
	const { data, error } = await supabase().rpc('delete_athlete_results', {
		p_code: session.code,
		p_coach_key: session.coach_key,
		p_athlete: athlete
	});

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? 0) as number;
};

export const deleteSquad = async ({ session }: { session: CoachSession }): Promise<void> => {
	const { error } = await supabase().rpc('delete_squad', {
		p_code: session.code,
		p_coach_key: session.coach_key
	});

	if (error) {
		throw new Error(error.message);
	}
};

export const listResults = async ({
	session,
	limit = 100
}: {
	session: CoachSession;
	limit?: number;
}): Promise<RemoteResult[]> => {
	const { data, error } = await supabase().rpc('list_results', {
		p_code: session.code,
		p_coach_key: session.coach_key,
		p_limit: limit
	});

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []) as RemoteResult[];
};
