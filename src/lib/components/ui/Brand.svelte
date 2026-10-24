<script lang="ts">
	import { localeStore } from '$lib/stores/locale.store';
	import { t } from '$lib/utils/i18n.utils';

	interface Props {
		large?: boolean;
	}

	let { large = false }: Props = $props();
</script>

<span class="text-fg flex items-center gap-2.5">
	<svg viewBox="0 0 64 64" aria-hidden="true" class={large ? 'h-14 w-14' : 'h-9 w-9'}>
		<defs>
			<linearGradient id="tempra-g" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ffb08a" />
				<stop offset="1" stop-color="#ff6a2b" />
			</linearGradient>
		</defs>
		<path
			d="M32 4 L58 16 L58 36 C58 50 46 58 32 62 C18 58 6 50 6 36 L6 16 Z"
			fill="none"
			stroke="url(#tempra-g)"
			stroke-width="4"
			stroke-linejoin="round"
		/>
		<path d="M36 14 L22 36 L31 36 L28 52 L44 28 L35 28 Z" fill="url(#tempra-g)" />
	</svg>
	<span>
		<span class="font-display block text-2xl leading-none font-extrabold uppercase">
			{t({ locale: $localeStore, key: 'app.name' })}
		</span>
		<span class="text-fg-2 hidden text-xs font-medium sm:block">
			{t({ locale: $localeStore, key: 'app.tagline' })}
		</span>
	</span>
</span>
