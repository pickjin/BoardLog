import type React from 'react';
import { useState } from 'react';
import { Search, Plus, LayoutGrid, List, Download, MessageCircle } from 'lucide-react';
import type { UserGame, GameOwnershipStatus } from '../types';
import { GameCard } from './GameCard';
import { GameListItem } from './GameListItem';
import { EmptyState } from './StateViews';

const OWNERSHIP_TABS: (GameOwnershipStatus | '전체')[] = [
  '전체',
  '보유중',
  '빌려줌',
  '빌림',
  '판매예정',
  '판매완료',
  '분실',
  '처분'
];

interface GamesViewProps {
  games: UserGame[];
  /** Receives the current search text so the add form can start from it. */
  onAddGame: (searchQuery: string) => void;
  onOpenKakaoShare: () => void;
  onOpenCatalog: () => void;
  onSelectGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  onAddGame,
  onOpenKakaoShare,
  onOpenCatalog,
  onSelectGame,
  onDeleteGame
}) => {
  const [gameSearch, setGameSearch] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState<GameOwnershipStatus | '전체'>('전체');
  const [gameViewMode, setGameViewMode] = useState<'grid' | 'list'>('grid');

  // Filtered Games
  const filteredGames = games.filter((g) => {
    const matchesSearch =
      !gameSearch.trim() ||
      g.title.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.titleEn.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.publisher.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.genre.some((tag) => tag.toLowerCase().includes(gameSearch.toLowerCase())) ||
      g.storageLocation.toLowerCase().includes(gameSearch.toLowerCase());

    const matchesOwnership = selectedOwnership === '전체' || g.ownershipStatus === selectedOwnership;

    return matchesSearch && matchesOwnership;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header & View toggle */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black italic text-[#1E272E]">내 보드게임 컬렉션</h2>
          <p className="text-xs text-[#636E72]">총 {games.length}개의 게임</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Add Game Button */}
          <button
            id="games-add-game-btn"
            type="button"
            onClick={() => onAddGame(gameSearch)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-2xl text-xs font-bold shadow-[0_4px_12px_rgba(72,52,212,0.25)] transition-all active:scale-95"
            title="새 보드게임 추가하기"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>게임 추가</span>
          </button>

          {/* KakaoTalk Share Button */}
          <button
            id="games-kakao-share-btn"
            type="button"
            onClick={() => onOpenKakaoShare()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FEE500] hover:bg-[#F5DC00] active:bg-[#E8CE00] text-[#191919] rounded-2xl text-xs font-black shadow-xs transition-all active:scale-95 border border-[#F5DC00]"
            title="소장 보드게임 목록 카카오톡 공유 (전체 / 4인이하 등 조건 선택)"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-[#191919]" />
            <span className="hidden sm:inline">카카오톡 공유</span>
            <span className="sm:hidden">카톡 공유</span>
          </button>

          {/* Catalog Print & PDF Export Button */}
          <button
            id="games-print-catalog-btn"
            type="button"
            onClick={() => onOpenCatalog()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#1E272E] rounded-2xl text-xs font-bold border border-[#E9ECEF] shadow-sm transition-all active:scale-95"
            title="소장 도록 PDF 저장 및 인쇄"
          >
            <Download className="w-3.5 h-3.5 text-[#4834D4]" />
            <span className="hidden sm:inline">PDF 도록 / 인쇄</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E9ECEF] shadow-sm">
            <button
              type="button"
              onClick={() => setGameViewMode('grid')}
              className={`p-2 rounded-xl transition-colors ${
                gameViewMode === 'grid' ? 'bg-[#4834D4] text-white shadow-xs' : 'text-[#A8ABAF] hover:text-[#2D3436]'
              }`}
              title="그리드 뷰"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setGameViewMode('list')}
              className={`p-2 rounded-xl transition-colors ${
                gameViewMode === 'list' ? 'bg-[#4834D4] text-white shadow-xs' : 'text-[#A8ABAF] hover:text-[#2D3436]'
              }`}
              title="리스트 뷰"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
        <input
          id="games-search-input"
          type="text"
          placeholder="게임명, 영문명, 장르, 보관장소 검색..."
          value={gameSearch}
          onChange={(e) => setGameSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9ECEF] rounded-full text-xs text-[#1E272E] focus:outline-hidden focus:ring-2 focus:ring-[#4834D4]/20 focus:border-[#4834D4] shadow-sm transition-all"
        />
      </div>

      {/* Ownership Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {OWNERSHIP_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSelectedOwnership(tab)}
            className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              selectedOwnership === tab
                ? 'bg-[#4834D4] text-white shadow-xs'
                : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F8F9FA]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Game List / Grid */}
      {filteredGames.length > 0 ? (
        gameViewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => onSelectGame(game)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteGame(game);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredGames.map((game) => (
              <GameListItem
                key={game.id}
                game={game}
                onClick={() => onSelectGame(game)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteGame(game);
                }}
              />
            ))}
          </div>
        )
      ) : games.length === 0 ? (
        <EmptyState
          title="등록된 보드게임이 없습니다"
          description="자주 즐기는 보드게임을 등록하고 플레이 기록을 남겨보세요."
          actionText="인기 게임 검색해서 추가하기"
          onAction={() => onAddGame(gameSearch)}
        />
      ) : (
        <div className="p-8 bg-white rounded-[28px] border border-[#E9ECEF] text-center space-y-3 shadow-sm">
          <p className="text-xs text-[#636E72]">'{gameSearch}' 검색 조건에 맞는 게임이 없습니다.</p>
          <button
            type="button"
            onClick={() => onAddGame(gameSearch)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>'{gameSearch}' 직접 등록하기</span>
          </button>
        </div>
      )}
    </div>
  );
};
