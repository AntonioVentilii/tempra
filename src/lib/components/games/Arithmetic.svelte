<script lang="ts">
	import TrialTimer from '$lib/components/session/TrialTimer.svelte';
	import { ladder } from '$lib/constants/config.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { GameProps } from '$lib/types/game';
	import { t } from '$lib/utils/i18n.utils';
	import { pick, randomInt, shuffle, sleep } from '$lib/utils/random.utils';
	import { createTrialGate } from '$lib/utils/trial.utils';
	import { onMount } from 'svelte';

	let { difficulty, timePressure, onTrial }: GameProps = $props();

	const range = $derived(ladder([10, 20, 50, 100, 200], difficulty));
	const windowMs = $derived(ladder([7000, 6000, 5000, 4000, 3000], difficulty));
	const ops = $derived(difficulty >= 3 ? ['+', '-', '×'] : ['+', '-']);
	// Close distractors only from level 4; below, half of them are far off.
	const closeOnly = $derived(difficulty >= 4);
	const OFFSETS = [-10, -3, -2, -1, 1, 2, 3, 10];

	let prompt = $state('');
	let choices = $state<number[]>([]);
	let trialId = $state(0);
	let gate = createTrialGate<number>();

	const answer = (value: number | null) => gate.answer(value);

	const makeProblem = (): { text: string; result: number } => {
		const op = pick(ops);
		let a = 1 + randomInt(range);
		let b = 1 + randomInt(range);

		if (op === '×') {
			const max = Math.min(12, Math.max(3, Math.floor(range / 8)));
			a = 2 + randomInt(max);
			b = 2 + randomInt(max);

			return { text: `${a} × ${b}`, result: a * b };
		}

		if (op === '-') {
			if (b > a) {
				[a, b] = [b, a];
			}

			return { text: `${a} − ${b}`, result: a - b };
		}

		return { text: `${a} + ${b}`, result: a + b };
	};

	onMount(() => {
		let active = true;

		const loop = async () => {
			while (active) {
				const { text, result } = makeProblem();
				const wrongs: number[] = [];

				while (wrongs.length < 3) {
					const w = result + pick(OFFSETS) * (closeOnly ? 1 : pick([1, 1, 2]));

					if (w !== result && w >= 0 && !wrongs.includes(w)) {
						wrongs.push(w);
					}
				}

				prompt = text;
				choices = shuffle([result, ...wrongs]);
				gate = createTrialGate<number>();
				trialId++;
				const started = performance.now();
				const said = await gate.wait();

				if (!active) {
					break;
				}

				onTrial({
					correct: said === result,
					rt_ms: said === result ? Math.round(performance.now() - started) : null
				});
				await sleep(200);
			}
		};

		void loop();

		return () => {
			active = false;
			gate.answer(null);
		};
	});
</script>

<div class="stim tnum">{prompt}</div>
<div class="answers">
	{#each choices as choice (choice)}
		<button class="btn tnum" onclick={() => answer(choice)}>{choice}</button>
	{/each}
</div>
{#if timePressure}
	{#key trialId}
		<div class="w-full max-w-[420px]">
			<TrialTimer durationMs={windowMs} onExpire={() => answer(null)} />
		</div>
	{/key}
{/if}
<p class="hint">{t({ locale: $localeStore, key: 'game.math.hint' })}</p>
