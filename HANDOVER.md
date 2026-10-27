# HANDOVER

Read this before anything else, then [`AGENTS.md`](./AGENTS.md). Delete this file (and the pointers at the top of `AGENTS.md` and `CLAUDE.md`) in a `docs(ai): ...` PR once every box below is ticked.

## Context

On 2026-10-24 Antonio Ventilii (`AntonioVentilii`) transferred this repository to Enrica Cipolloni (`EnricaCipolloni`). Enrica is the owner; Antonio stays on as a collaborator and keeps maintaining the code. On a personal account a collaborator cannot be made Admin (roles exist only in organisations): Antonio can push, open and merge PRs, but every setting, secret and ruleset change is Enrica's. Talk to Enrica in Italian.

Enrica's account is on **GitHub Free** and stays there. On Free a private repository gets neither GitHub Pages nor rulesets, so the decision is: **the repository is public**, under the MIT licence. Do not suggest upgrading the plan again.

Before it went public the repo had a security audit: no secrets anywhere in the git history (gitleaks over every commit; the only hit is the Supabase publishable key, public by design), no keystores or provisioning files, no personal data beyond the commit author emails, workflows with `permissions: {}` and actions pinned by SHA. The fixes it produced are listed in section 1.

## 1. Before the switch to public (Antonio)

- [x] Merge `chore(repo): MIT license and security policy`.
- [x] Merge `fix(coach): drop the coach key from the address bar after restoring`.
- [x] Merge `fix(supabase): drop direct table grants and bound RPC payloads` and apply its migration to the live project, then write the applied date in its header.
- [ ] Rotate the private key of the `av-automation` GitHub App (github.com/settings/apps). Not a blocker: Enrica overwrote `RELEASE_BOT_PRIVATE_KEY` with her own app's key on 2026-10-25, so the old key is no longer stored here; rotating is hygiene for Antonio's other repos.

## 2. Repository settings (Enrica)

Each step is a GitHub setting. An agent can do most of them with `gh api` once Enrica is logged in to `gh` with her own account; creating the GitHub App in section 3 has to happen in the browser.

