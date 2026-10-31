import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { hapticBlockEnd, hapticTap, hapticTrial } from '$lib/services/haptics.service';

const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

const stubNavigator = (value: unknown) =>
	Object.defineProperty(globalThis, 'navigator', { value, configurable: true });

const recordVibrations = () => {
	const calls: (number | number[])[] = [];
	stubNavigator({
		vibrate: (pattern: number | number[]) => {
			calls.push(pattern);

			return true;
		}
	});

	return calls;
};

afterEach(() => {
	if (original) {
		Object.defineProperty(globalThis, 'navigator', original);
	}
});

describe('hapticTrial', () => {
	it('ticks on a tapped correct answer', () => {
		const calls = recordVibrations();
		hapticTrial({ correct: true, rt_ms: 420 });
		assert.deepEqual(calls, [15]);
	});

	it('stays silent on a correct withhold, where nothing was tapped', () => {
		const calls = recordVibrations();
		hapticTrial({ correct: true, rt_ms: null });
		assert.deepEqual(calls, []);
	});

	it('feels different on an error', () => {
		const calls = recordVibrations();
		hapticTrial({ correct: false, rt_ms: null });
		assert.deepEqual(calls, [40]);
	});
});

describe('web fallback', () => {
	it('gives the block end its own pattern', () => {
		const calls = recordVibrations();
		hapticBlockEnd();
		assert.deepEqual(calls, [[40, 60, 80]]);
	});

	it('does nothing without a vibration API', () => {
		stubNavigator({});
		assert.doesNotThrow(() => hapticTap());
	});

	it('does nothing without a navigator', () => {
		stubNavigator(undefined);
		assert.doesNotThrow(() => hapticTap());
	});

	it('swallows a throwing vibration API', () => {
		stubNavigator({
			vibrate: () => {
				throw new Error('blocked');
			}
		});
		assert.doesNotThrow(() => hapticTap());
	});
});
