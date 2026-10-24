# Copilot instructions

This repository is documented for agents in [`AGENTS.md`](../AGENTS.md) (canonical entry) and [`docs/ai/`](../docs/ai/) (source of truth). Read `AGENTS.md` first and follow its commandments: Svelte 5 runes only, `$derived` for anything computed from a prop, game loops in `onMount`, `isNullish` / `nonNullish` instead of direct null checks, every user-visible string through `t({ locale, key })` in both catalogs, imports through `$lib/...`, mobile first at 390px, no AI attribution in commits or PRs, no em dashes in prose.

PR titles are Conventional Commits with a required scope (`feat(games): ...`). PR bodies follow [`pull_request_template.md`](./pull_request_template.md). Gates before done: `npm run quality`, `npm run check`, `npm test`, `npm run e2e`, `npm run build`.
