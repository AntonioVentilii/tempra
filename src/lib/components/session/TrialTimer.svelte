<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		durationMs: number;
		onExpire: () => void;
	}

	let { durationMs, onExpire }: Props = $props();

	let armed = $state(false);

	onMount(() => {
		const frame = requestAnimationFrame(() => {
			armed = true;
		});
		const timer = setTimeout(onExpire, durationMs);

		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timer);
		};
	});
</script>

<div class="bg-bg-3 h-1 w-full overflow-hidden rounded-sm" aria-hidden="true">
	<i
		class="bg-cool block h-full origin-left"
		style="transform: scaleX({armed ? 0 : 1}); transition: transform {armed
			? durationMs
			: 0}ms linear;"
	></i>
</div>
