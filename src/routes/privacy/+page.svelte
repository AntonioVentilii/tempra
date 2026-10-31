<script lang="ts">
	import { localeStore } from '$lib/stores/locale.store';
	import { toast } from '$lib/stores/toast.store';
	import { clearLocal } from '$lib/utils/storage.utils';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';

	interface Section {
		title: I18nKey;
		text?: I18nKey;
		items?: I18nKey[];
	}

	// The lead says it all; each section stays folded until someone asks.
	const sections: Section[] = [
		{
			title: 'privacy.data.title',
			items: ['privacy.data.1', 'privacy.data.2', 'privacy.data.3', 'privacy.data.4']
		},
		{ title: 'privacy.see.title', text: 'privacy.see.text' },
		{ title: 'privacy.minors.title', text: 'privacy.minors.text' },
		{ title: 'privacy.rights.title', text: 'privacy.rights.text' },
		{
			title: 'privacy.where.title',
			items: ['privacy.where.1', 'privacy.where.2', 'privacy.where.3']
		},
		{ title: 'privacy.keep.title', text: 'privacy.keep.text' },
		{ title: 'privacy.why.title', text: 'privacy.why.text' },
		{ title: 'privacy.who.title', text: 'privacy.who.text' }
	];

	// Stores read localStorage once at load, so a reload is the simplest full reset.
	const eraseDevice = () => {
		if (!window.confirm(t({ locale: $localeStore, key: 'privacy.device.confirm' }))) {
			return;
		}

		clearLocal({ keep: ['locale'] });
		toast(t({ locale: $localeStore, key: 'privacy.device.erased' }));
		setTimeout(() => window.location.reload(), 800);
	};
</script>

<svelte:head>
	<title>
		{t({ locale: $localeStore, key: 'privacy.title' })} · {t({
			locale: $localeStore,
			key: 'app.name'
		})}
	</title>
</svelte:head>

<article class="card flex flex-col gap-3" data-tid="privacy">
	<h1 class="text-4xl font-extrabold">{t({ locale: $localeStore, key: 'privacy.title' })}</h1>
	<p class="max-w-prose">{t({ locale: $localeStore, key: 'privacy.lead' })}</p>

	<div class="flex flex-col">
		{#each sections as section (section.title)}
			<details class="border-line border-t py-2.5">
				<summary class="font-display cursor-pointer text-lg font-bold tracking-[.04em] uppercase">
					{t({ locale: $localeStore, key: section.title })}
				</summary>
				{#if nonNullish(section.text)}
					<p class="text-fg-2 mt-1.5 max-w-prose text-sm">
						{t({ locale: $localeStore, key: section.text })}
					</p>
				{/if}
				{#if nonNullish(section.items)}
					<ul class="text-fg-2 mt-1.5 flex max-w-prose list-disc flex-col gap-1 pl-5 text-sm">
						{#each section.items as item (item)}
							<li>{t({ locale: $localeStore, key: item })}</li>
						{/each}
					</ul>
				{/if}
			</details>
		{/each}
	</div>

	<button
		class="btn btn-ghost self-start px-3 py-2 text-sm"
		data-tid="erase-device"
		onclick={eraseDevice}
	>
		{t({ locale: $localeStore, key: 'privacy.device.erase' })}
	</button>

	<p class="text-fg-2 text-xs">{t({ locale: $localeStore, key: 'privacy.updated' })}</p>
</article>
