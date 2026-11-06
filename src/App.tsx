import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { UserGame, PlayRecord, TabType } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { track } from './services/analytics';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { GamesView } from './components/GamesView';
import { GameFormModal } from './components/GameFormModal';
import { GameScanModal } from './components/GameScanModal';
import { GameDetailModal } from './components/GameDetailModal';
import { GameCatalogModal } from './components/GameCatalogModal';
import { KakaoShareModal } from './components/KakaoShareModal';
import { PlaysView } from './components/PlaysView';
import { PlayRecordFormModal } from './components/PlayRecordFormModal';
import { PlayDetailModal } from './components/PlayDetailModal';
import { MyPageView } from './components/MyPageView';
import { AuthModal } from './components/AuthModal';
import { PlayShareSheet } from './components/PlayShareSheet';
import { SharedPlayModal } from './components/SharedPlayModal';
import { type SharedPlay, decodeSharedPlay, sharedHashPresent, toRecipientRecord } from './utils/sharedPlay';
import { normalizePlay } from './utils/backupImport';
import { ConfirmModal } from './components/ConfirmModal';
import { LoadingState, ErrorState } from './components/StateViews';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Main Data States
  const [games, setGames] = useState<UserGame[]>([]);
  const [plays, setPlays] = useState<PlayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search text carried from the games tab into the add form
  const [gameFormQuery, setGameFormQuery] = useState('');

  // Modals Management
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isKakaoShareOpen, setIsKakaoShareOpen] = useState(false);
  const [isGameFormOpen, setIsGameFormOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [viewingGame, setViewingGame] = useState<UserGame | null>(null);

  const [isPlayFormOpen, setIsPlayFormOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState<PlayRecord | null>(null);
  const [sharingPlay, setSharingPlay] = useState<PlayRecord | null>(null);
  const [incomingShare, setIncomingShare] = useState<SharedPlay | null>(null);
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
    } catch {
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
    gameData: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>,
    source: { fromSeed: boolean }
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
      track('game_added', { method: source.fromSeed ? 'seed' : 'manual' });
      setGames((prev) => [newGame, ...prev]);
      showToast(`'${newGame.title}'이(가) 내 게임에 추가되었습니다!`, 'success');
    }
    setEditingGame(null);
    setIsGameFormOpen(false);
  };

  const handleRegisterScannedGames = async (scanned: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!user) return;
    const created: UserGame[] = [];
    try {
      for (const game of scanned) {
        created.push(await storage.addUserGame(user.uid, game));
        track('game_added', { method: 'scan' });
      }
    } finally {
      // Whatever was written before a failure is already saved, so reflect it either way.
      if (created.length > 0) {
        setGames((prev) => [...[...created].reverse(), ...prev]);
      }
    }
    showToast(`${created.length}개 게임이 등록되었습니다.`, 'success');
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

  // A shared play arrives in the URL hash. Clear it right away so a reload does not reopen it
  // and the friends' names do not linger in the address bar or history.
  // Also on hashchange: opening a second link while the app is already open only changes the
  // fragment, which does not reload the page.
  useEffect(() => {
    const readSharedHash = () => {
      const { hash, pathname, search } = window.location;
      if (!sharedHashPresent(hash)) return;
      window.history.replaceState(null, '', pathname + search);
      const shared = decodeSharedPlay(hash);
      if (shared) {
        track('share_link_opened');
        setIncomingShare(shared);
      } else {
        showToast('공유 링크가 손상되어 기록을 열 수 없습니다.', 'error');
      }
    };
    readSharedHash();
    window.addEventListener('hashchange', readSharedHash);
    return () => window.removeEventListener('hashchange', readSharedHash);
  }, [showToast]);

  const handleAddSharedPlay = async (myIndex: number) => {
    if (!user || !incomingShare) return;
    const imported = normalizePlay(toRecipientRecord(incomingShare, myIndex));
    if (!imported) {
      showToast('공유된 기록을 읽지 못했습니다.', 'error');
      return;
    }
    try {
      // Same path as backup restore: fresh id, whitelisted fields, duplicate check, ownership.
      const plan = await storage.planImport(user.uid, { games: [], plays: [imported], invalidCount: 0 });
      if (plan.newPlays.length === 0) {
        showToast('이미 내 기록에 있는 게임이에요.', 'info');
      } else {
        await storage.commitImport(user.uid, plan);
        track('share_link_added');
        await loadData();
        showToast('내 기록에 추가했어요.', 'success');
      }
      setIncomingShare(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '기록을 추가하지 못했습니다.', 'error');
    }
  };

  const handleRemoveSampleData = async () => {
    if (!user) return;
    try {
      const removed = await storage.removeSampleData(user.uid);
      await loadData();
      showToast(`예시 기록 ${removed.plays}개, 예시 게임 ${removed.games}개를 지웠습니다.`, 'success');
    } catch {
      showToast('예시 데이터를 지우지 못했습니다.', 'error');
    }
  };

  // --- Handlers: Play Record CRUD ---
  const handleSavePlay = async (playData: Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
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
      track('play_saved');
      if (playData.photos.length > 0) track('play_photo_added', { count: playData.photos.length });
      setPlays((prev) => [newPlay, ...prev]);
      // Refresh games to update playCount
      const updatedGames = await storage.getUserGames(user.uid);
      setGames(updatedGames);
      showToast('새 플레이 기록이 저장되었습니다! 🎲', 'success');
      track('share_sheet_opened');
      setSharingPlay(newPlay);
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

  const openNewPlay = () => {
    setEditingPlay(null);
    setPreselectedGameForPlay(null);
    setIsPlayFormOpen(true);
  };

  // Quick Action from Game Card/Detail
  const handleStartPlayForGame = (game: UserGame) => {
    setPreselectedGameForPlay(game);
    setEditingPlay(null);
    setViewingGame(null);
    setIsPlayFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] text-[#2D3436] flex flex-col font-sans selection:bg-[#4834D4]/20 selection:text-[#4834D4]">
      {/* Top Fixed Header */}
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

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
                onRemoveSampleData={handleRemoveSampleData}
                onOpenAddPlay={openNewPlay}
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
              <GamesView
                games={games}
                onAddGame={(query) => {
                  setGameFormQuery(query);
                  setEditingGame(null);
                  setIsGameFormOpen(true);
                }}
                onOpenKakaoShare={() => setIsKakaoShareOpen(true)}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
                onSelectGame={setViewingGame}
                onDeleteGame={setDeletingGame}
              />
            )}

            {/* 3. PLAYS TAB (플레이 기록) */}
            {activeTab === 'plays' && <PlaysView plays={plays} onAddPlay={openNewPlay} onSelectPlay={setViewingPlay} />}

            {/* 4. MY PAGE TAB */}
            {activeTab === 'mypage' && (
              <MyPageView
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
                onDataImported={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation & Big Central FAB */}
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} onQuickAddPlay={openNewPlay} />

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
        defaultSearchQuery={gameFormQuery}
        onClose={() => {
          setIsGameFormOpen(false);
          setEditingGame(null);
        }}
        onSave={handleSaveGame}
        onOpenScan={() => {
          setIsGameFormOpen(false);
          setEditingGame(null);
          setIsScanOpen(true);
        }}
      />

      {/* Bulk Registration from Photos */}
      <GameScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        existingGames={games}
        onRegister={handleRegisterScannedGames}
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
        pastPlays={plays}
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

      <PlayShareSheet play={sharingPlay} onClose={() => setSharingPlay(null)} />
      <SharedPlayModal shared={incomingShare} onClose={() => setIncomingShare(null)} onAdd={handleAddSharedPlay} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Delete Game Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingGame}
        title="보드게임 삭제"
        message={`'${deletingGame?.title}' 게임을 내 목록에서 삭제하시겠습니까? 기록된 플레이 내역은 유지됩니다.`}
        confirmText="삭제하기"
        isDestructive
        onConfirm={handleConfirmDeleteGame}
        onCancel={() => setDeletingGame(null)}
      />

      {/* Delete Play Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPlay}
        title="플레이 기록 삭제"
        message={`'${deletingPlay?.gameTitle}' (${deletingPlay?.date}) 기록을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`}
        confirmText="삭제하기"
        isDestructive
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
