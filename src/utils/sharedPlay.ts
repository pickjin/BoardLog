import { PlayRecord, MyGameResult } from '../types';

/**
 * A play travels inside the link itself (after '#', which browsers never send to the server),
 * so a friend can add it to their own log without a backend. Photos, rating and review stay
 * with the sharer: they are personal and would make the link too long to paste.
 */

const HASH_KEY = 'play';
const MAX_ENCODED_LENGTH = 6000;
const MAX_PARTICIPANTS = 20;
const MAX_NAME_LENGTH = 30;
const MAX_TEXT_LENGTH = 80;
const RESULTS: readonly MyGameResult[] = ['승리', '패배', '무승부', '참여'];

export interface SharedParticipant {
  name: string;
  score: number | null;
  rank: number | null;
  isWinner: boolean;
}

export interface SharedPlay {
  sharedBy: string;
  gameTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location: string;
  isTeamPlay: boolean;
  expansionName: string;
  /** The sharer's own result; only used to tell a draw from a no-winner game. */
  sharerResult: MyGameResult;
  participants: SharedParticipant[];
}

const isMe = (p: { id?: string; name: string }) => p.id === 'p_me' || p.name === '나';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** '나' only means something on the sharer's device, so it is swapped for their name. */
export function buildShareLink(play: PlayRecord, sharerName: string, origin: string): string {
  const name = sharerName.trim();
  const payload = {
    v: 1,
    by: name,
    g: play.gameTitle,
    d: play.date,
    st: play.startTime,
    et: play.endTime,
    dm: play.durationMinutes,
    l: play.location,
    t: play.isTeamPlay ? 1 : 0,
    x: play.hasExpansion ? play.expansionName : '',
    r: play.myResult,
    p: play.participants.map((p) => ({
      n: isMe(p) ? name : p.name,
      s: p.score,
      k: p.rank,
      w: p.isWinner ? 1 : 0
    }))
  };
  return `${origin}/#${HASH_KEY}=${toBase64Url(JSON.stringify(payload))}`;
}

export const sharedHashPresent = (hash: string) => hash.startsWith(`#${HASH_KEY}=`);

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Null for anything that is not a well-formed share; the link is untrusted input. */
export function decodeSharedPlay(hash: string): SharedPlay | null {
  if (!sharedHashPresent(hash)) return null;
  const encoded = hash.slice(HASH_KEY.length + 2);
  if (!encoded || encoded.length > MAX_ENCODED_LENGTH) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(encoded));
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !Array.isArray(o.p)) return null;

  const participants = o.p
    .slice(0, MAX_PARTICIPANTS)
    .map((p): SharedParticipant | null => {
      if (typeof p !== 'object' || p === null) return null;
      const q = p as Record<string, unknown>;
      const name = clip(q.n, MAX_NAME_LENGTH);
      return name ? { name, score: numOrNull(q.s), rank: numOrNull(q.k), isWinner: q.w === 1 } : null;
    })
    .filter((p): p is SharedParticipant => p !== null);

  const gameTitle = clip(o.g, MAX_TEXT_LENGTH);
  if (!gameTitle || participants.length === 0) return null;

  return {
    sharedBy: clip(o.by, MAX_NAME_LENGTH),
    gameTitle,
    date: clip(o.d, 10),
    startTime: clip(o.st, 5),
    endTime: clip(o.et, 5),
    durationMinutes: Math.max(0, Math.min(24 * 60, numOrNull(o.dm) ?? 0)),
    location: clip(o.l, MAX_TEXT_LENGTH),
    isTeamPlay: o.t === 1,
    expansionName: clip(o.x, MAX_TEXT_LENGTH),
    sharerResult: RESULTS.includes(o.r as MyGameResult) ? (o.r as MyGameResult) : '참여',
    participants
  };
}

/** The recipient's result, read from the same winner marks everyone agreed on. */
export function resultFor(shared: SharedPlay, myIndex: number): MyGameResult {
  const me = shared.participants[myIndex];
  if (me?.isWinner) return '승리';
  if (shared.participants.some((p) => p.isWinner)) return '패배';
  return shared.sharerResult === '무승부' ? '무승부' : '참여';
}

/**
 * Rewrites the shared play from the recipient's seat: their row becomes '나'. The result is a
 * raw record that still goes through the backup normaliser before anything is stored.
 */
export function toRecipientRecord(shared: SharedPlay, myIndex: number) {
  const participants = shared.participants.map((p, i) => ({
    id: i === myIndex ? 'p_me' : `p_${i}`,
    name: i === myIndex ? '나' : p.name,
    score: p.score,
    rank: p.rank,
    isWinner: p.isWinner,
    notes: ''
  }));
  return {
    gameId: null,
    gameTitle: shared.gameTitle,
    gameImageUrl: '',
    date: shared.date,
    startTime: shared.startTime,
    endTime: shared.endTime,
    durationMinutes: shared.durationMinutes,
    location: shared.location,
    participants,
    myResult: resultFor(shared, myIndex),
    isTeamPlay: shared.isTeamPlay,
    hasExpansion: Boolean(shared.expansionName),
    expansionName: shared.expansionName,
    rating: 0,
    review: '',
    photos: []
  };
}
