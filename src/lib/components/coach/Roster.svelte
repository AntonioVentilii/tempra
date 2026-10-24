<script lang="ts">
	import Sparkline from '$lib/components/ui/Sparkline.svelte';
	import { LOCALE_TAG } from '$lib/constants/locale.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';
	import type { AthleteSummary } from '$lib/utils/roster.utils';
	import { formatWhen } from '$lib/utils/time.utils';

	interface Props {
		roster: AthleteSummary[];
		selected: string | undefined;
		onSelect: (name: string) => void;
	}

	let { roster, selected, onSelect }: Props = $props();

	const statusOf = (a: AthleteSummary): { key: I18nKey; cls: string; game?: string } => {
		if (a.presence?.status === 'block') {
			return {
				key: 'coach.status.block',
				cls: 'badge-ok',
				game: nonNullish(a.presence.game)
					? t({ locale: $localeStore, key: `game.${a.presence.game}.name` as I18nKey })
					: undefined
			};
		}

		if (nonNullish(a.presence)) {
			return { key: 'coach.status.online', cls: 'badge-warn' };
		}

		return { key: 'coach.status.offline', cls: '' };
	};

	const trendGlyph = (trend: AthleteSummary['trend']) =>
		trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■';
	const trendClass = (trend: AthleteSummary['trend']) =>
		trend === 'up' ? 'text-ok' : trend === 'down' ? 'text-bad' : 'text-fg-2';
</script>

<div class="card" data-tid="roster">
	<h3 class="text-fg-2 text-base font-bold tracking-[.08em]">
		{t({ locale: $localeStore, key: 'coach.roster' })}
	</h3>
	{#if roster.length === 0}
		<p class="text-fg-2 mt-2 text-sm">{t({ locale: $localeStore, key: 'coach.roster.empty' })}</p>
	{:else}
		<ul class="mt-2 grid gap-2">
			{#each roster as athlete (athlete.name)}
				{@const status = statusOf(athlete)}
				<li>
					<button
						class="bg-bg-3 grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-[10px] border px-3 py-2.5 text-left {selected ===
						athlete.name
							? 'border-accent'
							: 'border-transparent'}"
						onclick={() => onSelect(athlete.name)}
						aria-pressed={selected === athlete.name}
					>
						<span class="flex min-w-0 flex-wrap items-center gap-2">
							<span class="font-display text-lg font-bold tracking-[.03em] uppercase">
								{athlete.name}
							</span>
							<span class="badge {status.cls}">
								{t({ locale: $localeStore, key: status.key })}{status.game
									? `: ${status.game}`
									: ''}
							</span>
						</span>
						<span class="row-span-2 self-center">
							<Sparkline
								values={athlete.indices.slice(-12)}
								label={t({ locale: $localeStore, key: 'summary.index' })}
							/>
						</span>
						<span class="text-fg-2 tnum flex flex-wrap gap-x-3 text-xs">
							<span>
								{t({
									locale: $localeStore,
									key: 'coach.roster.blocks',
									values: { n: athlete.blocks }
								})}
							</span>
							{#if nonNullish(athlete.lastIndex)}
								<span>
									{t({ locale: $localeStore, key: 'summary.index' })}
									<b class="text-fg">{athlete.lastIndex}</b>
									<span class={trendClass(athlete.trend)} aria-hidden="true">
										{trendGlyph(athlete.trend)}
									</span>
								</span>
								<span>
									{t({ locale: $localeStore, key: 'summary.accuracy' })}
									<b class="text-fg">{Math.round(athlete.meanAccuracy * 100)}%</b>
								</span>
							{/if}
							{#if nonNullish(athlete.lastAt)}
								<span>{formatWhen(athlete.lastAt, LOCALE_TAG[$localeStore])}</span>
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
