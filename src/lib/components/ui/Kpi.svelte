<script lang="ts">
	interface Props {
		value: string | number;
		label: string;
	}

	let { value, label }: Props = $props();
</script>

<div class="kpi">
	<b>{value}</b>
	<span>{label}</span>
</div>
