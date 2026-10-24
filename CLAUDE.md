# CLAUDE.md

Claude-specific runtime layer. [`AGENTS.md`](./AGENTS.md) is the canonical entry for all agents and [`docs/ai/`](./docs/ai/) is the source of truth; this file only adds Claude-only hints.

> **Mandatory first step:** read [`AGENTS.md`](./AGENTS.md), then the area page you are about to touch ([`docs/ai/frontend/README.md`](./docs/ai/frontend/README.md) or [`docs/ai/backend/README.md`](./docs/ai/backend/README.md)).

## Before declaring done

```bash
npm run quality   # prettier --write + eslint --fix, then prettier --check + eslint + i18n catalogs
npm run check     # svelte-check: zero errors, zero warnings
npm test          # node --test over src/tests
npm run build     # static export must succeed (CI also asserts build/CNAME)
```

## Easy-to-miss rules

- Props read at component top level must go through `$derived`; `svelte-check` reports `state_referenced_locally` otherwise and CI treats the repo as warning-free.
- A new remote parameter touches four places in one PR: `SquadConfig` type, `DEFAULT_SQUAD_CONFIG`, `default_squad_config()` in a new migration under `supabase/migrations/`, and `ConfigForm.svelte` (plus both locale catalogs and `PRODUCT.md`).
- The Supabase publishable key in `src/lib/constants/supabase.constants.ts` is public by design. Never add a service-role key anywhere in this repo.
- Never add AI attribution to commits or PRs; no em dashes in prose.
- Ask before using a spec-first workflow for a net-new feature; for small changes implement directly.
