import { PlayRecord } from '../types';
import { formatDuration } from './formatters';

/** Plain text so it pastes cleanly into KakaoTalk or any messenger. */
export function formatPlayShareText(play: PlayRecord, appUrl: string): string {
  const winners = play.participants.filter((p) => p.isWinner).map((p) => p.name);
  const scored = play.participants
    .filter((p) => p.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const lines = [
    `🎲 ${play.gameTitle}`,
    [`📅 ${play.date}`, play.location ? `📍 ${play.location}` : ''].filter(Boolean).join(' · '),
    winners.length > 0 ? `👑 승자: ${winners.join(', ')}` : '',
    `👥 참여: ${play.participants.map((p) => p.name).join(', ')}`,
    scored.length > 0 ? `🏆 점수: ${scored.map((p) => `${p.name} ${p.score}`).join(' · ')}` : '',
    play.durationMinutes > 0 ? `⏱ ${formatDuration(play.durationMinutes)}` : '',
    '',
    `보드로그로 기록했어요 → ${appUrl}`
  ];

  return lines.filter((line, i) => line !== '' || i === lines.length - 2).join('\n');
}
