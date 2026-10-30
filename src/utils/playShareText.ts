import { PlayRecord } from '../types';
import { formatDuration } from './formatters';

/**
 * Plain text so it pastes cleanly into KakaoTalk or any messenger. Friends read it, so the
 * sharer's own '나' row is shown under their name.
 */
export function formatPlayShareText(play: PlayRecord, link: string, sharerName: string): string {
  const displayName = (p: PlayRecord['participants'][number]) =>
    (p.id === 'p_me' || p.name === '나') && sharerName.trim() ? sharerName.trim() : p.name;
  const winners = play.participants.filter((p) => p.isWinner).map(displayName);
  const scored = play.participants.filter((p) => p.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const lines = [
    `🎲 ${play.gameTitle}`,
    [`📅 ${play.date}`, play.location ? `📍 ${play.location}` : ''].filter(Boolean).join(' · '),
    winners.length > 0 ? `👑 승자: ${winners.join(', ')}` : '',
    `👥 참여: ${play.participants.map(displayName).join(', ')}`,
    scored.length > 0 ? `🏆 점수: ${scored.map((p) => `${displayName(p)} ${p.score}`).join(' · ')}` : '',
    play.durationMinutes > 0 ? `⏱ ${formatDuration(play.durationMinutes)}` : '',
    '',
    `같이 한 사람은 눌러서 내 기록에 바로 추가 → ${link}`
  ];

  return lines.filter((line, i) => line !== '' || i === lines.length - 2).join('\n');
}
