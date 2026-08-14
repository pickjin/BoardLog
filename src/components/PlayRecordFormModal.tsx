import React, { useState, useEffect, useRef } from 'react';
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
  Search
} from 'lucide-react';
import {
  PlayRecord,
  PlayParticipant,
  PlayPhoto,
  UserGame,
  MyGameResult
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

export const PlayRecordFormModal: React.FC<PlayRecordFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userGames,
  initialPlay,
  preselectedGame
}) => {
  // Game Selection
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [gameImageUrl, setGameImageUrl] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');

  // Date, Time & Place
  const [playDate, setPlayDate] = useState(formatDate());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('우리 집');

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
    } else if (preselectedGame) {
      setGameId(preselectedGame.id);
      setGameTitle(preselectedGame.title);
      setGameImageUrl(preselectedGame.imageUrl);
      setPlayDate(formatDate());
      setStartTime(formatCurrentTime());
      // Default end time + 45 mins
      const now = new Date();
      now.setMinutes(now.getMinutes() + (preselectedGame.playTime || 45));
      const eH = String(now.getHours()).padStart(2, '0');
      const eM = String(now.getMinutes()).padStart(2, '0');
      setEndTime(`${eH}:${eM}`);
      setLocation('우리 집');
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
    } else {
      // Default fresh state
      const firstMyGame = userGames[0];
      if (firstMyGame) {
        setGameId(firstMyGame.id);
        setGameTitle(firstMyGame.title);
        setGameImageUrl(firstMyGame.imageUrl);
      } else {
        setGameId(null);
        setGameTitle('스플렌더');
        setGameImageUrl('https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80');
      }
      setPlayDate(formatDate());
      setStartTime(formatCurrentTime());
      setEndTime('21:00');
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
    }
    setFormError(null);
    setGameSearchQuery('');
  }, [initialPlay, preselectedGame, userGames, isOpen]);

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
      setFormError('플레이한 보드게임명을 입력해 주세요.');
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
        location: location.trim() || '우리 집',
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

  // Games for autocomplete dropdown
  const filteredQuickGames = userGames.concat(
    SEED_GAMES.filter((sg) => !userGames.some((ug) => ug.title === sg.title)).map((sg) => ({
      id: '',
      title: sg.title,
      titleEn: sg.titleEn,
      imageUrl: sg.imageUrl,
      genre: sg.genre,
      minPlayers: sg.minPlayers,
      maxPlayers: sg.maxPlayers,
      bestPlayers: sg.bestPlayers,
      recommendedAge: sg.recommendedAge,
      playTime: sg.playTime,
      weight: sg.weight,
      publisher: sg.publisher,
      purchaseDate: '',
      purchasePrice: 0,
      originalPrice: 0,
      marketPrice: 0,
      storageLocation: '',
      condition: '최상' as const,
      tags: [],
      notes: '',
      ownershipStatus: '보유중' as const,
      playCount: 0,
      priceMeta: { source: '', verifiedDate: '', isManual: true },
      createdAt: '',
      updatedAt: ''
    }))
  );

  return (
    <AnimatePresence>
      <div id="play-record-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4.5 sm:p-5 border-b border-[#E9ECEF] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1E272E]">
                  {initialPlay ? '플레이 기록 수정' : '새 플레이 기록 남기기'}
                </h2>
                <p className="text-[11px] text-[#636E72]">참여자, 점수, 순위, 승패, 사진을 기록하세요</p>
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

            {/* 1. Game Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1E272E]">
                플레이한 게임 <span className="text-[#EB4D4B]">*</span>
              </label>

              {/* Quick selector chips from My Games */}
              {userGames.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                  {userGames.map((ug) => (
                    <button
                      key={ug.id}
                      type="button"
                      onClick={() => {
                        setGameId(ug.id);
                        setGameTitle(ug.title);
                        setGameImageUrl(ug.imageUrl);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 transition-all font-bold ${
                        gameTitle === ug.title
                          ? 'bg-[#4834D4] text-white border-[#4834D4] shadow-[0_2px_8px_rgba(72,52,212,0.3)]'
                          : 'bg-[#F8F9FA] text-[#636E72] border-[#E9ECEF] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      <img
                        src={ug.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{ug.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Text Input for Custom or Seed title */}
              <div className="flex gap-2">
                <input
                  id="play-game-title-input"
                  type="text"
                  required
                  placeholder="게임명 직접 입력 (예: 스플렌더, 테라포밍 마스)"
                  value={gameTitle}
                  onChange={(e) => {
                    setGameTitle(e.target.value);
                    const matched = userGames.find((g) => g.title === e.target.value);
                    if (matched) {
                      setGameId(matched.id);
                      setGameImageUrl(matched.imageUrl);
                    } else {
                      setGameId(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl text-xs font-bold text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] focus:ring-2 focus:ring-[#4834D4]/10 transition-all"
                />
              </div>
            </div>

            {/* 2. Date, Time, Duration & Location */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1E272E] mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#A8ABAF]" />
                  <span>플레이 날짜</span>
                </label>
                <input
                  id="play-input-date"
                  type="text"
                  placeholder="YYYY.MM.DD"
                  value={playDate}
                  onChange={(e) => setPlayDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#E9ECEF] rounded-xl text-xs font-semibold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1E272E] mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#A8ABAF]" />
                  <span>장소</span>
                </label>
                <input
                  id="play-input-location"
                  type="text"
                  placeholder="예: 보드게임 카페, 집"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#E9ECEF] rounded-xl text-xs font-semibold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1E272E] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A8ABAF]" />
                  <span>시작 / 종료 시간</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                  />
                  <span className="text-[#A8ABAF]">~</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1E272E] mb-1">총 플레이 시간</label>
                <div className="px-2.5 py-2 bg-[#4834D4]/10 border border-[#4834D4]/20 rounded-xl text-xs font-bold text-[#4834D4] text-center">
                  {formatDuration(durationMinutes)} ({durationMinutes}분)
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
          <div className="p-4 border-t border-[#E9ECEF] bg-white flex items-center justify-end gap-2.5">
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
