import { describe, expect, it } from 'vitest';
import type { PlayRecord } from '../types';
import {
  buildShareLink,
  decodeSharedPlay,
  resultFor,
  type SharedPlay,
  sharedHashPresent,
  toRecipientRecord
} from './sharedPlay';

const ORIGIN = 'https://boardlog.example';

const makePlay = (overrides: Partial<PlayRecord> = {}): PlayRecord => ({
  id: 'play_1',
  gameId: 'game_1',
  gameTitle: '카탄',
  gameImageUrl: '',
  date: '2026.10.30',
  startTime: '19:00',
  endTime: '20:30',
  durationMinutes: 90,
  location: '보드게임 카페',
  participants: [
    { id: 'p_me', name: '나', score: 10, rank: 1, isWinner: true, characterOrFaction: '', notes: '' },
    { id: 'p_1', name: '민수', score: 7, rank: 2, isWinner: false, characterOrFaction: '', notes: '' }
  ],
  winnerNames: ['나'],
  myResult: '승리',
  isTeamPlay: false,
  hasExpansion: false,
  expansionName: '',
  rating: 5,
  review: '사적인 후기',
  photos: [],
  createdAt: '',
  updatedAt: '',
  ...overrides
});

const hashOf = (link: string) => link.slice(ORIGIN.length + 1);
const encode = (value: unknown) => `#play=${Buffer.from(JSON.stringify(value)).toString('base64url')}`;
const validPayload = (overrides: Record<string, unknown> = {}) => ({
  v: 1,
  by: '지민',
  g: '카탄',
  d: '2026.10.30',
  st: '19:00',
  et: '20:30',
  dm: 90,
  l: '카페',
  t: 0,
  x: '',
  r: '승리',
  p: [
    { n: '지민', s: 10, k: 1, w: 1 },
    { n: '민수', s: 7, k: 2, w: 0 }
  ],
  ...overrides
});

describe('buildShareLink', () => {
  it('puts the play after # so it is never sent to a server', () => {
    const link = buildShareLink(makePlay(), '지민', ORIGIN);
    expect(link.startsWith(`${ORIGIN}/#play=`)).toBe(true);
    expect(new URL(link).search).toBe('');
  });

  it('swaps "나" (by name or by p_me id) for the sharer name, trimmed', () => {
    const play = makePlay({
      participants: [
        { id: 'p_me', name: '아무개', score: null, rank: null, isWinner: false, characterOrFaction: '', notes: '' },
        { id: 'x', name: '나', score: null, rank: null, isWinner: false, characterOrFaction: '', notes: '' },
        { id: 'p_2', name: '민수', score: null, rank: null, isWinner: false, characterOrFaction: '', notes: '' }
      ]
    });
    const shared = decodeSharedPlay(hashOf(buildShareLink(play, '  지민  ', ORIGIN)));
    expect(shared?.sharedBy).toBe('지민');
    expect(shared?.participants.map((p) => p.name)).toEqual(['지민', '지민', '민수']);
  });

  it('never carries rating, review or photos', () => {
    const link = buildShareLink(makePlay({ review: '비밀 후기', rating: 4 }), '지민', ORIGIN);
    const decoded = Buffer.from(hashOf(link).slice('#play='.length), 'base64url').toString('utf8');
    expect(decoded).not.toContain('비밀 후기');
    expect(decoded).not.toContain('"rating"');
  });

  it('round-trips a play, including Korean text, expansion and team flag', () => {
    const play = makePlay({ isTeamPlay: true, hasExpansion: true, expansionName: '항해자' });
    const shared = decodeSharedPlay(hashOf(buildShareLink(play, '지민', ORIGIN)));
    expect(shared).toEqual({
      sharedBy: '지민',
      gameTitle: '카탄',
      date: '2026.10.30',
      startTime: '19:00',
      endTime: '20:30',
      durationMinutes: 90,
      location: '보드게임 카페',
      isTeamPlay: true,
      expansionName: '항해자',
      sharerResult: '승리',
      participants: [
        { name: '지민', score: 10, rank: 1, isWinner: true },
        { name: '민수', score: 7, rank: 2, isWinner: false }
      ]
    });
  });

  it('drops the expansion name when the play had no expansion', () => {
    const play = makePlay({ hasExpansion: false, expansionName: '남은 이름' });
    expect(decodeSharedPlay(hashOf(buildShareLink(play, '지민', ORIGIN)))?.expansionName).toBe('');
  });
});

