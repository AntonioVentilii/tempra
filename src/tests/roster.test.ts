import type { SquadPresence } from '$lib/types/presence';
import type { RemoteResult } from '$lib/types/result';
import { buildRoster, trendOf } from '$lib/utils/roster.utils';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const row = (over: Partial<RemoteResult>): RemoteResult => ({
	id: Math.random().toString(36).slice(2),
	code: 'ABCDEF',
	athlete: 'Giulia',
	game: 'block',
	difficulty: 3,
	score: 100,
	accuracy: 0.8,
	mean_rt_ms: 700,
	trials: 20,
	duration_ms: 90000,
	params: { index: 70 },
	created_at: '2026-10-24T10:00:00Z',
	...over
});

describe('trendOf', () => {
	it('needs six points before calling a trend', () => {
		assert.equal(trendOf([50, 60, 70, 80, 90]), 'flat');
	});

	it('compares the last three with the three before', () => {
		assert.equal(trendOf([50, 50, 50, 60, 60, 60]), 'up');
		assert.equal(trendOf([60, 60, 60, 50, 50, 50]), 'down');
		assert.equal(trendOf([60, 60, 60, 61, 60, 62]), 'flat');
	});
});

describe('buildRoster', () => {
	const results: RemoteResult[] = [
		row({
			athlete: 'Giulia',
			created_at: '2026-10-24T10:30:00Z',
			params: { index: 80 },
			accuracy: 0.9
		}),
		row({
			athlete: 'Marco',
			created_at: '2026-10-24T10:20:00Z',
			params: { index: 55 },
			accuracy: 0.6
		}),
		row({
			athlete: 'Giulia',
			created_at: '2026-10-24T10:00:00Z',
			params: { index: 60 },
			accuracy: 0.7
		})
	];

	it('groups newest-first results per athlete and keeps indices chronological', () => {
		const roster = buildRoster({ results, presences: [] });
		const giulia = roster.find((a) => a.name === 'Giulia');
		assert.ok(giulia);
		assert.equal(giulia.blocks, 2);
		assert.deepEqual(giulia.indices, [60, 80]);
		assert.equal(giulia.lastIndex, 80);
		assert.equal(giulia.meanIndex, 70);
		assert.equal(giulia.lastAt, '2026-10-24T10:30:00Z');
		assert.ok(Math.abs(giulia.meanAccuracy - 0.8) < 1e-9);
	});

	it('lists a present athlete with no blocks yet and puts live athletes first', () => {
		const presences: SquadPresence[] = [
			{
				role: 'athlete',
				name: 'Sara',
				status: 'block',
				game: 'stroop',
				since: '2026-10-24T11:00:00Z'
			},
			{ role: 'coach', name: 'Coach', status: 'idle', since: '2026-10-24T11:00:00Z' }
		];
		const roster = buildRoster({ results, presences });
		assert.deepEqual(
			roster.map((a) => a.name),
			['Sara', 'Giulia', 'Marco']
		);
		assert.equal(roster[0].blocks, 0);
		assert.equal(roster[0].presence?.game, 'stroop');
		assert.ok(!roster.some((a) => a.name === 'Coach'));
	});
});
