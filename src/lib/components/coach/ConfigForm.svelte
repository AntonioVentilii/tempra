<script lang="ts">
	import { BLOCK_DURATIONS_S, GAME_DURATIONS_S } from '$lib/constants/config.constants';
	import { localeStore } from '$lib/stores/locale.store';
	import { toast } from '$lib/stores/toast.store';
	import { GAME_KEYS, type Difficulty, type GameKey, type SquadConfig } from '$lib/types/config';
	import { t, type I18nKey } from '$lib/utils/i18n.utils';
	import { formatDuration } from '$lib/utils/time.utils';
	import { untrack } from 'svelte';

	interface Props {
		config: SquadConfig;
		busy: boolean;
		onPublish: (config: SquadConfig) => void;
	}

	let { config, busy, onPublish }: Props = $props();

	// Local draft: edits stay here until the coach publishes. The parent keys this
	// component on the server's updated_at, so a publish from any device resets it.
	let draft = $state<SquadConfig>(untrack(() => ({ ...config, games: [...config.games] })));

	const toggleGame = (key: GameKey) => {
		draft.games = draft.games.includes(key)
			? draft.games.filter((g) => g !== key)
			: GAME_KEYS.filter((g) => g === key || draft.games.includes(g));
	};

	const publish = () => {
		if (draft.games.length === 0) {
			toast(t({ locale: $localeStore, key: 'coach.games.min' }));

			return;
		}

		onPublish({ ...draft, message: draft.message.trim() });
	};
</script>

<div class="card flex flex-col gap-3">
	<div>
		<label class="label" for="c-diff">
			{t({ locale: $localeStore, key: 'coach.difficulty' })}: {draft.difficulty} / 5
		</label>
		<input
			id="c-diff"
			type="range"
			min="1"
			max="5"
			step="1"
			class="accent-accent w-full"
			value={draft.difficulty}
			oninput={(e) => (draft.difficulty = Number(e.currentTarget.value) as Difficulty)}
		/>
		<p class="text-fg-2 text-sm">
			{t({ locale: $localeStore, key: `difficulty.${draft.difficulty}` as I18nKey })}
		</p>
	</div>

	<div>
		<span class="label">{t({ locale: $localeStore, key: 'coach.games' })}</span>
		<div class="mt-1.5 flex flex-wrap gap-2">
			{#each GAME_KEYS as key (key)}
				<label
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-sm select-none {draft.games.includes(
						key
					)
						? 'border-accent bg-bg-3'
						: 'border-line bg-bg-3'}"
				>
					<input
						type="checkbox"
						class="accent-accent m-0"
						checked={draft.games.includes(key)}
						onchange={() => toggleGame(key)}
					/>
					{t({ locale: $localeStore, key: `game.${key}.name` as I18nKey })}
				</label>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap gap-2.5">
		<div class="min-w-0 flex-1 basis-40">
			<label class="label" for="c-block">{t({ locale: $localeStore, key: 'coach.block' })}</label>
			<select
				id="c-block"
				class="input"
				value={String(draft.block_duration_s)}
				onchange={(e) => (draft.block_duration_s = Number(e.currentTarget.value))}
			>
				{#each BLOCK_DURATIONS_S as s (s)}
					<option value={String(s)}>{formatDuration(s)}</option>
				{/each}
			</select>
		</div>
		<div class="min-w-0 flex-1 basis-40">
			<label class="label" for="c-game">{t({ locale: $localeStore, key: 'coach.game' })}</label>
			<select
				id="c-game"
				class="input"
				value={String(draft.game_duration_s)}
				onchange={(e) => (draft.game_duration_s = Number(e.currentTarget.value))}
			>
				{#each GAME_DURATIONS_S as s (s)}
					<option value={String(s)}>{formatDuration(s)}</option>
				{/each}
			</select>
		</div>
	</div>

	<div>
		<div class="toggle-row">
			<label for="c-pressure">
				{t({ locale: $localeStore, key: 'coach.pressure' })}
				<small class="text-fg-2 block text-sm">
					{t({ locale: $localeStore, key: 'coach.pressure.hint' })}
				</small>
			</label>
			<input id="c-pressure" type="checkbox" bind:checked={draft.time_pressure} />
		</div>
		<div class="toggle-row">
			<label for="c-distract">
				{t({ locale: $localeStore, key: 'coach.distractors' })}
				<small class="text-fg-2 block text-sm">
					{t({ locale: $localeStore, key: 'coach.distractors.hint' })}
				</small>
			</label>
			<input id="c-distract" type="checkbox" bind:checked={draft.distractors} />
		</div>
		<div class="toggle-row">
			<label for="c-penalty">
				{t({ locale: $localeStore, key: 'coach.penalty' })}
				<small class="text-fg-2 block text-sm">
					{t({ locale: $localeStore, key: 'coach.penalty.hint' })}
				</small>
			</label>
			<input id="c-penalty" type="checkbox" bind:checked={draft.penalty_on_error} />
		</div>
		<div class="toggle-row">
			<label for="c-adapt">
				{t({ locale: $localeStore, key: 'coach.adapt' })}
				<small class="text-fg-2 block text-sm">
					{t({ locale: $localeStore, key: 'coach.adapt.hint' })}
				</small>
			</label>
			<input id="c-adapt" type="checkbox" bind:checked={draft.auto_adapt} />
		</div>
	</div>

	<div>
		<label class="label" for="c-msg">{t({ locale: $localeStore, key: 'coach.message' })}</label>
		<input
			id="c-msg"
			type="text"
			class="input"
			maxlength="120"
			placeholder={t({ locale: $localeStore, key: 'coach.message.placeholder' })}
			bind:value={draft.message}
		/>
	</div>

	<button class="btn btn-primary btn-big" disabled={busy} onclick={publish}>
		{t({ locale: $localeStore, key: 'coach.publish' })}
	</button>
</div>
