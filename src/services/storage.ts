import { UserGame, PlayRecord, UserProfile } from '../types';
import { formatDate } from '../utils/formatters';

const DB_NAME = 'board_log_db_v1';
const DB_VERSION = 1;

const STORE_GAMES = 'games';
const STORE_PLAYS = 'plays';

const LS_ACTIVE_USER = 'boardlog_active_user';
const LS_ALL_USERS = 'boardlog_all_users';
const LS_GUEST_UID = 'boardlog_guest_uid';

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_KEY_BITS = 256;
const PBKDF2_SALT_BYTES = 16;

const QUOTA_MESSAGE =
  '저장 공간이 가득 찼습니다. 사진 수를 줄이거나 오래된 기록을 정리한 뒤 다시 시도해주세요.';

const gamesKey = (uid: string) => `boardlog_games_${uid}`;
const playsKey = (uid: string) => `boardlog_plays_${uid}`;

type Backend = 'idb' | 'ls';

/** Ordering field: `createdAt` is day-resolution only, so it cannot order same-day records. */
type Stored<T> = T & { userId: string; order: number };

interface PasswordRecord {
  algo: 'pbkdf2-sha256';
  salt: string;
  iterations: number;
  hash: string;
}

interface StoredUser {
  profile: UserProfile;
  password?: PasswordRecord;
  /** Reversible base64 from a previous version; upgraded to `password` on next successful sign-in. */
  passwordHash?: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_KEY_BITS
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function createPasswordRecord(password: string): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  return {
    algo: 'pbkdf2-sha256',
    salt: bytesToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
    hash: await derivePasswordHash(password, salt, PBKDF2_ITERATIONS)
  };
}

function legacyHashMatches(password: string, legacyHash: string): boolean {
  try {
    return btoa(password) === legacyHash;
  } catch {
    // btoa rejects non-Latin1 input, so such a password was never storable by the legacy path.
    return false;
  }
}

