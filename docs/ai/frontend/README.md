# Frontend

SvelteKit 2, Svelte 5 (runes), TypeScript, Tailwind 4, static adapter with `404.html` fallback, `ssr = false` (state lives in the browser).

## Folder taxonomy (closed)

```
src/
  app.css                     design tokens (dark-first), @theme bridge to Tailwind, shared primitives
  app.html                    fonts (Barlow / Barlow Condensed from Google Fonts), manifest, favicon
  routes/
    +layout.svelte            header (brand, Athlete / Coach tabs), footer (locale switch, version), Toast
    +page.svelte              landing
    athlete/+page.svelte      join form → home card → BlockRunner → BlockSummary
    coach/+page.svelte        create / restore → squad card + ConfigForm + ResultsTable
  lib/
    components/
      games/                  one component per game + index.ts (GAME_COMPONENTS)
      session/                BlockRunner, BlockSummary, TrialTimer, Distractors
      coach/                  Roster, AthleteHistory, ConfigForm, ResultsTable
      ui/                     Brand, Kpi, Toast, Sparkline
    constants/                config, locale, supabase, messages/{it,en}.ts
    services/                 supabase.service (lazy client), squad.service (RPC wrappers), realtime.service (channel: config, presence, result broadcast)
    stores/                   locale, squad (athlete side), coach, results (local history), outbox (unsent results), toast
    types/                    config, result, game, presence
    utils/                    i18n, nullish, random, scoring, roster, storage, time, trial, device
  service-worker.ts           offline shell (cache-first assets, network-first pages)
  tests/                      node --test specs, `$lib/...` imports resolved by scripts/test/lib-resolver.mjs
e2e/                          Playwright specs + supabase-mock.ts (every RPC intercepted, no network)
android/, ios/                Capacitor shells; `npm run cap:sync` copies build/ into them. Generated web assets inside them are gitignored.
```

New code goes into the folder that already owns the concern. No new top-level folders without an explicit ask.

## Svelte 5 patterns

- `let { a, b }: Props = $props();` with a named `interface Props`. Anything computed from a prop at top level is `$derived(...)`; a plain `const` freezes the initial value and `svelte-check` warns (`state_referenced_locally`). Initial `$state` seeded from a prop uses `untrack(() => ...)` and an `$effect` that resyncs.
- Event handlers are attributes: `onclick={...}`, `onsubmit={(e) => { e.preventDefault(); ... }}`.
- Dynamic components: `const Game = $derived(GAME_COMPONENTS[key]); <Game {...props} />`.
- Stores from `svelte/store` are used for cross-route browser state (`$localeStore`, `$squadStore`); runes for component-local state.
- A form that edits a copy of a prop (`ConfigForm`) seeds `$state` with `untrack(() => clone(prop))` and is remounted by its parent with `{#key}` when the server value changes; no `$effect` resync (eslint forbids the `$state` + `$effect` pair).
- Selectors for tests: `data-tid="..."` attributes (Playwright `testIdAttribute`), never CSS classes.
- Timers and async loops start in `onMount` and are torn down in its return. `$effect` is reserved for subscriptions that must restart when a dependency changes (the realtime channel keyed by squad code, the coach results poll).

## The game contract

A game is a component with `GameProps`:

```ts
interface GameProps {
	difficulty: Difficulty; // 1..5, fixed for the mount
	timePressure: boolean; // show TrialTimer and fail a trial on expiry
	onTrial: (outcome: { correct: boolean; rt_ms: number | null }) => void;
}
```

- Read ladders with `ladder([l1, l2, l3, l4, l5], difficulty)`; keep the five values next to the game so the tuning is visible.
- Run the trial loop in `onMount`; await a `createTrialGate()` per trial so taps and the timer race cleanly; `gate.answer(null)` in cleanup.
- Report `rt_ms` only for correct trials (mean RT is over correct answers).
- Render `TrialTimer` inside `{#key trialId}` so the bar restarts per trial.
- BlockRunner owns the slot clock and unmounts the game when the slot ends. A game never knows how long it runs.
- Register in `GAME_COMPONENTS`, add the key to `GAME_KEYS`, add `game.<key>.name|hint|about` to both catalogs, document the ladder in `PRODUCT.md`.

## i18n

`t({ locale: $localeStore, key, values })` from `$lib/utils/i18n.utils`. Keys are flat dotted strings typed from the Italian catalog (`I18nKey`); `en.ts` is `Record<I18nKey, string>` so TypeScript catches drift, and `scripts/check-locale-catalogs.mjs` catches it in `npm run lint` without a TS build. Placeholders are `{name}`. Italian is the default locale; the browser language picks English when it starts with `en`.

## Design tokens

Identity lives on the Claude Design canvas "Tempra Brand" (https://claude.ai/artifact/6JbvJwk8r5RqrwRJybdYn2): marchio, palette, caratteri, tre schermate. The code mirrors it in `src/app.css`:

- Ground: asphalt `--bg` #0B0C0F, `--bg-2` #15171C, `--bg-3` #1F2229, chalk `--fg` #F5F6F2, `--fg-2` #9BA1A6, `--line` #2A2E36.
- Accent: volt `--accent` #CCFF00 (buttons, code, active tab, progress), `--accent-2` lighter volt for small text on dark, `--cool` #8AB4FF for charts only. Semantic `--ok`, `--warn`, `--bad` are never used as the accent.
- Light theme under `prefers-color-scheme: light`: volt stays on buttons (dark text on it), `--accent-2` turns to a dark olive so small volt text keeps contrast.
- Type: Saira Extra Condensed 800 italic for headings, numbers, codes (always uppercase); Saira 400 to 600 for body and tables; `.tnum` wherever digits line up.
- Shapes: no radius, no gradient, no shadow. Buttons are bibs: slanted edges with `clip-path`, text upright. Cards carry a 3px top rule (`.card`, volt with `.card-accent`). Status is a left rule on a `.badge`. The block progress is `.track`: lane stripes under a volt fill.
- The mark (`Brand.svelte`, `static/logo.svg`, `favicon.svg`, `icon-512.svg`): a slanted T whose stem is a pulse spike. Drawn as two shapes, 13% stroke, readable at 16px. Never outlined, never shadowed, never recoloured outside volt / asphalt / chalk.

## Accessibility

Real `<button>` / `<a>` elements, labelled inputs (`for` / `id`), `role="status"` on the toast, `aria-label` on icon-only or colour-only controls (Stroop buttons carry the colour name). Respect `prefers-reduced-motion` (all transitions off).

## Testing

- Unit: `npm test` runs `node --test` over `src/tests/*.test.ts` with TypeScript stripped on the fly. Pure modules only (scoring, roster, i18n, trial gate). Keep logic that deserves a test out of components.
- E2E: `npm run e2e` (Playwright, chromium desktop + Pixel 7, locale `it-IT`, dev server on 5173). `e2e/supabase-mock.ts` intercepts every call to the Supabase host and plays the RPC contract back, so the suite is deterministic and never touches the live project. Mock state is per test; set `state.config` before `page.goto`.
- Locally without a Playwright download: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test` where that folder exists; otherwise `npm run e2e:install` once.

## Native shells

`capacitor.config.ts` points both shells at `build/`. `npm run cap:sync` builds the web app and copies it in; `npm run cap:android` / `npm run cap:ios` also open the IDE. CI (`mobile.yml`) assembles a debug APK and compiles the iOS project unsigned on every PR. Icons and splash screens are still the Capacitor defaults.
