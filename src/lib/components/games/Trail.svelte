<script lang="ts">
	import { ladder } from '$lib/constants/config.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { GameProps } from '$lib/types/game';
	import { t } from '$lib/utils/i18n.utils';
	import { shuffle } from '$lib/utils/random.utils';
	import { untrack } from 'svelte';

	let { difficulty, onTrial }: GameProps = $props();

	const total = $derived(ladder([9, 12, 16, 20, 25], difficulty));
	const cols = $derived(ladder([3, 4, 4, 5, 5], difficulty));
	// From level 4 the grid reshuffles after every correct tap: no spatial memory to lean on.
	const moving = $derived(difficulty >= 4);
	const DONE_FLASH_MS = 700;

	const fresh = () => shuffle(Array.from({ length: total }, (_, i) => i + 1));

	let order = $state<number[]>(untrack(fresh));
	let next = $state(1);
	let completed = $state(false);
	let lastTap = performance.now();

	const tap = (value: number) => {
		if (completed) {
			return;
		}

		const now = performance.now();

		if (value !== next) {
			onTrial({ correct: false, rt_ms: null });

			return;
		}

		onTrial({ correct: true, rt_ms: Math.round(now - lastTap) });
		lastTap = now;
		next++;

		if (next > total) {
			completed = true;
			setTimeout(() => {
				order = fresh();
				next = 1;
				completed = false;
				lastTap = performance.now();
			}, DONE_FLASH_MS);

			return;
		}

		if (moving) {
			order = shuffle(order);
		}
	};
</script>

{#if completed}
	<div class="stim text-ok">{t({ locale: $localeStore, key: 'session.grid.done' })}</div>
{:else}
	<div
		class="grid w-full max-w-[420px] gap-2"
		style="grid-template-columns: repeat({cols}, minmax(0, 1fr));"
	>
		{#each order as value (value)}
			<button
				class="btn tnum aspect-square p-0 text-2xl {value < next
					? 'bg-ok text-on-accent opacity-35'
					: ''}"
				disabled={value < next}
				onclick={() => tap(value)}
			>
				{value}
			</button>
		{/each}
	</div>
{/if}
<p class="hint">{t({ locale: $localeStore, key: 'game.trail.hint' })}</p>
