import type { SquadPresence } from '$lib/types/presence';
import type { RemoteResult } from '$lib/types/result';
import { nonNullish } from '$lib/utils/nullish.utils';

export type Trend = 'up' | 'down' | 'flat';

export interface AthleteSummary {
	name: string;
	blocks: number;
	lastAt: string | undefined;
	lastIndex: number | undefined;
	meanAccuracy: number;
	meanIndex: number;
	/** Indices in chronological order, for the sparkline. */
	indices: number[];
	trend: Trend;
	presence: SquadPresence | undefined;
}

const TREND_WINDOW = 3;
const TREND_MIN_DELTA = 3;

export const indexOf = (row: RemoteResult): number | undefined => row.params?.index;

export const trendOf = (indices: number[]): Trend => {
	if (indices.length < TREND_WINDOW * 2) {
		return 'flat';
	}

	const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
	const recent = mean(indices.slice(-TREND_WINDOW));
	const before = mean(indices.slice(-TREND_WINDOW * 2, -TREND_WINDOW));
	const delta = recent - before;

	return delta >= TREND_MIN_DELTA ? 'up' : delta <= -TREND_MIN_DELTA ? 'down' : 'flat';
};

/**
 * One row per athlete: everyone who ever submitted a block, plus anyone
 * currently present on the channel even with no block yet. Results arrive
 * newest first from `list_results`.
 */
export const buildRoster = ({
	results,
	presences
}: {
	results: RemoteResult[];
	presences: SquadPresence[];
}): AthleteSummary[] => {
	const byName = new Map<string, RemoteResult[]>();

	for (const row of results) {
		byName.set(row.athlete, [...(byName.get(row.athlete) ?? []), row]);
	}

	for (const p of presences) {
		if (p.role === 'athlete' && !byName.has(p.name)) {
			byName.set(p.name, []);
		}
	}

	const roster = [...byName.entries()].map(([name, rows]): AthleteSummary => {
		const chronological = rows.slice().reverse();
		const indices = chronological.map(indexOf).filter(nonNullish);
		const accuracies = chronological.map((r) => Number(r.accuracy));
		const mean = (xs: number[]) => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

		return {
			name,
			blocks: rows.length,
			lastAt: rows[0]?.created_at,
			lastIndex: indices.at(-1),
			meanAccuracy: mean(accuracies),
			meanIndex: Math.round(mean(indices)),
			indices,
			trend: trendOf(indices),
			presence: presences.find((p) => p.role === 'athlete' && p.name === name)
		};
	});

	// Live first, then by most recent block.
	return roster.sort((a, b) => {
		const liveA = a.presence?.status === 'block' ? 2 : nonNullish(a.presence) ? 1 : 0;
		const liveB = b.presence?.status === 'block' ? 2 : nonNullish(b.presence) ? 1 : 0;

		if (liveA !== liveB) {
			return liveB - liveA;
		}

		return (b.lastAt ?? '').localeCompare(a.lastAt ?? '');
	});
};
