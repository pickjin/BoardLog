import { describe, expect, it } from 'vitest';
import { SEED_GAMES } from '../data/seedGames';
import type { SeedGame } from '../types';
import { findSeedMatch, MATCH_THRESHOLD, normalizeTitle, similarity } from './titleMatch';

const seed = (title: string, titleEn = ''): SeedGame => ({ ...SEED_GAMES[0], id: title, title, titleEn });

describe('normalizeTitle', () => {
  it('drops spacing and punctuation, lowercases, keeps letters and digits', () => {
    expect(normalizeTitle('Catan!')).toBe('catan');
    expect(normalizeTitle('테라포밍 마스')).toBe('테라포밍마스');
    expect(normalizeTitle('7 Wonders: Duel')).toBe('7wondersduel');
  });

  it('normalizes decomposed Hangul to the same string as composed Hangul', () => {
    expect(normalizeTitle('한')).toBe(normalizeTitle('한'));
  });
});

describe('similarity', () => {
  it('is 1 for equal strings, including two empty ones', () => {
    expect(similarity('catan', 'catan')).toBe(1);
    expect(similarity('', '')).toBe(1);
  });

  it('is 0 against an empty string', () => {
    expect(similarity('abc', '')).toBe(0);
    expect(similarity('', 'abc')).toBe(0);
  });

  it('scales with edit distance over the longer length', () => {
    expect(similarity('abcd', 'abce')).toBe(0.75);
    expect(similarity('abc', 'xyz')).toBe(0);
  });
});

describe('findSeedMatch', () => {
  const seeds = [seed('카탄', 'Catan'), seed('스플렌더', 'Splendor'), seed('아그리콜라')];

  it('matches a Korean title ignoring spacing', () => {
    expect(findSeedMatch('스플 렌더', seeds)?.game.title).toBe('스플렌더');
  });

  it('matches through the English title', () => {
    expect(findSeedMatch('SPLENDOR!', seeds)?.game.title).toBe('스플렌더');
  });

  it('tolerates a one-letter misread', () => {
    expect(findSeedMatch('Splendar', seeds)?.game.title).toBe('스플렌더');
  });

  it('returns the highest scoring game and reports its score', () => {
    const match = findSeedMatch('아그리콜라', seeds);
    expect(match?.game.title).toBe('아그리콜라');
    expect(match?.score).toBe(1);
  });

  it('returns null when nothing clears the threshold', () => {
    expect(findSeedMatch('완전히 다른 제목', seeds)).toBeNull();
    expect(MATCH_THRESHOLD).toBe(0.72);
  });

  it('returns null for a query too short to trust, or an empty list', () => {
    expect(findSeedMatch('a', seeds)).toBeNull();
    expect(findSeedMatch('!!', seeds)).toBeNull();
    expect(findSeedMatch('카탄', [])).toBeNull();
  });

  it('finds every seed title in the real seed list (titles of two or more letters)', () => {
    const searchable = SEED_GAMES.filter((game) => normalizeTitle(game.title).length >= 2);
    expect(searchable.length).toBeGreaterThan(290);
    for (const game of searchable) {
      expect(findSeedMatch(game.title, SEED_GAMES)?.score, game.title).toBe(1);
    }
  });

  // Known defect (TBD-019): a one-letter title such as "뱅!" or "라" is rejected by the length guard, so a
  // photo of that exact title never matches its seed entry. `it.fails` turns green again, and so reminds us
  // to rewrite this test, once the guard learns to allow an exact match.
  it.fails('finds seed games whose title is a single letter', () => {
    expect(findSeedMatch('뱅!', SEED_GAMES)?.game.titleEn).toBe('BANG!');
  });
});