- [x] Accept the transfer from the GitHub email.
- [ ] Settings → General → Danger Zone → **Change visibility → Public**. Section 1 is done apart from the non-blocking key rotation.
- [ ] Settings → Pages → Source **GitHub Actions**, custom domain `tempra.ventilii.dev`, **Enforce HTTPS**.
- [ ] Settings → Rules → Rulesets: the `main` ruleset came over with the transfer but was dormant while the repo was private on Free. Check that it is listed and **Active**. If it is missing, import [`.github/rulesets/main.json`](./.github/rulesets/main.json) (New ruleset → Import a ruleset).
- [ ] Settings → Code security: turn on **Private vulnerability reporting** (the channel `SECURITY.md` points to), **Dependabot alerts**, **Dependabot security updates**, **Secret scanning** with **Push protection**, and **CodeQL** default setup. All free on public repos.
- [ ] Settings → Actions → General: "Approval for running fork pull request workflows" → **Require approval for all external contributors**; "Workflow permissions" → **Read repository contents**; leave "Allow GitHub Actions to create and approve pull requests" **off**.
- [x] Release bot, see section 3 (Enrica's own app, workflow green on 2026-10-25).
- [ ] Tell Antonio when this section is done.

Being public also means anyone can open issues and pull requests, and forks can run `checks.yml` and `mobile.yml` (no secrets are exposed to them). Every past PR, its comments and the commit author emails become visible.

## 3. Release bot (release-please)

[`release-please.yml`](./.github/workflows/release-please.yml) runs as a GitHub App, because events created with the default `GITHUB_TOKEN` do not trigger the checks on the release PR. It reads the `RELEASE_BOT_APP_ID` variable and the `RELEASE_BOT_PRIVATE_KEY` secret.

Until now that app was `av-automation`, which belongs to Antonio, is not public (so it cannot be installed on Enrica's account) and also serves Antonio's other repositories. Its private key must **not** be handed over: whoever holds it can act on every repo where Antonio installed the app.

What to do instead:

- [ ] Enrica creates her own GitHub App (Settings → Developer settings → GitHub Apps → New GitHub App): any name, webhook off, repository permissions **Contents: Read and write**, **Issues: Read and write**, **Pull requests: Read and write**, installable "Only on this account".
- [ ] Generate a private key for it (downloads a `.pem`) and install the app on `EnricaCipolloni/tempra` only.
- [ ] Repo Settings → Secrets and variables → Actions: variable `RELEASE_BOT_APP_ID` = the new app's ID, secret `RELEASE_BOT_PRIVATE_KEY` = the full content of the `.pem`. Overwrite any value carried over from the old owner.
- [ ] Re-run the "Release Please" workflow from the Actions tab and check that it opens or updates the `chore(release): vX.Y.Z` PR.

No code change is needed: the workflow only reads the variable and the secret.

## 4. Domain and DNS (Antonio)

- [ ] At Namecheap, change `tempra.ventilii.dev CNAME antonioventilii.github.io` to `tempra.ventilii.dev CNAME enricacipolloni.github.io`, after Enrica has set the custom domain in Pages.
- [ ] If `ventilii.dev` is a verified domain in Antonio's account (github.com/settings/pages), GitHub may block another account from using its subdomains. Either keep it verified and confirm the site still serves, or remove the verification for this subdomain.
- [ ] Update the DNS line in [`docs/ai/pr-and-ci.md`](./docs/ai/pr-and-ci.md) section 6 to `enricacipolloni.github.io`.

The domain stays Antonio's; `static/CNAME` and the CI assertion on `build/CNAME` do not change. If Enrica later wants her own domain, that is a change to `static/CNAME`, `checks.yml`, `deploy.yml`, `AGENTS.md` and `docs/ai/`, in one PR.

## 5. Supabase

The backend project `tempra` (ref `znhomweyvdkkhvgcnvdc`) lives in Antonio's Supabase organisation and keeps working unchanged after the GitHub transfer; nothing in the repo points to a GitHub owner. Decide with Enrica whether to:

- leave it in Antonio's organisation and invite her as a member (no downtime), or
- transfer the project to an organisation she owns (Supabase dashboard → Project settings → General → Transfer project). The URL and the publishable key stay the same.

Never add a service-role key or database password to the repo, whoever owns the project.

## 6. Publishing the Android and iOS apps

Nothing is in the stores yet. CI builds only a debug APK and an unsigned iOS simulator build (`mobile.yml`). The store accounts belong to Enrica, since she publishes the app.

Decide first:

- [ ] **App ID.** It is `dev.ventilii.tempra` (Antonio's domain) in `capacitor.config.ts`, `android/app/build.gradle` and the iOS project. It can still change, but once the first build is submitted to a store it is fixed forever. If Enrica wants her own (for example a reverse domain she owns), change it in all three places in one PR **before** the first submission.

Google Play:

- [ ] Google Play Console developer account in Enrica's name (one-time 25 USD, identity verification).
- [ ] New personal accounts must run a closed test with at least 12 testers for 14 consecutive days before they can publish to production. Plan for it.
- [ ] Create an upload keystore, keep it and its passwords outside the repo (password manager plus a backup), enrol in Play App Signing.
- [ ] Build a signed release AAB (`npm run cap:sync`, then `./gradlew bundleRelease` in `android/` with the signing config from environment variables, never committed).

Apple App Store:

- [ ] Apple Developer Program in Enrica's name (99 USD per year).
- [ ] Register the bundle ID, create the app in App Store Connect, archive from Xcode on a Mac (`npm run cap:ios`) and upload; TestFlight first.

Both stores:

- [ ] A privacy policy URL (the app stores athlete display names and game results in Supabase, see [`docs/ai/backend/README.md`](./docs/ai/backend/README.md)). A page on the site itself works.
- [ ] Data safety (Play) and App Privacy (Apple) forms answered from the same facts.
- [ ] Store listing: name, descriptions in it and en, screenshots at phone sizes, icon.

Every release already attaches the APK, AAB and IPA built by [`release-assets.yml`](./.github/workflows/release-assets.yml); until the signing secrets exist they are a debug APK and an unsigned IPA. Once the keystore and the Apple distribution certificate and profile exist, Enrica adds them as the repository secrets listed in [`docs/ai/pr-and-ci.md`](./docs/ai/pr-and-ci.md) section 7 and the next release is signed. Uploading to the stores (fastlane, App Store Connect API key) is a later `ci(mobile): ...` PR. Secrets are never exposed to fork pull requests, so this stays safe on a public repo.

## 7. State at handover

- `main` is green; CI is `checks.yml` (`checks-pass` is the only required status), `deploy.yml`, `mobile.yml`, `release-please.yml`.
- `v0.1.1` is tagged. release-please keeps the next release PR open; merging it only tags a release and updates `CHANGELOG.md`, the deploy already happens on every merge to `main`.
- Licence: MIT ([`LICENSE`](./LICENSE)). Security reports: [`SECURITY.md`](./SECURITY.md).
