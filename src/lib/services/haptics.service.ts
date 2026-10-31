import type { TrialOutcome } from '$lib/types/result';
import { nonNullish } from '$lib/utils/nullish.utils';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface Feel {
	native: () => Promise<void>;
	/** `navigator.vibrate` pattern in ms. */
	web: number | number[];
}

/**
 * Fire and forget: reaction times are measured around these calls, so nothing
 * here is awaited and a failure stays silent. Browsers without a vibration API
 * (iOS Safari, Firefox) simply feel nothing.
 */
const play = ({ native, web }: Feel) => {
	try {
		if (Capacitor.isNativePlatform()) {
			void native().catch(() => undefined);

			return;
		}

		if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
			navigator.vibrate(web);
		}
	} catch {
		// Feedback is never worth interrupting a trial.
	}
};

const lightTick = (): Feel => ({
	native: () => Haptics.impact({ style: ImpactStyle.Light }),
	web: 15
});

export const hapticTap = () => play(lightTick());

export const hapticCorrect = () => play(lightTick());

export const hapticWrong = () =>
	play({ native: () => Haptics.impact({ style: ImpactStyle.Heavy }), web: 40 });

export const hapticBlockEnd = () =>
	play({
		native: () => Haptics.notification({ type: NotificationType.Success }),
		web: [40, 60, 80]
	});

/**
 * A correct trial without a reaction time is a correct withhold (Go / No-Go,
 * N-back): the athlete touched nothing, so there is nothing to confirm.
 */
export const hapticTrial = ({ correct, rt_ms }: TrialOutcome) => {
	if (!correct) {
		hapticWrong();

		return;
	}

	if (nonNullish(rt_ms)) {
		hapticCorrect();
	}
};