describe('sharedHashPresent', () => {
  it('recognizes only the #play= fragment', () => {
    expect(sharedHashPresent('#play=abc')).toBe(true);
    expect(sharedHashPresent('#other=abc')).toBe(false);
    expect(sharedHashPresent('')).toBe(false);
  });
});

describe('decodeSharedPlay (the link is untrusted input)', () => {
  it('returns null when there is no share fragment or no data', () => {
    expect(decodeSharedPlay('')).toBeNull();
    expect(decodeSharedPlay('#other=abc')).toBeNull();
    expect(decodeSharedPlay('#play=')).toBeNull();
  });

  // The padding sits in a field the decoder ignores, so only the length cap can reject the long one.
  const hashWithEncodedLength = (atLeast: number) => {
    for (let pad = 0; ; pad += 1) {
      const hash = encode({ ...validPayload(), pad: 'x'.repeat(pad) });
      if (hash.length - '#play='.length >= atLeast) return hash;
    }
  };

  it('accepts a valid link of exactly 6000 encoded characters', () => {
    const hash = hashWithEncodedLength(6000);
    expect(hash.length - '#play='.length).toBe(6000);
    expect(decodeSharedPlay(hash)?.gameTitle).toBe('카탄');
  });

  it('rejects a valid link longer than 6000 encoded characters', () => {
    const hash = hashWithEncodedLength(6001);
    expect(hash.length - '#play='.length).toBeGreaterThan(6000);
    expect(decodeSharedPlay(hash)).toBeNull();
  });

  it('rejects text that is not base64 or not JSON', () => {
    expect(decodeSharedPlay('#play=!!!not base64!!!')).toBeNull();
    expect(decodeSharedPlay(`#play=${Buffer.from('not json').toString('base64url')}`)).toBeNull();
  });

  it.each([5, null, 'text'])('rejects a JSON value that is not an object (%j)', (value) => {
    expect(decodeSharedPlay(encode(value))).toBeNull();
  });

  it('rejects an unknown version or a missing participant list', () => {
    expect(decodeSharedPlay(encode(validPayload({ v: 2 })))).toBeNull();
    expect(decodeSharedPlay(encode(validPayload({ p: 'nope' })))).toBeNull();
  });

  it('rejects a play without a game title or without any valid participant', () => {
    expect(decodeSharedPlay(encode(validPayload({ g: '   ' })))).toBeNull();
    expect(decodeSharedPlay(encode(validPayload({ g: 42 })))).toBeNull();
    expect(decodeSharedPlay(encode(validPayload({ p: [] })))).toBeNull();
    expect(decodeSharedPlay(encode(validPayload({ p: [null, 'x', { n: '   ' }, { n: 5 }] })))).toBeNull();
  });

  it('keeps valid participants and skips malformed ones', () => {
    const shared = decodeSharedPlay(encode(validPayload({ p: [null, { n: '민수', s: 3, k: 2, w: 0 }, 'x'] })));
    expect(shared?.participants).toEqual([{ name: '민수', score: 3, rank: 2, isWinner: false }]);
  });

  it('caps participants at 20 and clips long names and texts', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ n: `P${i}`, s: i, k: i, w: 0 }));
    const shared = decodeSharedPlay(
      encode(validPayload({ p: many, g: 'G'.repeat(200), by: 'B'.repeat(100), l: 'L'.repeat(200) }))
    );
    expect(shared?.participants).toHaveLength(20);
    expect(shared?.gameTitle).toHaveLength(80);
    expect(shared?.sharedBy).toHaveLength(30);
    expect(shared?.location).toHaveLength(80);
    const longName = decodeSharedPlay(encode(validPayload({ p: [{ n: 'N'.repeat(100), w: 1 }] })));
    expect(longName?.participants[0].name).toHaveLength(30);
  });

  it('turns non-numbers into null scores and ranks, and only w === 1 into a winner', () => {
    const shared = decodeSharedPlay(
      encode(
        validPayload({
          p: [
            { n: 'A', s: '9', k: Number.NaN, w: true },
            { n: 'B', s: null, k: 'x', w: 1 }
          ]
        })
      )
    );
    expect(shared?.participants).toEqual([
      { name: 'A', score: null, rank: null, isWinner: false },
      { name: 'B', score: null, rank: null, isWinner: true }
    ]);
  });

  it('clamps duration to 0..1440 and defaults a missing or invalid one to 0', () => {
    expect(decodeSharedPlay(encode(validPayload({ dm: -30 })))?.durationMinutes).toBe(0);
    expect(decodeSharedPlay(encode(validPayload({ dm: 99999 })))?.durationMinutes).toBe(1440);
    expect(decodeSharedPlay(encode(validPayload({ dm: 'abc' })))?.durationMinutes).toBe(0);
    expect(decodeSharedPlay(encode(validPayload({ dm: 45 })))?.durationMinutes).toBe(45);
  });

  it('only accepts t === 1 as a team play', () => {
    expect(decodeSharedPlay(encode(validPayload({ t: 1 })))?.isTeamPlay).toBe(true);
    expect(decodeSharedPlay(encode(validPayload({ t: true })))?.isTeamPlay).toBe(false);
  });

  it('falls back to "참여" for an unknown sharer result', () => {
    expect(decodeSharedPlay(encode(validPayload({ r: '무승부' })))?.sharerResult).toBe('무승부');
    expect(decodeSharedPlay(encode(validPayload({ r: '해킹' })))?.sharerResult).toBe('참여');
  });

  it('treats markup in names as plain text', () => {
    const shared = decodeSharedPlay(encode(validPayload({ p: [{ n: '<img src=x onerror=alert(1)>', w: 0 }] })));
    expect(shared?.participants[0].name).toBe('<img src=x onerror=alert(1)>');
  });

  it('ignores extra fields a crafted link might add', () => {
    const shared = decodeSharedPlay(encode(validPayload({ userId: 'attacker', order: 1, id: 'x' })));
    expect(shared).not.toHaveProperty('userId');
    expect(shared).not.toHaveProperty('id');
  });
});

