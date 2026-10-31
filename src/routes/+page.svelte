<script lang="ts">
	import Brand from '$lib/components/ui/Brand.svelte';
	import { localeStore } from '$lib/stores/locale.store';
	import { GAME_KEYS } from '$lib/types/config';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';

	const steps: I18nKey[] = ['home.how.1', 'home.how.2', 'home.how.3', 'home.how.4'];
</script>

<section class="card flex flex-col gap-4 py-6">
	<Brand large />
	<h1 class="text-4xl font-extrabold sm:text-5xl">
		{t({ locale: $localeStore, key: 'home.title' })}
	</h1>
	<p class="text-fg-2 max-w-prose">{t({ locale: $localeStore, key: 'home.lead' })}</p>
</section>

<div class="grid gap-3 sm:grid-cols-2">
	<section class="card flex flex-col gap-2">
		<h2 class="text-2xl font-bold">{t({ locale: $localeStore, key: 'home.athlete.title' })}</h2>
		<p class="text-fg-2 flex-1 text-sm">{t({ locale: $localeStore, key: 'home.athlete.text' })}</p>
		<a href="/athlete" class="btn btn-primary">
			{t({ locale: $localeStore, key: 'home.athlete.cta' })}
		</a>
	</section>
	<section class="card flex flex-col gap-2">
		<h2 class="text-2xl font-bold">{t({ locale: $localeStore, key: 'home.coach.title' })}</h2>
		<p class="text-fg-2 flex-1 text-sm">{t({ locale: $localeStore, key: 'home.coach.text' })}</p>
		<a href="/coach" class="btn">{t({ locale: $localeStore, key: 'home.coach.cta' })}</a>
	</section>
</div>

<details class="card">
	<summary class="font-display cursor-pointer text-2xl font-extrabold uppercase italic">
		{t({ locale: $localeStore, key: 'home.how.title' })}
	</summary>
	<ol class="mt-3 grid gap-2 pl-5 text-sm">
		{#each steps as step (step)}
			<li>{t({ locale: $localeStore, key: step })}</li>
		{/each}
	</ol>
</details>

<details class="card">
	<summary class="font-display cursor-pointer text-2xl font-extrabold uppercase italic">
		{t({ locale: $localeStore, key: 'home.games.title' })}
	</summary>
	<dl class="mt-3 grid gap-2 sm:grid-cols-2">
		{#each GAME_KEYS as key (key)}
			<div class="bg-bg-3 rounded-[10px] px-3 py-2.5">
				<dt class="font-display text-lg font-bold tracking-[.04em] uppercase">
					{t({ locale: $localeStore, key: `game.${key}.name` as I18nKey })}
				</dt>
				<dd class="text-fg-2 m-0 text-sm">
					{t({ locale: $localeStore, key: `game.${key}.about` as I18nKey })}
				</dd>
			</div>
		{/each}
	</dl>
</details>
