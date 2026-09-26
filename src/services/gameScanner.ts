import { SeedGame } from '../types';
import { SEED_GAMES } from '../data/seedGames';
import { compressImage } from '../utils/imageCompressor';
import { findSeedMatch, SeedMatch } from '../utils/titleMatch';

export const MAX_SCAN_IMAGES = 4;

export type TitleOrientation = 'horizontal' | 'vertical' | 'rotated';

export interface ScanDetection {
  title: string;
  titleEn?: string;
  orientation: TitleOrientation;
  confidence: number;
}

export interface ScanCandidate {
  id: string;
  detection: ScanDetection;
  /** Null when the photographed title is not in the seed list; registered under its read title. */
  match: SeedMatch | null;
}

export class ScanNotConfiguredError extends Error {
  constructor() {
    super('사진 인식 기능이 아직 설정되지 않았습니다. 관리자에게 문의해주세요.');
    this.name = 'ScanNotConfiguredError';
  }
}

function toInlineImage(dataUrl: string): { data: string; mimeType: string } {
  const separator = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, separator);
  const mimeType = header.slice(header.indexOf(':') + 1, header.indexOf(';'));
  return { data: dataUrl.slice(separator + 1), mimeType };
}

function isDetection(value: unknown): value is ScanDetection {
  if (typeof value !== 'object' || value === null) return false;
  const { title, orientation, confidence } = value as Record<string, unknown>;
  return (
    typeof title === 'string' &&
    title.trim().length > 0 &&
    (orientation === 'horizontal' || orientation === 'vertical' || orientation === 'rotated') &&
    typeof confidence === 'number'
  );
}

export async function scanGamePhotos(
  files: File[],
  seeds: SeedGame[] = SEED_GAMES
): Promise<ScanCandidate[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_SCAN_IMAGES) {
    throw new Error(`사진은 한 번에 ${MAX_SCAN_IMAGES}장까지 인식할 수 있습니다.`);
  }

  const compressed = await Promise.all(files.map((file) => compressImage(file)));
  const images = compressed.map((result) => toInlineImage(result.dataUrl));

  const response = await fetch('/api/scan-games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images })
  });

  let payload: { detections?: unknown; error?: unknown; code?: unknown } = {};
  try {
    payload = await response.json();
  } catch {
    throw new Error('사진 인식 서버 응답을 읽지 못했습니다.');
  }

  if (!response.ok) {
    if (payload.code === 'NOT_CONFIGURED') throw new ScanNotConfiguredError();
    throw new Error(
      typeof payload.error === 'string' ? payload.error : '사진 인식에 실패했습니다.'
    );
  }

  const raw = Array.isArray(payload.detections) ? payload.detections : [];
  const seen = new Set<string>();
  const candidates: ScanCandidate[] = [];

  raw.filter(isDetection).forEach((detection, index) => {
    const match = findSeedMatch(detection.title, seeds);
    // One shelf photo can show the same box twice from different angles.
    const key = (match ? match.game.id : detection.title.trim().toLowerCase());
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ id: `scan_${index}_${key}`, detection, match });
  });

  return candidates;
}
