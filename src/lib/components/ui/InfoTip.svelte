<script lang="ts">
	import { localeStore } from '$lib/stores/locale.store';
	import { t } from '$lib/utils/i18n.utils';
	import { nonNullish } from '$lib/utils/nullish.utils';

	const NOTE_WIDTH = 256;
	const GUTTER = 12;

	interface Props {
		text: string;
		label: string;
	}

	let { text, label }: Props = $props();

	let open = $state(false);
	let width = $state(NOTE_WIDTH);
	let offset = $state(0);
	let button = $state<HTMLButtonElement>();
	const id = $props.id();

	// The note opens from the button, then slides left just enough to stay on screen.
	const toggle = () => {
		if (!open && nonNullish(button)) {
			const viewport = document.documentElement.clientWidth;
			width = Math.min(NOTE_WIDTH, viewport - GUTTER * 2);
			offset = Math.min(0, viewport - GUTTER - width - button.getBoundingClientRect().left);
		}

		open = !open;
	};

	// Detail on demand: the button toggles it; any other tap (the note included) or Escape closes it,
	// so it never sits on top of the start button.
	const closeOutside = (e: MouseEvent) => {
		if (open && e.target instanceof Node && !button?.contains(e.target)) {
			open = false;
		}
	};
</script>

<svelte:window
	onclick={closeOutside}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			open = false;
		}
	}}
/>

<span class="relative inline-flex align-middle">
	<button
		bind:this={button}
		type="button"
		class="info-tip"
		aria-label={t({ locale: $localeStore, key: 'info.label', values: { topic: label } })}
		aria-expanded={open}
		aria-controls={id}
		onclick={toggle}
	>
		i
	</button>
	{#if open}
		<span
			{id}
			role="note"
			style="left: {offset}px; width: {width}px;"
			class="bg-bg-3 border-line text-fg absolute top-full z-10 mt-1.5 border px-3 py-2 text-left text-xs font-normal tracking-normal normal-case not-italic"
		>
			{text}
		</span>
	{/if}
</span>
