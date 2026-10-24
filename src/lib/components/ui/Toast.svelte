<script lang="ts">
	import { toastStore } from '$lib/stores/toast.store';
	import { nonNullish } from '$lib/utils/nullish.utils';
</script>

<div
	role="status"
	aria-live="polite"
	class="bg-cool pointer-events-none fixed bottom-[calc(18px+env(safe-area-inset-bottom,0px))] left-1/2 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full px-4 py-2.5 text-center font-semibold text-[#0b1222] transition-opacity {nonNullish(
		$toastStore
	)
		? 'opacity-100'
		: 'opacity-0'}"
>
	{$toastStore ?? ''}
</div>
