<script lang="ts">
	import TrialTimer from '$lib/components/session/TrialTimer.svelte';
	import { ladder } from '$lib/constants/config.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { GameProps } from '$lib/types/game';
	import { t } from '$lib/utils/i18n.utils';
	import { sleep } from '$lib/utils/random.utils';
	import { createTrialGate } from '$lib/utils/trial.utils';
	import { onMount } from 'svelte';

	let { difficulty, timePressure, onTrial }: GameProps = $props();

	type Dir = 'L' | 'R';

	const windowMs = $derived(ladder([2000, 1600, 1300, 1000, 800], difficulty));
	const incongruentP = $derived(ladder([0.5, 0.6, 0.7, 0.8, 0.8], difficulty));
	const count = $derived(ladder([3, 5, 5, 7, 7], difficulty));

	let row = $state('');
	let target = $state<Dir>('L');
	let trialId = $state(0);
	let gate = createTrialGate<Dir>();

	const arrow = (d: Dir) => (d === 'L' ? '←' : '→');
	const answer = (d: Dir | null) => gate.answer(d);

	onMount(() => {
		let active = true;

		const loop = async () => {
			while (active) {
				const dir: Dir = Math.random() < 0.5 ? 'L' : 'R';
				const flank: Dir = Math.random() < incongruentP ? (dir === 'L' ? 'R' : 'L') : dir;
				const mid = Math.floor(count / 2);
				target = dir;
				row = Array.from({ length: count }, (_, i) => arrow(i === mid ? dir : flank)).join(' ');
				gate = createTrialGate<Dir>();
				trialId++;
				const started = performance.now();
				const said = await gate.wait();

				if (!active) {
					break;
				}

				onTrial({
					correct: said === dir,
					rt_ms: said === dir ? Math.round(performance.now() - started) : null
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

<div class="stim stim-small tracking-[.1em]" aria-label={target === 'L' ? '←' : '→'}>{row}</div>
<div class="answers">
	<button class="btn btn-pad" aria-label="←" onclick={() => answer('L')}>←</button>
	<button class="btn btn-pad" aria-label="→" onclick={() => answer('R')}>→</button>
</div>
{#if timePressure}
	{#key trialId}
		<div class="w-full max-w-[420px]">
			<TrialTimer durationMs={windowMs} onExpire={() => answer(null)} />
		</div>
	{/key}
{/if}
<p class="hint">{t({ locale: $localeStore, key: 'game.flanker.hint' })}</p>
