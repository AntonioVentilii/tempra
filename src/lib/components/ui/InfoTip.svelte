<script lang="ts">
	interface Props {
		text: string;
		label: string;
	}

	let { text, label }: Props = $props();

	let open = $state(false);
	let button = $state<HTMLButtonElement>();
	const id = $props.id();

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
		aria-label={`Info: ${label}`}
		aria-expanded={open}
		aria-controls={id}
		onclick={() => (open = !open)}
	>
		i
	</button>
	{#if open}
		<span
			{id}
			role="note"
			class="bg-bg-3 border-line text-fg absolute top-full left-0 z-10 mt-1.5 w-64 max-w-[75vw] border px-3 py-2 text-left text-xs font-normal tracking-normal normal-case not-italic"
		>
			{text}
		</span>
	{/if}
</span>
