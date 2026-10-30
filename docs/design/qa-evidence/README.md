# QA evidence (session scripts, reference only)

Browser checks written during the 2026-10 design/implementation session to verify features as they
were built. They are **not wired into the repo's test setup**: they use `playwright-core` with a
hardcoded Chromium path and a scratch output folder from that session.

Kept so their assertions are not lost; PHASE 6 decides how they become real tests.

| File | Assertions | Covers |
|---|---|---|
| `verify-play-form.mjs` | 15 | Result derived from winner, save blocked without result, recent-game ordering, companion chips |
| `verify-share-import.mjs` | 27 | Share sheet text and copy, backup export, restore preview, hostile backup fields, two-account isolation |
| `verify-sample-pwa.mjs` | 26 | Empty start for new accounts, sample-data removal incl. other-account isolation, manifest and icons |
| `verify-share-link.mjs` | 29 | Share link across three isolated devices, dedupe, linking to an owned game, hostile and broken links |

Usage then: `node <file> <base-url>` against `vite preview`.
