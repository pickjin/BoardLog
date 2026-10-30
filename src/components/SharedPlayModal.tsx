import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Check } from 'lucide-react';
import { SharedPlay, resultFor } from '../utils/sharedPlay';
import { formatDuration } from '../utils/formatters';

interface SharedPlayModalProps {
  shared: SharedPlay | null;
  onClose: () => void;
  onAdd: (myIndex: number) => Promise<void>;
}

export const SharedPlayModal: React.FC<SharedPlayModalProps> = ({ shared, onClose, onAdd }) => {
  const [myIndex, setMyIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMyIndex(null);
  }, [shared]);

  const handleAdd = async () => {
    if (myIndex === null) return;
    setIsSaving(true);
    try {
      await onAdd(myIndex);
    } finally {
      setIsSaving(false);
    }
  };

  const myResult = shared && myIndex !== null ? resultFor(shared, myIndex) : null;

  return (
    <AnimatePresence>
      {shared && (
        <motion.div
          id="shared-play-modal"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-5 shadow-xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-[#4834D4]">
                  {shared.sharedBy ? `${shared.sharedBy}님이 공유한 기록` : '공유받은 기록'}
                </p>
                <h3 className="mt-0.5 text-lg font-black italic text-[#1E272E]">{shared.gameTitle}</h3>
                <p className="mt-0.5 text-xs text-[#636E72]">
                  {[
                    shared.date,
                    shared.location,
                    shared.durationMinutes > 0 ? formatDuration(shared.durationMinutes) : ''
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="rounded-full p-1 text-[#A8ABAF] hover:bg-[#F1F3F5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-xs font-bold text-[#1E272E]">이 게임에서 나는 누구였나요?</p>
            <div className="space-y-1.5" role="radiogroup">
              {shared.participants.map((p, i) => {
                const selected = myIndex === i;
                return (
                  <button
                    key={`${p.name}-${i}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMyIndex(i)}
                    className={`flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-xs transition-colors ${
                      selected ? 'border-[#4834D4] bg-[#4834D4]/5' : 'border-[#E9ECEF] bg-[#F8F9FA] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? 'border-[#4834D4] bg-[#4834D4] text-white' : 'border-[#DCDDE1] bg-white'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 truncate font-bold text-[#1E272E]">{p.name}</span>
                    {p.score !== null && <span className="text-[#636E72]">{p.score}점</span>}
                    {p.isWinner && <Trophy className="h-3.5 w-3.5 text-[#F5A623]" aria-label="승자" />}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 min-h-4 text-xs text-[#636E72]">
              {myResult ? (
                <>
                  내 결과: <strong className="text-[#1E272E]">{myResult}</strong>
                </>
              ) : (
                '내 이름을 고르면 내 기준으로 승패를 정리해 드려요.'
              )}
            </p>

            <button
              id="shared-play-add-btn"
              type="button"
              onClick={handleAdd}
              disabled={myIndex === null || isSaving}
              className="mt-4 w-full rounded-full bg-[#4834D4] py-3 text-xs font-bold text-white shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-colors hover:bg-[#3c2ab9] disabled:opacity-40"
            >
              {isSaving ? '저장 중...' : '내 기록에 추가'}
            </button>
            <p className="mt-2 text-center text-[10px] text-[#A8ABAF]">사진, 평점, 후기는 공유되지 않아요.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
