import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  Trash2,
  RotateCw,
  Trophy,
  Users,
  MapPin,
  Calendar,
  Clock,
  Star,
  Camera,
  Image as ImageIcon,
  Save,
  AlertCircle,
  Sparkles,
  Award,
  Check,
  Search,
  BookOpen,
  Coffee,
  CheckCircle2,
  ChevronRight,
  Flame,
  Dices
} from 'lucide-react';
import {
  PlayRecord,
  PlayParticipant,
  PlayPhoto,
  UserGame,
  MyGameResult,
  SeedGame
} from '../types';
import { SEED_GAMES } from '../data/seedGames';
import {
  formatDate,
  formatCurrentTime,
  calculateDurationMinutes,
  formatDuration
} from '../utils/formatters';
import { compressImage, rotateDataUrl } from '../utils/imageCompressor';

interface PlayRecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playData: Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  userGames: UserGame[];
  initialPlay?: PlayRecord | null;
  preselectedGame?: UserGame | null;
}

const MY_RESULT_OPTIONS: MyGameResult[] = ['승리', '패배', '무승부', '참여'];

const LOCATION_PRESETS = [
  '☕ 보드게임 카페',
  '🏠 우리 집',
  '🏡 친구 집',
  '🎲 동호회 모임',
  '🏕️ MT / 파티룸',
  '🏢 아지트'
];

