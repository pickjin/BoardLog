import { describe, expect, it } from 'vitest';
import type { PlayParticipant, PlayRecord } from '../types';
import { formatPlayShareText } from './playShareText';

const person = (overrides: Partial<PlayParticipant>): PlayParticipant => ({
  id: 'p',
  name: '민수',
  score: null,
  rank: null,
  isWinner: false,
  characterOrFaction: '',
  notes: '',
  ...overrides
});

const makePlay = (overrides: Partial<PlayRecord> = {}): PlayRecord => ({
  id: 'play_1',
  gameId: null,
  gameTitle: '카탄',
  gameImageUrl: '',
  date: '2026.10.30',
  startTime: '19:00',
  endTime: '20:30',
  durationMinutes: 90,
  location: '보드게임 카페',
  participants: [
    person({ id: 'p_me', name: '나', score: 10, isWinner: true }),
    person({ id: 'p_1', name: '민수', score: 7 })
  ],
  winnerNames: ['나'],
  myResult: '승리',
  isTeamPlay: false,
  hasExpansion: false,
  expansionName: '',
  rating: 5,
  review: '',
  photos: [],
  createdAt: '',
  updatedAt: '',
  ...overrides
});

const LINK = 'https://boardlog.example/#play=abc';

describe('formatPlayShareText', () => {
  it('writes every section, shows the sharer under their name and ends with the link', () => {
    expect(formatPlayShareText(makePlay(), LINK, '지민')).toBe(
      [
        '🎲 카탄',
        '📅 2026.10.30 · 📍 보드게임 카페',
        '👑 승자: 지민',
        '👥 참여: 지민, 민수',
        '🏆 점수: 지민 10 · 민수 7',
        '⏱ 1시간 30분',
        '',
        `같이 한 사람은 눌러서 내 기록에 바로 추가 → ${LINK}`
      ].join('\n')
    );
  });

  it('keeps "나" when no sharer name is given', () => {
    expect(formatPlayShareText(makePlay(), LINK, '   ')).toContain('👥 참여: 나, 민수');
  });

  it('skips the sections that have nothing to show', () => {
    const play = makePlay({
      location: '',
      durationMinutes: 0,
      participants: [person({ name: '지민' }), person({ name: '민수' })]
    });
    expect(formatPlayShareText(play, LINK, '지민')).toBe(
      [
        '🎲 카탄',
        '📅 2026.10.30',
        '👥 참여: 지민, 민수',
        '',
        `같이 한 사람은 눌러서 내 기록에 바로 추가 → ${LINK}`
      ].join('\n')
    );
  });

  it('lists scores from highest to lowest', () => {
    const play = makePlay({
      participants: [person({ name: 'A', score: 3 }), person({ name: 'B', score: 9 }), person({ name: 'C' })]
    });
    expect(formatPlayShareText(play, LINK, '')).toContain('🏆 점수: B 9 · A 3');
  });
});
