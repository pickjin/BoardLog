import { UserGame, PlayRecord, UserProfile, GameOwnershipStatus } from '../types';
import { formatDate } from '../utils/formatters';

const DB_NAME = 'board_log_db_v1';
const DB_VERSION = 1;

class BoardLogStorage {
  private db: IDBDatabase | null = null;
  private isReady = false;

  private async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'uid' });
          }
          if (!db.objectStoreNames.contains('games')) {
            const gameStore = db.createObjectStore('games', { keyPath: 'id' });
            gameStore.createIndex('userId', 'userId', { unique: false });
          }
          if (!db.objectStoreNames.contains('plays')) {
            const playStore = db.createObjectStore('plays', { keyPath: 'id' });
            playStore.createIndex('userId', 'userId', { unique: false });
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isReady = true;
          resolve(this.db);
        };

        request.onerror = () => {
          console.warn('IndexedDB failed to open, using LocalStorage fallback');
          resolve(null as unknown as IDBDatabase);
        };
      } catch (err) {
        console.warn('IndexedDB exception, using LocalStorage fallback', err);
        resolve(null as unknown as IDBDatabase);
      }
    });
  }

  // --- Fallback Helpers (LocalStorage) ---
  private lsGet<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private lsSet(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('LocalStorage write error', err);
    }
  }

  // --- Auth methods ---
  async getActiveSession(): Promise<UserProfile | null> {
    const sessionUser = this.lsGet<UserProfile | null>('boardlog_active_user', null);
    return sessionUser;
  }

  async setActiveSession(user: UserProfile | null): Promise<void> {
    this.lsSet('boardlog_active_user', user);
  }

  async signUp(email: string, password: string, nickname: string): Promise<UserProfile> {
    const db = await this.openDb();
    const users = this.lsGet<Record<string, { profile: UserProfile; passwordHash: string }>>('boardlog_all_users', {});

    const cleanEmail = email.trim().toLowerCase();
    if (users[cleanEmail]) {
      throw new Error('이미 등록된 이메일 계정입니다.');
    }

    const uid = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now();
    const newUser: UserProfile = {
      uid,
      email: cleanEmail,
      nickname: nickname.trim() || cleanEmail.split('@')[0],
      isAnonymous: false,
      createdAt: formatDate(),
      theme: 'light'
    };

    users[cleanEmail] = {
      profile: newUser,
      passwordHash: btoa(password) // basic hash simulation
    };
    this.lsSet('boardlog_all_users', users);
    await this.setActiveSession(newUser);

    // Also populate default sample games so first-time user has immediate delight
    await this.seedInitialUserGames(uid);

    return newUser;
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    const users = this.lsGet<Record<string, { profile: UserProfile; passwordHash: string }>>('boardlog_all_users', {});
    const cleanEmail = email.trim().toLowerCase();
    const record = users[cleanEmail];

    if (!record) {
      throw new Error('등록되지 않은 이메일 계정입니다.');
    }
    if (record.passwordHash !== btoa(password)) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    await this.setActiveSession(record.profile);
    return record.profile;
  }

  async signInAnonymously(): Promise<UserProfile> {
    const guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
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
      const users = this.lsGet<Record<string, { profile: UserProfile; passwordHash: string }>>('boardlog_all_users', {});
      if (users[current.email]) {
        users[current.email].profile = updated;
        this.lsSet('boardlog_all_users', users);
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

    // Add a sample play record
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
    const key = `boardlog_games_${uid}`;
    const games = this.lsGet<UserGame[]>(key, []);
    return games;
  }

  async getUserGameById(uid: string, id: string): Promise<UserGame | null> {
    const games = await this.getUserGames(uid);
    return games.find((g) => g.id === id) || null;
  }

  async addUserGame(
    uid: string,
    game: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'> | UserGame
  ): Promise<UserGame> {
    const key = `boardlog_games_${uid}`;
    const games = await this.getUserGames(uid);
    const newGame: UserGame = {
      ...game,
      id: ('id' in game && game.id) ? game.id : 'game_' + Math.random().toString(36).substring(2, 9) + Date.now(),
      createdAt: ('createdAt' in game && game.createdAt) ? game.createdAt : formatDate(),
      updatedAt: formatDate()
    };
    games.unshift(newGame);
    this.lsSet(key, games);
    return newGame;
  }

  async updateUserGame(uid: string, id: string, updates: Partial<UserGame>): Promise<UserGame> {
    const key = `boardlog_games_${uid}`;
    const games = await this.getUserGames(uid);
    const index = games.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error('수정할 게임을 찾을 수 없습니다.');
    }
    const updatedGame: UserGame = {
      ...games[index],
      ...updates,
      updatedAt: formatDate()
    };
    games[index] = updatedGame;
    this.lsSet(key, games);
    return updatedGame;
  }

  async deleteUserGame(uid: string, id: string): Promise<boolean> {
    const key = `boardlog_games_${uid}`;
    const games = await this.getUserGames(uid);
    const filtered = games.filter((g) => g.id !== id);
    this.lsSet(key, filtered);
    return true;
  }

  // --- Play Records CRUD ---
  async getUserPlays(uid: string): Promise<PlayRecord[]> {
    const key = `boardlog_plays_${uid}`;
    const plays = this.lsGet<PlayRecord[]>(key, []);
    return plays;
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
    const key = `boardlog_plays_${uid}`;
    const plays = await this.getUserPlays(uid);
    const newPlay: PlayRecord = {
      ...play,
      id: ('id' in play && play.id) ? play.id : 'play_' + Math.random().toString(36).substring(2, 9) + Date.now(),
      createdAt: ('createdAt' in play && play.createdAt) ? play.createdAt : formatDate(),
      updatedAt: formatDate()
    };
    plays.unshift(newPlay);
    this.lsSet(key, plays);

    // Auto increment play count if attached to a UserGame
    if (newPlay.gameId) {
      const userGames = await this.getUserGames(uid);
      const game = userGames.find((g) => g.id === newPlay.gameId);
      if (game) {
        await this.updateUserGame(uid, game.id, {
          playCount: (game.playCount || 0) + 1
        });
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
    const key = `boardlog_plays_${uid}`;
    const plays = await this.getUserPlays(uid);
    const index = plays.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('수정할 플레이 기록을 찾을 수 없습니다.');
    }
    const updatedPlay: PlayRecord = {
      ...plays[index],
      ...updates,
      updatedAt: formatDate()
    };
    plays[index] = updatedPlay;
    this.lsSet(key, plays);
    return updatedPlay;
  }

  async updatePlayRecord(uid: string, id: string, updates: Partial<PlayRecord>): Promise<PlayRecord> {
    return this.updateUserPlay(uid, id, updates);
  }

  async deleteUserPlay(uid: string, id: string): Promise<boolean> {
    const key = `boardlog_plays_${uid}`;
    const plays = await this.getUserPlays(uid);
    const target = plays.find((p) => p.id === id);
    const filtered = plays.filter((p) => p.id !== id);
    this.lsSet(key, filtered);

    // Decrement play count on associated user game
    if (target?.gameId) {
      const userGames = await this.getUserGames(uid);
      const game = userGames.find((g) => g.id === target.gameId);
      if (game && game.playCount > 0) {
        await this.updateUserGame(uid, game.id, {
          playCount: Math.max(0, (game.playCount || 1) - 1)
        });
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
