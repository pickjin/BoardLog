import { describe, expect, it } from 'vitest';
import { getGameIndexKey, KOREAN_INDEX_KEYS } from './koreanIndex';

describe('getGameIndexKey', () => {
  it.each([
    ['가나다', 'ㄱ'],
    ['나비', 'ㄴ'],
    ['하늘', 'ㅎ'],
    ['  스플렌더  ', 'ㅅ']
  ])('uses the initial consonant of a Hangul syllable (%j -> %s)', (title, key) => {
    expect(getGameIndexKey(title)).toBe(key);
  });

  it.each([
    ['까치', 'ㄱ'],
    ['따라', 'ㄷ'],
    ['빠름', 'ㅂ'],
    ['싸움', 'ㅅ'],
    ['짜장', 'ㅈ']
  ])('folds a doubled initial into its plain one (%j -> %s)', (title, key) => {
    expect(getGameIndexKey(title)).toBe(key);
  });

  it.each([
    ['ㄱㄴ', 'ㄱ'],
    ['ㅂ게임', 'ㅂ'],
    ['ㄲ', 'ㄱ'],
    ['ㄸ', 'ㄷ'],
    ['ㅃ', 'ㅂ'],
    ['ㅆ', 'ㅅ'],
    ['ㅉ', 'ㅈ']
  ])('handles a bare consonant (%j -> %s)', (title, key) => {
    expect(getGameIndexKey(title)).toBe(key);
  });

  it('groups letters, digits and everything else', () => {
    expect(getGameIndexKey('Catan')).toBe('A-Z');
    expect(getGameIndexKey('zoo')).toBe('A-Z');
    expect(getGameIndexKey('7 Wonders')).toBe('0-9');
    expect(getGameIndexKey('!wow')).toBe('#');
  });

  it('puts empty or blank titles under #', () => {
    expect(getGameIndexKey('')).toBe('#');
    expect(getGameIndexKey('   ')).toBe('#');
  });

  it('only returns keys the index offers', () => {
    for (const title of ['가', '까', 'A', '1', '!', 'ㅏ', '']) {
      expect(KOREAN_INDEX_KEYS).toContain(getGameIndexKey(title));
    }
  });
});
