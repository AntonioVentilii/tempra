<script lang="ts">
	import { localeStore } from '$lib/stores/locale.store';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';

	interface Section {
		title: I18nKey;
		text?: I18nKey;
		items?: I18nKey[];
	}

	const sections: Section[] = [
		{ title: 'privacy.who.title', text: 'privacy.who.text' },
		{
			title: 'privacy.data.title',
			items: ['privacy.data.1', 'privacy.data.2', 'privacy.data.3', 'privacy.data.4']
		},
		{ title: 'privacy.why.title', text: 'privacy.why.text' },
		{ title: 'privacy.see.title', text: 'privacy.see.text' },
		{
			title: 'privacy.where.title',
			items: ['privacy.where.1', 'privacy.where.2', 'privacy.where.3', 'privacy.where.4']
		},
		{ title: 'privacy.keep.title', text: 'privacy.keep.text' },
		{ title: 'privacy.minors.title', text: 'privacy.minors.text' },
		{ title: 'privacy.rights.title', text: 'privacy.rights.text' }
	];
</script>

<svelte:head>
	<title>
		{t({ locale: $localeStore, key: 'privacy.title' })} · {t({
			locale: $localeStore,
			key: 'app.name'
		})}
	</title>
</svelte:head>

<article class="card flex flex-col gap-4" data-tid="privacy">
	<header class="flex flex-col gap-2">
		<h1 class="text-4xl font-extrabold">{t({ locale: $localeStore, key: 'privacy.title' })}</h1>
		<p class="max-w-prose">{t({ locale: $localeStore, key: 'privacy.lead' })}</p>
		<p class="text-fg-2 text-xs">{t({ locale: $localeStore, key: 'privacy.updated' })}</p>
	</header>

	{#each sections as section (section.title)}
		<section class="flex max-w-prose flex-col gap-1.5">
			<h2 class="text-2xl font-bold">{t({ locale: $localeStore, key: section.title })}</h2>
			{#if nonNullish(section.text)}
				<p class="text-fg-2 text-sm">{t({ locale: $localeStore, key: section.text })}</p>
			{/if}
			{#if nonNullish(section.items)}
				<ul class="text-fg-2 flex list-disc flex-col gap-1 pl-5 text-sm">
					{#each section.items as item (item)}
						<li>{t({ locale: $localeStore, key: item })}</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</article>
