# Governance

## Truth hierarchy

1. The code (`src/**`, `supabase/migrations/**`, `scripts/**`).
2. CI workflows (`.github/workflows/**`).
3. This folder (`docs/ai/**`).
4. [`AGENTS.md`](../../AGENTS.md).
5. Tool-specific layers: `CLAUDE.md` and `.claude/` (Claude Code), `GEMINI.md` (Gemini CLI), `.github/copilot-instructions.md` (Copilot), `.cursor/rules/tempra.mdc` (Cursor), `.windsurfrules` (Windsurf), `.aider.conf.yml` (Aider). Codex, opencode and Continue read `AGENTS.md` directly. Each layer is a thin pointer and never contradicts 1 to 4; new substance lands in `docs/ai/` first, then the pointers are updated in the same PR.

A contradiction is fixed in the PR that found it, in the lower-ranked source.

## Allowed without asking

- Edit anything under `src/lib/**`, `src/routes/**`, `src/app.css`, `src/app.html`, `src/tests/**`.
- Add a game component under `src/lib/components/games/` and register it in `index.ts`, `GAME_KEYS`, both catalogs and `PRODUCT.md`.
- Add i18n keys to both catalogs.
- Update `docs/ai/**` when the meta-update rule fires.
- Run any `npm run …` script.

## Protected paths (change only when the task names them)

| Path                                                                          | Reason                                                                |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `.github/workflows/**`, `.github/dependabot.yml`                              | CI and deploy integrity; `ci(...)` PRs only.                          |
| `package.json` dependencies, `package-lock.json`                              | New or upgraded dependencies need an explicit ask.                    |
| `supabase/migrations/**`                                                      | Append-only history of the live database. Never edit an applied file. |
| `src/lib/constants/supabase.constants.ts`                                     | Project URL and publishable key. Rotate deliberately, never casually. |
| `static/CNAME`                                                                | The custom domain; DNS points here.                                   |
| `eslint.config.js`, `.prettierrc`, `tsconfig.json`                            | Lint, format and TS policy.                                           |
| `release-please-config.json`, `.release-please-manifest.json`, `CHANGELOG.md` | Owned by release-please.                                              |

## Forbidden

- Any secret in the repo: service-role keys, database passwords, tokens. The publishable key is the only key allowed and it is public by design.
- Disabling an eslint rule, suppressing a svelte-check warning or using `any` to get past a type.
- Force-pushing or rewriting shared history without an explicit, named ask.
- Reading or writing another coach's squad from the client without the coach key (the RPCs enforce it; do not add policies that bypass them).

## Meta-update rule

A PR that introduces a new pattern, shared component, game, remote parameter, workflow or policy updates the relevant page under `docs/ai/` in the same PR, with the smallest delta that keeps the next agent from rediscovering it. `PRODUCT.md` moves together with behaviour.
