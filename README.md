# Tempra

Cognitive-load games for athletes, played during the recovery breaks between sets. The coach controls difficulty and every other parameter from their own phone; athletes receive the new settings in real time, without accounts or passwords.

Live at https://tempra.ventilii.dev (GitHub Pages), plus Android and iOS apps built from the same code with Capacitor. Backend: Supabase project `tempra` (Postgres + Realtime, eu-central-2).

## What it does

- **Six games**, each tuned over five difficulty levels: Stroop (inhibition), Go / No-Go (impulse control), N-back (working memory), Flanker (selective attention), Arithmetic (processing speed), Trail (visual scanning).
- **Recovery blocks** of 60 to 240 seconds. The athlete taps start when the rest begins; games rotate every 20 to 60 seconds until the block ends on its own.
- **Remote parameters**: difficulty, which games, block and game duration, time pressure, visual distractors, error penalty, auto-adaptation, and a message to the squad. Published by the coach, delivered live.
- **Live roster**: the coach sees who is online, who is in a block and which game they are playing, as it happens.
- **Track record**: every block is scored (points, accuracy, mean reaction time, a composite Tempra index); each athlete has a history chart and table in the coach panel, with a trend over the last blocks.
- **Works offline**: the app shell is cached, results that cannot be sent wait in an outbox.

## How it is used

1. The coach opens `/coach`, creates a squad and gets a six-character code plus a coach link (the link holds the only credential: keep it).
2. Athletes open `/athlete`, type the code and their name. The join link `/athlete?code=XXXXXX` does the typing for them.
3. During training the coach adjusts parameters and publishes; the athlete's screen updates within a second.

## Development

```bash
npm ci
npm run dev        # http://localhost:5173
npm run quality    # prettier + eslint + i18n catalog check
npm run check      # svelte-check
npm test           # unit tests
npm run e2e        # Playwright against a mocked Supabase (npm run e2e:install once)
npm run build      # static export in build/
npm run cap:sync   # copy the build into the Android and iOS projects
```

Identity (logo, palette, type, screens) lives on the Claude Design canvas linked from `docs/ai/frontend/README.md`. Node version in `.node-version`. Agents: start from [`AGENTS.md`](./AGENTS.md); the long-form docs live under [`docs/ai/`](./docs/ai/).

## Mobile

`android/` and `ios/` are Capacitor shells around `build/`. Open them with `npm run cap:android` (Android Studio) or `npm run cap:ios` (Xcode). CI assembles a debug APK on every change ([`.github/workflows/mobile.yml`](./.github/workflows/mobile.yml)); store builds need signing credentials and are a later step.

## Deploy

Every push to `main` builds the static site and publishes it to GitHub Pages ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)). `static/CNAME` pins the custom domain; the DNS record is a CNAME from `tempra.ventilii.dev` to `antonioventilii.github.io`. Versioning and the changelog are handled by release-please from Conventional Commit PR titles.

The database schema and RPCs are in [`supabase/migrations/`](./supabase/migrations/); see [`docs/ai/backend/README.md`](./docs/ai/backend/README.md) for the security model.
