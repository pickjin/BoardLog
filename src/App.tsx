import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Filter,
  Dices,
  Trophy,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  HelpCircle,
  FolderPlus,
  Printer,
  BookOpen,
  Download,
  MessageCircle,
  Share2
} from 'lucide-react';
import { UserGame, PlayRecord, GameOwnershipStatus, MyGameResult } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { GameCard } from './components/GameCard';
import { GameListItem } from './components/GameListItem';
import { GameFormModal } from './components/GameFormModal';
import { GameDetailModal } from './components/GameDetailModal';
import { GameCatalogModal } from './components/GameCatalogModal';
import { KakaoShareModal } from './components/KakaoShareModal';
import { PlayCard } from './components/PlayCard';
import { PlayRecordFormModal } from './components/PlayRecordFormModal';
import { PlayDetailModal } from './components/PlayDetailModal';
import { MyPageView } from './components/MyPageView';
import { AuthModal } from './components/AuthModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoadingState, EmptyState, ErrorState } from './components/StateViews';

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

const PLAY_RESULT_TABS: (MyGameResult | '전체')[] = ['전체', '승리', '패배', '무승부'];

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'plays' | 'mypage'>('home');

  // Main Data States
  const [games, setGames] = useState<UserGame[]>([]);
  const [plays, setPlays] = useState<PlayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter States for Games tab
  const [gameSearch, setGameSearch] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState<GameOwnershipStatus | '전체'>('전체');
  const [gameViewMode, setGameViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter States for Plays tab
  const [playSearch, setPlaySearch] = useState('');
  const [selectedPlayResult, setSelectedPlayResult] = useState<MyGameResult | '전체'>('전체');

  // Modals Management
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isKakaoShareOpen, setIsKakaoShareOpen] = useState(false);
  const [isGameFormOpen, setIsGameFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [viewingGame, setViewingGame] = useState<UserGame | null>(null);

  const [isPlayFormOpen, setIsPlayFormOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState<PlayRecord | null>(null);
  const [viewingPlay, setViewingPlay] = useState<PlayRecord | null>(null);
  const [preselectedGameForPlay, setPreselectedGameForPlay] = useState<UserGame | null>(null);

  // Confirm delete modals
  const [deletingGame, setDeletingGame] = useState<UserGame | null>(null);
  const [deletingPlay, setDeletingPlay] = useState<PlayRecord | null>(null);

  // Fetch all user data
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedGames, fetchedPlays] = await Promise.all([
        storage.getUserGames(user.uid),
        storage.getPlayRecords(user.uid)
      ]);
      setGames(fetchedGames);
      setPlays(fetchedPlays);
    } catch (err) {
      setLoadError('데이터를 불러오는 중 오류가 발생했습니다.');
      showToast('데이터 불러오기 실패', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Handlers: Game CRUD ---
  const handleSaveGame = async (
    gameData: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;
    if (editingGame) {
      // Update
      const updated = await storage.updateUserGame(user.uid, editingGame.id, gameData);
      if (updated) {
        setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        if (viewingGame?.id === updated.id) {
          setViewingGame(updated);
        }
        showToast(`'${updated.title}' 정보가 수정되었습니다.`, 'success');
      }
    } else {
      // Create
      const newGame = await storage.addUserGame(user.uid, gameData);
      setGames((prev) => [newGame, ...prev]);
      showToast(`'${newGame.title}'이(가) 내 게임에 추가되었습니다!`, 'success');
    }
    setEditingGame(null);
    setIsGameFormOpen(false);
  };

  const handleConfirmDeleteGame = async () => {
    if (!user || !deletingGame) return;
    try {
      const ok = await storage.deleteUserGame(user.uid, deletingGame.id);
      if (ok) {
        setGames((prev) => prev.filter((g) => g.id !== deletingGame.id));
        if (viewingGame?.id === deletingGame.id) {
          setViewingGame(null);
        }
        showToast(`'${deletingGame.title}'이(가) 삭제되었습니다.`, 'info');
      }
    } catch {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingGame(null);
    }
  };

  // --- Handlers: Play Record CRUD ---
  const handleSavePlay = async (
    playData: Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;
    if (editingPlay) {
      // Update
      const updated = await storage.updatePlayRecord(user.uid, editingPlay.id, playData);
      if (updated) {
        setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        if (viewingPlay?.id === updated.id) {
          setViewingPlay(updated);
        }
        // Refresh games play counts
        const updatedGames = await storage.getUserGames(user.uid);
        setGames(updatedGames);
        showToast('플레이 기록이 수정되었습니다.', 'success');
      }
    } else {
      // Create
      const newPlay = await storage.addPlayRecord(user.uid, playData);
      setPlays((prev) => [newPlay, ...prev]);
      // Refresh games to update playCount
      const updatedGames = await storage.getUserGames(user.uid);
      setGames(updatedGames);
      showToast('새 플레이 기록이 저장되었습니다! 🎲', 'success');
    }
    setEditingPlay(null);
    setIsPlayFormOpen(false);
    setPreselectedGameForPlay(null);
  };

  const handleConfirmDeletePlay = async () => {
    if (!user || !deletingPlay) return;
    try {
      const ok = await storage.deletePlayRecord(user.uid, deletingPlay.id);
      if (ok) {
        setPlays((prev) => prev.filter((p) => p.id !== deletingPlay.id));
        if (viewingPlay?.id === deletingPlay.id) {
          setViewingPlay(null);
        }
        const updatedGames = await storage.getUserGames(user.uid);
        setGames(updatedGames);
        showToast('플레이 기록이 삭제되었습니다.', 'info');
      }
    } catch {
      showToast('기록 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingPlay(null);
    }
  };

  // Quick Action from Game Card/Detail
  const handleStartPlayForGame = (game: UserGame) => {
    setPreselectedGameForPlay(game);
    setEditingPlay(null);
    setViewingGame(null);
    setIsPlayFormOpen(true);
  };

  // Filtered Games
  const filteredGames = games.filter((g) => {
    const matchesSearch =
      !gameSearch.trim() ||
      g.title.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.titleEn.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.publisher.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.genre.some((tag) => tag.toLowerCase().includes(gameSearch.toLowerCase())) ||
      g.storageLocation.toLowerCase().includes(gameSearch.toLowerCase());

    const matchesOwnership =
      selectedOwnership === '전체' || g.ownershipStatus === selectedOwnership;

    return matchesSearch && matchesOwnership;
  });

  // Filtered Plays
  const filteredPlays = plays.filter((p) => {
    const matchesSearch =
      !playSearch.trim() ||
      p.gameTitle.toLowerCase().includes(playSearch.toLowerCase()) ||
      p.location.toLowerCase().includes(playSearch.toLowerCase()) ||
      p.participants.some((part) => part.name.toLowerCase().includes(playSearch.toLowerCase()));

    const matchesResult =
      selectedPlayResult === '전체' || p.myResult === selectedPlayResult;

    return matchesSearch && matchesResult;
  });

  return (
    <div className="min-h-screen bg-[#F1F3F5] text-[#2D3436] flex flex-col font-sans selection:bg-[#4834D4]/20 selection:text-[#4834D4]">
      {/* Top Fixed Header */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-18 pb-24">
        {isLoading ? (
          <LoadingState message="보드로그 데이터를 불러오는 중입니다..." />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadData} />
        ) : (
          <>
            {/* 1. HOME TAB */}
            {activeTab === 'home' && (
              <HomeDashboard
                games={games}
                plays={plays}
                onOpenAddPlay={() => {
                  setEditingPlay(null);
                  setPreselectedGameForPlay(null);
                  setIsPlayFormOpen(true);
                }}
                onOpenAddGame={() => {
                  setEditingGame(null);
                  setIsGameFormOpen(true);
                }}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
                onOpenKakaoShare={() => setIsKakaoShareOpen(true)}
                onSelectGame={(game) => setViewingGame(game)}
                onSelectPlay={(play) => setViewingPlay(play)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* 2. GAMES TAB (내 보드게임) */}
            {activeTab === 'games' && (
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
                      onClick={() => {
                        setEditingGame(null);
                        setIsGameFormOpen(true);
                      }}
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
                      onClick={() => setIsKakaoShareOpen(true)}
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
                      onClick={() => setIsCatalogModalOpen(true)}
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
                          gameViewMode === 'grid'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'text-[#A8ABAF] hover:text-[#2D3436]'
                        }`}
                        title="그리드 뷰"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGameViewMode('list')}
                        className={`p-2 rounded-xl transition-colors ${
                          gameViewMode === 'list'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'text-[#A8ABAF] hover:text-[#2D3436]'
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
                          onClick={() => setViewingGame(game)}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setDeletingGame(game);
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
                          onClick={() => setViewingGame(game)}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setDeletingGame(game);
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
                    onAction={() => {
                      setEditingGame(null);
                      setIsGameFormOpen(true);
                    }}
                  />
                ) : (
                  <div className="p-8 bg-white rounded-[28px] border border-[#E9ECEF] text-center space-y-3 shadow-sm">
                    <p className="text-xs text-[#636E72]">
                      '{gameSearch}' 검색 조건에 맞는 게임이 없습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGame(null);
                        setIsGameFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>'{gameSearch}' 직접 등록하기</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. PLAYS TAB (플레이 기록) */}
            {activeTab === 'plays' && (
              <div className="space-y-4 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black italic text-[#1E272E]">플레이 기록</h2>
                    <p className="text-xs text-[#636E72]">총 {plays.length}회의 플레이 기록</p>
                  </div>

                  <button
                    id="plays-tab-add-btn"
                    type="button"
                    onClick={() => {
                      setEditingPlay(null);
                      setPreselectedGameForPlay(null);
                      setIsPlayFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 기록</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
                  <input
                    id="plays-search-input"
                    type="text"
                    placeholder="게임명, 참여자 이름, 장소 검색..."
                    value={playSearch}
                    onChange={(e) => setPlaySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9ECEF] rounded-full text-xs text-[#1E272E] focus:outline-hidden focus:ring-2 focus:ring-[#4834D4]/20 focus:border-[#4834D4] shadow-sm transition-all"
                  />
                </div>

                {/* Result Filter Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {PLAY_RESULT_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedPlayResult(tab)}
                      className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                        selectedPlayResult === tab
                          ? 'bg-[#4834D4] text-white shadow-xs'
                          : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {tab === '승리' ? '👑 승리' : tab}
                    </button>
                  ))}
                </div>

                {/* Plays List */}
                {filteredPlays.length > 0 ? (
                  <div className="space-y-3.5">
                    {filteredPlays.map((play) => (
                      <PlayCard
                        key={play.id}
                        play={play}
                        onClick={() => setViewingPlay(play)}
                      />
                    ))}
                  </div>
                ) : plays.length === 0 ? (
                  <EmptyState
                    title="아직 기록된 플레이가 없습니다"
                    description="오늘 진행한 보드게임의 참여자, 점수, 순위, 현장 사진을 기록해 보세요."
                    actionText="첫 플레이 기록 남기기"
                    onAction={() => {
                      setEditingPlay(null);
                      setPreselectedGameForPlay(null);
                      setIsPlayFormOpen(true);
                    }}
                  />
                ) : (
                  <div className="p-8 bg-white rounded-[28px] border border-[#E9ECEF] text-center text-xs text-[#636E72] shadow-sm">
                    '{playSearch}' 조건에 해당하는 플레이 기록이 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 4. MY PAGE TAB */}
            {activeTab === 'mypage' && (
              <MyPageView
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation & Big Central FAB */}
      <BottomNav
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAddPlay={() => {
          setEditingPlay(null);
          setPreselectedGameForPlay(null);
          setIsPlayFormOpen(true);
        }}
      />

      {/* --- ALL MODALS --- */}
      {/* KakaoTalk Share Modal */}
      <KakaoShareModal
        isOpen={isKakaoShareOpen}
        games={games}
        ownerName={user?.nickname || '나'}
        onClose={() => setIsKakaoShareOpen(false)}
      />

      {/* Game Catalog & PDF Print Modal */}
      <GameCatalogModal
        isOpen={isCatalogModalOpen}
        games={games}
        ownerName={user?.nickname || '나'}
        onClose={() => setIsCatalogModalOpen(false)}
      />

      {/* Game Add/Edit Modal */}
      <GameFormModal
        isOpen={isGameFormOpen}
        initialGame={editingGame}
        defaultSearchQuery={gameSearch}
        onClose={() => {
          setIsGameFormOpen(false);
          setEditingGame(null);
        }}
        onSave={handleSaveGame}
      />

      {/* Game Details Modal */}
      <GameDetailModal
        isOpen={!!viewingGame}
        game={viewingGame}
        onClose={() => setViewingGame(null)}
        onEdit={(game) => {
          setViewingGame(null);
          setEditingGame(game);
          setIsGameFormOpen(true);
        }}
        onDelete={(game) => {
          setDeletingGame(game);
        }}
        onStartPlay={handleStartPlayForGame}
      />

      {/* Play Add/Edit Modal */}
      <PlayRecordFormModal
        isOpen={isPlayFormOpen}
        initialPlay={editingPlay}
        preselectedGame={preselectedGameForPlay}
        userGames={games}
        onClose={() => {
          setIsPlayFormOpen(false);
          setEditingPlay(null);
          setPreselectedGameForPlay(null);
        }}
        onSave={handleSavePlay}
      />

      {/* Play Details Modal */}
      <PlayDetailModal
        isOpen={!!viewingPlay}
        play={viewingPlay}
        onClose={() => setViewingPlay(null)}
        onEdit={(play) => {
          setViewingPlay(null);
          setEditingPlay(play);
          setIsPlayFormOpen(true);
        }}
        onDelete={(play) => {
          setDeletingPlay(play);
        }}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Delete Game Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingGame}
        title="보드게임 삭제"
        message={`'${deletingGame?.title}' 게임을 내 목록에서 삭제하시겠습니까? 기록된 플레이 내역은 유지됩니다.`}
        confirmText="삭제하기"
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteGame}
        onCancel={() => setDeletingGame(null)}
      />

      {/* Delete Play Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPlay}
        title="플레이 기록 삭제"
        message={`'${deletingPlay?.gameTitle}' (${deletingPlay?.date}) 기록을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`}
        confirmText="삭제하기"
        confirmVariant="danger"
        onConfirm={handleConfirmDeletePlay}
        onCancel={() => setDeletingPlay(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
