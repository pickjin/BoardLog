import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Users,
  Clock,
  Flame,
  Search,
  Filter,
  X,
  MessageCircle,
  Sparkles,
  CheckSquare,
  Square,
  HelpCircle,
  Tag,
  Dices,
  Layers,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Send
} from 'lucide-react';
import { loadHtml2Canvas, ExportModuleLoadError } from '../utils/lazyModules';
import { useIsMounted } from '../utils/useIsMounted';
import { UserGame } from '../types';
import { useToast } from '../context/ToastContext';

interface KakaoShareModalProps {
  isOpen: boolean;
  games: UserGame[];
  ownerName: string;
  onClose: () => void;
}

type PlayerPreset = 'all' | 'under4' | 'twoPlayers' | 'threeFour' | 'party5Plus';
type WeightPreset = 'all' | 'easy' | 'medium' | 'heavy';

export const KakaoShareModal: React.FC<KakaoShareModalProps> = ({
  isOpen,
  games,
  ownerName,
  onClose
}) => {
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  // Sharing Mode: 'all' | 'selective'
  const [shareMode, setShareMode] = useState<'all' | 'selective'>('selective');

  // Filter Presets
  const [playerPreset, setPlayerPreset] = useState<PlayerPreset>('under4'); // default 4인 이하 as requested
  const [selectedGenre, setSelectedGenre] = useState<string>('전체');
  const [weightPreset, setWeightPreset] = useState<WeightPreset>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected game IDs (for selective sharing)
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(() => {
    // Initial: games that support 4 or fewer players
    const initialSet = new Set<string>();
    games.forEach((g) => {
      if (g.minPlayers <= 4 && (g.maxPlayers <= 4 || g.minPlayers <= 4)) {
        initialSet.add(g.id);
      }
    });
    // fallback if empty
    if (initialSet.size === 0) {
      games.slice(0, 8).forEach((g) => initialSet.add(g.id));
    }
    return initialSet;
  });

  // Custom sharing message / header
  const [customMessage, setCustomMessage] = useState('🎲 오늘 모임에서 같이 할 보드게임 골라보세요!');
  const [includePlaytime, setIncludePlaytime] = useState(true);
  const [includePlayers, setIncludePlayers] = useState(true);
  const [includeGenre, setIncludeGenre] = useState(true);
  const [includeWeight, setIncludeWeight] = useState(true);

  // States
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const isMounted = useIsMounted();
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');

  // Extract all genres from user's games
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      g.genre.forEach((gr) => set.add(gr.trim()));
    });
    return Array.from(set).filter(Boolean);
  }, [games]);

  // Filtered games based on preset filters (used for quick bulk selection)
  const filteredPresetGames = useMemo(() => {
    return games.filter((g) => {
      // 1. Player Count
      if (playerPreset === 'under4') {
        // Can be played with 4 or fewer (minPlayers <= 4)
        if (g.minPlayers > 4) return false;
      } else if (playerPreset === 'twoPlayers') {
        if (g.minPlayers > 2 || g.maxPlayers < 2) return false;
      } else if (playerPreset === 'threeFour') {
        if (g.maxPlayers < 3 || g.minPlayers > 4) return false;
      } else if (playerPreset === 'party5Plus') {
        if (g.maxPlayers < 5) return false;
      }

      // 2. Genre
      if (selectedGenre !== '전체') {
        if (!g.genre.includes(selectedGenre)) return false;
      }

      // 3. Weight / Difficulty
      if (weightPreset === 'easy') {
        if ((g.weight || 2.0) > 2.2) return false;
      } else if (weightPreset === 'medium') {
        if ((g.weight || 2.0) < 2.0 || (g.weight || 2.0) > 3.2) return false;
      } else if (weightPreset === 'heavy') {
        if ((g.weight || 2.0) < 3.2) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = g.title.toLowerCase().includes(q) || (g.titleEn && g.titleEn.toLowerCase().includes(q));
        const matchesGenre = g.genre.some((gr) => gr.toLowerCase().includes(q));
        if (!matchesTitle && !matchesGenre) return false;
      }

      return true;
    });
  }, [games, playerPreset, selectedGenre, weightPreset, searchQuery]);

  // Games that are actually included in the share output
  const gamesToShare = useMemo(() => {
    if (shareMode === 'all') {
      return games;
    }
    return games.filter((g) => selectedGameIds.has(g.id));
  }, [games, shareMode, selectedGameIds]);

  // Toggle individual game
  const toggleGameSelection = (id: string) => {
    setSelectedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Quick Preset Click Handler
  const applyPresetFilter = (type: 'under4' | 'twoPlayers' | 'party5Plus' | 'all', genre?: string) => {
    setShareMode('selective');
    if (type) setPlayerPreset(type);
    if (genre !== undefined) setSelectedGenre(genre);

    // Auto-check all games matching this preset
    const matching = games.filter((g) => {
      if (type === 'under4' && g.minPlayers > 4) return false;
      if (type === 'twoPlayers' && (g.minPlayers > 2 || g.maxPlayers < 2)) return false;
      if (type === 'party5Plus' && g.maxPlayers < 5) return false;
      if (genre && genre !== '전체' && !g.genre.includes(genre)) return false;
      return true;
    });

    const newSet = new Set<string>();
    matching.forEach((g) => newSet.add(g.id));
    setSelectedGameIds(newSet);

    showToast(`${matching.length}개의 게임이 선택되었습니다.`, 'success');
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    const allSet = new Set<string>(games.map((g) => g.id));
    setSelectedGameIds(allSet);
  };

  const handleDeselectAll = () => {
    setSelectedGameIds(new Set());
  };

  const handleSelectFilteredOnly = () => {
    const set = new Set<string>();
    filteredPresetGames.forEach((g) => set.add(g.id));
    setSelectedGameIds(set);
    showToast(`필터된 ${filteredPresetGames.length}개 게임이 선택되었습니다.`, 'success');
  };

  // Generate KakaoTalk Formatted Text
  const kakaoFormattedText = useMemo(() => {
    const titleHeader = `🎲 [${ownerName || '보드게이머'}님의 보드게임 소장 목록] 🎲`;
    const subDesc =
      shareMode === 'all'
        ? `📦 전체 소장 컬렉션 (${gamesToShare.length}종)`
        : `✨ 추천/선택 보드게임 (${gamesToShare.length}종)`;

    const lines = [
      titleHeader,
      subDesc,
      customMessage ? `💬 "${customMessage}"` : '',
      '──────────────────'
    ].filter(Boolean);

    if (gamesToShare.length === 0) {
      lines.push('(선택된 게임이 없습니다)');
    } else {
      gamesToShare.forEach((g, idx) => {
        let line = `${idx + 1}. 🎮 ${g.title}`;
        const metaParts: string[] = [];

        if (includePlayers) {
          metaParts.push(`👥 ${g.minPlayers}~${g.maxPlayers}인`);
        }
        if (includePlaytime && g.playTime) {
          metaParts.push(`⏱ ${g.playTime}분`);
        }
        if (includeWeight && g.weight) {
          metaParts.push(`⭐ 난이도 ${g.weight.toFixed(1)}/5`);
        }
        if (includeGenre && g.genre && g.genre.length > 0) {
          metaParts.push(`🏷 ${g.genre.slice(0, 2).join(', ')}`);
        }

        lines.push(line);
        if (metaParts.length > 0) {
          lines.push(`   └ ${metaParts.join(' | ')}`);
        }
      });
    }

    lines.push('──────────────────');
    lines.push(`🎲 보드게임 로그 & 룸: ${window.location.origin}`);

    return lines.join('\n');
  }, [
    ownerName,
    gamesToShare,
    shareMode,
    customMessage,
    includePlayers,
    includePlaytime,
    includeWeight,
    includeGenre
  ]);

  // Copy to Clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(kakaoFormattedText);
      setIsCopied(true);
      showToast('카카오톡 공유 문구가 클립보드에 복사되었습니다! 카톡 채팅방에 붙여넣기(Ctrl+V)하세요.', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('문구 복사에 실패했습니다.', 'error');
    }
  };

  // Direct Kakao Share / Web Share API
  const handleNativeOrKakaoShare = async () => {
    const shareTitle = `${ownerName || '보드게이머'}님의 보드게임 목록 (${gamesToShare.length}종)`;
    
    // 1. Try Web Share API (Natively opens KakaoTalk app on mobile/desktop!)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: kakaoFormattedText,
          url: window.location.href
        });
        showToast('카카오톡 또는 원하는 앱으로 공유를 시작했습니다.', 'success');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // If canceled, do nothing. Otherwise fallback to clipboard
          handleCopyText();
        }
        return;
      }
    }

    // 2. Fallback: Copy to clipboard and offer kakao web sharer
    await handleCopyText();
    // Try opening kakao sharer or talk scheme if available
    const kakaoWebSharerUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=boardgame&shortKey=${encodeURIComponent(
      window.location.href
    )}`;
    
    // Check if on mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `kakaolink://send?text=${encodeURIComponent(kakaoFormattedText)}`;
    } else {
      window.open(kakaoWebSharerUrl, '_blank', 'width=450,height=600');
    }
  };

  // Export as Image Card
  const handleExportImageCard = async () => {
    if (!cardRef.current || isExportingImage) return;
    setIsExportingImage(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `boardgames_${ownerName || 'collection'}_${Date.now()}.png`;
      link.click();

      if (!isMounted()) return;
      showToast('카카오톡 공유용 이미지 카드가 저장되었습니다.', 'success');
    } catch (error) {
      console.error('Image Card Export Error:', error);
      if (!isMounted()) return;
      showToast(
        error instanceof ExportModuleLoadError
          ? '이미지 생성 모듈을 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.'
          : '이미지 카드 생성에 실패했습니다.',
        'error'
      );
    } finally {
      if (isMounted()) setIsExportingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="kakao-share-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4.5 sm:p-5 border-b border-[#E9ECEF] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEE500] text-[#191919] flex items-center justify-center font-black shadow-xs">
                <MessageCircle className="w-5 h-5 fill-[#191919]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#1E272E]">카카오톡 보드게임 목록 공유</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEE500] text-[#191919] text-[10px] font-black">
                    KakaoTalk
                  </span>
                </div>
                <p className="text-[11px] text-[#636E72]">
                  전체 또는 원하는 조건(장르, 4인이하 등)으로 골라 친구들에게 공유하세요
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F1F3F5] text-[#A8ABAF] hover:text-[#1E272E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (Settings vs Live Preview) */}
          <div className="px-4.5 pt-3 pb-2 bg-[#F8F9FA] border-b border-[#E9ECEF] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#1E272E] text-white shadow-xs'
                    : 'bg-white text-[#636E72] hover:bg-[#E9ECEF] border border-[#E9ECEF]'
                }`}
              >
                1. 공유할 게임 선택 ({gamesToShare.length}개)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-[#FEE500] text-[#191919] shadow-xs'
                    : 'bg-white text-[#636E72] hover:bg-[#E9ECEF] border border-[#E9ECEF]'
                }`}
              >
                <span>2. 카카오톡 미리보기</span>
                <span className="w-2 h-2 rounded-full bg-[#EB4D4B]"></span>
              </button>
            </div>

            <div className="text-xs font-bold text-[#4834D4]">
              선택: {gamesToShare.length} / {games.length}개
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'settings' ? (
              <>
                {/* 1. Mode Select: All vs Selective */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareMode('all')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      shareMode === 'all'
                        ? 'border-[#4834D4] bg-[#4834D4]/5 text-[#4834D4] ring-2 ring-[#4834D4]/20'
                        : 'border-[#E9ECEF] bg-[#F8F9FA] text-[#636E72] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">📦 전체 소장 게임 공유</span>
                      {shareMode === 'all' && <Check className="w-4 h-4 text-[#4834D4]" />}
                    </div>
                    <p className="text-[11px] text-[#A8ABAF]">보유한 {games.length}개 전체를 목록으로 공유합니다</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareMode('selective')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      shareMode === 'selective'
                        ? 'border-[#4834D4] bg-[#4834D4]/5 text-[#4834D4] ring-2 ring-[#4834D4]/20'
                        : 'border-[#E9ECEF] bg-[#F8F9FA] text-[#636E72] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">🎯 일부 선택 공유 (추천)</span>
                      {shareMode === 'selective' && <Check className="w-4 h-4 text-[#4834D4]" />}
                    </div>
                    <p className="text-[11px] text-[#A8ABAF]">인원수(4인이하), 장르 등 조건에 맞는 게임만 선택</p>
                  </button>
                </div>

                {/* 2. Quick Presets Section (Active when in Selective mode) */}
                {shareMode === 'selective' && (
                  <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E272E]">
                        <Sparkles className="w-4 h-4 text-[#F5CD79]" />
                        <span>인기 빠른 필터 프리셋</span>
                      </div>
                      <span className="text-[10px] text-[#A8ABAF]">원클릭으로 자동 선택</span>
                    </div>

                    {/* Presets Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPresetFilter('under4')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          playerPreset === 'under4'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'bg-white text-[#2D3436] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>👥 4인 이하 가능</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetFilter('twoPlayers')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          playerPreset === 'twoPlayers'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'bg-white text-[#2D3436] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>👫 2인 추천/전용</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetFilter('party5Plus')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          playerPreset === 'party5Plus'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'bg-white text-[#2D3436] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>🎉 5인 이상 파티/단체</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetFilter('all', '전략')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          selectedGenre === '전략'
                            ? 'bg-[#27AE60] text-white shadow-xs'
                            : 'bg-white text-[#2D3436] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>🧠 전략 장르만</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetFilter('all', '파티')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          selectedGenre === '파티'
                            ? 'bg-[#E67E22] text-white shadow-xs'
                            : 'bg-white text-[#2D3436] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>🎈 파티/블러핑만</span>
                      </button>
                    </div>

                    {/* Detailed Filters Dropdown/Bar */}
                    <div className="pt-2 border-t border-[#E9ECEF] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {/* Genre Select */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#636E72] mb-1">장르 선택</label>
                        <select
                          value={selectedGenre}
                          onChange={(e) => {
                            setSelectedGenre(e.target.value);
                            applyPresetFilter(playerPreset, e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs font-bold text-[#1E272E] focus:outline-hidden"
                        >
                          <option value="전체">전체 장르</option>
                          {allGenres.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Weight Select */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#636E72] mb-1">난이도 (웨이트)</label>
                        <select
                          value={weightPreset}
                          onChange={(e) => setWeightPreset(e.target.value as WeightPreset)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs font-bold text-[#1E272E] focus:outline-hidden"
                        >
                          <option value="all">전체 난이도</option>
                          <option value="easy">초보/입문 (2.2 이하)</option>
                          <option value="medium">중급 전략 (2.0~3.2)</option>
                          <option value="heavy">헤비 전략 (3.2 이상)</option>
                        </select>
                      </div>

                      {/* Search Bar */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-[#636E72] mb-1">게임 직접 검색</label>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#A8ABAF] absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="게임명 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-[#1E272E] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Selective Checklist Table */}
                {shareMode === 'selective' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E272E]">
                          게임 개별 선택 ({selectedGameIds.size}/{games.length}개 선택됨)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={handleSelectFilteredOnly}
                          className="px-2.5 py-1 bg-[#4834D4]/10 hover:bg-[#4834D4]/20 text-[#4834D4] rounded-lg text-[11px] font-bold transition-colors"
                        >
                          필터된 항목만 선택
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="px-2.5 py-1 bg-white hover:bg-[#F1F3F5] text-[#636E72] border border-[#E9ECEF] rounded-lg text-[11px] font-bold transition-colors"
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="px-2.5 py-1 bg-white hover:bg-[#F1F3F5] text-[#636E72] border border-[#E9ECEF] rounded-lg text-[11px] font-bold transition-colors"
                        >
                          선택 해제
                        </button>
                      </div>
                    </div>

                    {/* Game Items List */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-[#E9ECEF] bg-[#F8F9FA]">
                      {filteredPresetGames.length > 0 ? (
                        filteredPresetGames.map((game) => {
                          const isSelected = selectedGameIds.has(game.id);
                          return (
                            <div
                              key={game.id}
                              onClick={() => toggleGameSelection(game.id)}
                              className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-white border border-[#4834D4]/30 shadow-2xs'
                                  : 'bg-white/60 hover:bg-white border border-transparent text-[#A8ABAF]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'bg-[#4834D4] text-white'
                                      : 'border border-[#CBD5E1] bg-white text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <img
                                  src={game.imageUrl}
                                  alt={game.title}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0 border border-[#E9ECEF]"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80';
                                  }}
                                />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        isSelected ? 'text-[#1E272E]' : 'text-[#636E72]'
                                      }`}
                                    >
                                      {game.title}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#636E72] flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span>👥 {game.minPlayers}~{game.maxPlayers}인</span>
                                    {game.playTime && <span>• ⏱ {game.playTime}분</span>}
                                    {game.weight && <span>• ⭐ {game.weight.toFixed(1)}</span>}
                                    {game.genre && game.genre.length > 0 && (
                                      <span className="text-[#4834D4]">• {game.genre.slice(0, 2).join(', ')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[11px] font-bold shrink-0 text-[#A8ABAF]">
                                {isSelected ? '포함됨' : '제외됨'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-[#636E72]">
                          선택한 필터 조건에 맞는 게임이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Message Options & Greetings */}
                <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] space-y-2.5">
                  <label className="block text-xs font-bold text-[#1E272E]">
                    카카오톡 공유 상단 메시지 (선택 입력)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 이번 주말 모임에서 할 보드게임 골라주세요!"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-xl text-xs font-medium text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                  />

                  {/* Metadata Toggles */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#636E72]">
                      <input
                        type="checkbox"
                        checked={includePlayers}
                        onChange={(e) => setIncludePlayers(e.target.checked)}
                        className="rounded accent-[#4834D4]"
                      />
                      <span>인원수 표시</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#636E72]">
                      <input
                        type="checkbox"
                        checked={includePlaytime}
                        onChange={(e) => setIncludePlaytime(e.target.checked)}
                        className="rounded accent-[#4834D4]"
                      />
                      <span>플레이 시간 표시</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#636E72]">
                      <input
                        type="checkbox"
                        checked={includeWeight}
                        onChange={(e) => setIncludeWeight(e.target.checked)}
                        className="rounded accent-[#4834D4]"
                      />
                      <span>난이도 표시</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#636E72]">
                      <input
                        type="checkbox"
                        checked={includeGenre}
                        onChange={(e) => setIncludeGenre(e.target.checked)}
                        className="rounded accent-[#4834D4]"
                      />
                      <span>장르 표시</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              /* TAB 2: LIVE PREVIEW */
              <div className="space-y-4">
                <div className="p-3 bg-[#FFF3CD] border border-[#FFEBAA] rounded-2xl text-xs text-[#856404] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E67E22] shrink-0" />
                    <span>카카오톡 대화방에 전송될 메시지 형태를 미리 확인하세요!</span>
                  </div>
                  <span className="font-bold">총 {gamesToShare.length}개 게임</span>
                </div>

                {/* Simulated KakaoTalk Chat Room Background */}
                <div className="p-4 sm:p-5 rounded-3xl bg-[#B2C7D9] border border-[#9FB7CC] shadow-inner space-y-3">
                  <div className="text-center">
                    <span className="px-3 py-1 bg-black/15 rounded-full text-[10px] text-white font-medium">
                      보드게임 모임 카카오톡 대화방
                    </span>
                  </div>

                  {/* Kakao Talk Yellow Message Bubble */}
                  <div className="flex items-start justify-end gap-2">
                    <div
                      ref={cardRef}
                      className="max-w-md w-full bg-[#FEE500] text-[#191919] p-4 rounded-2xl rounded-tr-none shadow-md border border-[#F5DC00] space-y-2.5"
                    >
                      {/* Bubble Header */}
                      <div className="flex items-center justify-between border-b border-black/10 pb-2">
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <Dices className="w-4 h-4" />
                          <span>{ownerName || '보드게이머'}님의 보드게임 컬렉션</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/10">
                          {gamesToShare.length}개
                        </span>
                      </div>

                      {/* Custom User Greeting Message */}
                      {customMessage && (
                        <p className="text-xs font-semibold bg-white/70 p-2 rounded-xl border border-black/5">
                          "{customMessage}"
                        </p>
                      )}

                      {/* Game Items List Preview */}
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {gamesToShare.length > 0 ? (
                          gamesToShare.map((g, idx) => (
                            <div
                              key={g.id}
                              className="p-2 bg-white/90 rounded-xl flex items-center gap-2.5 border border-black/5"
                            >
                              <span className="w-5 h-5 rounded-full bg-[#191919] text-[#FEE500] text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <img
                                src={g.imageUrl}
                                alt={g.title}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-[#191919] truncate">{g.title}</div>
                                <div className="text-[10px] text-[#555] flex items-center gap-1 flex-wrap">
                                  {includePlayers && <span>👥 {g.minPlayers}~{g.maxPlayers}인</span>}
                                  {includePlaytime && g.playTime && <span>• ⏱ {g.playTime}분</span>}
                                  {includeWeight && g.weight && <span>• ⭐ {g.weight.toFixed(1)}</span>}
                                  {includeGenre && g.genre.length > 0 && <span>• 🏷 {g.genre[0]}</span>}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-[#666]">
                            선택된 게임이 없습니다.
                          </div>
                        )}
                      </div>

                      {/* Bubble Footer */}
                      <div className="pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] text-[#555]">
                        <span>🎲 보드게임 룸 아카이브</span>
                        <span className="font-bold">보드게임 로그</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plain Text View Box */}
                <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1E272E]">
                    <span>텍스트 전문 미리보기</span>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-[#4834D4] hover:underline flex items-center gap-1 font-bold text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>복사</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-white rounded-xl border border-[#E9ECEF] text-[11px] font-mono text-[#2D3436] whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {kakaoFormattedText}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-[#E9ECEF] bg-white flex items-center justify-between gap-2.5 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportImageCard}
                disabled={isExportingImage || gamesToShare.length === 0}
                className="px-3 py-2.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#1E272E] text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="이미지 카드로 저장"
              >
                <ImageIcon className="w-4 h-4 text-[#636E72]" />
                <span className="hidden sm:inline">이미지 카드로 저장</span>
                <span className="sm:hidden">이미지</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                disabled={gamesToShare.length === 0}
                className="px-3.5 py-2.5 bg-white hover:bg-[#F8F9FA] text-[#1E272E] border border-[#E9ECEF] text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="카카오톡 문구 복사"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-[#27AE60]" />
                    <span className="text-[#27AE60]">복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#636E72]" />
                    <span>문구 복사</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2.5 text-xs text-[#636E72] hover:text-[#1E272E] font-bold"
              >
                닫기
              </button>

              <button
                id="kakao-share-execute-btn"
                type="button"
                onClick={handleNativeOrKakaoShare}
                disabled={gamesToShare.length === 0}
                className="px-5 py-2.5 bg-[#FEE500] hover:bg-[#F5DC00] active:bg-[#E8CE00] text-[#191919] text-xs font-black rounded-2xl shadow-[0_4px_14px_rgba(254,229,0,0.45)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4 fill-[#191919]" />
                <span>카카오톡으로 공유하기</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
