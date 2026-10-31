<script lang="ts">
	import { TERMS_SECTIONS } from '$lib/constants/legal.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';
	import { LEGAL_DRAFT, legalValues } from '$lib/utils/legal.utils';

	const values = $derived(legalValues($localeStore));
</script>

<svelte:head>
	<title>
		{t({ locale: $localeStore, key: 'terms.title' })} · {t({
			locale: $localeStore,
			key: 'app.name'
		})}
	</title>
</svelte:head>

<article class="card flex flex-col gap-3" data-tid="terms">
	<h1 class="text-4xl font-extrabold">{t({ locale: $localeStore, key: 'terms.title' })}</h1>
	<p class="max-w-prose">{t({ locale: $localeStore, key: 'terms.lead' })}</p>

	{#if LEGAL_DRAFT}
		<p class="badge badge-warn self-start whitespace-normal" data-tid="legal-draft">
			{t({ locale: $localeStore, key: 'legal.draft' })}
		</p>
	{/if}

	<div class="flex flex-col">
		{#each TERMS_SECTIONS as id (id)}
			<!-- Reports stay open: the footer link lands here and a closed section would hide the answer. -->
			<details {id} class="border-line scroll-mt-4 border-t py-2.5" open={id === 'report'}>
				<summary class="font-display cursor-pointer text-lg font-bold tracking-[.04em] uppercase">
					{t({ locale: $localeStore, key: `terms.${id}.title` as I18nKey })}
				</summary>
				<p class="text-fg-2 mt-1.5 max-w-prose text-sm whitespace-pre-line">
					{t({ locale: $localeStore, key: `terms.${id}.text` as I18nKey, values })}
				</p>
			</details>
		{/each}
	</div>

	<p class="text-fg-2 text-xs">{t({ locale: $localeStore, key: 'terms.updated' })}</p>
</article>
