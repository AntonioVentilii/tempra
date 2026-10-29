<script lang="ts">
	import { page } from '$app/state';
	import BlockRunner from '$lib/components/session/BlockRunner.svelte';
	import BlockSummary from '$lib/components/session/BlockSummary.svelte';
	import InfoTip from '$lib/components/ui/InfoTip.svelte';
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import { CONFIG_POLL_MS, SQUAD_CODE_LENGTH } from '$lib/constants/config.constants';
	import { LOCALE_TAG } from '$lib/constants/locale.constants';
	import { joinSquadChannel, type SquadChannel } from '$lib/services/realtime.service';
	import { getSquad, submitResult } from '$lib/services/squad.service';
	import { localeStore } from '$lib/stores/locale.store';
	import { flushOutbox, outboxStore, queueResult } from '$lib/stores/outbox.store';
	import {
		addResult,
		readAdaptedDifficulty,
		resultsStore,
		writeAdaptedDifficulty
	} from '$lib/stores/results.store';
	import {
		athleteNameStore,
		leaveSquad,
		setAthleteName,
		setSquad,
		squadStore
	} from '$lib/stores/squad.store';
	import { toast } from '$lib/stores/toast.store';
	import type { Difficulty, GameKey } from '$lib/types/config';
	import type { PresenceStatus } from '$lib/types/presence';
	import type { BlockResult, GameStats } from '$lib/types/result';
	import { deviceId } from '$lib/utils/device.utils';
	import { t } from '$lib/utils/i18n.utils';
	import { isNullish, nonNullish } from '$lib/utils/nullish.utils';
	import { accuracyOf, adaptDifficulty, meanRtOf, tempraIndex } from '$lib/utils/scoring.utils';
	import { formatDuration, formatWhen } from '$lib/utils/time.utils';
	import { onMount } from 'svelte';

	type View = 'home' | 'session' | 'summary';

	let view = $state<View>('home');
	let codeInput = $state(page.url.searchParams.get('code')?.toUpperCase() ?? '');
	let nameInput = $state($athleteNameStore);
	let joining = $state(false);
	let joinError = $state<string | undefined>(undefined);
	let realtimeLive = $state(false);
	let lastResult = $state<BlockResult | undefined>(undefined);
	let nextDifficulty = $state<Difficulty | undefined>(undefined);
	let sessionDifficulty = $state<Difficulty>(3);
	let channel: SquadChannel | undefined;

	const squad = $derived($squadStore);
	const myHistory = $derived(
		$resultsStore.filter((r) => r.athlete === $athleteNameStore).slice(0, 8)
	);

	const announce = (status: PresenceStatus, game?: GameKey) => {
		if (isNullish(channel) || $athleteNameStore.length === 0) {
			return;
		}

		void channel.track({
			role: 'athlete',
			name: $athleteNameStore,
			status,
			game,
			since: new Date().toISOString()
		});
	};

	const join = async () => {
		const code = codeInput.trim().toUpperCase();
		const name = nameInput.trim();

		if (code.length !== SQUAD_CODE_LENGTH || name.length === 0) {
			return;
		}

		joining = true;
		joinError = undefined;

		try {
			const found = await getSquad({ code });

			if (isNullish(found)) {
				joinError = t({ locale: $localeStore, key: 'join.error.notfound' });

				return;
			}

			setAthleteName(name);
			setSquad(found);
		} catch {
			joinError = t({ locale: $localeStore, key: 'join.error.offline' });
		} finally {
			joining = false;
		}
	};

	const refreshConfig = async ({ announce: say }: { announce: boolean }) => {
		if (isNullish(squad)) {
			return;
		}

		try {
			const fresh = await getSquad({ code: squad.code });

			if (nonNullish(fresh) && fresh.updated_at !== squad.updated_at) {
				setSquad(fresh);

				if (say) {
					toast(t({ locale: $localeStore, key: 'athlete.config.live' }));
				}
			}
		} catch {
			// Offline: keep the cached config, the poll retries.
		}
	};

	// One channel per joined squad: config pushes in, presence out. A slow poll backs it up.
	$effect(() => {
		if (isNullish(squad)) {
			return;
		}

		const code = squad.code;
		void refreshConfig({ announce: false });
		channel = joinSquadChannel({
			code,
			presenceKey: `athlete:${deviceId()}`,
			onConfig: ({ config, updated_at }) => {
				setSquad({ ...squad, config, updated_at });
				toast(t({ locale: $localeStore, key: 'athlete.config.live' }));
			},
			onStatus: (live) => {
				realtimeLive = live;

				if (live) {
					announce(view === 'session' ? 'block' : 'idle');
				}
			}
		});
		const poll = setInterval(() => void refreshConfig({ announce: true }), CONFIG_POLL_MS);

		return () => {
			channel?.leave();
			channel = undefined;
			clearInterval(poll);
			realtimeLive = false;
		};
	});

	onMount(() => {
		void flushOutbox();
		const onOnline = () => void flushOutbox();
		window.addEventListener('online', onOnline);

		return () => window.removeEventListener('online', onOnline);
	});

	const start = () => {
		if (isNullish(squad)) {
			return;
		}

		const name = nameInput.trim();

		if (name.length === 0) {
			return;
		}

		setAthleteName(name);
		sessionDifficulty = squad.config.auto_adapt
			? (readAdaptedDifficulty({ athlete: name }) ?? squad.config.difficulty)
			: squad.config.difficulty;
		view = 'session';
		announce('block');
	};

	const finish = async (games: GameStats[], durationMs: number) => {
		if (isNullish(squad)) {
			return;
		}

		const accuracy = accuracyOf(games);
		const meanRt = meanRtOf(games);
		const result: BlockResult = {
			at: new Date().toISOString(),
			athlete: $athleteNameStore,
			difficulty: sessionDifficulty,
			score: games.reduce((s, g) => s + g.score, 0),
			accuracy,
			mean_rt_ms: meanRt,
			index: tempraIndex({ accuracy, meanRt, difficulty: sessionDifficulty }),
			duration_ms: durationMs,
			games
		};
		lastResult = result;
		addResult(result);

		if (squad.config.auto_adapt) {
			nextDifficulty = adaptDifficulty({ current: sessionDifficulty, accuracy });
			writeAdaptedDifficulty({ athlete: result.athlete, difficulty: nextDifficulty });
		} else {
			nextDifficulty = undefined;
		}

		view = 'summary';
		announce('idle');

		try {
			await submitResult({ code: squad.code, result });
			void channel?.announceResult({
				athlete: result.athlete,
				index: result.index,
				score: result.score,
				at: result.at
			});
			toast(t({ locale: $localeStore, key: 'summary.saved' }));
		} catch {
			queueResult({ code: squad.code, result });
			toast(t({ locale: $localeStore, key: 'summary.queued' }));
		}
	};

	const abort = () => {
		view = 'home';
		announce('idle');
		toast(t({ locale: $localeStore, key: 'session.aborted' }));
	};
