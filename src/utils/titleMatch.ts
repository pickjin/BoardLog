import { SeedGame } from '../types';

/** Below this, a photographed title is treated as a game the seed list does not contain. */
export const MATCH_THRESHOLD = 0.72;

/**
 * Photographed titles carry spacing and punctuation that the seed list does not
 * ("테라포밍 마스" vs "테라포밍마스", "Catan!" vs "Catan"), so both sides are reduced
 * to letters and digits before comparison.
 */
export function normalizeTitle(raw: string): string {
  return raw
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]/gu, '');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i += 1) {
    const curr: number[] = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      curr[j + 1] = Math.min(
        prev[j + 1] + 1,
        curr[j] + 1,
        prev[j] + (a[i] === b[j] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

export interface SeedMatch {
  game: SeedGame;
  score: number;
}

/** Best seed-list entry for a photographed title, or null when nothing clears the threshold. */
export function findSeedMatch(rawTitle: string, seeds: SeedGame[]): SeedMatch | null {
  const query = normalizeTitle(rawTitle);
  if (query.length < 2) return null;

  let best: SeedMatch | null = null;
  for (const game of seeds) {
    const score = Math.max(
      similarity(query, normalizeTitle(game.title)),
      game.titleEn ? similarity(query, normalizeTitle(game.titleEn)) : 0
    );
    if (!best || score > best.score) {
      best = { game, score };
    }
  }

  return best && best.score >= MATCH_THRESHOLD ? best : null;
}
