import React from 'react';
import {
  Layers,
  Trophy,
  History,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Printer,
  BookOpen,
  Download
} from 'lucide-react';
import { UserGame, PlayRecord } from '../types';
import { PlayCard } from './PlayCard';
import { GameCard } from './GameCard';
import { formatDuration } from '../utils/formatters';

interface HomeDashboardProps {
  games: UserGame[];
  plays: PlayRecord[];
  onOpenAddPlay: () => void;
  onOpenAddGame: () => void;
  onOpenCatalog?: () => void;
  onSelectGame: (game: UserGame) => void;
  onSelectPlay: (play: PlayRecord) => void;
  onNavigateTab: (tab: 'games' | 'plays') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  games,
  plays,
  onOpenAddPlay,
  onOpenAddGame,
  onOpenCatalog,
  onSelectGame,
  onSelectPlay,
  onNavigateTab
}) => {
  // Statistics calculations
  const totalGames = games.length;
  const totalPlays = plays.length;
  const totalMinutes = plays.reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
  const winCount = plays.filter((p) => p.myResult === '승리').length;
  const winRate = totalPlays > 0 ? Math.round((winCount / totalPlays) * 100) : 0;

  const recentPlays = plays.slice(0, 3);
  const favoriteGames = [...games].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 4);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Quick Action CTA - Editorial Gradient */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#4834D4] via-[#5742df] to-[#686DE0] p-6 text-white shadow-[0_20px_40px_rgba(72,52,212,0.25)] border border-white/10">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-white/80 text-[11px] font-bold mb-2 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Editorial Board Game Log</span>
          </div>
          <h2 className="text-2xl font-black italic tracking-tight mb-1.5 leading-snug">
            오늘 플레이한 게임을 기록하세요
          </h2>
          <p className="text-xs text-white/80 mb-5 max-w-xs leading-relaxed font-normal">
            승패, 순위, 점수, 현장 사진을 3터치 이내로 빠르게 아카이빙합니다.
          </p>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="dashboard-add-play-cta"
              type="button"
              onClick={onOpenAddPlay}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white hover:bg-[#F8F9FA] text-[#4834D4] rounded-full text-xs font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 플레이 기록</span>
            </button>
            <button
              id="dashboard-add-game-cta"
              type="button"
              onClick={onOpenAddGame}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>게임 등록</span>
            </button>
            {onOpenCatalog && (
              <button
                id="dashboard-open-catalog-cta"
                type="button"
                onClick={onOpenCatalog}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF 도록 / 인쇄</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative subtle background accents */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#A8ABAF] font-bold block mb-0.5">보유 게임</span>
          <span className="text-xl font-black italic text-[#1E272E]">{totalGames}</span>
          <span className="text-[10px] text-[#636E72] font-medium block">개</span>
        </div>

        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#A8ABAF] font-bold block mb-0.5">총 플레이</span>
          <span className="text-xl font-black italic text-[#4834D4]">{totalPlays}</span>
          <span className="text-[10px] text-[#636E72] font-medium block">회</span>
        </div>

        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#A8ABAF] font-bold block mb-0.5">승률</span>
          <span className="text-xl font-black italic text-[#27AE60]">{winRate}%</span>
          <span className="text-[10px] text-[#636E72] font-medium block">{winCount}승</span>
        </div>

        <div className="p-3.5 bg-white rounded-[24px] border border-[#E9ECEF] shadow-sm text-center">
          <span className="text-[10px] text-[#A8ABAF] font-bold block mb-0.5">총 시간</span>
          <span className="text-xs font-black italic text-[#1E272E] block mt-1.5">
            {formatDuration(totalMinutes)}
          </span>
        </div>
      </div>

      {/* Recent Plays Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black italic text-[#1E272E]">최근 플레이 기록</h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('plays')}
            className="text-xs font-bold text-[#4834D4] hover:text-[#3c2ab9] flex items-center gap-1 transition-colors"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentPlays.length > 0 ? (
          <div className="space-y-3.5">
            {recentPlays.map((p) => (
              <PlayCard key={p.id} play={p} onClick={() => onSelectPlay(p)} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-[28px] border border-dashed border-[#E9ECEF] text-center shadow-sm">
            <p className="text-xs text-[#636E72] mb-3">아직 기록된 플레이가 없습니다.</p>
            <button
              type="button"
              onClick={onOpenAddPlay}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>첫 플레이 기록 남기기</span>
            </button>
          </div>
        )}
      </div>

      {/* Most Played Games Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black italic text-[#1E272E]">많이 플레이한 게임</h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('games')}
            className="text-xs font-bold text-[#4834D4] hover:text-[#3c2ab9] flex items-center gap-1 transition-colors"
          >
            <span>내 게임 전체</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {favoriteGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {favoriteGames.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => onSelectGame(g)} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-[28px] border border-dashed border-[#E9ECEF] text-center shadow-sm">
            <p className="text-xs text-[#636E72] mb-3">등록된 게임이 없습니다.</p>
            <button
              type="button"
              onClick={onOpenAddGame}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>인기 게임 등록하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

