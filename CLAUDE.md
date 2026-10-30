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

## Known state (2026-10-30)

- **Design session D-001..D-039 is done through PHASE 8; implementation has not started.** Do not
  write application code until the owner explicitly starts implementation.
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
