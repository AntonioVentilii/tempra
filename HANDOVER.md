# HANDOVER

Read this before anything else, then [`AGENTS.md`](./AGENTS.md). Delete this file (and the pointer at the top of `AGENTS.md`) in a `docs(ai): ...` PR once every box below is ticked.

## Context

On 2026-10-24 Antonio Ventilii (`AntonioVentilii`) transferred this repository to Enrica Cipolloni (`EnricaCipolloni`) and made it private. Enrica is the owner; Antonio stays on as an Admin collaborator and keeps maintaining the code. Talk to Enrica in Italian.

Everything that was tied to Antonio's account has to be re-created or re-pointed on Enrica's side. The code itself needs no change for the transfer.

## 1. Check the GitHub plan first

Several features of a **private** repository depend on the owner's plan, and Antonio's account and Enrica's account may not be on the same one. Find out which plan Enrica's account has (github.com/settings/billing) before doing anything else.

| Feature on a private repo                             | GitHub Free   | GitHub Pro |
| ----------------------------------------------------- | ------------- | ---------- |
| GitHub Pages (the website and `deploy.yml`)           | Not available | Available  |
| Rulesets (`.github/rulesets/main.json`)               | Not available | Available  |
| Actions minutes per month                             | 2,000         | 3,000      |
| macOS runner (`mobile.yml` iOS job) minute multiplier | 10x           | 10x        |

If Enrica is on Free, the website at https://tempra.ventilii.dev stops deploying and the ruleset cannot be imported. Ask her to pick one, and do not work around it silently:

1. **Upgrade to GitHub Pro** (about 4 USD per month). Nothing else changes. Recommended.
2. **Make the repository public again.** Pages, rulesets and Actions minutes are free on public repos. The code becomes visible to everyone.
3. **Host the site elsewhere** (Cloudflare Pages or Netlify, both free with private repos). This needs a new deploy setup in place of `deploy.yml` and a different DNS record; it is a `ci(pages): ...` PR of its own.

The iOS job in `mobile.yml` runs on every PR and push to `main` and costs 10 minutes of quota per minute it runs. If minutes run short, limit it to `push` on `main` and tags in a `ci(mobile): ...` PR.

## 2. Repository settings (Enrica, in the GitHub UI)

- [ ] Accept the transfer from the GitHub email.
- [ ] Settings → Collaborators → add `AntonioVentilii` with the **Admin** role. Until then Antonio cannot see the private repo.
- [ ] Settings → Pages → Source **GitHub Actions**, custom domain `tempra.ventilii.dev`, **Enforce HTTPS** (needs Pro or a public repo, see section 1).
- [ ] Settings → Rules → Rulesets → New ruleset → Import a ruleset → [`.github/rulesets/main.json`](./.github/rulesets/main.json) (needs Pro or a public repo).
- [ ] Release bot, see section 3.
- [ ] Tell Antonio when this section is done.

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

Automating store builds in CI (signed AAB and IPA as artifacts, or upload with fastlane) is a later `ci(mobile): ...` PR. It needs the keystore, the Apple certificates and API keys as repository secrets, and on a private repo the macOS minutes from section 1.

## 7. State at handover

- `main` is green; CI is `checks.yml` (`checks-pass` is the only required status), `deploy.yml`, `mobile.yml`, `release-please.yml`.
- The standing release PR `chore(release): v0.1.1` may be open: merging it only tags a release and updates `CHANGELOG.md`; the deploy already happens on every merge to `main`.
- No licence file: the repo is private and all rights are reserved. Add one only if Enrica decides to open it up.
