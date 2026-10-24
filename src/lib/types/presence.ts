import type { GameKey } from '$lib/types/config';

export type PresenceStatus = 'idle' | 'block';

/** What each device announces on the squad channel; coaches read it as the live roster. */
export interface SquadPresence {
	role: 'athlete' | 'coach';
	name: string;
	status: PresenceStatus;
	game?: GameKey;
	since: string;
}

export interface ResultBroadcast {
	athlete: string;
	index: number;
	score: number;
	at: string;
}
