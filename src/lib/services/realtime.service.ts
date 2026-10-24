import { DEFAULT_SQUAD_CONFIG } from '$lib/constants/config.constants';
import { supabase } from '$lib/services/supabase.service';
import type { SquadConfig } from '$lib/types/config';
import type { ResultBroadcast, SquadPresence } from '$lib/types/presence';
import { nonNullish } from '$lib/utils/nullish.utils';

const RESULT_EVENT = 'result';

export interface SquadChannel {
	/** Announce this device's state to everyone on the squad channel (no-op until the socket is live). */
	track: (presence: SquadPresence) => Promise<void>;
	/** Tell the coach a block just landed, so the panel refreshes without waiting for the poll. */
	announceResult: (payload: ResultBroadcast) => Promise<void>;
	leave: () => void;
}

/**
 * One Realtime channel per squad carries three things: config updates from
 * Postgres (coach → athletes), presence (who is online and what they are
 * doing) and a `result` broadcast (athlete → coach). Callers keep a slow poll
 * as a fallback: phones suspend sockets, gyms have bad reception.
 */
export const joinSquadChannel = ({
	code,
	presenceKey,
	onConfig,
	onResult,
	onPresence,
	onStatus
}: {
	code: string;
	presenceKey: string;
	onConfig?: (payload: { config: SquadConfig; updated_at: string }) => void;
	onResult?: (payload: ResultBroadcast) => void;
	onPresence?: (presences: SquadPresence[]) => void;
	onStatus?: (live: boolean) => void;
}): SquadChannel => {
	const channel = supabase().channel(`squad:${code}`, {
		config: { presence: { key: presenceKey }, broadcast: { self: false } }
	});

	if (nonNullish(onConfig)) {
		channel.on(
			'postgres_changes',
			{ event: 'UPDATE', schema: 'public', table: 'squad_config', filter: `code=eq.${code}` },
			(payload) => {
				const row = payload.new as { config?: Partial<SquadConfig>; updated_at?: string };
				onConfig({
					config: { ...DEFAULT_SQUAD_CONFIG, ...(row.config ?? {}) },
					updated_at: row.updated_at ?? new Date().toISOString()
				});
			}
		);
	}

	if (nonNullish(onResult)) {
		channel.on('broadcast', { event: RESULT_EVENT }, ({ payload }) =>
			onResult(payload as ResultBroadcast)
		);
	}

	if (nonNullish(onPresence)) {
		channel.on('presence', { event: 'sync' }, () => {
			const state = channel.presenceState<SquadPresence>();
			// Each key can hold several entries (two tabs of the same athlete): keep the newest.
			const latest = Object.values(state).flatMap((entries) =>
				entries.length > 0 ? [entries.reduce((a, b) => (a.since > b.since ? a : b))] : []
			);
			onPresence(latest);
		});
	}

	let live = false;
	channel.subscribe((status) => {
		live = status === 'SUBSCRIBED';
		onStatus?.(live);
	});

	return {
		track: async (presence) => {
			if (live) {
				await channel.track(presence);
			}
		},
		announceResult: async (payload) => {
			// Without a live socket the coach's poll picks the result up anyway.
			if (live) {
				await channel.send({ type: 'broadcast', event: RESULT_EVENT, payload });
			}
		},
		leave: () => {
			void supabase().removeChannel(channel);
		}
	};
};
