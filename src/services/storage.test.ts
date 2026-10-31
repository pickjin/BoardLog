import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { PlayRecord, UserGame } from '../types';
import { normalizePlay } from '../utils/backupImport';

/** Node has no localStorage; the session pointers and the fallback store need one. */
class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}

vi.stubGlobal('localStorage', new MemoryStorage());

const { storage } = await import('./storage');

type NewGame = Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>;
type NewPlay = Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'>;

const game = (title: string, overrides: Partial<NewGame> = {}): NewGame => ({
  title,
  titleEn: '',
  imageUrl: '',
  genre: [],
  minPlayers: 2,
  maxPlayers: 4,
  bestPlayers: '',
  recommendedAge: 10,
  playTime: 30,
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
  ...overrides
});

const play = (gameTitle: string, gameId: string | null, overrides: Partial<NewPlay> = {}): NewPlay => ({
  gameId,
  gameTitle,
  gameImageUrl: '',
  date: '2026.10.30',
  startTime: '19:00',
  endTime: '20:00',
  durationMinutes: 60,
  location: '',
  participants: [
    { id: 'p_me', name: '나', score: null, rank: null, isWinner: true, characterOrFaction: '', notes: '' }
  ],
  winnerNames: ['나'],
  myResult: '승리',
  isTeamPlay: false,
  hasExpansion: false,
  expansionName: '',
  rating: 5,
  review: '',
  photos: [],
  ...overrides
});

/** Writes a raw record straight into the shared store, as an older app version would have left it. */
const putRaw = (store: 'games' | 'plays', row: object) =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('board_log_db_v1');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction(store, 'readwrite');
      tx.objectStore(store).put(row);
      tx.oncomplete = () => {
        req.result.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
  });

let seq = 0;
const freshUid = (label: string) => `user_${label}_${++seq}`;

/** Two accounts on one device, sharing the same IndexedDB stores (the situation invariant 2 is about). */
async function twoAccounts() {
  const a = freshUid('a');
  const b = freshUid('b');
  const aGame = await storage.addUserGame(a, game('카탄', { playCount: 0 }));
  const aPlay = await storage.addPlayRecord(a, play('카탄', aGame.id));
  return { a, b, aGame, aPlay };
}

describe('storage: account isolation on the shared IndexedDB stores (invariant 2)', () => {
  beforeAll(async () => {
    // Opens the database once so every test below runs on IndexedDB, not the fallback.
    await storage.getUserGames(freshUid('warmup'));
  });

  it("lists only the account's own games and plays", async () => {
    const { a, b } = await twoAccounts();
    await storage.addUserGame(b, game('아그리콜라'));
    expect((await storage.getUserGames(a)).map((g) => g.title)).toEqual(['카탄']);
    expect((await storage.getUserGames(b)).map((g) => g.title)).toEqual(['아그리콜라']);
    expect(await storage.getUserPlays(b)).toEqual([]);
  });

  it("cannot read another account's game or play by id", async () => {
    const { b, aGame, aPlay } = await twoAccounts();
    expect(await storage.getUserGameById(b, aGame.id)).toBeNull();
    expect(await storage.getUserPlayById(b, aPlay.id)).toBeNull();
  });

  it("cannot update another account's game by id", async () => {
    const { a, b, aGame } = await twoAccounts();
    await expect(storage.updateUserGame(b, aGame.id, { title: '탈취' })).rejects.toThrow('찾을 수 없습니다');
    expect((await storage.getUserGames(a))[0].title).toBe('카탄');
  });

  it("cannot update another account's play by id", async () => {
    const { a, b, aPlay } = await twoAccounts();
    await expect(storage.updatePlayRecord(b, aPlay.id, { review: '탈취' })).rejects.toThrow('찾을 수 없습니다');
    expect((await storage.getUserPlays(a))[0].review).toBe('');
  });

  it("cannot delete another account's game or play by id", async () => {
    const { a, b, aGame, aPlay } = await twoAccounts();
    expect(await storage.deleteUserGame(b, aGame.id)).toBe(true);
    expect(await storage.deletePlayRecord(b, aPlay.id)).toBe(true);
    expect((await storage.getUserGames(a)).map((g) => g.id)).toEqual([aGame.id]);
    expect((await storage.getUserPlays(a)).map((p) => p.id)).toEqual([aPlay.id]);
  });

  it("does not change another account's play count through a play linked to its game id", async () => {
    const { a, b, aGame } = await twoAccounts();
    const before = (await storage.getUserGames(a))[0].playCount;
    await storage.addPlayRecord(b, play('카탄', aGame.id));
    expect((await storage.getUserGames(a))[0].playCount).toBe(before);
  });

  it('still lets the owner update and delete', async () => {
    const { a, aGame, aPlay } = await twoAccounts();
    expect((await storage.updateUserGame(a, aGame.id, { notes: '메모' })).notes).toBe('메모');
    expect((await storage.getUserGames(a))[0].playCount).toBe(1);
    await storage.deletePlayRecord(a, aPlay.id);
    expect(await storage.getUserPlays(a)).toEqual([]);
    expect((await storage.getUserGames(a))[0].playCount).toBe(0);
    await storage.deleteUserGame(a, aGame.id);
    expect(await storage.getUserGames(a)).toEqual([]);
  });

  it('removing sample data in one account leaves the other account untouched', async () => {
    const a = freshUid('a');
    const b = freshUid('b');
    // Demo records as older versions seeded them into every new account.
    for (const uid of [a, b]) {
      await putRaw('games', { ...game('스플렌더'), id: `sample-game-1-${uid}`, userId: uid, order: 1 });
      await putRaw('plays', {
        ...play('스플렌더', `sample-game-1-${uid}`),
        id: `sample-play-1-${uid}`,
        userId: uid,
        order: 2
      });
    }
    expect(await storage.removeSampleData(a)).toEqual({ plays: 1, games: 1 });
    expect(await storage.getUserGames(a)).toEqual([]);
    expect((await storage.getUserGames(b)).map((g) => g.id)).toEqual([`sample-game-1-${b}`]);
    expect((await storage.getUserPlays(b)).map((p) => p.id)).toEqual([`sample-play-1-${b}`]);
  });
});

