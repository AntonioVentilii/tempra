<script lang="ts">
	import { LOCALE_TAG } from '$lib/constants/locale.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { RemoteResult } from '$lib/types/result';
	import { t } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';
	import { indexOf } from '$lib/utils/roster.utils';
	import { formatWhen } from '$lib/utils/time.utils';

	interface Props {
		name: string;
		results: RemoteResult[];
		onClose: () => void;
	}

	let { name, results, onClose }: Props = $props();

	const W = 320;
	const H = 120;
	const PAD = 8;

	// Oldest first for the chart; the table stays newest first.
	const chronological = $derived(results.slice().reverse());

	const path = (values: (number | undefined)[], max: number): string => {
		const pts = values.map((v, i) => (nonNullish(v) ? { v, i } : undefined)).filter(nonNullish);

		if (pts.length === 0) {
			return '';
		}

		const stepX = values.length > 1 ? (W - PAD * 2) / (values.length - 1) : 0;

		return pts
			.map(({ v, i }, n) => {
				const x = PAD + i * stepX;
				const y = H - PAD - (Math.min(v, max) / max) * (H - PAD * 2);

				return `${n === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
			})
			.join(' ');
	};

	const indexPath = $derived(path(chronological.map(indexOf), 120));
	const accuracyPath = $derived(
		path(
			chronological.map((r) => Math.round(Number(r.accuracy) * 100)),
			100
		)
	);
</script>

<div class="card" data-tid="athlete-history">
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-fg-2 text-base font-bold tracking-[.08em]">
			{t({ locale: $localeStore, key: 'coach.athlete.history', values: { name } })}
		</h3>
		<button class="btn btn-ghost px-3 py-2 text-sm" onclick={onClose}>
			{t({ locale: $localeStore, key: 'coach.athlete.back' })}
		</button>
	</div>

	{#if results.length === 0}
		<p class="text-fg-2 mt-2 text-sm">{t({ locale: $localeStore, key: 'coach.results.empty' })}</p>
	{:else}
		<svg
			viewBox="0 0 {W} {H}"
			class="mt-3 block h-auto w-full max-w-[520px]"
			role="img"
			aria-label={t({ locale: $localeStore, key: 'coach.athlete.chart' })}
		>
			<line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" />
			<line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="var(--line)" stroke-dasharray="2 4" />
			<path d={accuracyPath} fill="none" stroke="var(--fg-2)" stroke-width="1.5" />
			<path d={indexPath} fill="none" stroke="var(--accent)" stroke-width="2.5" />
		</svg>
		<p class="text-fg-2 mt-1 flex gap-4 text-xs">
			<span
				><i class="bg-accent inline-block h-1 w-4 align-middle"></i>
				{t({ locale: $localeStore, key: 'summary.index' })}</span
			>
			<span
				><i class="bg-fg-2 inline-block h-1 w-4 align-middle"></i>
				{t({ locale: $localeStore, key: 'summary.accuracy' })}</span
			>
		</p>

		<div class="mt-3 overflow-x-auto">
			<table class="tnum w-full border-collapse text-sm">
				<thead>
					<tr class="text-fg-2 text-left text-xs tracking-[.06em] uppercase">
						<th class="border-line border-b px-1.5 py-2"
							>{t({ locale: $localeStore, key: 'coach.results.when' })}</th
						>
						<th class="border-line border-b px-1.5 py-2"
							>{t({ locale: $localeStore, key: 'coach.results.diff' })}</th
						>
						<th class="border-line border-b px-1.5 py-2 text-right"
							>{t({ locale: $localeStore, key: 'coach.results.score' })}</th
						>
						<th class="border-line border-b px-1.5 py-2 text-right"
							>{t({ locale: $localeStore, key: 'coach.results.accuracy' })}</th
						>
						<th class="border-line border-b px-1.5 py-2 text-right"
							>{t({ locale: $localeStore, key: 'coach.results.rt' })}</th
						>
						<th class="border-line border-b px-1.5 py-2 text-right"
							>{t({ locale: $localeStore, key: 'coach.results.index' })}</th
						>
					</tr>
				</thead>
				<tbody>
					{#each results as row (row.id)}
						<tr>
							<td class="border-line border-b px-1.5 py-2"
								>{formatWhen(row.created_at, LOCALE_TAG[$localeStore])}</td
							>
							<td class="border-line border-b px-1.5 py-2">{row.difficulty}</td>
							<td class="border-line border-b px-1.5 py-2 text-right">{row.score}</td>
							<td class="border-line border-b px-1.5 py-2 text-right"
								>{Math.round(Number(row.accuracy) * 100)}%</td
							>
							<td class="border-line border-b px-1.5 py-2 text-right"
								>{nonNullish(row.mean_rt_ms) ? `${row.mean_rt_ms} ms` : '–'}</td
							>
							<td class="border-line border-b px-1.5 py-2 text-right">{indexOf(row) ?? '–'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
