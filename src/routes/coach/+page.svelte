<script lang="ts">
	import { page } from '$app/state';
	import AthleteHistory from '$lib/components/coach/AthleteHistory.svelte';
	import ConfigForm from '$lib/components/coach/ConfigForm.svelte';
	import ResultsTable from '$lib/components/coach/ResultsTable.svelte';
	import Roster from '$lib/components/coach/Roster.svelte';
	import {
		DEFAULT_SQUAD_CONFIG,
		RESULTS_POLL_MS,
		SQUAD_CODE_LENGTH
	} from '$lib/constants/config.constants';
	import { LOCALE_TAG } from '$lib/constants/locale.constants';
	import { joinSquadChannel, type SquadChannel } from '$lib/services/realtime.service';
	import {
		createSquad,
		getSquad,
		listResults,
		updateSquadConfig
	} from '$lib/services/squad.service';
	import { clearCoachSession, coachStore, setCoachSession } from '$lib/stores/coach.store';
	import { localeStore } from '$lib/stores/locale.store';
	import { toast } from '$lib/stores/toast.store';
	import type { SquadConfig } from '$lib/types/config';
	import type { SquadPresence } from '$lib/types/presence';
	import type { RemoteResult } from '$lib/types/result';
	import { deviceId } from '$lib/utils/device.utils';
	import { t } from '$lib/utils/i18n.utils';
	import { isNullish, nonNullish } from '$lib/utils/nullish.utils';
	import { buildRoster } from '$lib/utils/roster.utils';
	import { formatWhen } from '$lib/utils/time.utils';
	import { onMount } from 'svelte';

	const HISTORY_LIMIT = 1000;
	const RECENT_LIMIT = 15;

	let nameInput = $state('');
	let restoreCode = $state('');
	let restoreKey = $state('');
	let busy = $state(false);
	let config = $state<SquadConfig>(DEFAULT_SQUAD_CONFIG);
	let updatedAt = $state<string | undefined>(undefined);
	let results = $state<RemoteResult[]>([]);
	let presences = $state<SquadPresence[]>([]);
	let realtimeLive = $state(false);
	let selected = $state<string | undefined>(undefined);
	let channel: SquadChannel | undefined;

	const session = $derived($coachStore);
	const roster = $derived(buildRoster({ results, presences }));
	const selectedResults = $derived(
		nonNullish(selected) ? results.filter((r) => r.athlete === selected) : []
	);

	const siteOrigin = () => page.url.origin;

	const create = async () => {
		const name = nameInput.trim();

		if (name.length === 0) {
			return;
		}

		busy = true;

		try {
			setCoachSession(await createSquad({ name }));
		} catch {
			toast(t({ locale: $localeStore, key: 'coach.create.error' }));
		} finally {
			busy = false;
		}
	};

	const restore = async ({ code, key }: { code: string; key: string }) => {
		if (code.length !== SQUAD_CODE_LENGTH || key.length === 0) {
			return;
		}

		busy = true;

		try {
			const squad = await getSquad({ code });

			if (isNullish(squad)) {
				toast(t({ locale: $localeStore, key: 'join.error.notfound' }));

				return;
			}

			setCoachSession({ code: squad.code, name: squad.name, coach_key: key });
		} catch {
			toast(t({ locale: $localeStore, key: 'join.error.offline' }));
		} finally {
			busy = false;
		}
	};

	const load = async () => {
		if (isNullish(session)) {
			return;
		}

		try {
			const [squad, rows] = await Promise.all([
				getSquad({ code: session.code }),
				listResults({ session, limit: HISTORY_LIMIT })
			]);

			if (nonNullish(squad)) {
				config = squad.config;
				updatedAt = squad.updated_at;
			}

			results = rows;
		} catch {
			// Transient network error: the poll retries.
		}
	};

	const publish = async (next: SquadConfig) => {
		if (isNullish(session)) {
			return;
		}

		busy = true;

		try {
			const saved = await updateSquadConfig({ session, config: next });
			config = saved.config;
			updatedAt = saved.updated_at;
			toast(t({ locale: $localeStore, key: 'coach.published' }));
		} catch {
			toast(t({ locale: $localeStore, key: 'coach.publish.error' }));
		} finally {
			busy = false;
		}
	};

	const copy = async ({ text, done }: { text: string; done: string }) => {
		try {
			await navigator.clipboard.writeText(text);
			toast(done);
		} catch {
			window.prompt(done, text);
		}
	};

	// Coach link: /coach?code=XXXXXX&key=… restores the session on a new device.
	onMount(() => {
		const code = page.url.searchParams.get('code')?.toUpperCase();
		const key = page.url.searchParams.get('key');

		if (nonNullish(code) && nonNullish(key) && isNullish(session)) {
			void restore({ code, key });
		}
	});

	// Presence and result broadcasts make the roster live; the poll is the safety net.
	$effect(() => {
		if (isNullish(session)) {
			return;
		}

		const { code, name } = session;
		void load();
		channel = joinSquadChannel({
			code,
			presenceKey: `coach:${deviceId()}`,
			onResult: () => void load(),
			onPresence: (list) => (presences = list),
			onStatus: (live) => {
				realtimeLive = live;

				if (live) {
					void channel?.track({
						role: 'coach',
						name,
						status: 'idle',
						since: new Date().toISOString()
					});
				}
			}
		});
		const poll = setInterval(() => void load(), RESULTS_POLL_MS);

		return () => {
			channel?.leave();
			channel = undefined;
			clearInterval(poll);
			presences = [];
			realtimeLive = false;
		};
	});
