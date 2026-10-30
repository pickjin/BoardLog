import { describe, expect, it } from 'vitest';
import { gameDedupKey, MAX_BACKUP_BYTES, normalizePlay, parseBackup, playDedupKey, safeImageUrl } from './backupImport';

describe('safeImageUrl', () => {
  it.each([
    'https://example.com/a.png',
    'HTTP://example.com/a.png',
    'data:image/png;base64,AAAA',
    '  https://x.io/a  '
  ])('keeps a web or inline image url (%j)', (url) => {
    expect(safeImageUrl(url)).toBe(url.trim());
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '//evil.example/a.png',
    '',
    42,
    null,
    undefined,
    { url: 'https://x.io' }
  ])('drops anything else (%j)', (value) => {
    expect(safeImageUrl(value)).toBe('');
  });
});

describe('parseBackup: whole-file checks', () => {
  it('refuses a file over the size cap', () => {
    expect(() => parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1))).toThrow('너무 큽니다');
  });

  it('refuses text that is not JSON', () => {
    expect(() => parseBackup('not json')).toThrow('JSON 형식');
  });

  it.each([
    '"text"',
    'null',
    '[]',
    '{}',
    '{"games":[]}',
    '{"plays":[]}',
    '{"games":{},"plays":[]}',
    '{"games":[],"plays":"x"}'
  ])('refuses JSON that is not a BoardLog backup (%s)', (text) => {
    expect(() => parseBackup(text)).toThrow('백업 파일 형식');
  });

  it('accepts an empty backup', () => {
    expect(parseBackup('{"games":[],"plays":[]}')).toEqual({ games: [], plays: [], invalidCount: 0 });
  });

  it('counts dropped entries across games and plays', () => {
    const text = JSON.stringify({
      games: [{ title: '카탄' }, { title: '   ' }, 'x', null, []],
      plays: [{ gameTitle: '카탄' }, { gameTitle: '' }, 5]
    });
    const parsed = parseBackup(text);
    expect(parsed.games).toHaveLength(1);
    expect(parsed.plays).toHaveLength(1);
    expect(parsed.invalidCount).toBe(4 + 2);
  });
});

describe('parseBackup: games', () => {
  const parseGame = (game: unknown) => parseBackup(JSON.stringify({ games: [game], plays: [] })).games[0];

  it('fills defaults for a title-only game', () => {
    expect(parseGame({ title: ' 카탄 ' })).toEqual({
      sourceId: '',
      data: {
        title: '카탄',
        titleEn: '',
        imageUrl: '',
        genre: [],
        minPlayers: 1,
        maxPlayers: 4,
        bestPlayers: '',
        recommendedAge: 0,
        playTime: 45,
        weight: 2,
        publisher: '',
        purchaseDate: '',
        purchasePrice: 0,
        originalPrice: 0,
        marketPrice: 0,
        storageLocation: '',
        condition: '상',
        tags: [],
        notes: '',
        ownershipStatus: '보유중',
        playCount: 0,
        priceMeta: { source: '', verifiedDate: '', isManual: false },
        createdAt: '',
        updatedAt: ''
      }
    });
  });

  it('keeps valid values and remembers the backup id only as sourceId', () => {
    const game = parseGame({
      id: 'game_from_backup',
      title: '아그리콜라',
      imageUrl: 'https://x.io/a.png',
      genre: ['전략', 3, '농장'],
      tags: ['a', null],
      minPlayers: 1,
      maxPlayers: 5,
      condition: '최상',
      ownershipStatus: '빌려줌',
      playCount: 7.9,
      priceMeta: { source: '직접', verifiedDate: '2026.10.01', isManual: true }
    });
    expect(game.sourceId).toBe('game_from_backup');
    expect(game.data).not.toHaveProperty('id');
    expect(game.data).toMatchObject({
      imageUrl: 'https://x.io/a.png',
      genre: ['전략', '농장'],
      tags: ['a'],
      maxPlayers: 5,
      condition: '최상',
      ownershipStatus: '빌려줌',
      playCount: 7,
      priceMeta: { source: '직접', verifiedDate: '2026.10.01', isManual: true }
    });
  });

  it('replaces out-of-range or wrongly typed values with safe defaults', () => {
    const game = parseGame({
      title: '게임',
      condition: '최악',
      ownershipStatus: '도난',
      playCount: -5,
      minPlayers: 'many',
      weight: Number.POSITIVE_INFINITY,
      imageUrl: 'javascript:alert(1)',
      priceMeta: 'oops'
    });
    expect(game.data).toMatchObject({
      condition: '상',
      ownershipStatus: '보유중',
      playCount: 0,
      minPlayers: 1,
      weight: 2,
      imageUrl: '',
      priceMeta: { source: '', verifiedDate: '', isManual: false }
    });
  });

  it('cannot smuggle in ownership fields', () => {
    const game = parseGame({ title: '게임', id: 'x', userId: 'attacker', order: 999 });
    expect(game.data).not.toHaveProperty('userId');
    expect(game.data).not.toHaveProperty('order');
    expect(game.data).not.toHaveProperty('id');
  });
});

