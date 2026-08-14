import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Trophy,
  Clock,
  Calendar,
  MapPin,
  Users,
  Star,
  Edit,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PlayRecord } from '../types';
import { formatDuration } from '../utils/formatters';

interface PlayDetailModalProps {
  play: PlayRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (play: PlayRecord) => void;
  onDelete: (play: PlayRecord) => void;
}

export const PlayDetailModal: React.FC<PlayDetailModalProps> = ({
  play,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!isOpen || !play) return null;

  return (
    <AnimatePresence>
      <div id="play-detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4.5 sm:p-5 border-b border-[#E9ECEF] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <img
                src={play.gameImageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80'}
                alt={play.gameTitle}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover bg-stone-200 border border-[#E9ECEF] shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#1E272E]">{play.gameTitle}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      play.myResult === '승리'
                        ? 'bg-[#4834D4]/10 text-[#4834D4] border-[#4834D4]/20'
                        : 'bg-[#F1F3F5] text-[#636E72] border-[#E9ECEF]'
                    }`}
                  >
                    {play.myResult === '승리' ? '👑 내 승리' : play.myResult}
                  </span>
                </div>
                <p className="text-xs text-[#636E72] flex items-center gap-1 mt-0.5 font-medium">
                  <Calendar className="w-3 h-3 text-[#A8ABAF]" />
                  <span>{play.date}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3 text-[#A8ABAF]" />
                  <span>{formatDuration(play.durationMinutes)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(play)}
                className="p-2 text-[#A8ABAF] hover:text-[#4834D4] rounded-full hover:bg-[#F1F3F5] transition-colors"
                title="기록 수정"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(play)}
                className="p-2 text-[#A8ABAF] hover:text-[#EB4D4B] rounded-full hover:bg-[#F1F3F5] transition-colors"
                title="기록 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Scroll Area */}
          <div className="p-4.5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Meta bar */}
            <div className="grid grid-cols-3 gap-2 p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-center text-xs">
              <div>
                <span className="text-[10px] text-[#A8ABAF] block mb-0.5 font-bold">장소</span>
                <span className="font-bold text-[#1E272E] flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4834D4]" />
                  {play.location || '미입력'}
                </span>
              </div>
              <div className="border-x border-[#E9ECEF]">
                <span className="text-[10px] text-[#A8ABAF] block mb-0.5 font-bold">플레이 시간대</span>
                <span className="font-bold text-[#1E272E]">
                  {play.startTime} ~ {play.endTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#A8ABAF] block mb-0.5 font-bold">만족도</span>
                <div className="flex items-center justify-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < play.rating ? 'text-[#F5CD79] fill-[#F5CD79]' : 'text-[#E9ECEF]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Participants Leaderboard */}
            <div>
              <h3 className="text-xs font-bold text-[#1E272E] mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#A8ABAF]" />
                <span>참여자 순위 & 점수표</span>
              </h3>

              <div className="bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] overflow-hidden divide-y divide-[#E9ECEF]">
                {play.participants.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className={`p-3.5 flex items-center justify-between text-xs ${
                      p.isWinner ? 'bg-[#4834D4]/5 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          p.rank === 1 || p.isWinner
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : p.rank === 2
                            ? 'bg-[#A8ABAF] text-white'
                            : 'bg-[#E9ECEF] text-[#636E72]'
                        }`}
                      >
                        {p.rank || idx + 1}
                      </span>
                      <span className="text-[#1E272E] flex items-center gap-1">
                        {p.name}
                        {p.name === '나' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#4834D4]/10 text-[#4834D4] rounded-full font-bold">
                            본인
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {p.score !== null && (
                        <span className="font-black text-[#1E272E] text-sm">{p.score}점</span>
                      )}
                      {p.isWinner && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4834D4] bg-[#4834D4]/10 px-2.5 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3" />
                          <span>승리</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos Gallery */}
            {play.photos && play.photos.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#1E272E] mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#A8ABAF]" />
                  <span>현장 사진 ({play.photos.length}장)</span>
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  {play.photos.map((photo, pIdx) => (
                    <div
                      key={photo.id || pIdx}
                      onClick={() => setSelectedPhotoIndex(pIdx)}
                      className="group relative rounded-2xl overflow-hidden border border-[#E9ECEF] bg-[#F1F3F5] aspect-square cursor-pointer shadow-xs"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || '플레이 사진'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs p-1.5 text-[9px] text-white truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Note */}
            {play.review && (
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-xs text-[#1E272E] space-y-1">
                <span className="text-[10px] font-bold text-[#A8ABAF] block">플레이 소감 & 전략 메모</span>
                <p className="leading-relaxed whitespace-pre-line text-[#636E72]">{play.review}</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-[#E9ECEF] bg-white flex items-center justify-between">
            <span className="text-[11px] text-[#A8ABAF] font-medium">
              작성일: {play.createdAt || play.date}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-colors"
            >
              확인
            </button>
          </div>
        </motion.div>

        {/* Photo Lightbox Popup */}
        {selectedPhotoIndex !== null && play.photos[selectedPhotoIndex] && (
          <div
            id="photo-lightbox-modal"
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={play.photos[selectedPhotoIndex].url}
                alt="확대 사진"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
              {play.photos[selectedPhotoIndex].caption && (
                <p className="text-xs text-stone-200 mt-2 text-center bg-black/50 px-3 py-1 rounded-full">
                  {play.photos[selectedPhotoIndex].caption}
                </p>
              )}
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

