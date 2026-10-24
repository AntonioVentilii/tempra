import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	accuracyOf,
	adaptDifficulty,
	gameScore,
	meanRtOf,
	tempraIndex
} from '$lib/utils/scoring.utils';

describe('gameScore', () => {
	it('awards 10 per correct answer', () => {
		assert.equal(gameScore({ correct: 4, wrong: 0, penalty: true }), 40);
	});

	it('subtracts 5 per error only when the penalty is on', () => {
		assert.equal(gameScore({ correct: 4, wrong: 2, penalty: true }), 30);
		assert.equal(gameScore({ correct: 4, wrong: 2, penalty: false }), 40);
	});

	it('never goes below zero', () => {
		assert.equal(gameScore({ correct: 1, wrong: 5, penalty: true }), 0);
	});
});

describe('accuracyOf / meanRtOf', () => {
	const games = [
		{ game: 'stroop' as const, correct: 3, wrong: 1, rts_ms: [500, 700], score: 25 },
		{ game: 'math' as const, correct: 1, wrong: 1, rts_ms: [900], score: 5 }
	];

	it('pools trials across games', () => {
		assert.equal(accuracyOf(games), 4 / 6);
		assert.equal(meanRtOf(games), 700);
	});

	it('handles an empty block', () => {
		assert.equal(accuracyOf([]), 0);
		assert.equal(meanRtOf([]), null);
	});
});

describe('tempraIndex', () => {
	it('rewards a perfect fast block more at higher difficulty', () => {
		const low = tempraIndex({ accuracy: 1, meanRt: 500, difficulty: 1 });
		const high = tempraIndex({ accuracy: 1, meanRt: 500, difficulty: 5 });
		assert.ok(high > low);
	});

	it('falls back to a neutral speed when no reaction time exists', () => {
		assert.equal(tempraIndex({ accuracy: 0.5, meanRt: null, difficulty: 3 }), 52);
	});
});

describe('adaptDifficulty', () => {
	it('steps up above 90%, down below 60%, stays otherwise, within 1..5', () => {
		assert.equal(adaptDifficulty({ current: 3, accuracy: 0.95 }), 4);
		assert.equal(adaptDifficulty({ current: 3, accuracy: 0.5 }), 2);
		assert.equal(adaptDifficulty({ current: 3, accuracy: 0.75 }), 3);
		assert.equal(adaptDifficulty({ current: 5, accuracy: 1 }), 5);
		assert.equal(adaptDifficulty({ current: 1, accuracy: 0 }), 1);
	});
});