const PRESET_GAME_IMAGES = [
  { label: '보석/전략', url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80' },
  { label: '주사위', url: 'https://images.unsplash.com/photo-1577741314755-048d8525d31e?auto=format&fit=crop&w=600&q=80' },
  { label: '카드/타일', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' },
  { label: '개척/지도', url: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80' },
  { label: 'SF/우주', url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80' },
  { label: '자연/동물', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80' }
];

export const PlayRecordFormModal: React.FC<PlayRecordFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userGames,
  initialPlay,
  preselectedGame
}) => {
  // Game Selection State
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [gameTitleEn, setGameTitleEn] = useState('');
  const [gameImageUrl, setGameImageUrl] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [isSelectingGame, setIsSelectingGame] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'db' | 'owned'>('all');
  const [showCustomImagePicker, setShowCustomImagePicker] = useState(false);

  // Date, Time & Place
  const [playDate, setPlayDate] = useState(formatDate());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('보드게임 카페');

  // Participants
  const [participants, setParticipants] = useState<PlayParticipant[]>([
    { id: 'p_me', name: '나', score: null, rank: 1, isWinner: true, notes: '' },
    { id: 'p_2', name: '동행 1', score: null, rank: 2, isWinner: false, notes: '' }
  ]);
  const [myResult, setMyResult] = useState<MyGameResult>('승리');
  const [isTeamPlay, setIsTeamPlay] = useState(false);
  const [hasExpansion, setHasExpansion] = useState(false);
  const [expansionName, setExpansionName] = useState('');

  // Rating & Review
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  // Photos (Max 6)
  const [photos, setPhotos] = useState<PlayPhoto[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto calculate duration when times change
  useEffect(() => {
    const mins = calculateDurationMinutes(startTime, endTime);
    setDurationMinutes(mins);
  }, [startTime, endTime]);

  // Reset or initialize on open
  useEffect(() => {
    if (initialPlay) {
      setGameId(initialPlay.gameId || null);
      setGameTitle(initialPlay.gameTitle || '');
      setGameTitleEn('');
      setGameImageUrl(initialPlay.gameImageUrl || '');
      setPlayDate(initialPlay.date || formatDate());
      setStartTime(initialPlay.startTime || '19:00');
      setEndTime(initialPlay.endTime || '20:00');
      setDurationMinutes(initialPlay.durationMinutes || 60);
      setLocation(initialPlay.location || '보드게임 카페');
      setParticipants(
        initialPlay.participants && initialPlay.participants.length > 0
          ? initialPlay.participants
          : [{ id: 'p_me', name: '나', score: null, rank: 1, isWinner: true }]
      );
      setMyResult(initialPlay.myResult || '승리');
      setIsTeamPlay(initialPlay.isTeamPlay || false);
      setHasExpansion(initialPlay.hasExpansion || false);
      setExpansionName(initialPlay.expansionName || '');
      setRating(initialPlay.rating || 5);
      setReview(initialPlay.review || '');
      setPhotos(initialPlay.photos || []);
      setIsSelectingGame(false);
    } else if (preselectedGame) {
      setGameId(preselectedGame.id);
      setGameTitle(preselectedGame.title);
      setGameTitleEn(preselectedGame.titleEn || '');
      setGameImageUrl(preselectedGame.imageUrl);
      setPlayDate(formatDate());
      setStartTime(formatCurrentTime());

      // Auto end time based on game's typical play time
      const now = new Date();
      now.setMinutes(now.getMinutes() + (preselectedGame.playTime || 45));
      const eH = String(now.getHours()).padStart(2, '0');
      const eM = String(now.getMinutes()).padStart(2, '0');
      setEndTime(`${eH}:${eM}`);

      setLocation(preselectedGame.storageLocation ? '우리 집' : '보드게임 카페');
      setParticipants([
        { id: 'p_me', name: '나', score: null, rank: 1, isWinner: true, notes: '' },
        { id: 'p_2', name: '동행 1', score: null, rank: 2, isWinner: false, notes: '' }
      ]);
      setMyResult('승리');
      setIsTeamPlay(false);
      setHasExpansion(false);
      setExpansionName('');
      setRating(5);
      setReview('');
      setPhotos([]);
      setIsSelectingGame(false);
    } else {
      // Default: Clean start with Search Mode open so user can search cafe games or owned games
      setGameId(null);
      setGameTitle('');
      setGameTitleEn('');
      setGameImageUrl('https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80');
      setPlayDate(formatDate());
      setStartTime(formatCurrentTime());

      const now = new Date();
      now.setMinutes(now.getMinutes() + 60);
      const eH = String(now.getHours()).padStart(2, '0');
      const eM = String(now.getMinutes()).padStart(2, '0');
      setEndTime(`${eH}:${eM}`);

      setLocation('보드게임 카페');
      setParticipants([
        { id: 'p_me', name: '나', score: null, rank: 1, isWinner: true, notes: '' },
        { id: 'p_2', name: '동행 1', score: null, rank: 2, isWinner: false, notes: '' }
      ]);
      setMyResult('승리');
      setIsTeamPlay(false);
      setHasExpansion(false);
      setExpansionName('');
      setRating(5);
      setReview('');
      setPhotos([]);
      setIsSelectingGame(true); // Open search directly for easy typing/search!
    }
    setFormError(null);
    setGameSearchQuery('');
    setShowCustomImagePicker(false);
  }, [initialPlay, preselectedGame, userGames, isOpen]);

  // Combined Search Catalog (User games + Full DB Seed games)
  const combinedCatalog = useMemo(() => {
    // 1. User owned games
    const ownedItems = userGames.map((ug) => ({
      id: ug.id,
      isOwned: true,
      title: ug.title,
      titleEn: ug.titleEn || '',
      imageUrl: ug.imageUrl,
      genre: ug.genre || [],
      minPlayers: ug.minPlayers,
      maxPlayers: ug.maxPlayers,
      playTime: ug.playTime || 45,
      weight: ug.weight || 2.0,
      publisher: ug.publisher || '',
      storageLocation: ug.storageLocation || ''
    }));

    // 2. Seed Games (marking whether user already owns them)
    const seedItems = SEED_GAMES.filter(
      (sg) => !userGames.some((ug) => ug.title.toLowerCase() === sg.title.toLowerCase())
    ).map((sg) => ({
      id: sg.id,
      isOwned: false,
      title: sg.title,
      titleEn: sg.titleEn || '',
      imageUrl: sg.imageUrl,
      genre: sg.genre || [],
      minPlayers: sg.minPlayers,
      maxPlayers: sg.maxPlayers,
      playTime: sg.playTime || 45,
      weight: sg.weight || 2.0,
      publisher: sg.publisher || '',
      storageLocation: ''
    }));

    return [...ownedItems, ...seedItems];
  }, [userGames]);

  // Filtered game suggestions
  const searchResults = useMemo(() => {
    let list = combinedCatalog;

    if (searchCategory === 'owned') {
      list = list.filter((g) => g.isOwned);
    } else if (searchCategory === 'db') {
      list = list.filter((g) => !g.isOwned);
    }

    const query = gameSearchQuery.trim().toLowerCase();
    if (!query) {
      return list.slice(0, 15);
    }

    return list.filter((g) => {
      return (
        g.title.toLowerCase().includes(query) ||
        g.titleEn.toLowerCase().includes(query) ||
        g.publisher.toLowerCase().includes(query) ||
        g.genre.some((gr) => gr.toLowerCase().includes(query))
      );
    });
  }, [combinedCatalog, gameSearchQuery, searchCategory]);

  // Select a game from suggestions
  const handleSelectGame = (game: {
    id: string;
    isOwned: boolean;
    title: string;
    titleEn?: string;
    imageUrl: string;
    playTime?: number;
    storageLocation?: string;
  }) => {
    setGameId(game.isOwned ? game.id : null);
    setGameTitle(game.title);
    setGameTitleEn(game.titleEn || '');
    setGameImageUrl(game.imageUrl);

    // Auto calculate end time based on game's playTime
    const typicalTime = game.playTime || 45;
    const [sH, sM] = startTime.split(':').map(Number);
    if (!isNaN(sH) && !isNaN(sM)) {
      const dateObj = new Date();
      dateObj.setHours(sH, sM + typicalTime, 0, 0);
      const eH = String(dateObj.getHours()).padStart(2, '0');
      const eM = String(dateObj.getMinutes()).padStart(2, '0');
      setEndTime(`${eH}:${eM}`);
    }

    if (!game.isOwned && location === '우리 집') {
      setLocation('보드게임 카페');
    }

    setIsSelectingGame(false);
    setFormError(null);
  };

  // Select a custom entered title
  const handleSelectCustomTitle = (customName: string) => {
    if (!customName.trim()) return;
    setGameId(null);
    setGameTitle(customName.trim());
    setGameTitleEn('');
    if (!gameImageUrl) {
      setGameImageUrl(PRESET_GAME_IMAGES[0].url);
    }
    setIsSelectingGame(false);
    setFormError(null);
  };

  // Handle participant updates
  const updateParticipant = (index: number, updates: Partial<PlayParticipant>) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };

      // If winner toggled on for '나', sync myResult to '승리'
      if (next[index].name === '나' && updates.isWinner !== undefined) {
        setMyResult(updates.isWinner ? '승리' : '패배');
      }
      return next;
    });
  };

  const addParticipant = () => {
    const nextRank = participants.length + 1;
    setParticipants((prev) => [
      ...prev,
      {
        id: 'p_' + Math.random().toString(36).substring(2, 7),
        name: `플레이어 ${nextRank}`,
        score: null,
        rank: nextRank,
        isWinner: false,
        notes: ''
      }
    ]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) {
      setFormError('참여자는 최소 1명 이상이어야 합니다.');
      return;
    }
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  // Image Upload handler (with Canvas compressor)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 6) {
      setFormError('사진은 1개 기록당 최대 6장까지만 등록 가능합니다.');
      return;
    }

    setIsUploadingPhoto(true);
    setFormError(null);

    try {
      const newPhotos: PlayPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await compressImage(file);
        newPhotos.push({
          id: 'photo_' + Math.random().toString(36).substring(2, 8) + Date.now(),
          url: res.dataUrl,
          caption: '',
          rotation: 0
        });
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '사진 압축 및 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRotatePhoto = async (index: number) => {
    const target = photos[index];
    if (!target) return;
    try {
      const rotatedUrl = await rotateDataUrl(target.url, 90);
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          url: rotatedUrl,
          rotation: (next[index].rotation + 90) % 360
        };
        return next;
      });
    } catch {
      setFormError('사진 회전 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCaption = (index: number, caption: string) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], caption };
      return next;
    });
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) {
      setFormError('플레이한 보드게임명을 검색하거나 입력해 주세요.');
      setIsSelectingGame(true);
      return;
    }
    if (participants.length === 0) {
      setFormError('참여자를 최소 1명 이상 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const winnerNames = participants.filter((p) => p.isWinner).map((p) => p.name);

    try {
      await onSave({
        gameId,
        gameTitle: gameTitle.trim(),
        gameImageUrl: gameImageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
        date: playDate || formatDate(),
        startTime: startTime || '19:00',
        endTime: endTime || '20:00',
        durationMinutes: Number(durationMinutes) || 60,
        location: location.trim() || '보드게임 카페',
        participants,
        winnerNames,
        myResult,
        isTeamPlay,
        hasExpansion,
        expansionName: expansionName.trim(),
        rating,
        review: review.trim(),
        photos
      });

      // Victory celebration confetti!
      if (myResult === '승리') {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch {
          // ignore
        }
      }

      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="play-record-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4.5 sm:p-5 border-b border-[#E9ECEF] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1E272E]">
                  {initialPlay ? '플레이 기록 수정' : '새 플레이 기록 남기기'}
                </h2>
                <p className="text-[11px] text-[#636E72]">
                  소장 여부 상관없이 보드게임 카페, 모임 플레이를 자유롭게 검색 및 기록하세요
                </p>
              </div>
            </div>
            <button
              id="play-form-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body Scroll Area */}
          <form onSubmit={handleSubmit} className="p-4.5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {formError && (
              <div className="p-3 bg-[#EB4D4B]/10 border border-[#EB4D4B]/20 rounded-2xl text-[#EB4D4B] text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Game Selection & Search Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E272E] flex items-center gap-1.5">
                  <Dices className="w-3.5 h-3.5 text-[#4834D4]" />
                  <span>플레이한 보드게임</span>
                  <span className="text-[#EB4D4B]">*</span>
                </label>
                {gameTitle && !isSelectingGame && (
                  <button
                    type="button"
                    onClick={() => setIsSelectingGame(true)}
                    className="text-[11px] font-bold text-[#4834D4] hover:underline flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    <span>다른 게임 검색 / 변경</span>
                  </button>
                )}
              </div>

              {/* A. Selected Game Card (When a game is picked and search is closed) */}
              {!isSelectingGame && gameTitle ? (
                <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={gameImageUrl}
                      alt={gameTitle}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-[#E9ECEF] shrink-0 bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-black text-[#1E272E] truncate">{gameTitle}</h3>
                        {gameId ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4834D4]/10 text-[#4834D4] border border-[#4834D4]/20">
                            내 소장 게임
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/20">
                            카페 / 미소장 게임
                          </span>
                        )}
                      </div>
                      {gameTitleEn && (
                        <p className="text-[11px] text-[#A8ABAF] truncate font-medium">{gameTitleEn}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSelectingGame(true)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F1F3F5] text-[#1E272E] border border-[#E9ECEF] rounded-xl text-xs font-bold shrink-0 transition-colors"
                  >
                    변경
                  </button>
                </div>
              ) : (
                /* B. Search / Autocomplete & Input Box */
                <div className="space-y-2.5 p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#4834D4]/20 shadow-xs">
                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSearchCategory('all')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                        searchCategory === 'all'
                          ? 'bg-[#4834D4] text-white shadow-xs'
                          : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      전체 DB ({combinedCatalog.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchCategory('db')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                        searchCategory === 'db'
                          ? 'bg-[#27AE60] text-white shadow-xs'
                          : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      카페 / 인기 게임 DB ({SEED_GAMES.length})
                    </button>
                    {userGames.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSearchCategory('owned')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                          searchCategory === 'owned'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                        }`}
                      >
                        내 소장 게임 ({userGames.length})
                      </button>
                    )}
                  </div>

                  {/* Search Input Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#A8ABAF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="play-game-search-input"
                      type="text"
                      autoFocus={isSelectingGame}
                      placeholder="게임 검색 또는 직접 입력 (스플렌더, 카탄, 윙스팬, 뱅...)"
                      value={gameSearchQuery}
                      onChange={(e) => setGameSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && gameSearchQuery.trim()) {
                          e.preventDefault();
                          // If search result has exact or first match, pick it, else custom
                          if (searchResults.length > 0) {
                            handleSelectGame(searchResults[0]);
                          } else {
                            handleSelectCustomTitle(gameSearchQuery);
                          }
                        }
                      }}
                      className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#E9ECEF] rounded-2xl text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] focus:ring-2 focus:ring-[#4834D4]/10 transition-all"
                    />
                    {gameSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setGameSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8ABAF] hover:text-[#1E272E]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Direct custom name selection banner if user typed text */}
                  {gameSearchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomTitle(gameSearchQuery)}
                      className="w-full p-2.5 rounded-xl bg-white hover:bg-[#4834D4]/5 border border-dashed border-[#4834D4]/40 text-left text-xs font-bold text-[#4834D4] flex items-center justify-between transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="w-4 h-4 shrink-0 text-[#F5CD79]" />
                        <span className="truncate">
                          <strong>"{gameSearchQuery}"</strong> 이름으로 직접 기록하기
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4834D4]/10 font-bold shrink-0">
                        직접 입력 선택
                      </span>
                    </button>
                  )}

                  {/* Results List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                    {searchResults.length > 0 ? (
                      searchResults.map((game) => (
                        <div
                          key={`${game.isOwned ? 'owned' : 'seed'}-${game.id || game.title}`}
                          onClick={() => handleSelectGame(game)}
                          className="p-2 rounded-xl bg-white hover:bg-[#F1F3F5] border border-[#E9ECEF] cursor-pointer flex items-center justify-between gap-2.5 transition-all active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={game.imageUrl}
                              alt={game.title}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-lg object-cover bg-stone-100 shrink-0 border border-[#E9ECEF]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-[#1E272E] truncate">
                                  {game.title}
                                </span>
                                {game.isOwned ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#4834D4]/10 text-[#4834D4] font-bold shrink-0">
                                    소장
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#27AE60]/10 text-[#27AE60] font-bold shrink-0">
                                    DB
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#636E72] flex items-center gap-1.5 mt-0.5">
                                {game.titleEn && <span className="truncate max-w-[100px]">{game.titleEn}</span>}
                                {game.minPlayers && (
                                  <span>
                                    • {game.minPlayers}~{game.maxPlayers}인
                                  </span>
                                )}
                                {game.playTime && <span>• {game.playTime}분</span>}
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-3.5 h-3.5 text-[#A8ABAF] shrink-0" />
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#636E72] bg-white rounded-xl border border-[#E9ECEF]">
                        <p>일치하는 보드게임을 찾을 수 없습니다.</p>
                        <p className="text-[11px] text-[#A8ABAF] mt-0.5">
                          상단의 <strong>"{gameSearchQuery}" 직접 기록하기</strong>를 누르면 바로 기록할 수 있습니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cancel Selecting if already had a title */}
                  {gameTitle && (
                    <button
                      type="button"
                      onClick={() => setIsSelectingGame(false)}
                      className="w-full py-1.5 text-center text-xs text-[#636E72] hover:text-[#1E272E] font-bold"
                    >
                      닫기 (현재 선택: {gameTitle})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Date, Time, Duration & Location */}
            <div className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E272E] mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#4834D4]" />
                    <span>플레이 날짜</span>
                  </label>
                  <input
                    id="play-input-date"
                    type="text"
                    placeholder="YYYY.MM.DD"
                    value={playDate}
                    onChange={(e) => setPlayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-xl text-xs font-semibold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1E272E] mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#4834D4]" />
                    <span>장소</span>
                  </label>
                  <input
                    id="play-input-location"
                    type="text"
                    placeholder="예: 보드게임 카페, 우리 집, 모임 장소"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-xl text-xs font-semibold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                </div>
              </div>

              {/* Quick Location Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-[#A8ABAF] font-bold shrink-0">추천 장소:</span>
                {LOCATION_PRESETS.map((loc) => {
                  const pureName = loc.replace(/^[^\s]+\s/, '');
                  const isSelected = location.includes(pureName);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-colors border ${
                        isSelected
                          ? 'bg-[#4834D4] text-white border-[#4834D4] shadow-2xs'
                          : 'bg-white text-[#636E72] border-[#E9ECEF] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>

              {/* Time & Duration Section (Clean, non-overlapping design) */}
              <div className="pt-3 border-t border-[#E9ECEF] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#1E272E] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#4834D4]" />
                    <span>시작 / 종료 시간</span>
                  </label>
                  
                  {/* Total Duration Highlight Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#4834D4]/10 border border-[#4834D4]/20 rounded-full text-xs font-black text-[#4834D4]">
                    <span className="text-[10px] font-bold text-[#636E72]">총 플레이:</span>
                    <span>{formatDuration(durationMinutes)} ({durationMinutes}분)</span>
                  </div>
                </div>

                {/* Time Pickers (Ample room for native pickers) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white px-3 py-2 rounded-xl border border-[#E9ECEF] flex flex-col justify-center">
                    <span className="text-[9px] text-[#A8ABAF] font-bold block mb-0.5">시작</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-transparent text-xs font-black text-[#1E272E] focus:outline-hidden"
                    />
                  </div>

                  <div className="bg-white px-3 py-2 rounded-xl border border-[#E9ECEF] flex flex-col justify-center">
                    <span className="text-[9px] text-[#A8ABAF] font-bold block mb-0.5">종료</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-transparent text-xs font-black text-[#1E272E] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Quick duration presets */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <span className="text-[10px] text-[#A8ABAF] font-bold shrink-0">빠른 설정:</span>
                  {[30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        const [sh, sm] = startTime.split(':').map(Number);
                        const startTotal = (isNaN(sh) ? 0 : sh) * 60 + (isNaN(sm) ? 0 : sm);
                        const endTotal = (startTotal + mins) % (24 * 60);
                        const eh = Math.floor(endTotal / 60);
                        const em = endTotal % 60;
                        setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
                        setDurationMinutes(mins);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition-colors border ${
                        durationMinutes === mins
                          ? 'bg-[#4834D4]/10 text-[#4834D4] border-[#4834D4]/30'
                          : 'bg-white text-[#636E72] border-[#E9ECEF] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      {mins < 60 ? `+${mins}분` : `+${mins / 60}시간${mins % 60 !== 0 ? ` ${mins % 60}분` : ''}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. My Result Selection */}
            <div>
              <label className="block text-xs font-bold text-[#1E272E] mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#4834D4]" />
                <span>나의 결과</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MY_RESULT_OPTIONS.map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => {
                      setMyResult(res);
                      // sync with participant '나'
                      setParticipants((prev) =>
                        prev.map((p) => (p.name === '나' ? { ...p, isWinner: res === '승리' } : p))
                      );
                    }}
                    className={`py-2 rounded-full text-xs font-bold border transition-all text-center ${
                      myResult === res
                        ? res === '승리'
                          ? 'bg-[#4834D4] text-white border-[#4834D4] shadow-[0_2px_8px_rgba(72,52,212,0.3)]'
                          : 'bg-[#1E272E] text-white border-[#1E272E] shadow-xs'
                        : 'bg-[#F8F9FA] text-[#636E72] border-[#E9ECEF] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    {res === '승리' ? '👑 승리' : res}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Participants, Scores & Ranks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E272E] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#A8ABAF]" />
                  <span>참여자 & 점수/순위</span>
                </label>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4834D4] bg-[#4834D4]/10 hover:bg-[#4834D4]/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>참여자 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {participants.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs transition-colors ${
                      p.isWinner ? 'bg-[#4834D4]/5 border-[#4834D4]/30' : 'bg-[#F8F9FA] border-[#E9ECEF]'
                    }`}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2 w-full sm:w-1/3">
                      <button
                        type="button"
                        onClick={() => updateParticipant(idx, { isWinner: !p.isWinner })}
                        title="승자 토글"
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          p.isWinner
                            ? 'bg-[#4834D4] text-white border-[#4834D4] shadow-xs'
                            : 'bg-white text-[#A8ABAF] border-[#E9ECEF]'
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="이름"
                        value={p.name}
                        onChange={(e) => updateParticipant(idx, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                      />
                    </div>

                    {/* Rank & Score */}
                    <div className="flex items-center gap-2 w-full sm:w-1/2">
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[10px] text-[#636E72] shrink-0 font-medium">순위:</span>
                        <input
                          type="number"
                          placeholder="순위"
                          value={p.rank || ''}
                          onChange={(e) =>
                            updateParticipant(idx, {
                              rank: e.target.value === '' ? null : Number(e.target.value)
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-center font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[10px] text-[#636E72] shrink-0 font-medium">점수:</span>
                        <input
                          type="number"
                          placeholder="점수"
                          value={p.score ?? ''}
                          onChange={(e) =>
                            updateParticipant(idx, {
                              score: e.target.value === '' ? null : Number(e.target.value)
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-center font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                        />
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => removeParticipant(idx)}
                      className="p-1.5 text-[#A8ABAF] hover:text-[#EB4D4B] rounded-full ml-auto hover:bg-[#F1F3F5] transition-colors"
                      title="참여자 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Photos Upload (Max 6, canvas compressed, rotate, caption, delete) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E272E] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#A8ABAF]" />
                  <span>플레이 현장 사진 (최대 6장)</span>
                </label>
                <span className="text-[11px] font-bold text-[#636E72]">
                  {photos.length} / 6장
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-2.5">
                {photos.map((photo, pIdx) => (
                  <div
                    key={photo.id || pIdx}
                    className="relative group rounded-2xl overflow-hidden border border-[#E9ECEF] bg-[#F1F3F5] aspect-square flex flex-col justify-between shadow-xs"
                  >
                    <img
                      src={photo.url}
                      alt="플레이 사진"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay action buttons */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs rounded-full p-0.5">
                      <button
                        type="button"
                        onClick={() => handleRotatePhoto(pIdx)}
                        className="p-1 text-white hover:text-[#F5CD79] transition-colors"
                        title="90도 회전"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(pIdx)}
                        className="p-1 text-white hover:text-[#EB4D4B] transition-colors"
                        title="사진 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Caption input on photo */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-1.5">
                      <input
                        type="text"
                        placeholder="사진 설명"
                        value={photo.caption}
                        onChange={(e) => handleUpdateCaption(pIdx, e.target.value)}
                        className="w-full px-1 py-0.5 bg-transparent text-[10px] text-white placeholder-stone-400 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}

                {photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-[#CED6E0] hover:border-[#4834D4] bg-[#F8F9FA] hover:bg-[#4834D4]/5 aspect-square transition-all text-[#636E72] hover:text-[#4834D4]"
                  >
                    <Camera className="w-5 h-5 mb-1 text-[#A8ABAF]" />
                    <span className="text-[10px] font-bold">
                      {isUploadingPhoto ? '압축 중...' : '사진 추가'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* 6. Rating (Stars) & Review Note */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#1E272E] mb-1.5">이번 플레이 만족도</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="p-1 text-[#E9ECEF] hover:text-[#F5CD79] transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          starVal <= rating ? 'text-[#F5CD79] fill-[#F5CD79]' : 'text-[#E9ECEF]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#4834D4] ml-2">{rating}점 / 5점</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E272E] mb-1">
                  플레이 후기 & 전략 메모
                </label>
                <textarea
                  id="play-input-review"
                  rows={3}
                  placeholder="승리 요인, 하이라이트 순간, 인상 깊었던 전략이나 소감을 남겨보세요."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full p-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] focus:ring-2 focus:ring-[#4834D4]/10 transition-all"
                />
              </div>
            </div>
          </form>

          {/* Footer CTA */}
          <div className="p-4 border-t border-[#E9ECEF] bg-white flex items-center justify-end gap-2.5 shrink-0">
            <button
              id="play-form-cancel-btn"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-[#636E72] hover:bg-[#F1F3F5] rounded-full transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              id="play-form-save-btn"
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] active:bg-[#32229e] text-white text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? '저장 중...' : initialPlay ? '수정 완료' : '기록 저장'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

