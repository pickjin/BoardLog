# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server on :3000. Does NOT serve /api/* (see below).
npm run build    # Production build (tsc types are not checked here)
npm run lint     # tsc --noEmit — this is the only type-check step; there is no separate test suite
```

`api/scan-games.ts` is a Vercel serverless function. `npm run dev` does not run it. To exercise it
locally: `vercel link` (project: `boardlog`), `vercel env pull .env.local`, then `vercel dev`.

## Deployment

- Vercel project `boardlog`, team `wlstkden-6327s-projects`. Production domain:
  `boardlog-blush.vercel.app`.
- Production target is the `main` branch: pushing to `main` on GitHub auto-deploys.
- Required env var: `GEMINI_API_KEY` (set in Vercel, all three environments). Optional:
  `GEMINI_MODEL` to pin a specific model id instead of the fallback list in `api/scan-games.ts`.

## Architecture

**There is no backend database.** All user data (accounts, games, play records) lives in the
browser's IndexedDB, with localStorage as a fallback and for session/account pointers. Nothing
syncs across devices or browsers. `api/scan-games.ts` is the only server-side code in the repo, and
it is stateless — it proxies one Gemini vision call and stores nothing.

### `src/services/storage.ts` — the persistence boundary

Every read and write in the app goes through this single file (`storage` singleton). No component
talks to IndexedDB or localStorage directly. This matters for two reasons:

1. **Swapping in a real backend later only means reimplementing this file.** The 19 UI components
   never need to change — they already only know the `storage.*` method signatures.
2. **IndexedDB is a single shared store per record type (`games`, `plays`), keyed by record id, not
   per-user.** Any new by-id method (update/delete) MUST check `record.userId === uid` before
   touching the record — the `idbReadOwned` helper does this. Skipping it is a real bug that
   happened once already: one account could read/edit/delete another account's games by id, even
   though list views (which go through the `userId` index) looked correctly isolated. A fix must be
   verified with a multi-account test, not a single-user one — the bug is invisible otherwise.

Auth is entirely client-side: passwords are PBKDF2-SHA256 hashed (210k iterations, per-record salt)
and stored in `localStorage['boardlog_all_users']`. There is no session token or server validation.

### Bulk photo registration (`api/scan-games.ts` + `src/services/gameScanner.ts`)

Uploads go through the serverless function (key stays server-side) which calls Gemini's vision API
and returns detected game titles. The client (`gameScanner.ts`) matches each title against the
60-game seed list (`src/data/seedGames.ts`) using fuzzy string matching (`src/utils/titleMatch.ts`);
unmatched titles are still registered under the read title with placeholder fields.

The function tries a short list of model ids in order (`MODEL_CANDIDATES`), not a single hardcoded
one — Gemini model ids retire while still appearing in the account's own `models.list()` output, so
a single pinned id eventually breaks with no warning. `classifyProviderError` distinguishes a model
that is genuinely unavailable from one that is just temporarily overloaded (HTTP 503 /
"UNAVAILABLE") versus the account's key, quota, or region being the actual problem — these need
different fixes and must not be conflated in the error message shown to the user. If a rejected
model id still appears in a fresh `listUsableModels()` call, treat the failure as transient provider
instability, not a configuration problem — telling the user to change `GEMINI_MODEL` to an id that
is already known to be valid just wastes a deploy cycle.

### Image fallback

`src/utils/imageFallback.ts` provides `applyImageFallback`, an inline SVG placeholder with a
one-shot guard (`dataset.fallbackApplied`). Every `<img onError>` in the codebase must use this, not
a remote URL — a remote fallback that itself 404s re-fires `onError` against itself, which caused an
infinite request loop (~500 req/s) in production once already.

## Known state / open issues

- No backend, by design, pending validation: the plan is to add one only after real users show
  second-visit retention (see conversation history / commit messages for the reasoning). Don't treat
  "add a backend" as the next obvious step without checking whether that validation has happened.
- The Gemini photo-scan feature has shown intermittent provider-side instability in testing
  (alternating between a clean success, a 503 overload, and a "not found" response for a model the
  account's own listing confirms exists). This is external to the app; retries and error
  classification are already handled, but it is not fully solved because it cannot be — it depends
  on Google's service state.
