<script lang="ts">
	import { LOCALE_TAG } from '$lib/constants/locale.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import type { RemoteResult } from '$lib/types/result';
	import { t } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';
	import { formatWhen } from '$lib/utils/time.utils';

	interface Props {
		results: RemoteResult[];
		onRefresh: () => void;
	}

	let { results, onRefresh }: Props = $props();

	const badgeClass = (index: number | undefined) =>
		nonNullish(index) ? (index >= 75 ? 'badge-ok' : index >= 50 ? 'badge-warn' : 'badge-bad') : '';
</script>

<div class="card">
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-fg-2 text-base font-bold tracking-[.08em]">
			{t({ locale: $localeStore, key: 'coach.recent' })}
		</h3>
		<button class="btn btn-ghost px-3 py-2 text-sm" onclick={onRefresh}>
			{t({ locale: $localeStore, key: 'coach.results.refresh' })}
		</button>
	</div>
	{#if results.length === 0}
		<p class="text-fg-2 mt-2 text-sm">{t({ locale: $localeStore, key: 'coach.results.empty' })}</p>
	{:else}
		<div class="mt-2 overflow-x-auto">
			<table class="tnum w-full border-collapse text-sm">
				<thead>
					<tr class="text-fg-2 text-left text-xs tracking-[.06em] uppercase">
						<th class="border-line border-b px-1.5 py-2">
							{t({ locale: $localeStore, key: 'coach.results.athlete' })}
						</th>
						<th class="border-line border-b px-1.5 py-2">
							{t({ locale: $localeStore, key: 'coach.results.when' })}
						</th>
						<th class="border-line border-b px-1.5 py-2">
							{t({ locale: $localeStore, key: 'coach.results.diff' })}
						</th>
						<th class="border-line border-b px-1.5 py-2 text-right">
							{t({ locale: $localeStore, key: 'coach.results.score' })}
						</th>
						<th class="border-line border-b px-1.5 py-2 text-right">
							{t({ locale: $localeStore, key: 'coach.results.accuracy' })}
						</th>
						<th class="border-line border-b px-1.5 py-2 text-right">
							{t({ locale: $localeStore, key: 'coach.results.rt' })}
						</th>
						<th class="border-line border-b px-1.5 py-2 text-right">
							{t({ locale: $localeStore, key: 'coach.results.index' })}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each results as row (row.id)}
						<tr>
							<td class="border-line border-b px-1.5 py-2">{row.athlete}</td>
							<td class="border-line border-b px-1.5 py-2">
								{formatWhen(row.created_at, LOCALE_TAG[$localeStore])}
							</td>
							<td class="border-line border-b px-1.5 py-2">{row.difficulty}</td>
							<td class="border-line border-b px-1.5 py-2 text-right">{row.score}</td>
							<td class="border-line border-b px-1.5 py-2 text-right">
								{Math.round(Number(row.accuracy) * 100)}%
							</td>
							<td class="border-line border-b px-1.5 py-2 text-right">
								{nonNullish(row.mean_rt_ms) ? `${row.mean_rt_ms} ms` : '–'}
							</td>
							<td class="border-line border-b px-1.5 py-2 text-right">
								{#if nonNullish(row.params?.index)}
									<span class="badge {badgeClass(row.params.index)}">{row.params.index}</span>
								{:else}
									–
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
