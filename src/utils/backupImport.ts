import {
  UserGame,
  PlayRecord,
  PlayParticipant,
  PlayPhoto,
  MyGameResult,
  GameOwnershipStatus,
  GameCondition
} from '../types';

/** Photos are stored as data URLs, so a real backup can be large; this only stops a runaway file. */
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

/**
 * `sourceId` is the id the record had in the backup. It is only used to re-link plays to
 * games and must never be written: ids are global across accounts in IndexedDB, so
 * reusing one could overwrite another account's record.
 */
export interface ImportedGame {
  sourceId: string;
  data: Omit<UserGame, 'id'>;
}

export interface ImportedPlay {
  sourceGameId: string | null;
  data: Omit<PlayRecord, 'id'>;
}

export interface ParsedBackup {
  games: ImportedGame[];
  plays: ImportedPlay[];
  /** Entries dropped because they lacked a title or were not objects. */
  invalidCount: number;
}

const OWNERSHIP: readonly GameOwnershipStatus[] = ['보유중', '빌려줌', '빌림', '판매예정', '판매완료', '분실', '처분'];
const CONDITIONS: readonly GameCondition[] = ['미개봉', '최상', '상', '중', '하'];
const RESULTS: readonly MyGameResult[] = ['승리', '패배', '무승부', '참여'];

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strArray = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

/** These values end up in <img src>; anything but a web or inline image URL is dropped. */
export const safeImageUrl = (v: unknown): string => {
  const url = str(v).trim();
  return /^(https?:\/\/|data:image\/)/i.test(url) ? url : '';
};

function normalizeGame(raw: unknown): ImportedGame | null {
  if (!isObject(raw)) return null;
  const title = str(raw.title).trim();
  if (!title) return null;
  const priceMeta = isObject(raw.priceMeta) ? raw.priceMeta : {};

  return {
    sourceId: str(raw.id),
    data: {
      title,
      titleEn: str(raw.titleEn),
      imageUrl: safeImageUrl(raw.imageUrl),
      genre: strArray(raw.genre),
      minPlayers: num(raw.minPlayers, 1),
      maxPlayers: num(raw.maxPlayers, 4),
      bestPlayers: str(raw.bestPlayers),
      recommendedAge: num(raw.recommendedAge),
      playTime: num(raw.playTime, 45),
      weight: num(raw.weight, 2),
      publisher: str(raw.publisher),
      purchaseDate: str(raw.purchaseDate),
      purchasePrice: num(raw.purchasePrice),
      originalPrice: num(raw.originalPrice),
      marketPrice: num(raw.marketPrice),
      storageLocation: str(raw.storageLocation),
      condition: oneOf(raw.condition, CONDITIONS, '상'),
      tags: strArray(raw.tags),
      notes: str(raw.notes),
      ownershipStatus: oneOf(raw.ownershipStatus, OWNERSHIP, '보유중'),
      playCount: Math.max(0, Math.floor(num(raw.playCount))),
      priceMeta: {
        source: str(priceMeta.source),
        verifiedDate: str(priceMeta.verifiedDate),
        isManual: priceMeta.isManual === true
      },
      createdAt: str(raw.createdAt),
      updatedAt: str(raw.updatedAt)
    }
  };
}

function normalizeParticipant(raw: unknown, index: number): PlayParticipant | null {
  if (!isObject(raw)) return null;
  const name = str(raw.name).trim();
  if (!name) return null;
  return {
    id: str(raw.id) || `p_${index}`,
    name,
    score: numOrNull(raw.score),
    rank: numOrNull(raw.rank),
    isWinner: raw.isWinner === true,
    characterOrFaction: str(raw.characterOrFaction),
    notes: str(raw.notes)
  };
}

function normalizePhoto(raw: unknown, index: number): PlayPhoto | null {
  if (!isObject(raw)) return null;
  const url = safeImageUrl(raw.url);
  if (!url) return null;
  const rotation = num(raw.rotation);
  return {
    id: str(raw.id) || `photo_${index}`,
    url,
    caption: str(raw.caption),
    rotation: [0, 90, 180, 270].includes(rotation) ? rotation : 0
  };
}

function normalizePlay(raw: unknown): ImportedPlay | null {
  if (!isObject(raw)) return null;
  const gameTitle = str(raw.gameTitle).trim();
  if (!gameTitle) return null;

  const participants = Array.isArray(raw.participants)
    ? raw.participants.map(normalizeParticipant).filter((p): p is PlayParticipant => p !== null)
    : [];
  const photos = Array.isArray(raw.photos)
    ? raw.photos.map(normalizePhoto).filter((p): p is PlayPhoto => p !== null)
    : [];
  const sourceGameId = str(raw.gameId);

  return {
    sourceGameId: sourceGameId || null,
    data: {
      gameId: null,
      gameTitle,
      gameImageUrl: safeImageUrl(raw.gameImageUrl),
      date: str(raw.date),
      startTime: str(raw.startTime),
      endTime: str(raw.endTime),
      durationMinutes: Math.max(0, num(raw.durationMinutes)),
      location: str(raw.location),
      participants,
      winnerNames: participants.filter((p) => p.isWinner).map((p) => p.name),
      myResult: oneOf(raw.myResult, RESULTS, '참여'),
      isTeamPlay: raw.isTeamPlay === true,
      hasExpansion: raw.hasExpansion === true,
      expansionName: str(raw.expansionName),
      rating: Math.min(5, Math.max(0, num(raw.rating))),
      review: str(raw.review),
      photos,
      createdAt: str(raw.createdAt),
      updatedAt: str(raw.updatedAt)
    }
  };
}

/** Throws a user-facing Korean message when the file cannot be a BoardLog backup at all. */
export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_BYTES) {
    throw new Error('백업 파일이 너무 큽니다.');
  }

  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    throw new Error('JSON 형식의 백업 파일이 아닙니다.');
  }
  if (!isObject(root) || !Array.isArray(root.games) || !Array.isArray(root.plays)) {
    throw new Error('보드로그 백업 파일 형식이 아닙니다.');
  }

  const games = root.games.map(normalizeGame);
  const plays = root.plays.map(normalizePlay);
  const validGames = games.filter((g): g is ImportedGame => g !== null);
  const validPlays = plays.filter((p): p is ImportedPlay => p !== null);

  return {
    games: validGames,
    plays: validPlays,
    invalidCount: games.length - validGames.length + (plays.length - validPlays.length)
  };
}

export const gameDedupKey = (title: string) => title.trim().toLowerCase();

/** Same game, same day and time, same people: treated as the same session already on record. */
export const playDedupKey = (play: Pick<PlayRecord, 'gameTitle' | 'date' | 'startTime' | 'participants'>) =>
  [
    play.gameTitle.trim().toLowerCase(),
    play.date,
    play.startTime,
    play.participants
      .map((p) => p.name.trim())
      .sort()
      .join(',')
  ].join('|');
