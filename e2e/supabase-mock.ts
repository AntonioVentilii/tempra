import type { Page, Route } from '@playwright/test';

/**
 * Intercepts every call to the Supabase project so specs run without network
 * and never write to the live database. RPC bodies mirror what PostgREST
 * returns for the SECURITY DEFINER functions in supabase/migrations/.
 */
export const SQUAD_CODE = 'TESTSQ';
export const COACH_KEY = 'test-coach-key';

export const defaultConfig = {
	difficulty: 3,
	games: ['stroop', 'gonogo', 'nback', 'flanker', 'math', 'trail'],
	block_duration_s: 60,
	game_duration_s: 20,
	time_pressure: true,
	distractors: false,
	penalty_on_error: true,
	auto_adapt: false,
	message: ''
};

export interface MockState {
	config: Record<string, unknown>;
	updated_at: string;
	results: Record<string, unknown>[];
	calls: { fn: string; body: Record<string, unknown> }[];
}

export const mockSupabase = async (page: Page): Promise<MockState> => {
	const state: MockState = {
		config: { ...defaultConfig },
		updated_at: '2026-10-24T09:00:00.000Z',
		results: [],
		calls: []
	};

	const json = (route: Route, body: unknown, status = 200) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

	await page.route('**/*.supabase.co/**', async (route) => {
		const url = new URL(route.request().url());
		const fn = url.pathname.split('/rest/v1/rpc/')[1];

		if (!fn) {
			await route.abort();

			return;
		}

		const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
		state.calls.push({ fn, body });

		switch (fn) {
			case 'get_squad':
				if (String(body.p_code).toUpperCase() !== SQUAD_CODE) {
					await json(route, []);

					return;
				}

				await json(route, [
					{
						code: SQUAD_CODE,
						name: 'Test squad',
						config: state.config,
						updated_at: state.updated_at
					}
				]);

				return;
			case 'create_squad':
				await json(route, [{ code: SQUAD_CODE, coach_key: COACH_KEY, config: state.config }]);

				return;
			case 'update_squad_config':
				if (body.p_coach_key !== COACH_KEY) {
					await json(route, { message: 'unauthorized' }, 400);

					return;
				}

				state.config = body.p_config as Record<string, unknown>;
				state.updated_at = new Date().toISOString();
				await json(route, [{ config: state.config, updated_at: state.updated_at }]);

				return;
			case 'submit_result':
				state.results.unshift({
					id: `r${state.results.length + 1}`,
					code: SQUAD_CODE,
					athlete: body.p_athlete,
					game: body.p_game,
					difficulty: body.p_difficulty,
					score: body.p_score,
					accuracy: body.p_accuracy,
					mean_rt_ms: body.p_mean_rt_ms,
					trials: body.p_trials,
					duration_ms: body.p_duration_ms,
					params: body.p_params,
					created_at: new Date().toISOString()
				});
				await json(route, 'd3b07384-d9a0-4c2e-9f3a-000000000001');

				return;
			case 'list_results':
				if (body.p_coach_key !== COACH_KEY) {
					await json(route, { message: 'unauthorized' }, 400);

					return;
				}

				await json(route, state.results);

				return;
			default:
				await json(route, { message: `unmocked rpc ${fn}` }, 404);
		}
	});

	return state;
};
