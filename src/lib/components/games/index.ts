import Arithmetic from '$lib/components/games/Arithmetic.svelte';
import Flanker from '$lib/components/games/Flanker.svelte';
import GoNoGo from '$lib/components/games/GoNoGo.svelte';
import NBack from '$lib/components/games/NBack.svelte';
import Stroop from '$lib/components/games/Stroop.svelte';
import Trail from '$lib/components/games/Trail.svelte';
import type { GameKey } from '$lib/types/config';
import type { GameProps } from '$lib/types/game';
import type { Component } from 'svelte';

export const GAME_COMPONENTS: Record<GameKey, Component<GameProps>> = {
	stroop: Stroop,
	gonogo: GoNoGo,
	nback: NBack,
	flanker: Flanker,
	math: Arithmetic,
	trail: Trail
};
