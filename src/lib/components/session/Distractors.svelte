<script lang="ts">
	import { pick, randomInt } from '$lib/utils/random.utils';
	import { onMount } from 'svelte';

	interface Blob {
		id: number;
		left: number;
		top: number;
		color: string;
	}

	let flash = $state(false);
	let blobs = $state<Blob[]>([]);

	const COLORS = ['var(--steel)', 'var(--warn)', 'var(--bad)', 'var(--ember)'];

	onMount(() => {
		const timers: ReturnType<typeof setTimeout>[] = [];
		let seq = 0;

		const scheduleFlash = () => {
			timers.push(
				setTimeout(
					() => {
						flash = true;
						timers.push(setTimeout(() => (flash = false), 180));
						scheduleFlash();
					},
					1200 + randomInt(2200)
				)
			);
		};

		const scheduleBlob = () => {
			timers.push(
				setTimeout(
					() => {
						const blob: Blob = {
							id: seq++,
							left: randomInt(90),
							top: randomInt(90),
							color: pick(COLORS)
						};
						blobs = [...blobs, blob];
						timers.push(setTimeout(() => (blobs = blobs.filter((b) => b.id !== blob.id)), 700));
						scheduleBlob();
					},
					500 + randomInt(900)
				)
			);
		};

		scheduleFlash();
		scheduleBlob();

		return () => timers.forEach(clearTimeout);
	});
</script>

<div
	class="pointer-events-none absolute inset-0 rounded-[14px] transition-colors"
	style="background: {flash ? 'color-mix(in srgb, var(--bad) 18%, transparent)' : 'transparent'};"
	aria-hidden="true"
>
	{#each blobs as blob (blob.id)}
		<i
			class="absolute h-15 w-15 rounded-full opacity-45 blur-[2px]"
			style="left: {blob.left}%; top: {blob.top}%; background: {blob.color};"
		></i>
	{/each}
</div>