describe('normalizePlay', () => {
  it('rejects anything that is not an object with a title', () => {
    expect(normalizePlay('x')).toBeNull();
    expect(normalizePlay(null)).toBeNull();
    expect(normalizePlay([])).toBeNull();
    expect(normalizePlay({})).toBeNull();
    expect(normalizePlay({ gameTitle: '   ' })).toBeNull();
  });

  it('builds a minimal play and never reuses ids', () => {
    const play = normalizePlay({ id: 'play_x', gameTitle: ' 카탄 ', userId: 'attacker' });
    expect(play).toEqual({
      sourceGameId: null,
      data: {
        gameId: null,
        gameTitle: '카탄',
        gameImageUrl: '',
        date: '',
        startTime: '',
        endTime: '',
        durationMinutes: 0,
        location: '',
        participants: [],
        winnerNames: [],
        myResult: '참여',
        isTeamPlay: false,
        hasExpansion: false,
        expansionName: '',
        rating: 0,
        review: '',
        photos: [],
        createdAt: '',
        updatedAt: ''
      }
    });
    expect(play?.data).not.toHaveProperty('id');
    expect(play?.data).not.toHaveProperty('userId');
  });

  it('keeps the source game id only as a link hint and always unlinks gameId', () => {
    const play = normalizePlay({ gameTitle: '카탄', gameId: 'game_9' });
    expect(play?.sourceGameId).toBe('game_9');
    expect(play?.data.gameId).toBeNull();
  });

  it('normalizes participants, derives winnerNames, drops nameless or non-object ones', () => {
    const play = normalizePlay({
      gameTitle: '카탄',
      participants: [
        { id: 'p_me', name: ' 나 ', score: 10, rank: 1, isWinner: true, characterOrFaction: '푸른색', notes: 'n' },
        { name: '민수', score: 'x', rank: null, isWinner: 'yes' },
        { name: '   ' },
        'nope',
        null
      ]
    });
    expect(play?.data.participants).toEqual([
      { id: 'p_me', name: '나', score: 10, rank: 1, isWinner: true, characterOrFaction: '푸른색', notes: 'n' },
      { id: 'p_1', name: '민수', score: null, rank: null, isWinner: false, characterOrFaction: '', notes: '' }
    ]);
    expect(play?.data.winnerNames).toEqual(['나']);
  });

  it('ignores participants or photos that are not lists', () => {
    const play = normalizePlay({ gameTitle: '카탄', participants: 'x', photos: { url: 'https://x.io/a.png' } });
    expect(play?.data.participants).toEqual([]);
    expect(play?.data.photos).toEqual([]);
  });

  it('keeps safe photos only, with a valid rotation and fallback id', () => {
    const play = normalizePlay({
      gameTitle: '카탄',
      photos: [
        { id: 'ph1', url: 'https://x.io/a.png', caption: '사진', rotation: 90 },
        { url: 'data:image/png;base64,AAAA', rotation: 45 },
        { url: 'javascript:alert(1)' },
        { url: '' },
        'nope'
      ]
    });
    expect(play?.data.photos).toEqual([
      { id: 'ph1', url: 'https://x.io/a.png', caption: '사진', rotation: 90 },
      { id: 'photo_1', url: 'data:image/png;base64,AAAA', caption: '', rotation: 0 }
    ]);
  });

  it('clamps rating to 0..5 and duration to at least 0', () => {
    expect(normalizePlay({ gameTitle: 'a', rating: 99 })?.data.rating).toBe(5);
    expect(normalizePlay({ gameTitle: 'a', rating: -3 })?.data.rating).toBe(0);
    expect(normalizePlay({ gameTitle: 'a', rating: 3.5 })?.data.rating).toBe(3.5);
    expect(normalizePlay({ gameTitle: 'a', durationMinutes: -10 })?.data.durationMinutes).toBe(0);
    expect(normalizePlay({ gameTitle: 'a', durationMinutes: 80 })?.data.durationMinutes).toBe(80);
  });

  it('accepts only known results and strict boolean flags', () => {
    expect(normalizePlay({ gameTitle: 'a', myResult: '승리' })?.data.myResult).toBe('승리');
    expect(normalizePlay({ gameTitle: 'a', myResult: '해킹' })?.data.myResult).toBe('참여');
    const flags = normalizePlay({ gameTitle: 'a', isTeamPlay: true, hasExpansion: 'true', expansionName: '확장' });
    expect(flags?.data).toMatchObject({ isTeamPlay: true, hasExpansion: false, expansionName: '확장' });
  });

  it('drops an unsafe cover image', () => {
    expect(normalizePlay({ gameTitle: 'a', gameImageUrl: 'javascript:alert(1)' })?.data.gameImageUrl).toBe('');
  });
});

describe('dedup keys', () => {
  it('compares game titles ignoring case and surrounding spaces', () => {
    expect(gameDedupKey('  Catan ')).toBe('catan');
  });

  it('keys a play on title, date, start time and the set of people, in any order', () => {
    const base = { gameTitle: ' Catan ', date: '2026.10.30', startTime: '19:00' };
    const a = playDedupKey({ ...base, participants: [{ name: '민수' }, { name: ' 나 ' }] as never });
    const b = playDedupKey({ ...base, participants: [{ name: '나' }, { name: '민수' }] as never });
    expect(a).toBe(b);
    expect(a).toBe('catan|2026.10.30|19:00|나,민수');
    expect(playDedupKey({ ...base, startTime: '20:00', participants: [] })).not.toBe(
      playDedupKey({ ...base, participants: [] })
    );
  });
});
