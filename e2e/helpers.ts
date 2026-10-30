import { expect, type Locator, type Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:4173';
export const MOBILE = { width: 420, height: 900 };

/** Only the fields the specs read; the app stores more. */
export interface Row {
  id: string;
  userId: string;
  title?: string;
  gameTitle?: string;
  gameId?: string | null;
  playCount?: number;
  imageUrl?: string;
  myResult?: string;
  rating?: number;
  review?: string;
  photos?: unknown[];
  participants?: { id?: string; name: string; score: number | null; isWinner: boolean }[];
}

export interface Stores {
  games: Row[];
  plays: Row[];
}

type Store = 'games' | 'plays';

/**
 * A soft assertion with a readable name: every check runs even after one fails, so a single run
 * shows everything that broke (the shape the original QA scripts had).
 */
export const check = (name: string, pass: unknown, detail = '') =>
  expect.soft(Boolean(pass), detail ? `${name} — ${detail}` : name).toBe(true);

export const visible = (name: string, locator: Locator, timeout = 5_000) =>
  expect.soft(locator, name).toBeVisible({ timeout });

export const hidden = (name: string, locator: Locator) => expect.soft(locator, name).toBeHidden();

export const hasText = (name: string, locator: Locator, text: string) => expect.soft(locator, name).toContainText(text);

export const activeUid = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('boardlog_active_user') ?? 'null')?.uid as string | undefined);

export async function requireUid(page: Page): Promise<string> {
  const uid = await activeUid(page);
  if (!uid) throw new Error('No active user in localStorage');
  return uid;
}

/** Every record in both IndexedDB stores, or only the active account's when `onlyActiveUser` is set. */
export const readStores = (page: Page, onlyActiveUser = false) =>
  page.evaluate(
    (onlyActive) =>
      new Promise<Stores>((resolve, reject) => {
        const uid = onlyActive ? JSON.parse(localStorage.getItem('boardlog_active_user') ?? 'null')?.uid : null;
        const req = indexedDB.open('board_log_db_v1');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction(['games', 'plays'], 'readonly');
          const out: Stores = { games: [], plays: [] };
          let pending = 2;
          for (const name of ['games', 'plays'] as const) {
            const request = tx.objectStore(name).getAll();
            request.onsuccess = () => {
              out[name] = onlyActive ? request.result.filter((row) => row.userId === uid) : request.result;
              pending -= 1;
              if (pending === 0) resolve(out);
            };
          }
        };
      }),
    onlyActiveUser
  );

/** Writes raw records straight into IndexedDB (a legacy account's data, another account's data...). */
export const putRows = (page: Page, items: { store: Store; row: object }[]) =>
  page.evaluate(
    (rows) =>
      new Promise<boolean>((resolve, reject) => {
        const req = indexedDB.open('board_log_db_v1');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction(['games', 'plays'], 'readwrite');
          for (const { store, row } of rows) tx.objectStore(store).put(row);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        };
      }),
    items
  );

export const gameRow = (overrides: Partial<Row> & Record<string, unknown> & Pick<Row, 'id' | 'userId' | 'title'>) => ({
  order: 1,
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
  createdAt: '',
  updatedAt: '',
  ...overrides
});

export const playRow = (id: string, userId: string, gameId: string, gameTitle: string, won: boolean) => ({
  id,
  userId,
  order: 2,
  gameId,
  gameTitle,
  gameImageUrl: '',
  date: '2026.10.01',
  startTime: '19:00',
  endTime: '20:00',
  durationMinutes: 60,
  location: '',
  participants: [
    { id: 'p_me', name: '나', score: null, rank: null, isWinner: won },
    { id: 'p2', name: won ? '민수' : '수진', score: null, rank: null, isWinner: !won }
  ],
  winnerNames: [],
  myResult: won ? '승리' : '패배',
  isTeamPlay: false,
  hasExpansion: false,
  expansionName: '',
  rating: 5,
  review: '',
  photos: [],
  createdAt: '',
  updatedAt: ''
});

export const owned = (rows: Row[], uid: string) => rows.filter((row) => row.userId === uid);
