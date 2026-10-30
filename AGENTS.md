# AGENTS.md

Rules for any AI coding agent working in this repository (Claude Code, Codex, Cursor, Gemini CLI, …).
This file is the single source of agent rules (D-039). Keep it under 150 lines; put rationale in
`docs/design/` and link to it. When a design decision changes a rule here, update this file in the
same PR.

## Commands

| Command | Status | What it does |
|---|---|---|
| `npm run dev` | now | Vite dev server on :3000. Does NOT serve `/api/*` (use `vercel dev`) |
| `npm ci` | now | Install exactly from `package-lock.json` (npm only, D-021; Node 24.x) |
| `npm run build` | now | Production build (does not type-check) |
| `npm run typecheck` | now | `tsc --noEmit` with `strict` |
| `npm run lint` | now | `npm run typecheck` + `biome check --error-on-warnings` (code files only; Markdown and CSS are not formatted) |
| `npm run check:secrets` | now | Scan `dist/` for server secrets after `build` (D-037) |
| `npm run format` | now | `biome format --write` |
| `npm test` | now | Vitest unit tests with coverage; 100% branch coverage required for `sharedPlay.ts` and `backupImport.ts` (D-030) |
| `npm run test:e2e` | now | Builds, then runs Playwright Test against `vite preview` (`e2e/*.spec.ts`). Needs Chromium: `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_PATH` |
| `npm run test:db` | planned (D-031) | Local Supabase policy tests |

Run every check that exists before saying work is done. Report failures with their output.

## Product and architecture in one paragraph

BoardLog is a Korean board-game play log and collection PWA (React 19, Vite, TypeScript, Tailwind),
deployed on Vercel from `main`. All user data lives in the browser (IndexedDB, localStorage
fallback). A Supabase cloud backup is designed but **not built**: see
[04-architecture](docs/design/04-architecture.md) and [ADR-002](docs/design/adr/ADR-002-cross-device-merge.md).
`api/scan-games.ts` (Gemini vision proxy) is the only server code today.

## Invariants (breaking these caused real bugs before)

1. **All device persistence goes through `src/services/storage.ts`.** Components never touch
   IndexedDB or localStorage directly. Server access (when built) goes only through
   `src/services/cloud/`, which still reads/writes device data via `storage.ts`.
2. **Every by-id read/update/delete checks ownership** (`record.userId === uid`, `idbReadOwned`).
   Stores are shared across accounts. Verify with a multi-account test, never a single-user one.
3. **Restore/import never reuses incoming ids.** Fresh ids, plays re-linked through a source-id map,
   fields whitelisted (`src/utils/backupImport.ts`), so a file cannot set `userId` or `order`.
4. **Shared play links (`#play=`) are untrusted input.** Decode with caps, then store only via
   `normalizePlay → planImport → commitImport` (`src/utils/sharedPlay.ts`).
5. **Every `<img onError>` uses `applyImageFallback`** (`src/utils/imageFallback.ts`). A remote
   fallback once caused an infinite request loop in production.
6. **Gemini errors are classified, not lumped** (`classifyProviderError` in `api/scan-games.ts`):
   unavailable model vs. temporary overload vs. key/quota/region. A model id that a fresh
   `listUsableModels()` still lists is a transient provider issue, not a config error.
7. **No secrets in client code or `VITE_*` variables.** The Supabase service-role key will live only
   in `api/delete-account.ts` on Vercel Production (D-037).
8. **Rules that must be testable are pure functions in `src/utils/`** (hub key, merge, share-link
   parsing), independent of React and storage.

Coding standards (naming, async loading/error states, comments): [05-engineering-standards](docs/design/05-engineering-standards.md).

## What an agent may and may not do (D-038)

May:
- Read code, run local checks and tests.
- Commit and push to a working branch (commit format `type: description`, see 05 §3).
- Open a PR when the owner asks.
- Merge to `main` **only through a PR**, and only when all of these hold:
  1. the owner explicitly asked for the merge/deploy **in the current session**;
  2. required check `ci` is green;
  3. no merge conflict;
  4. you posted this report right before merging, and got extra confirmation if the second line is
     not "none":
     ```
     Change: <one line>
     Irreversible impact: <none | schema change | data format change | external setting needed>
     CI: <passed | failing step>
     ```

Must not (stop and tell the owner what is needed instead):
- Push directly to `main`, force-push, or rewrite published history.
- Apply migrations to production, dump or restore production data (owner's machine only, D-034/D-035).
- Change Vercel, Supabase, or GitHub settings or environment variables.
- Delete data, deployments, or branches.
- Bypass checks: `@ts-ignore`, `as any` to hide errors, disabling lint rules, skipping or deleting
  tests, `--no-verify`. If a check is wrong, report it; do not silence it. The only allowed exception
  is a per-location `// biome-ignore lint/...: <reason>` with a real reason (D-026); do not add new ones to
  get a PR green, and do not edit `biome.json` rules.
- Read, print, or commit secrets.
- Build features or backend pieces that the design docs have not decided, or write application code
  during a design session before the owner says implementation has started.

## Definition of done (D-040)

1. Every existing check passes (see Commands). If one fails, report the output; do not say "done".
2. Add the evidence for the kind of change ([08 §3](docs/design/08-ai-governance.md)):
   - `storage.ts` by-id path → multi-account isolation test
   - external input (backup file, share link, server response) → corrupt / over-limit / extra-field tests
   - pure function → 100% branch coverage
   - UI behavior → a Playwright spec in `e2e/` for the affected scenario (S-01..S-06)
   - bug fix → a test that fails before the fix and passes after
   - visual design → mobile-width screenshot, and say the owner must review it
3. Report in two lists, `Verified:` (check → result) and `Not verified:` (item → why: real device,
   external service, owner review). If `Not verified` is non-empty, say "implemented, n items
   unverified", not "done".

## Making and changing decisions

- Decisions live in [decision-log](docs/design/decision-log.md) (`D-xxx`), open questions as `TBD-xxx`.
  Record the decision first, then update every impacted document in the same change.
- Unverified facts (pricing, quotas, platform behavior) are marked as unverified or as assumptions,
  never stated as fact. Numbers without a source are labeled as starting values.
- Database migrations are additive only; CI rejects `DROP`, `RENAME`, `ALTER … TYPE` (D-034).

## Design documents

| Doc | Topic |
|---|---|
| [01](docs/design/01-product-discovery.md) | Product discovery |
| [02](docs/design/02-requirements.md) | Requirements (FR/NFR, scenarios S-01..S-06) |
| [03](docs/design/03-tech-stack.md) | Tech stack |
| [04](docs/design/04-architecture.md) | Architecture, schema, env vars per environment |
| [05](docs/design/05-engineering-standards.md) | Engineering standards, Git policy |
| [06](docs/design/06-quality-assurance.md) | Tests, merge gates, manual checks |
| [07](docs/design/07-deployment-operations.md) | Deploy, CI, migrations, backup, monitoring, secrets |
| [08](docs/design/08-ai-governance.md) | AI governance (this file's rationale) |
| [09](docs/design/09-roadmap.md) | Milestones: M0 foundation → M1 measurement → 4-week gate → M2 |
