<script lang="ts">
	import { ladder } from '$lib/constants/config.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { GameProps } from '$lib/types/game';
	import { t } from '$lib/utils/i18n.utils';
	import { randomInt, sleep } from '$lib/utils/random.utils';
	import { onMount } from 'svelte';

	let { difficulty, onTrial }: GameProps = $props();

	const showMs = $derived(ladder([900, 750, 600, 500, 400], difficulty));
	const noGoP = $derived(ladder([0.2, 0.25, 0.3, 0.35, 0.4], difficulty));
	// From level 4 half the no-go stimuli wear the go colour: only the label tells.
	const deceptive = $derived(difficulty >= 4);

	type Phase = 'idle' | 'go' | 'nogo' | 'nogo-deceptive';

	let phase = $state<Phase>('idle');
	let answered = false;
	let shownAt = 0;

	const tap = () => {
		if (phase === 'idle' || answered) {
			return;
		}

		answered = true;
		const go = phase === 'go';
		onTrial({ correct: go, rt_ms: go ? Math.round(performance.now() - shownAt) : null });
	};

	onMount(() => {
		let active = true;

		const loop = async () => {
			while (active) {
				phase = 'idle';
				await sleep(500 + randomInt(900));

				if (!active) {
					break;
				}

				const go = Math.random() >= noGoP;
				answered = false;
				shownAt = performance.now();
				phase = go ? 'go' : deceptive && Math.random() < 0.5 ? 'nogo-deceptive' : 'nogo';
				await sleep(showMs);

				if (!active) {
					break;
				}

				if (!answered) {
					answered = true;
					onTrial({ correct: !go, rt_ms: null });
				}
			}
		};

		void loop();

		return () => {
			active = false;
		};
	});

	const background = $derived(
		phase === 'go' || phase === 'nogo-deceptive'
			? 'var(--ok)'
			: phase === 'nogo'
				? 'var(--bad)'
				: 'transparent'
	);
	const label = $derived(
		phase === 'go'
			? t({ locale: $localeStore, key: 'game.go' })
			: phase === 'idle'
				? ''
				: t({ locale: $localeStore, key: 'game.nogo' })
	);
</script>

<button
	class="font-display text-on-accent grid h-[140px] w-[140px] cursor-pointer place-items-center rounded-full border-0 text-3xl font-extrabold"
	style="background: {background};"
	aria-label={t({ locale: $localeStore, key: 'game.gonogo.name' })}
	onclick={tap}
>
	{label}
</button>
<p class="hint">{t({ locale: $localeStore, key: 'game.gonogo.hint' })}</p>