const sharedPlay = (overrides: Partial<SharedPlay> = {}): SharedPlay => ({
  sharedBy: '지민',
  gameTitle: '카탄',
  date: '2026.10.30',
  startTime: '19:00',
  endTime: '20:30',
  durationMinutes: 90,
  location: '카페',
  isTeamPlay: false,
  expansionName: '',
  sharerResult: '승리',
  participants: [
    { name: '지민', score: 10, rank: 1, isWinner: true },
    { name: '민수', score: 7, rank: 2, isWinner: false }
  ],
  ...overrides
});

describe('resultFor', () => {
  it('is a win when the picked row is a winner', () => {
    expect(resultFor(sharedPlay(), 0)).toBe('승리');
  });

  it('is a loss when someone else won', () => {
    expect(resultFor(sharedPlay(), 1)).toBe('패배');
  });

  it('keeps a draw only when the sharer called it a draw and nobody is marked winner', () => {
    const noWinners = sharedPlay({
      participants: [
        { name: '지민', score: 5, rank: null, isWinner: false },
        { name: '민수', score: 5, rank: null, isWinner: false }
      ]
    });
    expect(resultFor({ ...noWinners, sharerResult: '무승부' }, 1)).toBe('무승부');
    expect(resultFor({ ...noWinners, sharerResult: '승리' }, 1)).toBe('참여');
  });

  it('does not fail on an index outside the list', () => {
    expect(resultFor(sharedPlay(), 9)).toBe('패배');
  });
});

describe('toRecipientRecord', () => {
  it('turns the picked row into 나 / p_me and keeps the others', () => {
    const record = toRecipientRecord(sharedPlay(), 1);
    expect(record.participants.map((p) => [p.id, p.name])).toEqual([
      ['p_0', '지민'],
      ['p_me', '나']
    ]);
    expect(record.myResult).toBe('패배');
  });

  it('is a fresh, unlinked record with no personal fields', () => {
    const record = toRecipientRecord(sharedPlay({ expansionName: '항해자' }), 0);
    expect(record).toMatchObject({
      gameId: null,
      rating: 0,
      review: '',
      photos: [],
      hasExpansion: true,
      expansionName: '항해자'
    });
    expect(toRecipientRecord(sharedPlay(), 0).hasExpansion).toBe(false);
  });
});
