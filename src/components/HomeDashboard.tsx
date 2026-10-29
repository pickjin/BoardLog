import React from 'react';
import { Plus } from 'lucide-react';
import { UserGame, PlayRecord } from '../types';
import { findRemovableSampleData } from '../services/storage';
import { SectionHeading, TextLinks, TextLink, EmptyNote, PlayLedgerRow } from './ledger';

interface HomeDashboardProps {
  games: UserGame[];
  plays: PlayRecord[];
  onOpenAddPlay: () => void;
  onOpenAddGame: () => void;
  onOpenCatalog?: () => void;
  onOpenKakaoShare?: () => void;
  onSelectGame: (game: UserGame) => void;
  onSelectPlay: (play: PlayRecord) => void;
  onNavigateTab: (tab: 'games' | 'plays') => void;
  onRemoveSampleData?: () => void;
}

const PLAYS_PER_LEVEL = 5;
const RECENT_LIMIT = 5;
const TOP_GAMES_LIMIT = 5;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function today(): { date: string; weekday: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`, weekday: `${WEEKDAYS[d.getDay()]}요일` };
}

/** h:mm keeps the stat column narrow enough for four columns on a phone. */
function clockDuration(totalMinutes: number): string {
  return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

const Stat: React.FC<{ label: string; value: string; unit?: string }> = ({ label, value, unit }) => (
  <div className="flex flex-col gap-1 px-2 py-4 first:pl-0 last:pr-0">
    <span className="text-xs leading-4 text-graphite">{label}</span>
    <span className="font-mono text-[28px] font-medium leading-8 tracking-tight">
      {value}
      {unit && <span className="ml-1 font-sans text-xs font-normal text-graphite">{unit}</span>}
    </span>
  </div>
);

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  games,
  plays,
  onOpenAddPlay,
  onOpenAddGame,
  onOpenCatalog,
  onOpenKakaoShare,
  onSelectGame,
  onSelectPlay,
  onNavigateTab,
  onRemoveSampleData
}) => {
  const { date: todayDate, weekday } = today();
  const removableSample = findRemovableSampleData(games, plays);
  const hasSampleData = removableSample.samplePlays.length + removableSample.sampleGames.length > 0;

  const totalPlays = plays.length;
  const totalMinutes = plays.reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
  const winCount = plays.filter((p) => p.myResult === '승리').length;
  const winRate = totalPlays > 0 ? Math.round((winCount / totalPlays) * 100) : 0;

  const collectorLevel = Math.floor(totalPlays / PLAYS_PER_LEVEL) + 1;
  const playsIntoLevel = totalPlays % PLAYS_PER_LEVEL;

  const recentPlays = plays.slice(0, RECENT_LIMIT);
  const topGames = [...games]
    .filter((g) => (g.playCount || 0) > 0)
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, TOP_GAMES_LIMIT);

  const secondaryActions = [
    { label: '게임 등록', onClick: onOpenAddGame },
    onOpenKakaoShare && { label: '카톡으로 목록 공유', onClick: onOpenKakaoShare },
    onOpenCatalog && { label: 'PDF 도록', onClick: onOpenCatalog }
  ].filter((a): a is TextLink => Boolean(a));

  return (
    <div className="flex flex-col gap-10">
      {/* Opening: the one thing to do here */}
      <section className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 text-graphite">
            <span className="font-mono">{todayDate}</span> {weekday}
          </p>
          <h2 className="text-[28px] font-bold leading-9 tracking-tight">
            오늘 한 게임,
            <br />
            누가 이겼나요?
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <button
            id="dashboard-add-play-cta"
            type="button"
            onClick={onOpenAddPlay}
            className="flex h-14 items-center justify-center gap-2 rounded bg-felt text-[15px] font-semibold text-paper transition-opacity hover:opacity-90 active:opacity-80"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
            기록하기
          </button>

          <TextLinks links={secondaryActions} />
        </div>
      </section>

      {hasSampleData && onRemoveSampleData && (
        <div className="flex items-center justify-between gap-4 border-y border-dashed border-rule py-4">
          <p className="text-[13px] leading-5 text-graphite">
            처음에 넣어둔 <span className="text-ink">예시 기록</span>이 통계에 섞여 있어요.
          </p>
          <button
            id="dashboard-remove-sample-btn"
            type="button"
            onClick={onRemoveSampleData}
            className="shrink-0 text-[13px] font-semibold leading-5 underline underline-offset-4"
          >
            예시 지우기
          </button>
        </div>
      )}

      {/* Summary: a ruled score table, not cards */}
      <section className="flex flex-col">
        <SectionHeading title="기록 요약" />
        <div className="grid grid-cols-4 divide-x divide-rule border-b border-rule">
          <Stat label="보유 게임" value={String(games.length)} />
          <Stat label="총 플레이" value={String(totalPlays)} />
          <Stat label="승률" value={String(winRate)} unit="%" />
          <Stat label="총 시간" value={clockDuration(totalMinutes)} />
        </div>

        {/* Collector level as score-pad tally boxes */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-semibold leading-5">수집가 Lv.{collectorLevel}</span>
            <div className="flex gap-1" aria-label={`이번 레벨 ${playsIntoLevel}/${PLAYS_PER_LEVEL}회`}>
              {Array.from({ length: PLAYS_PER_LEVEL }, (_, i) => (
                <span key={i} className={`h-4 w-4 border border-ink ${i < playsIntoLevel ? 'bg-ink' : ''}`} />
              ))}
            </div>
          </div>
          <span className="text-xs leading-4 text-graphite">
            다음 레벨까지 <span className="font-mono">{PLAYS_PER_LEVEL - playsIntoLevel}</span>회
          </span>
        </div>
      </section>

      {/* Recent plays: ledger rows */}
      <section className="flex flex-col">
        <SectionHeading
          title="최근 기록"
          action={recentPlays.length > 0 ? { label: '전체 보기', onClick: () => onNavigateTab('plays') } : undefined}
        />
        {recentPlays.length > 0 ? (
          <ul className="divide-y divide-rule">
            {recentPlays.map((play) => (
              <li key={play.id}>
                <PlayLedgerRow play={play} onClick={() => onSelectPlay(play)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>아직 기록이 없어요. 게임이 끝나면 누가 이겼는지만 남겨도 충분해요.</EmptyNote>
        )}
      </section>

      {/* Most played: ranked list with dotted leaders */}
      <section className="flex flex-col">
        <SectionHeading
          title="많이 한 게임"
          action={games.length > 0 ? { label: '내 게임', onClick: () => onNavigateTab('games') } : undefined}
        />
        {topGames.length > 0 ? (
          <ol>
            {topGames.map((game, i) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => onSelectGame(game)}
                  className="flex w-full items-baseline gap-4 py-3 text-left hover:bg-ink/[0.03]"
                >
                  <span className="w-6 shrink-0 font-mono text-xs leading-4 text-graphite">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 truncate text-[15px] leading-6">{game.title}</span>
                  <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-rule" aria-hidden />
                  <span className="shrink-0 text-[13px] leading-5">
                    <span className="font-mono">{game.playCount}</span>회
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyNote>
            {games.length > 0 ? (
              '기록이 쌓이면 자주 한 게임 순으로 보여드려요.'
            ) : (
              <>
                아직 등록한 게임이 없어요.{' '}
                <button type="button" onClick={onOpenAddGame} className="text-ink underline underline-offset-4">
                  게임 등록
                </button>
              </>
            )}
          </EmptyNote>
        )}
      </section>
    </div>
  );
};
