<script lang="ts">
	interface Props {
		values: number[];
		width?: number;
		height?: number;
		label?: string;
	}

	let { values, width = 120, height = 32, label }: Props = $props();

	const PAD = 2;

	const points = $derived.by(() => {
		if (values.length === 0) {
			return '';
		}

		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1;
		const stepX = values.length > 1 ? (width - PAD * 2) / (values.length - 1) : 0;

		return values
			.map((v, i) => {
				const x = PAD + i * stepX;
				const y = height - PAD - ((v - min) / span) * (height - PAD * 2);

				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	});

	const last = $derived(points.split(' ').at(-1)?.split(',') ?? []);
</script>

<svg
	viewBox="0 0 {width} {height}"
	{width}
	{height}
	class="block max-w-full"
	role={label ? 'img' : 'presentation'}
	aria-label={label}
>
	{#if values.length > 1}
		<polyline fill="none" stroke="var(--cool)" stroke-width="2" {points} />
	{/if}
	{#if last.length === 2}
		<circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--accent)" />
	{/if}
</svg>
