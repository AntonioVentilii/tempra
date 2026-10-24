# Security policy

## Reporting a vulnerability

Please do not open a public issue. Use **Report a vulnerability** on the repository's Security tab (GitHub private vulnerability reporting), with the steps to reproduce and what an attacker gains. You will get an answer within a week.

## Scope

Tempra is a static site plus a Supabase project. There are no user accounts:

- A **squad code** (six characters) is meant to be shared with the athletes of that squad. Anyone holding it can read the squad name and parameters and submit results to it.
- The **coach key** is the only credential. It is created in Postgres, returned once to the coach and checked by every coach RPC.
- The Supabase **publishable key** in `src/lib/constants/supabase.constants.ts` is public by design.

In scope: anything that reads results, changes a squad's parameters or obtains a coach key without holding that coach key; anything that bypasses the RPCs to read or write tables directly; script injection in the site or the apps.

Out of scope: someone who has a squad code submitting results to that squad; volumetric abuse of the public endpoints.

The security model is described in [`docs/ai/backend/README.md`](./docs/ai/backend/README.md).