function isQuotaError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'QuotaExceededError';
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}${Date.now()}`;
}

class BoardLogStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private backends = new Map<string, Backend>();
  private lastOrder = 0;

  /** Strictly increasing so records added within the same millisecond keep their insertion order. */
  private nextOrder(): number {
    const now = Date.now();
    this.lastOrder = now > this.lastOrder ? now : this.lastOrder + 1;
    return this.lastOrder;
  }

  private openDb(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_GAMES)) {
            db.createObjectStore(STORE_GAMES, { keyPath: 'id' }).createIndex('userId', 'userId');
          }
          if (!db.objectStoreNames.contains(STORE_PLAYS)) {
            db.createObjectStore(STORE_PLAYS, { keyPath: 'id' }).createIndex('userId', 'userId');
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.warn('IndexedDB unavailable, falling back to LocalStorage');
          resolve(null);
        };
        request.onblocked = () => resolve(null);
      } catch (err) {
        console.warn('IndexedDB threw, falling back to LocalStorage', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async idbReadAll<T>(storeName: string, uid: string): Promise<Stored<T>[] | null> {
    const db = await this.openDb();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).index('userId').getAll(uid);
        request.onsuccess = () => resolve(request.result as Stored<T>[]);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async idbReadOne<T>(storeName: string, id: string): Promise<Stored<T> | null> {
    const db = await this.openDb();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
        request.onsuccess = () => resolve((request.result as Stored<T>) ?? null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Both stores are keyed by record id alone, so a bare id lookup would reach any
   * account's rows. Every by-id path goes through here to stay inside one owner.
   */
  private async idbReadOwned<T>(
    storeName: string,
    uid: string,
    id: string
  ): Promise<Stored<T> | null> {
    const record = await this.idbReadOne<T>(storeName, id);
    return record && record.userId === uid ? record : null;
  }

  /** Resolves false when the store is simply unusable; rejects only when the device is out of space. */
  private async idbWrite(
    storeName: string,
    mutate: (store: IDBObjectStore) => void
  ): Promise<boolean> {
    const db = await this.openDb();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(storeName, 'readwrite');
      } catch {
        resolve(false);
        return;
      }

      const settleFailure = () => {
        if (tx.error && tx.error.name === 'QuotaExceededError') {
          reject(new Error(QUOTA_MESSAGE));
        } else {
          resolve(false);
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = settleFailure;
      tx.onabort = settleFailure;

      try {
        mutate(tx.objectStore(storeName));
      } catch {
        tx.abort();
      }
    });
  }

  private lsGet<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /** For user data: a failed write must reach the user rather than look like a successful save. */
  private lsSet(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      if (isQuotaError(err)) {
        throw new Error(QUOTA_MESSAGE);
      }
      throw err;
    }
  }

  /** For session pointers: losing one costs a re-login, so it must not block the app. */
  private lsSetQuiet(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('Non-critical LocalStorage write failed', err);
    }
  }

  private async resolveBackend(uid: string): Promise<Backend> {
    const cached = this.backends.get(uid);
    if (cached) return cached;

    const db = await this.openDb();
    if (!db) {
      this.backends.set(uid, 'ls');
      return 'ls';
    }

    let backend: Backend = 'ls';
    try {
      backend = (await this.migrateToIdb(uid)) ? 'idb' : 'ls';
    } catch {
      backend = 'ls';
    }
    this.backends.set(uid, backend);
    return backend;
  }

  /** Moves any LocalStorage-era records into IndexedDB. Originals are kept unless both stores commit. */
  private async migrateToIdb(uid: string): Promise<boolean> {
    const legacyGames = this.lsGet<UserGame[]>(gamesKey(uid), []);
    const legacyPlays = this.lsGet<PlayRecord[]>(playsKey(uid), []);
    if (legacyGames.length === 0 && legacyPlays.length === 0) return true;

    const base = Date.now();
    const writtenGames = await this.idbWrite(STORE_GAMES, (store) => {
      legacyGames.forEach((game, i) => store.put({ ...game, userId: uid, order: base - i }));
    });
    if (!writtenGames) return false;

    const writtenPlays = await this.idbWrite(STORE_PLAYS, (store) => {
      legacyPlays.forEach((play, i) => store.put({ ...play, userId: uid, order: base - i }));
    });
    if (!writtenPlays) return false;

    localStorage.removeItem(gamesKey(uid));
    localStorage.removeItem(playsKey(uid));
    return true;
  }

  // --- Auth methods ---
  async getActiveSession(): Promise<UserProfile | null> {
    return this.lsGet<UserProfile | null>(LS_ACTIVE_USER, null);
  }

  async setActiveSession(user: UserProfile | null): Promise<void> {
    this.lsSetQuiet(LS_ACTIVE_USER, user);
  }

  async signUp(email: string, password: string, nickname: string): Promise<UserProfile> {
    const users = this.lsGet<Record<string, StoredUser>>(LS_ALL_USERS, {});
    const cleanEmail = email.trim().toLowerCase();
    if (users[cleanEmail]) {
      throw new Error('이미 등록된 이메일 계정입니다.');
    }

    const uid = randomId('user');
    const newUser: UserProfile = {
      uid,
      email: cleanEmail,
      nickname: nickname.trim() || cleanEmail.split('@')[0],
      isAnonymous: false,
      createdAt: formatDate(),
      theme: 'light'
    };

    users[cleanEmail] = { profile: newUser, password: await createPasswordRecord(password) };
    this.lsSet(LS_ALL_USERS, users);
    await this.setActiveSession(newUser);
    await this.seedInitialUserGames(uid);

    return newUser;
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    const users = this.lsGet<Record<string, StoredUser>>(LS_ALL_USERS, {});
    const cleanEmail = email.trim().toLowerCase();
    const record = users[cleanEmail];

    if (!record) {
      throw new Error('등록되지 않은 이메일 계정입니다.');
    }

    if (record.password) {
      const candidate = await derivePasswordHash(
        password,
        base64ToBytes(record.password.salt),
        record.password.iterations
      );
      if (candidate !== record.password.hash) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
    } else if (record.passwordHash && legacyHashMatches(password, record.passwordHash)) {
      record.password = await createPasswordRecord(password);
      delete record.passwordHash;
      users[cleanEmail] = record;
      this.lsSet(LS_ALL_USERS, users);
    } else {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    await this.setActiveSession(record.profile);
    return record.profile;
  }

  /**
   * One guest identity per browser. A fresh uid per call would orphan that guest's
   * records under an unreachable key on every sign-out.
   */
  private getOrCreateGuestUid(): string {
    const existing = this.lsGet<string | null>(LS_GUEST_UID, null);
    if (existing) return existing;

    const active = this.lsGet<UserProfile | null>(LS_ACTIVE_USER, null);
    const uid = active?.isAnonymous && active.uid ? active.uid : randomId('guest');
    this.lsSetQuiet(LS_GUEST_UID, uid);
    this.dropUnreachableGuestData(uid);
    return uid;
  }

  /** Clears `guest_*` records stranded by the previous per-call uid scheme; no code path can read them. */
  private dropUnreachableGuestData(activeGuestUid: string): void {
    try {
      const stale: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        const match = /^boardlog_(?:games|plays)_(guest_[a-z0-9]+)$/.exec(key);
        if (match && match[1] !== activeGuestUid) {
          stale.push(key);
        }
      }
      stale.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.warn('Guest cleanup skipped', err);
    }
  }

  async signInAnonymously(): Promise<UserProfile> {
    const guestUid = this.getOrCreateGuestUid();
    const guestUser: UserProfile = {
      uid: guestUid,
      email: 'guest@boardlog.app',
      nickname: '게스트 플레이어',
      isAnonymous: true,
      createdAt: formatDate(),
      theme: 'light'
    };

    await this.setActiveSession(guestUser);
    await this.seedInitialUserGames(guestUid);
    return guestUser;
  }

  async signOut(): Promise<void> {
    await this.setActiveSession(null);
  }

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getActiveSession();
    if (!current || current.uid !== uid) {
      throw new Error('로그인이 필요합니다.');
    }
    const updated: UserProfile = { ...current, ...updates };
    await this.setActiveSession(updated);

    if (!current.isAnonymous && current.email) {
      const users = this.lsGet<Record<string, StoredUser>>(LS_ALL_USERS, {});
      if (users[current.email]) {
        users[current.email].profile = updated;
        this.lsSet(LS_ALL_USERS, users);
      }
    }
    return updated;
  }

  // --- Seed default games for a fresh user ---
  private async seedInitialUserGames(uid: string) {
    const existingGames = await this.getUserGames(uid);
    if (existingGames.length > 0) return;

    const sampleGames: UserGame[] = [
      {
        id: 'sample-game-1-' + uid,
        title: '스플렌더',
        titleEn: 'Splendor',
        imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
        genre: ['엔진빌딩', '전략', '셋컬렉션'],
        minPlayers: 2,
        maxPlayers: 4,
        bestPlayers: '3인',
        recommendedAge: 10,
        playTime: 30,
        weight: 1.8,
        publisher: '스페이스 카우보이즈',
        purchaseDate: formatDate(),
        purchasePrice: 32000,
        originalPrice: 42000,
        marketPrice: 25000,
        storageLocation: '거실 보드게임장 1단',
        condition: '최상',
        tags: ['가족용', '입문추천', '인기게임'],
        notes: '친구들과 언제 돌려도 실패 없는 르네상스 보석 상인 엔진 빌딩',
        ownershipStatus: '보유중',
        playCount: 1,
        priceMeta: {
          source: '온라인 구매 (사용자 수동 입력)',
          verifiedDate: formatDate(),
          isManual: true
        },
        createdAt: formatDate(),
        updatedAt: formatDate()
      },
      {
        id: 'sample-game-2-' + uid,
        title: '카탄',
        titleEn: 'Catan',
        imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80',
        genre: ['전략', '협상', '주사위'],
        minPlayers: 3,
        maxPlayers: 4,
        bestPlayers: '4인',
        recommendedAge: 10,
        playTime: 75,
        weight: 2.3,
        publisher: '코스모스',
        purchaseDate: formatDate(),
        purchasePrice: 45000,
        originalPrice: 52000,
        marketPrice: 35000,
        storageLocation: '서재 선반 A열',
        condition: '상',
        tags: ['주말모임', '거래협상'],
        notes: '밀과 벽돌을 교역하며 섬을 개척하는 명작',
        ownershipStatus: '보유중',
        playCount: 0,
        priceMeta: {
          source: '보드게임 페스타 (사용자 수동 입력)',
          verifiedDate: formatDate(),
          isManual: true
        },
        createdAt: formatDate(),
        updatedAt: formatDate()
      }
    ];

    for (const g of sampleGames) {
      await this.addUserGame(uid, g);
    }

    const samplePlay: PlayRecord = {
      id: 'sample-play-1-' + uid,
      gameId: sampleGames[0].id,
      gameTitle: '스플렌더',
      gameImageUrl: sampleGames[0].imageUrl,
      date: formatDate(),
      startTime: '19:30',
      endTime: '20:10',
      durationMinutes: 40,
      location: '강남 보드게임 카페',
      participants: [
        { id: 'p1', name: '나', score: 15, rank: 1, isWinner: true, notes: '루비/사파이어 엔진 완성!' },
        { id: 'p2', name: '민수', score: 13, rank: 2, isWinner: false },
        { id: 'p3', name: '지은', score: 10, rank: 3, isWinner: false }
      ],
      winnerNames: ['나'],
      myResult: '승리',
      isTeamPlay: false,
      hasExpansion: false,
      expansionName: '',
      rating: 5,
      review: '초반 1단계 카드를 빠르게 모아 후반 귀족 타일 2개를 선점하며 15점으로 역전 승리!',
      photos: [],
      createdAt: formatDate(),
      updatedAt: formatDate()
    };

    await this.addUserPlay(uid, samplePlay);
  }

  // --- User Games CRUD ---
  async getUserGames(uid: string): Promise<UserGame[]> {
    if ((await this.resolveBackend(uid)) === 'idb') {
      const stored = await this.idbReadAll<UserGame>(STORE_GAMES, uid);
      if (stored) {
        return stored
          .sort((a, b) => b.order - a.order)
          .map(({ userId, order, ...game }) => game as UserGame);
      }
    }
    return this.lsGet<UserGame[]>(gamesKey(uid), []);
  }

  async getUserGameById(uid: string, id: string): Promise<UserGame | null> {
    const games = await this.getUserGames(uid);
    return games.find((g) => g.id === id) || null;
  }

  async addUserGame(
    uid: string,
    game: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'> | UserGame
  ): Promise<UserGame> {
    const newGame: UserGame = {
      ...game,
      id: 'id' in game && game.id ? game.id : randomId('game'),
      createdAt: 'createdAt' in game && game.createdAt ? game.createdAt : formatDate(),
      updatedAt: formatDate()
    };

    if ((await this.resolveBackend(uid)) === 'idb') {
      const order = this.nextOrder();
      if (await this.idbWrite(STORE_GAMES, (store) => store.put({ ...newGame, userId: uid, order }))) {
        return newGame;
      }
    }

    const games = this.lsGet<UserGame[]>(gamesKey(uid), []);
    games.unshift(newGame);
    this.lsSet(gamesKey(uid), games);
    return newGame;
  }

  async updateUserGame(uid: string, id: string, updates: Partial<UserGame>): Promise<UserGame> {
    if ((await this.resolveBackend(uid)) === 'idb') {
      const existing = await this.idbReadOwned<UserGame>(STORE_GAMES, uid, id);
      if (!existing) {
        throw new Error('수정할 게임을 찾을 수 없습니다.');
      }
      const merged = { ...existing, ...updates, updatedAt: formatDate() };
      if (await this.idbWrite(STORE_GAMES, (store) => store.put(merged))) {
        const { userId, order, ...game } = merged;
        return game as UserGame;
      }
    }

    const games = this.lsGet<UserGame[]>(gamesKey(uid), []);
    const index = games.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error('수정할 게임을 찾을 수 없습니다.');
    }
    games[index] = { ...games[index], ...updates, updatedAt: formatDate() };
    this.lsSet(gamesKey(uid), games);
    return games[index];
  }

  async deleteUserGame(uid: string, id: string): Promise<boolean> {
    if ((await this.resolveBackend(uid)) === 'idb') {
      if (!(await this.idbReadOwned<UserGame>(STORE_GAMES, uid, id))) {
        return true;
      }
      if (await this.idbWrite(STORE_GAMES, (store) => store.delete(id))) {
        return true;
      }
    }

    const games = this.lsGet<UserGame[]>(gamesKey(uid), []);
    this.lsSet(gamesKey(uid), games.filter((g) => g.id !== id));
    return true;
  }

  // --- Play Records CRUD ---
  async getUserPlays(uid: string): Promise<PlayRecord[]> {
    if ((await this.resolveBackend(uid)) === 'idb') {
      const stored = await this.idbReadAll<PlayRecord>(STORE_PLAYS, uid);
      if (stored) {
        return stored
          .sort((a, b) => b.order - a.order)
          .map(({ userId, order, ...play }) => play as PlayRecord);
      }
    }
    return this.lsGet<PlayRecord[]>(playsKey(uid), []);
  }

  async getPlayRecords(uid: string): Promise<PlayRecord[]> {
    return this.getUserPlays(uid);
  }

  async getUserPlayById(uid: string, id: string): Promise<PlayRecord | null> {
    const plays = await this.getUserPlays(uid);
    return plays.find((p) => p.id === id) || null;
  }

  async addUserPlay(
    uid: string,
    play: Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'> | PlayRecord
  ): Promise<PlayRecord> {
    const newPlay: PlayRecord = {
      ...play,
      id: 'id' in play && play.id ? play.id : randomId('play'),
      createdAt: 'createdAt' in play && play.createdAt ? play.createdAt : formatDate(),
      updatedAt: formatDate()
    };

    let written = false;
    if ((await this.resolveBackend(uid)) === 'idb') {
      const order = this.nextOrder();
      written = await this.idbWrite(STORE_PLAYS, (store) => store.put({ ...newPlay, userId: uid, order }));
    }
    if (!written) {
      const plays = this.lsGet<PlayRecord[]>(playsKey(uid), []);
      plays.unshift(newPlay);
      this.lsSet(playsKey(uid), plays);
    }

    if (newPlay.gameId) {
      const game = await this.getUserGameById(uid, newPlay.gameId);
      if (game) {
        await this.updateUserGame(uid, game.id, { playCount: (game.playCount || 0) + 1 });
      }
    }

    return newPlay;
  }

  async addPlayRecord(
    uid: string,
    play: Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'> | PlayRecord
  ): Promise<PlayRecord> {
    return this.addUserPlay(uid, play);
  }

  async updateUserPlay(uid: string, id: string, updates: Partial<PlayRecord>): Promise<PlayRecord> {
    if ((await this.resolveBackend(uid)) === 'idb') {
      const existing = await this.idbReadOwned<PlayRecord>(STORE_PLAYS, uid, id);
      if (!existing) {
        throw new Error('수정할 플레이 기록을 찾을 수 없습니다.');
      }
      const merged = { ...existing, ...updates, updatedAt: formatDate() };
      if (await this.idbWrite(STORE_PLAYS, (store) => store.put(merged))) {
        const { userId, order, ...play } = merged;
        return play as PlayRecord;
      }
    }

    const plays = this.lsGet<PlayRecord[]>(playsKey(uid), []);
    const index = plays.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('수정할 플레이 기록을 찾을 수 없습니다.');
    }
    plays[index] = { ...plays[index], ...updates, updatedAt: formatDate() };
    this.lsSet(playsKey(uid), plays);
    return plays[index];
  }

  async updatePlayRecord(uid: string, id: string, updates: Partial<PlayRecord>): Promise<PlayRecord> {
    return this.updateUserPlay(uid, id, updates);
  }

  async deleteUserPlay(uid: string, id: string): Promise<boolean> {
    const target = await this.getUserPlayById(uid, id);
    if (!target) return true;

    let deleted = false;
    if ((await this.resolveBackend(uid)) === 'idb') {
      deleted = await this.idbWrite(STORE_PLAYS, (store) => store.delete(id));
    }
    if (!deleted) {
      const plays = this.lsGet<PlayRecord[]>(playsKey(uid), []);
      this.lsSet(playsKey(uid), plays.filter((p) => p.id !== id));
    }

    if (target.gameId) {
      const game = await this.getUserGameById(uid, target.gameId);
      if (game && game.playCount > 0) {
        await this.updateUserGame(uid, game.id, { playCount: Math.max(0, game.playCount - 1) });
      }
    }
    return true;
  }

  async deletePlayRecord(uid: string, id: string): Promise<boolean> {
    return this.deleteUserPlay(uid, id);
  }

  // --- Export JSON ---
  async exportUserDataJson(uid: string): Promise<string> {
    const games = await this.getUserGames(uid);
    const plays = await this.getUserPlays(uid);
    const session = await this.getActiveSession();
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user: session,
        games,
        plays
      },
      null,
      2
    );
  }
}

export const storage = new BoardLogStorage();
