<script lang="ts">
	import { localeStore } from '$lib/stores/locale.store';
	import { t } from '$lib/utils/i18n.utils';

	interface Props {
		large?: boolean;
	}

	let { large = false }: Props = $props();
</script>

<span class="text-fg flex items-center gap-2.5">
	<!-- The crossbar is rest, the stem is the spike of attention. -->
	<svg viewBox="0 0 100 100" aria-hidden="true" class={large ? 'h-16 w-16' : 'h-9 w-9'}>
		<polygon points="22,12 96,12 90,28 16,28" fill="var(--accent)" />
		<polyline
			points="56,28 51,52 66,58 40,68 49,92"
			fill="none"
			stroke="var(--accent)"
			stroke-width="13"
			stroke-linejoin="miter"
		/>
	</svg>
	<span>
		<span
			class="font-display block leading-none font-extrabold uppercase italic {large
				? 'text-5xl'
				: 'text-3xl'}"
		>
			{t({ locale: $localeStore, key: 'app.name' })}
		</span>
		<span
			class="text-accent-2 hidden text-[0.68rem] font-semibold tracking-[.2em] uppercase sm:block"
		>
			{t({ locale: $localeStore, key: 'app.tagline' })}
		</span>
	</span>
</span>
