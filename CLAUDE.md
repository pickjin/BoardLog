# CLAUDE.md

All agent rules live in AGENTS.md (D-039). This file only adds Claude Code specifics.

@AGENTS.md

## Running the serverless function locally

`api/scan-games.ts` is a Vercel serverless function; `npm run dev` does not run it. To exercise it:
`vercel link` (project: `boardlog`), `vercel env pull .env.local`, then `vercel dev`.

## Deployment facts

- Vercel project `boardlog`, team `wlstkden-6327s-projects`. Production domain:
  `boardlog-blush.vercel.app`. `main` auto-deploys to production.
- `GEMINI_API_KEY` is required; `GEMINI_MODEL` optionally pins a model id instead of the fallback
  list in `api/scan-games.ts`. Per D-037 the key belongs in Production and Development only; removing
  it from Preview is an owner task (TBD-016).
- Vercel MCP tools may be available in a session. Use them to read deployments and logs. Changing
  project settings or env vars is forbidden for agents (AGENTS.md, D-038).

## Plan and where we are (update at every milestone step)

Order (D-041): **M0 foundation → M1 measurement → 4-week gate → M2**. Details: [09-roadmap](docs/design/09-roadmap.md).

| Step | Status (2026-10-30) |
|---|---|
| Design session (D-001..D-043, TBD-001..016) | Done |
| PR #1: design docs + unshipped features (empty start / sample removal, PWA, share link) | Open, **waiting for owner's explicit merge instruction**. One-time D-038 exception (no CI yet), evidence: lint, build, qa-evidence 97/97 |
| M0 PR1: npm lockfile, dependency cleanup, scripts, `.env.example`, minimal CI | Next, after PR #1 merges |
| M0 PR2: React types + `strict`, fix the 4 bugs | — |
| M0 PR3: Biome (config / full format / fixes as 3 commits) | — |
| M0 PR4: Vitest + tests for existing pure functions | — |
| M0 PR5: Playwright Test, migrate qa-evidence scripts | — |
| M1: `analytics.ts` + FR-MEAS-02 events, Vercel Web Analytics | — |
| Gate (4 weeks after M1): ≥30 users with `play_saved` AND ≥30% iOS Safari AND 7-day wipe confirmed → M2 = cloud backup; else hub or share-link growth | — |

Owner tasks, by priority: TBD-006 real-iPhone test (Safari tab + home-screen app, 8 days unopened)
→ TBD-004 GA4 property → TBD-014 `main` protection with required check `ci` (after M0 PR1) →
TBD-015 repo visibility / Actions quota → TBD-016 remove `GEMINI_API_KEY` from Preview.

## Known state (2026-10-30)

- **Design session is closed (D-001..D-043). Implementation started with milestone M0**
  ([09-roadmap](docs/design/09-roadmap.md)): five PRs, CI first (D-042). No other feature work during M0.
- No backend in code yet. A Supabase cloud backup is designed (D-010, 04-architecture, ADR-002).
  ADR-001 (platform) stays Proposed until TBD-013 (Supabase facts) is verified; supabase.com may be
  blocked by the session network policy.
- First implementation tasks already decided: npm lockfile (D-021), React types + `strict` and the 4
  bugs it exposes (D-025), Biome with a separate format commit (D-026), unused dependency removal and
  `clean` script fix (D-028), migrating `docs/design/qa-evidence/*.mjs` to Playwright Test (D-029),
  rewriting the stale AI Studio `.env.example` (07 §7.4).
- `main` branch protection is not on yet (TBD-014). Until it is, the merge rules in AGENTS.md are
  enforced only by agents following them.
- The Gemini photo scan shows intermittent provider-side instability (success / 503 / "not found"
  for a listed model). Retries and classification exist; it cannot be fully fixed from our side.
- iOS Safari's 7-day storage cap is the reason for the backend; it is not yet verified on a current
  device (TBD-006).
