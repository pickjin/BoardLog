import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Clock,
  Flame,
  Tag,
  MapPin,
  CheckSquare,
  Edit,
  Trash2,
  PlusCircle,
  HelpCircle,
  Calendar,
  MessageCircle,
  Share2
} from 'lucide-react';
import { UserGame } from '../types';
import { formatWon } from '../utils/formatters';
import { getOwnershipBadgeColor } from './GameCard';
import { useToast } from '../context/ToastContext';

interface GameDetailModalProps {
  game: UserGame | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (game: UserGame) => void;
  onDelete: (game: UserGame) => void;
  onStartPlay: (game: UserGame) => void;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStartPlay
}) => {
  const { showToast } = useToast();
  if (!isOpen || !game) return null;

  const handleShareSingleGame = async () => {
    const text = `🎲 [보드게임 추천] ${game.title}\n👥 인원: ${game.minPlayers}~${game.maxPlayers}인${game.bestPlayers ? ` (추천: ${game.bestPlayers})` : ''}\n⏱ 시간: ${game.playTime}분\n⭐ 난이도: ${game.weight?.toFixed(1) || '2.0'}/5.0\n🏷 장르: ${game.genre.join(', ')}\n${game.notes ? `💬 메모: ${game.notes}\n` : ''}\n👉 같이 플레이해요!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: game.title,
          text: text,
          url: window.location.href
        });
        showToast('카카오톡 등으로 공유를 시작했습니다.', 'success');
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(text);
    showToast('게임 정보가 복사되었습니다! 카톡 채팅방에 붙여넣기(Ctrl+V)하세요.', 'success');
  };

  return (
    <AnimatePresence>
      <div id="game-detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Hero Image & Floating Controls */}
          <div className="relative w-full h-56 sm:h-64 bg-[#F8F9FA] shrink-0">
            <img
              src={game.imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80'}
              alt={game.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Top Close & Actions */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShareSingleGame}
                className="w-8 h-8 rounded-full bg-[#FEE500] text-[#191919] hover:bg-[#F5DC00] flex items-center justify-center backdrop-blur-xs transition-colors shadow-xs"
                title="카카오톡으로 공유하기"
              >
                <MessageCircle className="w-4 h-4 fill-[#191919]" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(game)}
                className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-[#4834D4] flex items-center justify-center backdrop-blur-xs transition-colors"
                title="수정하기"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(game)}
                className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-[#EB4D4B] flex items-center justify-center backdrop-blur-xs transition-colors"
                title="삭제하기"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center backdrop-blur-xs transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Title on Image */}
            <div className="absolute bottom-3.5 left-4.5 right-4.5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getOwnershipBadgeColor(
                    game.ownershipStatus
                  )}`}
                >
                  {game.ownershipStatus}
                </span>
                {game.condition && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
                    상태: {game.condition}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-white leading-tight drop-shadow-sm">
                {game.title}
              </h2>
              {game.titleEn && (
                <p className="text-xs text-white/80 drop-shadow-xs">{game.titleEn}</p>
              )}
            </div>
          </div>

          {/* Details Scroll Area */}
          <div className="p-4.5 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* Quick Meta Grid */}
            <div className="grid grid-cols-3 gap-2 p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-[#A8ABAF] mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">추천 인원</span>
                </div>
                <p className="text-xs font-black text-[#1E272E]">
                  {game.minPlayers === game.maxPlayers ? `${game.minPlayers}인` : `${game.minPlayers}~${game.maxPlayers}인`}
                </p>
                {game.bestPlayers && (
                  <span className="text-[9px] text-[#4834D4] font-bold">(추천 {game.bestPlayers})</span>
                )}
              </div>

              <div className="border-x border-[#E9ECEF]">
                <div className="flex items-center justify-center gap-1 text-[#A8ABAF] mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">플레이 타임</span>
                </div>
                <p className="text-xs font-black text-[#1E272E]">{game.playTime}분</p>
                <span className="text-[9px] text-[#A8ABAF]">{game.recommendedAge}세 이상</span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 text-[#A8ABAF] mb-0.5">
                  <Flame className="w-3.5 h-3.5 text-[#4834D4]" />
                  <span className="text-[10px] font-bold">난이도</span>
                </div>
                <p className="text-xs font-black text-[#1E272E]">{game.weight.toFixed(1)} / 5.0</p>
                <span className="text-[9px] text-[#A8ABAF]">
                  {game.weight <= 1.5 ? '입문' : game.weight <= 2.8 ? '보통' : game.weight <= 3.8 ? '중상' : '헤비'}
                </span>
              </div>
            </div>

            {/* Play Count Banner */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E9ECEF] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4834D4] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(72,52,212,0.3)]">
                  <CheckSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1E272E]">총 {game.playCount || 0}회 플레이</p>
                  <p className="text-[10px] text-[#636E72]">누적된 기록을 확인하세요</p>
                </div>
              </div>

              <button
                id="game-detail-record-cta"
                type="button"
                onClick={() => onStartPlay(game)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>기록 추가</span>
              </button>
            </div>

            {/* Genres */}
            {game.genre && game.genre.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-[#A8ABAF] mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>장르 & 태그</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {game.genre.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full bg-[#F1F3F5] text-[#2D3436] text-xs font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Storage, Purchase Date & Publisher */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF]">
                <span className="text-[10px] text-[#A8ABAF] block mb-0.5">구매일시</span>
                <span className="font-bold text-[#1E272E] flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3 text-[#4834D4] shrink-0" />
                  <span className="truncate">{game.purchaseDate || '미지정'}</span>
                </span>
              </div>
              <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF]">
                <span className="text-[10px] text-[#A8ABAF] block mb-0.5">보관 장소</span>
                <span className="font-bold text-[#1E272E] flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#4834D4] shrink-0" />
                  <span className="truncate">{game.storageLocation || '미지정'}</span>
                </span>
              </div>
              <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF]">
                <span className="text-[10px] text-[#A8ABAF] block mb-0.5">제작사 / 유통사</span>
                <span className="font-bold text-[#1E272E] truncate block text-[11px]">
                  {game.publisher || '미입력'}
                </span>
              </div>
            </div>

            {/* Price Information */}
            {(game.purchasePrice > 0 || game.originalPrice > 0 || game.marketPrice > 0) && (
              <div className="p-3.5 bg-white rounded-2xl border border-[#E9ECEF] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E272E]">
                  <span>가격 정보</span>
                  <span className="text-[10px] font-bold text-[#4834D4] bg-[#4834D4]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <HelpCircle className="w-2.5 h-2.5" />
                    수동 입력 ({game.priceMeta?.verifiedDate || game.purchaseDate})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
                  <div className="p-2 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF]">
                    <span className="text-[9px] text-[#A8ABAF] block">구매가</span>
                    <span className="font-black text-[#1E272E]">{formatWon(game.purchasePrice)}</span>
                  </div>
                  <div className="p-2 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF]">
                    <span className="text-[9px] text-[#A8ABAF] block">정가</span>
                    <span className="font-bold text-[#636E72]">{formatWon(game.originalPrice)}</span>
                  </div>
                  <div className="p-2 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF]">
                    <span className="text-[9px] text-[#A8ABAF] block">중고 시세</span>
                    <span className="font-bold text-[#636E72]">{formatWon(game.marketPrice)}</span>
                  </div>
                </div>

                {game.priceMeta?.source && (
                  <p className="text-[10px] text-[#A8ABAF]">출처: {game.priceMeta.source}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {game.notes && (
              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-xs text-[#636E72]">
                <span className="text-[10px] font-bold text-[#A8ABAF] block mb-1">메모</span>
                <p className="leading-relaxed whitespace-pre-line">{game.notes}</p>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 border-t border-[#E9ECEF] bg-white flex items-center gap-2">
            <button
              id="game-detail-delete-btn"
              type="button"
              onClick={() => onDelete(game)}
              className="px-3.5 py-3 bg-[#FEEBEC] hover:bg-[#FCD7D7] text-[#EB4D4B] text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1 shrink-0"
              title="게임 삭제"
            >
              <Trash2 className="w-4 h-4" />
              <span>삭제</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(game)}
              className="flex-1 py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] text-xs font-bold rounded-full transition-colors text-center"
            >
              정보 수정
            </button>
            <button
              id="game-detail-start-play-btn"
              type="button"
              onClick={() => onStartPlay(game)}
              className="flex-2 py-3 bg-[#4834D4] hover:bg-[#3c2ab9] active:bg-[#3c2ab9] text-white text-xs font-bold rounded-full shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>플레이 기록</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

