<script lang="ts">
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import { localeStore } from '$lib/stores/locale.store';
	import type { Difficulty } from '$lib/types/config';
	import type { BlockResult } from '$lib/types/result';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';
	import { ADAPT_DOWN_ACCURACY, ADAPT_UP_ACCURACY } from '$lib/utils/scoring.utils';

	interface Props {
		result: BlockResult;
		nextDifficulty?: Difficulty;
		onBack: () => void;
	}

	let { result, nextDifficulty, onBack }: Props = $props();

	const verdictKey = $derived<I18nKey>(
		result.accuracy >= ADAPT_UP_ACCURACY
			? 'summary.verdict.high'
			: result.accuracy >= ADAPT_DOWN_ACCURACY
				? 'summary.verdict.mid'
				: 'summary.verdict.low'
	);
	const maxScore = $derived(Math.max(1, ...result.games.map((g) => g.score)));
</script>

<div class="card">
	<h2 class="text-2xl font-bold">{t({ locale: $localeStore, key: 'summary.title' })}</h2>
	<div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
		<Kpi value={result.score} label={t({ locale: $localeStore, key: 'summary.score' })} />
		<Kpi
			value={`${Math.round(result.accuracy * 100)}%`}
			label={t({ locale: $localeStore, key: 'summary.accuracy' })}
		/>
		<Kpi
			value={nonNullish(result.mean_rt_ms) ? `${result.mean_rt_ms} ms` : '–'}
			label={t({ locale: $localeStore, key: 'summary.rt' })}
		/>
		<Kpi value={result.index} label={t({ locale: $localeStore, key: 'summary.index' })} />
	</div>
	<p class="text-fg-2 mt-3 text-sm">
		{t({ locale: $localeStore, key: verdictKey })}
		{#if nonNullish(nextDifficulty) && nextDifficulty !== result.difficulty}
			{t({ locale: $localeStore, key: 'summary.next.level', values: { level: nextDifficulty } })}
		{/if}
	</p>
	<div class="mt-3 grid gap-1.5">
		{#each result.games as game, i (i)}
			<div class="grid grid-cols-[90px_1fr_52px] items-center gap-2 text-sm">
				<span>{t({ locale: $localeStore, key: `game.${game.game}.name` as I18nKey })}</span>
				<i
					class="bg-steel block h-2.5 rounded-[5px]"
					style="width: {(game.score / maxScore) * 100}%;"
				></i>
				<b class="tnum text-right">{game.correct}/{game.correct + game.wrong}</b>
			</div>
		{/each}
	</div>
</div>
<button class="btn btn-primary btn-big mt-3" onclick={onBack}>
	{t({ locale: $localeStore, key: 'summary.back' })}
</button>
