<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Brand from '$lib/components/ui/Brand.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { localeStore, setLocale } from '$lib/stores/locale.store';
	import { t } from '$lib/utils/i18n.utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const tabs = $derived([
		{ href: '/athlete', label: t({ locale: $localeStore, key: 'nav.athlete' }) },
		{ href: '/coach', label: t({ locale: $localeStore, key: 'nav.coach' }) }
	]);

	const isActive = (href: string) => page.url.pathname.startsWith(href);

	const switchLocale = () => setLocale($localeStore === 'it' ? 'en' : 'it');
</script>

<svelte:head>
	<title>{t({ locale: $localeStore, key: 'app.name' })}</title>
</svelte:head>

<div class="mx-auto flex min-h-full max-w-3xl flex-col gap-4 py-4">
	<header class="flex items-center justify-between gap-3">
		<a href="/" class="no-underline" aria-label={t({ locale: $localeStore, key: 'nav.home' })}>
			<Brand />
		</a>
		<nav class="flex gap-0.5" aria-label={t({ locale: $localeStore, key: 'nav.home' })}>
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="font-display px-3.5 py-2 text-base font-extrabold tracking-[.06em] uppercase italic no-underline [clip-path:polygon(10%_0,100%_0,90%_100%,0_100%)] {isActive(
						tab.href
					)
						? 'bg-accent text-on-accent'
						: 'bg-bg-3 text-fg-2'}"
					aria-current={isActive(tab.href) ? 'page' : undefined}
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</header>

	<main class="flex flex-1 flex-col gap-3">
		{@render children()}
	</main>

	<footer class="text-fg-2 flex flex-wrap items-center justify-between gap-2 text-xs">
		<span>{t({ locale: $localeStore, key: 'footer.made' })}</span>
		<span class="flex items-center gap-3">
			<a href="/privacy" class="text-fg-2" data-tid="footer-privacy">
				{t({ locale: $localeStore, key: 'footer.privacy' })}
			</a>
			<button class="cursor-pointer underline" onclick={switchLocale}>
				{t({ locale: $localeStore, key: 'lang.switch' })}
			</button>
			<span class="tnum">{t({ locale: $localeStore, key: 'app.version' })} {__APP_VERSION__}</span>
		</span>
	</footer>
</div>

<Toast />
