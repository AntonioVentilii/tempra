# PR and CI

## 1. PR title

Conventional Commits with a **required scope**: `type(scope): description`. The `pr-title` job rejects anything else. Verbs: `feat`, `fix`, `perf`, `refactor`, `style`, `docs`, `test`, `chore`, `build`, `ci`, `deps`, `revert`. Scopes in use: `games`, `session`, `coach`, `athlete`, `home`, `i18n`, `scoring`, `supabase`, `realtime`, `pages`, `ci`, `deps`, `ai` (for `docs/ai/**`), `release`.

Examples: `feat(games): add simon sequence`, `fix(realtime): resubscribe after reconnect`, `docs(ai): document the game contract`.

## 2. PR body

Follow [`.github/pull_request_template.md`](../../.github/pull_request_template.md): `# Motivation`, `# Changes`, `# Tests`. No hard-wrapped lines, no filler, no diff narration; write what the diff cannot say (why, trade-offs, what was left out). Tests are concrete: commands and outcomes, manual steps at 390px.

## 3. Atomicity

One logical change per PR. "And also" means split.

## 4. Local quality gates

```bash
npm run quality   # format (prettier --write, eslint --fix) then lint (prettier --check, eslint --max-warnings 0, i18n catalogs)
npm run check     # svelte-check against tsconfig.json
npm test          # node --test, TypeScript via --experimental-strip-types
npm run e2e       # Playwright, mocked Supabase (npm run e2e:install once)
npm run build     # vite build, static export to build/
npm run cap:sync  # build + copy into android/ and ios/ (only when touching the shells)
```

## 5. What CI runs

[`checks.yml`](../../.github/workflows/checks.yml): `pr-title`, `site` (npm ci, lint, check, test, build, and asserts `build/index.html`, `build/404.html`, `build/athlete.html`, `build/coach.html` and `build/CNAME` = `tempra.ventilii.dev`) and `e2e` (Playwright against the mocked Supabase). `checks-pass` is the single required status.

[`mobile.yml`](../../.github/workflows/mobile.yml): Android debug APK (uploaded as a run artifact) and an unsigned iOS simulator build, on every PR and push to `main`. Not part of `checks-pass` yet; promote it once the first store build exists.

## 5a. Branch ruleset

[`.github/rulesets/main.json`](../../.github/rulesets/main.json) is the ruleset for `main`, exported in GitHub's import format: pull request required, squash only, review threads resolved, `checks-pass` required and up to date, no deletion, no force push; repository admins bypass. Import it from Settings → Rules → Rulesets → New ruleset → Import a ruleset. Keep the file and the live ruleset in sync.

## 6. Deploy

[`deploy.yml`](../../.github/workflows/deploy.yml) runs on every push to `main`: builds and publishes `build/` to GitHub Pages at https://tempra.ventilii.dev. Pages must be configured once in the repository settings (source: GitHub Actions, custom domain `tempra.ventilii.dev`, enforce HTTPS). DNS: `tempra.ventilii.dev CNAME antonioventilii.github.io` at Namecheap.

## 7. Release

[`release-please.yml`](../../.github/workflows/release-please.yml) keeps a release PR open on `main`; merging it bumps `package.json`, regenerates `CHANGELOG.md` and tags `vX.Y.Z`. It is bookkeeping: the deploy already happened on merge. Needs the `RELEASE_BOT_APP_ID` variable and `RELEASE_BOT_PRIVATE_KEY` secret (av-automation app), as in the sibling repos.

## 8. Database changes

Write a new file under `supabase/migrations/` named `YYYYMMDDHHMMSS_<snake_case>.sql`, apply it to the `tempra` project (Supabase MCP `apply_migration` or the dashboard SQL editor), and describe the applied state in the file header. Never edit an applied migration.

## 9. Commits

Squash merges; the PR title becomes the commit. No AI attribution lines in commits or PR bodies.