</script>

{#if isNullish(session)}
	<form
		class="card flex flex-col gap-3"
		data-tid="create-squad"
		onsubmit={(e) => {
			e.preventDefault();
			void create();
		}}
	>
		<h2 class="text-2xl font-bold">{t({ locale: $localeStore, key: 'coach.create.title' })}</h2>
		<div>
			<label class="label" for="squad-name">
				{t({ locale: $localeStore, key: 'coach.create.name' })}
			</label>
			<input
				id="squad-name"
				class="input"
				type="text"
				maxlength="60"
				placeholder={t({ locale: $localeStore, key: 'coach.create.name.placeholder' })}
				bind:value={nameInput}
				required
			/>
		</div>
		<button class="btn btn-primary btn-big" type="submit" disabled={busy} data-tid="create-submit">
			{t({ locale: $localeStore, key: 'coach.create.cta' })}
		</button>
	</form>

	<form
		class="card flex flex-col gap-3"
		data-tid="restore-squad"
		onsubmit={(e) => {
			e.preventDefault();
			void restore({ code: restoreCode.trim().toUpperCase(), key: restoreKey.trim() });
		}}
	>
		<h3 class="text-fg-2 text-base font-bold tracking-[.08em]">
			{t({ locale: $localeStore, key: 'coach.restore.title' })}
		</h3>
		<p class="text-fg-2 text-sm">{t({ locale: $localeStore, key: 'coach.restore.text' })}</p>
		<div class="flex flex-wrap gap-2.5">
			<div class="min-w-0 flex-1 basis-32">
				<label class="label" for="restore-code"
					>{t({ locale: $localeStore, key: 'join.code' })}</label
				>
				<input
					id="restore-code"
					class="input uppercase"
					type="text"
					maxlength={SQUAD_CODE_LENGTH}
					autocapitalize="characters"
					bind:value={restoreCode}
				/>
			</div>
			<div class="min-w-0 flex-[2] basis-48">
				<label class="label" for="restore-key">
					{t({ locale: $localeStore, key: 'coach.restore.key' })}
				</label>
				<input id="restore-key" class="input" type="password" bind:value={restoreKey} />
			</div>
		</div>
		<button class="btn" type="submit" disabled={busy}>
			{t({ locale: $localeStore, key: 'coach.restore.cta' })}
		</button>
	</form>
{:else}
	<div
		class="card card-accent flex flex-wrap items-start justify-between gap-3"
		data-tid="squad-card"
	>
		<div>
			<span class="label">{t({ locale: $localeStore, key: 'coach.squad' })}</span>
			<div class="code" data-tid="squad-code">{session.code}</div>
			<span class="text-fg-2 text-sm">{session.name}</span>
			<p class="text-fg-2 mt-1 text-xs">{t({ locale: $localeStore, key: 'coach.code.share' })}</p>
		</div>
		<div class="flex flex-col items-end gap-1.5 text-right">
			<span class="badge {realtimeLive ? 'badge-ok' : 'badge-warn'}">
				{t({
					locale: $localeStore,
					key: realtimeLive ? 'coach.realtime.on' : 'coach.realtime.off'
				})}
			</span>
			<p class="text-fg-2 m-0 text-xs">{t({ locale: $localeStore, key: 'coach.live.hint' })}</p>
			{#if nonNullish(updatedAt)}
				<p class="text-fg-2 m-0 text-xs">
					{t({
						locale: $localeStore,
						key: 'coach.publish.last',
						values: { when: formatWhen(updatedAt, LOCALE_TAG[$localeStore]) }
					})}
				</p>
			{/if}
		</div>
		<div class="flex w-full flex-wrap gap-2">
			<button
				class="btn btn-ghost px-3 py-2 text-sm"
				onclick={() =>
					copy({
						text: `${siteOrigin()}/athlete?code=${session.code}`,
						done: t({ locale: $localeStore, key: 'coach.link.athletes.copied' })
					})}
			>
				{t({ locale: $localeStore, key: 'coach.link.athletes' })}
			</button>
			<button
				class="btn btn-ghost px-3 py-2 text-sm"
				onclick={() =>
					copy({
						text: `${siteOrigin()}/coach?code=${session.code}&key=${session.coach_key}`,
						done: t({ locale: $localeStore, key: 'coach.link.copied' })
					})}
			>
				{t({ locale: $localeStore, key: 'coach.link.copy' })}
			</button>
			<button
				class="btn btn-ghost ml-auto px-3 py-2 text-sm"
				data-tid="coach-leave"
				onclick={clearCoachSession}
			>
				{t({ locale: $localeStore, key: 'coach.leave' })}
			</button>
		</div>
	</div>

	<Roster
		{roster}
		{selected}
		onSelect={(name) => (selected = selected === name ? undefined : name)}
	/>

	{#if nonNullish(selected)}
		<AthleteHistory
			name={selected}
			results={selectedResults}
			onClose={() => (selected = undefined)}
		/>
	{/if}

	{#key updatedAt}
		<ConfigForm {config} {busy} onPublish={(next) => void publish(next)} />
	{/key}

	<ResultsTable results={results.slice(0, RECENT_LIMIT)} onRefresh={() => void load()} />
{/if}
