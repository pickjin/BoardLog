import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  FileText,
  BookOpen,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Sparkles,
  MapPin,
  Users,
  Clock,
  Dices,
  Layers,
  Check,
  Copy,
  Info,
  Download,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { loadHtml2Canvas, loadJsPdf, ExportModuleLoadError } from '../utils/lazyModules';
import { useIsMounted } from '../utils/useIsMounted';
import { UserGame, GameOwnershipStatus } from '../types';
import { formatWon, formatDate } from '../utils/formatters';
import { getGameIndexKey, KOREAN_INDEX_KEYS } from '../utils/koreanIndex';
import { useToast } from '../context/ToastContext';

interface GameCatalogModalProps {
  isOpen: boolean;
  games: UserGame[];
  ownerName: string;
  onClose: () => void;
}

type CatalogViewMode = 'table' | 'cards' | 'index';
type SortOption = 'title' | 'location' | 'playCount' | 'weight' | 'recent';

export const GameCatalogModal: React.FC<GameCatalogModalProps> = ({
  isOpen,
  games,
  ownerName,
  onClose
}) => {
  const { showToast } = useToast();

  // Settings
  const [viewMode, setViewMode] = useState<CatalogViewMode>('table');
  const [sortOption, setSortOption] = useState<SortOption>('title');
  const [statusFilter, setStatusFilter] = useState<GameOwnershipStatus | '전체'>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isMounted = useIsMounted();

  // Toggles for print elements
  const [showImages, setShowImages] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showStatsCover, setShowStatsCover] = useState(true);

  // Filter and sort games
  const processedGames = useMemo(() => {
    let list = games.filter((g) => {
      const matchesStatus =
        statusFilter === '전체' || g.ownershipStatus === statusFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.genre.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesQuery;
    });

    list = [...list].sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title, 'ko');
        case 'location':
          return (a.storageLocation || 'ZZZ').localeCompare(b.storageLocation || 'ZZZ', 'ko');
        case 'playCount':
          return (b.playCount || 0) - (a.playCount || 0);
        case 'weight':
          return (b.weight || 0) - (a.weight || 0);
        case 'recent':
        default:
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });

    return list;
  }, [games, statusFilter, searchQuery, sortOption]);

  // Group by Korean / Alphabet index for 'index' view
  const groupedByIndex = useMemo(() => {
    const map = new Map<string, UserGame[]>();
    processedGames.forEach((game) => {
      const key = getGameIndexKey(game.title);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(game);
    });
    return map;
  }, [processedGames]);

  // Statistics calculation for cover summary
  const stats = useMemo(() => {
    const total = processedGames.length;
    const totalPlays = processedGames.reduce((acc, g) => acc + (g.playCount || 0), 0);
    const locations = Array.from(
      new Set(processedGames.map((g) => g.storageLocation).filter(Boolean))
    );
    const genreMap: Record<string, number> = {};
    processedGames.forEach((g) => {
      g.genre.forEach((gen) => {
        genreMap[gen] = (genreMap[gen] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { total, totalPlays, locationCount: locations.length, topGenres };
  }, [processedGames]);

  // Real PDF file generation and direct download
  const handleSavePdf = async () => {
    if (isGeneratingPdf) return;
    const targetElement = document.getElementById('printable-catalog-document');
    if (!targetElement) {
      window.print();
      return;
    }

    setIsGeneratingPdf(true);
    showToast('PDF 파일을 생성하고 있습니다. 잠시만 기다려주세요...', 'info');

    try {
      const [html2canvas, jsPDF] = await Promise.all([loadHtml2Canvas(), loadJsPdf()]);

      // High quality canvas capture
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if document is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `${ownerName || '보드게임'}_서가_수록_목록_${dateStr}.pdf`;
      pdf.save(fileName);

      if (!isMounted()) return;
      showToast(`"${fileName}" PDF 저장이 완료되었습니다!`, 'success');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      if (!isMounted()) return;
      if (error instanceof ExportModuleLoadError) {
        showToast('PDF 생성 모듈을 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.', 'error');
        return;
      }
      showToast('직접 PDF 생성이 완료되지 않아 인쇄 창으로 전환합니다. "PDF로 저장"을 선택해주세요.', 'info');
      window.print();
    } finally {
      if (isMounted()) setIsGeneratingPdf(false);
    }
  };

  // Browser print fallback handler
  const handlePrint = () => {
    showToast('인쇄 대화상자에서 "PDF로 저장" 또는 연결된 프린터를 선택하세요.', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Copy as Text / TSV table for spreadsheet
  const handleCopyText = () => {
    const headers = ['색인번호', '게임명', '영문명', '인원', '시간(분)', '난이도', '장르', '보관위치', '상태', '플레이횟수'];
    const rows = processedGames.map((g, idx) => [
      `#${String(idx + 1).padStart(3, '0')}`,
      g.title,
      g.titleEn || '-',
      `${g.minPlayers}~${g.maxPlayers}명`,
      `${g.playTime}분`,
      `${g.weight.toFixed(1)}/5.0`,
      g.genre.join(', '),
      g.storageLocation || '미지정',
      g.ownershipStatus,
      `${g.playCount || 0}회`
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent);
    showToast('엑셀/스프레드시트에 붙여넣을 수 있는 표 데이터가 복사되었습니다.', 'success');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="game-catalog-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="printable-catalog-root w-full max-w-4xl bg-white rounded-[32px] shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[94vh] flex flex-col"
        >
          {/* Top Interactive Toolbar (Hidden on Print) */}
          <div className="no-print p-4 sm:p-5 border-b border-[#E9ECEF] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#1E272E]">보드게임 서가 도록 & PDF 저장</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4834D4]/10 text-[#4834D4] font-bold">
                    {processedGames.length}종 수록
                  </span>
                </div>
                <p className="text-[11px] text-[#636E72]">
                  서가 색인 대장 및 도록 형태로 PDF 파일을 즉시 다운로드하거나 인쇄할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#1E272E] text-xs font-bold rounded-full transition-colors"
                title="엑셀용 데이터 복사"
              >
                <Copy className="w-3.5 h-3.5 text-[#636E72]" />
                <span>표 복사</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#1E272E] text-xs font-bold rounded-full transition-colors"
                title="인쇄 미리보기 및 브라우저 인쇄"
              >
                <Printer className="w-3.5 h-3.5 text-[#636E72]" />
                <span>인쇄</span>
              </button>

              {/* Target Focused Button: catalog-print-btn */}
              <button
                id="catalog-print-btn"
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleSavePdf}
                className="inline-flex items-center gap-2 px-4.5 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-colors active:scale-95 disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isGeneratingPdf ? 'PDF 생성 중...' : 'PDF로 저장'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Configuration Controls Bar (Hidden on Print) */}
          <div className="no-print p-3 sm:p-4 bg-[#F8F9FA] border-b border-[#E9ECEF] space-y-3 shrink-0 text-xs">
            {/* Row 1: View Format & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* View Format Selector */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E9ECEF]">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#4834D4] text-white shadow-xs'
                      : 'text-[#636E72] hover:text-[#1E272E]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>서가 색인표형</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-[#4834D4] text-white shadow-xs'
                      : 'text-[#636E72] hover:text-[#1E272E]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>수록 카드형</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('index')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    viewMode === 'index'
                      ? 'bg-[#4834D4] text-white shadow-xs'
                      : 'text-[#636E72] hover:text-[#1E272E]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>가나다 목차형</span>
                </button>
              </div>

              {/* Search & Status Filter */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
                  <input
                    type="text"
                    placeholder="도록 내 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E9ECEF] rounded-full text-xs text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-[#E9ECEF] rounded-full text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                >
                  <option value="전체">전체 상태</option>
                  <option value="보유중">보유중만</option>
                  <option value="빌려줌">빌려줌</option>
                  <option value="빌림">빌림</option>
                  <option value="판매예정">판매예정</option>
                  <option value="판매완료">판매완료</option>
                </select>
              </div>
            </div>

            {/* Row 2: Sort and Visibility Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E9ECEF]/70">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#A8ABAF]">정렬:</span>
                {(
                  [
                    { id: 'title', label: '가나다순' },
                    { id: 'location', label: '보관위치순' },
                    { id: 'playCount', label: '플레이순' },
                    { id: 'weight', label: '난이도순' },
                    { id: 'recent', label: '등록순' }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortOption(opt.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                      sortOption === opt.id
                        ? 'bg-[#1E272E] text-white'
                        : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3 text-[11px] text-[#636E72]">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showImages}
                    onChange={(e) => setShowImages(e.target.checked)}
                    className="rounded text-[#4834D4]"
                  />
                  <span>사진 표시</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLocations}
                    onChange={(e) => setShowLocations(e.target.checked)}
                    className="rounded text-[#4834D4]"
                  />
                  <span>보관위치 강조</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showStatsCover}
                    onChange={(e) => setShowStatsCover(e.target.checked)}
                    className="rounded text-[#4834D4]"
                  />
                  <span>표지/통계 포함</span>
                </label>
              </div>
            </div>
          </div>

          {/* Printable Document Preview Area */}
          <div
            id="printable-catalog-document"
            className="printable-catalog-content p-5 sm:p-8 overflow-y-auto flex-1 bg-white space-y-6"
          >
            {/* Document Cover / Header Section */}
            {showStatsCover && (
              <div className="print-avoid-break p-6 sm:p-7 rounded-3xl bg-[#F8F9FA] border-2 border-[#1E272E]/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#1E272E]/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#4834D4] font-black text-xs uppercase tracking-widest">
                      <BookOpen className="w-4 h-4" />
                      <span>BOARD GAME COLLECTION & SHELF ARCHIVE</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1E272E] tracking-tight mt-1">
                      {ownerName}의 보드게임 서가 도록
                    </h1>
                    <p className="text-xs text-[#636E72] mt-0.5 font-medium">
                      소장 보드게임 색인 대장 • 인쇄 및 서가 관리용 카탈로그
                    </p>
                  </div>

                  <div className="text-right text-xs text-[#636E72] shrink-0">
                    <p className="font-bold text-[#1E272E]">
                      발행일: {formatDate()}
                    </p>
                    <p className="text-[11px] text-[#A8ABAF]">
                      정렬: {sortOption === 'title' ? '가나다순' : sortOption === 'location' ? '보관위치순' : sortOption === 'playCount' ? '플레이순' : sortOption === 'weight' ? '난이도순' : '등록순'}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-2xl border border-[#E9ECEF] text-center">
                    <span className="text-[10px] text-[#A8ABAF] font-bold block">총 수록 게임</span>
                    <span className="text-xl font-black text-[#1E272E]">{stats.total}</span>
                    <span className="text-[10px] text-[#636E72] font-semibold"> 종</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#E9ECEF] text-center">
                    <span className="text-[10px] text-[#A8ABAF] font-bold block">총 누적 플레이</span>
                    <span className="text-xl font-black text-[#4834D4]">{stats.totalPlays}</span>
                    <span className="text-[10px] text-[#636E72] font-semibold"> 회</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#E9ECEF] text-center">
                    <span className="text-[10px] text-[#A8ABAF] font-bold block">구분된 서가/보관처</span>
                    <span className="text-xl font-black text-[#1E272E]">{stats.locationCount}</span>
                    <span className="text-[10px] text-[#636E72] font-semibold"> 곳</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#E9ECEF] text-center">
                    <span className="text-[10px] text-[#A8ABAF] font-bold block">주요 소장 장르</span>
                    <div className="text-[11px] font-black text-[#1E272E] truncate mt-1">
                      {stats.topGenres.map(([g]) => g).join(', ') || '다양한 장르'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty list alert */}
            {processedGames.length === 0 ? (
              <div className="p-12 text-center text-[#636E72] space-y-2 border-2 border-dashed border-[#E9ECEF] rounded-3xl">
                <Dices className="w-8 h-8 mx-auto text-[#A8ABAF]" />
                <p className="font-bold text-sm text-[#1E272E]">조건에 맞는 보드게임이 없습니다.</p>
                <p className="text-xs">검색어나 상태 필터를 변경해 보세요.</p>
              </div>
            ) : null}

            {/* 1. LIBRARY INDEX TABLE VIEW */}
            {viewMode === 'table' && processedGames.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-2xl border border-[#E9ECEF]">
                  <table className="print-table w-full text-left text-xs text-[#1E272E] border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-[11px] font-black text-[#636E72]">
                        <th className="p-2.5 text-center w-12">No.</th>
                        {showImages && <th className="p-2.5 w-12 text-center">표지</th>}
                        <th className="p-2.5 min-w-[140px]">게임명 / 원제</th>
                        <th className="p-2.5 text-center w-20">인원</th>
                        <th className="p-2.5 text-center w-16">시간</th>
                        <th className="p-2.5 text-center w-16">난이도</th>
                        <th className="p-2.5 min-w-[100px]">장르</th>
                        {showLocations && <th className="p-2.5 min-w-[110px]">보관 위치</th>}
                        <th className="p-2.5 text-center w-16">플레이</th>
                        <th className="p-2.5 text-center w-16">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF]">
                      {processedGames.map((game, idx) => (
                        <tr
                          key={game.id}
                          className="print-avoid-break hover:bg-[#F8F9FA] transition-colors"
                        >
                          <td className="p-2.5 text-center font-bold text-[#A8ABAF] text-[11px]">
                            {String(idx + 1).padStart(2, '0')}
                          </td>

                          {showImages && (
                            <td className="p-2 text-center">
                              <img
                                src={
                                  game.imageUrl ||
                                  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=300&q=80'
                                }
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover bg-stone-100 mx-auto border border-[#E9ECEF]"
                              />
                            </td>
                          )}

                          <td className="p-2.5">
                            <div className="font-black text-[#1E272E] text-xs">
                              {game.title}
                            </div>
                            {game.titleEn && (
                              <div className="text-[10px] text-[#A8ABAF] font-medium">
                                {game.titleEn}
                              </div>
                            )}
                          </td>

                          <td className="p-2.5 text-center font-semibold text-[11px]">
                            {game.minPlayers === game.maxPlayers
                              ? `${game.minPlayers}인`
                              : `${game.minPlayers}~${game.maxPlayers}인`}
                          </td>

                          <td className="p-2.5 text-center font-semibold text-[11px]">
                            {game.playTime}분
                          </td>

                          <td className="p-2.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-[#F1F3F5] font-black text-[10px] text-[#1E272E]">
                              ★ {game.weight.toFixed(1)}
                            </span>
                          </td>

                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1">
                              {game.genre.map((gen, gIdx) => (
                                <span
                                  key={gIdx}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#F1F3F5] text-[#636E72] font-semibold"
                                >
                                  {gen}
                                </span>
                              ))}
                            </div>
                          </td>

                          {showLocations && (
                            <td className="p-2.5">
                              {game.storageLocation ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4834D4] bg-[#4834D4]/10 px-2 py-0.5 rounded-md">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>{game.storageLocation}</span>
                                </span>
                              ) : (
                                <span className="text-[#A8ABAF] text-[11px]">-</span>
                              )}
                            </td>
                          )}

                          <td className="p-2.5 text-center font-bold text-[#1E272E] text-[11px]">
                            {game.playCount || 0}회
                          </td>

                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                game.ownershipStatus === '보유중'
                                  ? 'bg-[#27AE60]/10 text-[#27AE60]'
                                  : game.ownershipStatus === '빌려줌'
                                  ? 'bg-[#E67E22]/10 text-[#E67E22]'
                                  : 'bg-[#F1F3F5] text-[#636E72]'
                              }`}
                            >
                              {game.ownershipStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. ILLUSTRATED BOOK CATALOGUE CARDS VIEW */}
            {viewMode === 'cards' && processedGames.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {processedGames.map((game, idx) => (
                  <div
                    key={game.id}
                    className="print-avoid-break p-4 bg-white rounded-2xl border-2 border-[#E9ECEF] flex gap-3.5 items-start relative"
                  >
                    {/* Index call number badge */}
                    <div className="absolute top-3 right-3 text-[10px] font-black text-[#A8ABAF] bg-[#F1F3F5] px-2 py-0.5 rounded-full">
                      #{String(idx + 1).padStart(3, '0')}
                    </div>

                    {showImages && (
                      <img
                        src={
                          game.imageUrl ||
                          'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=300&q=80'
                        }
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-stone-100 shrink-0 border border-[#E9ECEF] shadow-xs"
                      />
                    )}

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            game.ownershipStatus === '보유중'
                              ? 'bg-[#27AE60]/10 text-[#27AE60]'
                              : 'bg-[#F1F3F5] text-[#636E72]'
                          }`}
                        >
                          {game.ownershipStatus}
                        </span>
                        {game.storageLocation && showLocations && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#4834D4] bg-[#4834D4]/10 px-2 py-0.5 rounded-full">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{game.storageLocation}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-[#1E272E] leading-snug">
                        {game.title}
                      </h3>
                      {game.titleEn && (
                        <p className="text-[10px] text-[#A8ABAF] font-medium truncate mb-2">
                          {game.titleEn}
                        </p>
                      )}

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-1 py-1.5 my-1.5 border-y border-[#E9ECEF] text-[10px] text-center">
                        <div>
                          <span className="text-[#A8ABAF] block text-[9px]">인원</span>
                          <span className="font-bold text-[#1E272E]">
                            {game.minPlayers === game.maxPlayers
                              ? `${game.minPlayers}인`
                              : `${game.minPlayers}~${game.maxPlayers}인`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A8ABAF] block text-[9px]">시간</span>
                          <span className="font-bold text-[#1E272E]">{game.playTime}분</span>
                        </div>
                        <div>
                          <span className="text-[#A8ABAF] block text-[9px]">난이도</span>
                          <span className="font-bold text-[#4834D4]">★ {game.weight.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {game.genre.map((gen, gIdx) => (
                          <span
                            key={gIdx}
                            className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#F1F3F5] text-[#636E72] font-semibold"
                          >
                            {gen}
                          </span>
                        ))}
                      </div>

                      {/* Notes / Rules summary */}
                      {showNotes && game.notes && (
                        <p className="text-[10px] text-[#636E72] mt-2 line-clamp-2 bg-[#F8F9FA] p-2 rounded-xl border border-[#E9ECEF]">
                          {game.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. KOREAN / ALPHABET SYLLABARY INDEX VIEW (가나다 목차형) */}
            {viewMode === 'index' && processedGames.length > 0 && (
              <div className="space-y-6">
                {KOREAN_INDEX_KEYS.map((key) => {
                  const items = groupedByIndex.get(key);
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={key} className="print-avoid-break space-y-2">
                      <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#1E272E]">
                        <span className="w-8 h-8 rounded-xl bg-[#1E272E] text-white flex items-center justify-center font-black text-sm">
                          {key}
                        </span>
                        <h4 className="text-sm font-black text-[#1E272E]">
                          색인 '{key}' 섹션 ({items.length}종)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((game) => (
                          <div
                            key={game.id}
                            className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[#1E272E] truncate">
                                {game.title}
                              </div>
                              <div className="text-[10px] text-[#636E72] flex items-center gap-2 mt-0.5">
                                <span>{game.minPlayers}~{game.maxPlayers}인</span>
                                <span>•</span>
                                <span>{game.playTime}분</span>
                                {game.storageLocation && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#4834D4] font-bold">{game.storageLocation}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] font-black text-[#4834D4] px-2 py-0.5 rounded-md bg-white border border-[#E9ECEF] shrink-0">
                              ★ {game.weight.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Document Bottom Footer */}
            <div className="print-avoid-break pt-6 border-t border-[#E9ECEF] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A8ABAF]">
              <div>
                보드로그 (BoardLog) • {ownerName}의 보드게임 서가 도록 색인부
              </div>
              <div className="mt-1 sm:mt-0 font-medium">
                출력 일시: {formatDate()} • 총 {processedGames.length}종 수록
              </div>
            </div>
          </div>

          {/* Interactive Modal Bottom Bar (Hidden on Print) */}
          <div className="no-print p-4 border-t border-[#E9ECEF] bg-[#F8F9FA] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#636E72]">
              <Info className="w-4 h-4 text-[#4834D4] shrink-0" />
              <span>
                <strong>'PDF로 저장'</strong>을 누르면 즉시 도록이 PDF 파일로 저장되며, <strong>'인쇄'</strong> 버튼으로 실물 출력이 가능합니다.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#636E72] hover:bg-[#E9ECEF] rounded-full transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white hover:bg-[#F1F3F5] text-[#1E272E] border border-[#E9ECEF] text-xs font-bold rounded-full transition-colors inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#636E72]" />
                <span>인쇄 대화상자</span>
              </button>
              <button
                id="catalog-bottom-save-pdf-btn"
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleSavePdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-colors disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isGeneratingPdf ? 'PDF 생성 중...' : 'PDF로 저장'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