</script>

{#if isNullish(squad)}
	<form
		class="card flex flex-col gap-3"
		data-tid="join-form"
		onsubmit={(e) => {
			e.preventDefault();
			void join();
		}}
	>
		<h2 class="text-2xl font-bold">{t({ locale: $localeStore, key: 'join.title' })}</h2>
		<div>
			<label class="label" for="join-code">{t({ locale: $localeStore, key: 'join.code' })}</label>
			<input
				id="join-code"
				class="input code uppercase"
				type="text"
				inputmode="text"
				autocomplete="off"
				autocapitalize="characters"
				maxlength={SQUAD_CODE_LENGTH}
				bind:value={codeInput}
				required
			/>
		</div>
		<div>
			<label class="label" for="join-name">{t({ locale: $localeStore, key: 'join.name' })}</label>
			<input
				id="join-name"
				class="input"
				type="text"
				maxlength="40"
				autocomplete="given-name"
				placeholder={t({ locale: $localeStore, key: 'join.name.placeholder' })}
				bind:value={nameInput}
				required
			/>
		</div>
		{#if nonNullish(joinError)}
			<p class="text-bad text-sm" role="alert" data-tid="join-error">{joinError}</p>
		{/if}
		<button class="btn btn-primary btn-big" type="submit" disabled={joining} data-tid="join-submit">
			{t({ locale: $localeStore, key: 'join.cta' })}
		</button>
	</form>
{:else if view === 'session'}
	<BlockRunner
		config={squad.config}
		difficulty={sessionDifficulty}
		onDone={(games, durationMs) => void finish(games, durationMs)}
		onAbort={abort}
		onGameChange={(game) => announce('block', game)}
	/>
{:else if view === 'summary' && nonNullish(lastResult)}
	<BlockSummary result={lastResult} {nextDifficulty} onBack={() => (view = 'home')} />
{:else}
	<div class="card card-accent flex flex-col gap-3" data-tid="athlete-home">
		<div class="flex flex-wrap items-end gap-2.5">
			<div class="min-w-0 flex-1 basis-40">
				<label class="label" for="athlete-name"
					>{t({ locale: $localeStore, key: 'join.name' })}</label
				>
				<input
					id="athlete-name"
					class="input"
					type="text"
					maxlength="40"
					bind:value={nameInput}
					onchange={() => {
						setAthleteName(nameInput.trim());
						announce('idle');
					}}
				/>
			</div>
			<div>
				<span class="label">{t({ locale: $localeStore, key: 'athlete.squad' })}</span>
				<div class="code" data-tid="squad-code">{squad.code}</div>
				<span class="text-fg-2 text-xs">{squad.name}</span>
			</div>
		</div>
		<div class="grid grid-cols-3 gap-2.5" data-tid="athlete-kpis">
			<Kpi
				value={squad.config.difficulty}
				label={t({ locale: $localeStore, key: 'athlete.difficulty' })}
			/>
			<Kpi
				value={formatDuration(squad.config.block_duration_s)}
				label={t({ locale: $localeStore, key: 'athlete.block' })}
			/>
			<Kpi
				value={squad.config.games.length}
				label={t({ locale: $localeStore, key: 'athlete.games' })}
			/>
		</div>
		{#if squad.config.message.length > 0}
			<p class="text-sm" data-tid="coach-message">
				<span class="text-fg-2">{t({ locale: $localeStore, key: 'athlete.coach.message' })}:</span>
				“{squad.config.message}”
			</p>
		{/if}
		<p class="text-fg-2 flex flex-wrap items-center gap-2 text-xs">
			<span class="badge {realtimeLive ? 'badge-ok' : 'badge-warn'}">
				{t({
					locale: $localeStore,
					key: realtimeLive ? 'athlete.realtime.on' : 'athlete.realtime.off'
				})}
			</span>
			<InfoTip
				label={t({ locale: $localeStore, key: 'athlete.info.label' })}
				text={t({
					locale: $localeStore,
					key: 'athlete.info',
					values: {
						pressure: t({
							locale: $localeStore,
							key: squad.config.time_pressure ? 'athlete.yes' : 'athlete.no'
						}),
						when: formatWhen(squad.updated_at, LOCALE_TAG[$localeStore])
					}
				})}
			/>
			{#if $outboxStore.length > 0}
				<span class="badge badge-warn">
					{t({ locale: $localeStore, key: 'athlete.outbox', values: { n: $outboxStore.length } })}
				</span>
			{/if}
		</p>
	</div>

	<button
		class="btn btn-primary btn-big"
		data-tid="start-block"
		onclick={start}
		disabled={nameInput.trim().length === 0}
	>
		{t({ locale: $localeStore, key: 'athlete.start' })}
	</button>

	{#if myHistory.length > 0}
		<details class="card" data-tid="athlete-history">
			<summary
				class="font-display text-fg-2 cursor-pointer text-base font-extrabold tracking-[.08em] uppercase italic"
			>
				{t({ locale: $localeStore, key: 'athlete.history' })}
			</summary>
			<div class="mt-2 overflow-x-auto">
				<table class="tnum w-full border-collapse text-sm">
					<thead>
						<tr class="text-fg-2 text-left text-xs tracking-[.06em] uppercase">
							<th class="border-line border-b px-1.5 py-2">
								{t({ locale: $localeStore, key: 'coach.results.when' })}
							</th>
							<th class="border-line border-b px-1.5 py-2">
								{t({ locale: $localeStore, key: 'coach.results.diff' })}
							</th>
							<th class="border-line border-b px-1.5 py-2 text-right">
								{t({ locale: $localeStore, key: 'summary.score' })}
							</th>
							<th class="border-line border-b px-1.5 py-2 text-right">
								{t({ locale: $localeStore, key: 'summary.accuracy' })}
							</th>
							<th class="border-line border-b px-1.5 py-2 text-right">
								{t({ locale: $localeStore, key: 'summary.index' })}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each myHistory as row (row.at)}
							<tr>
								<td class="border-line border-b px-1.5 py-2">
									{formatWhen(row.at, LOCALE_TAG[$localeStore])}
								</td>
								<td class="border-line border-b px-1.5 py-2">{row.difficulty}</td>
								<td class="border-line border-b px-1.5 py-2 text-right">{row.score}</td>
								<td class="border-line border-b px-1.5 py-2 text-right">
									{Math.round(row.accuracy * 100)}%
								</td>
								<td class="border-line border-b px-1.5 py-2 text-right">{row.index}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}

	<button class="btn btn-ghost self-start text-sm" data-tid="leave-squad" onclick={leaveSquad}>
		{t({ locale: $localeStore, key: 'join.leave' })}
	</button>
{/if}
