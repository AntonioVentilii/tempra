<script lang="ts">
	import TrialTimer from '$lib/components/session/TrialTimer.svelte';
	import { ladder, NBACK_N } from '$lib/constants/config.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { GameProps } from '$lib/types/game';
	import { t } from '$lib/utils/i18n.utils';
	import { isNullish } from '$lib/utils/nullish.utils';
	import { pick, sleep } from '$lib/utils/random.utils';
	import { createTrialGate } from '$lib/utils/trial.utils';
	import { onMount } from 'svelte';

	let { difficulty, timePressure, onTrial }: GameProps = $props();

	const n = $derived(ladder(NBACK_N, difficulty));
	const showMs = $derived(ladder([2000, 1700, 1500, 1200, 1000], difficulty));
	const LETTERS = 'BCDFGHKLMNPRSTVZ'.split('');
	const MATCH_P = 0.33;

	let letter = $state('');
	let trialId = $state(0);
	let gate = createTrialGate<boolean>();

	const answer = (saidMatch: boolean | null) => gate.answer(saidMatch);

	onMount(() => {
		let active = true;
		const seq: string[] = [];

		const loop = async () => {
			while (active) {
				const canMatch = seq.length >= n;
				let next: string;

				if (canMatch && Math.random() < MATCH_P) {
					next = seq[seq.length - n];
				} else {
					do {
						next = pick(LETTERS);
					} while (canMatch && next === seq[seq.length - n]);
				}

				const isMatch = canMatch && next === seq[seq.length - n];
				seq.push(next);
				letter = next;
				gate = createTrialGate<boolean>();
				trialId++;
				const started = performance.now();
				// The stimulus always advances after showMs; the bar only shows under time pressure.
				const expiry = setTimeout(() => gate.answer(null), showMs);
				const said = await gate.wait();
				clearTimeout(expiry);

				if (!active) {
					break;
				}

				// The first n letters have nothing to compare with: a timeout there is not an error.
				if (isNullish(said)) {
					if (seq.length > n) {
						onTrial({ correct: !isMatch, rt_ms: null });
					}
				} else {
					onTrial({
						correct: said === isMatch,
						rt_ms: said === isMatch ? Math.round(performance.now() - started) : null
					});
				}

				letter = '';
				await sleep(250);
			}
		};

		void loop();

		return () => {
			active = false;
			gate.answer(null);
		};
	});
</script>

<div class="stim min-h-[1em]">{letter}</div>
<div class="answers">
	<button class="btn btn-primary btn-pad" onclick={() => answer(true)}>
		{t({ locale: $localeStore, key: 'game.match' })}
	</button>
	<button class="btn btn-pad" onclick={() => answer(false)}>
		{t({ locale: $localeStore, key: 'game.different' })}
	</button>
</div>
{#if timePressure}
	{#key trialId}
		<div class="w-full max-w-[420px]">
			<TrialTimer durationMs={showMs} onExpire={() => {}} />
		</div>
	{/key}
{/if}
<p class="hint">{t({ locale: $localeStore, key: 'game.nback.hint', values: { n } })}</p>