describe('storage: restore never reuses or takes over ids (invariant 3)', () => {
  it("gives restored records fresh ids, so a backup carrying another account's ids cannot overwrite them", async () => {
    const { a, b, aGame, aPlay } = await twoAccounts();
    const snapshot = JSON.stringify([await storage.getUserGames(a), await storage.getUserPlays(a)]);

    // B restores a file built from A's records, ids included.
    const imported = normalizePlay({ ...aPlay, id: aPlay.id, gameId: aGame.id });
    if (!imported) throw new Error('fixture did not normalize');
    const plan = await storage.planImport(b, {
      games: [{ sourceId: aGame.id, data: { ...aGame, createdAt: '', updatedAt: '' } }],
      plays: [imported],
      invalidCount: 0
    });
    await storage.commitImport(b, plan);

    expect(JSON.stringify([await storage.getUserGames(a), await storage.getUserPlays(a)])).toBe(snapshot);
    const bGames = await storage.getUserGames(b);
    const bPlays = await storage.getUserPlays(b);
    expect(bGames).toHaveLength(1);
    expect(bPlays).toHaveLength(1);
    expect(bGames[0].id).not.toBe(aGame.id);
    expect(bPlays[0].id).not.toBe(aPlay.id);
    expect(bPlays[0].gameId).toBe(bGames[0].id);
  });

  it("only raises the play count of the restoring account's own games", async () => {
    const { a, b } = await twoAccounts();
    const bGame = await storage.addUserGame(b, game('카탄'));
    const aCountBefore = (await storage.getUserGames(a))[0].playCount;
    const imported = normalizePlay(play('카탄', null, { date: '2026.01.01' }));
    if (!imported) throw new Error('fixture did not normalize');
    const plan = await storage.planImport(b, { games: [], plays: [imported], invalidCount: 0 });
    await storage.commitImport(b, plan);

    expect((await storage.getUserGames(b)).find((g) => g.id === bGame.id)?.playCount).toBe(1);
    expect((await storage.getUserGames(a))[0].playCount).toBe(aCountBefore);
  });
});

describe('storage: add never reuses a caller-supplied id', () => {
  // Regression test: add* used to keep an incoming id, and `put` then replaced another account's record.
  it("does not overwrite another account's record that has the same id", async () => {
    const { a, b, aGame, aPlay } = await twoAccounts();
    const snapshot = JSON.stringify([await storage.getUserGames(a), await storage.getUserPlays(a)]);

    const bGame = await storage.addUserGame(b, { ...aGame, title: '탈취' });
    const bPlay = await storage.addPlayRecord(b, { ...aPlay, review: '탈취' });

    expect(JSON.stringify([await storage.getUserGames(a), await storage.getUserPlays(a)])).toBe(snapshot);
    expect(bGame.id).not.toBe(aGame.id);
    expect(bPlay.id).not.toBe(aPlay.id);
    expect((await storage.getUserGames(b)).map((g) => g.title)).toEqual(['탈취']);
  });
});
