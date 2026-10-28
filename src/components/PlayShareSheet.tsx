import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, X } from 'lucide-react';
import { PlayRecord } from '../types';
import { useToast } from '../context/ToastContext';
import { formatPlayShareText } from '../utils/playShareText';

interface PlayShareSheetProps {
  play: PlayRecord | null;
  onClose: () => void;
}

export const PlayShareSheet: React.FC<PlayShareSheetProps> = ({ play, onClose }) => {
  const { showToast } = useToast();
  const text = useMemo(() => (play ? formatPlayShareText(play, window.location.origin) : ''), [play]);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('결과가 복사됐어요. 카톡 채팅방에 붙여넣으세요.', 'success');
      onClose();
    } catch {
      showToast('복사에 실패했습니다. 문구를 길게 눌러 직접 복사해 주세요.', 'error');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ text });
      onClose();
    } catch (err) {
      // The user backing out of the share sheet is not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      await copyText();
    }
  };

  return (
    <AnimatePresence>
      {play && (
        <motion.div
          id="play-share-sheet"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black italic text-[#1E272E]">같이 한 사람들에게 결과 공유</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="rounded-full p-1 text-[#A8ABAF] hover:bg-[#F1F3F5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <pre className="mb-4 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[#E9ECEF] bg-[#F8F9FA] p-3.5 font-sans text-xs leading-relaxed text-[#2D3436]">
              {text}
            </pre>

            <div className="flex gap-2">
              {canNativeShare && (
                <button
                  id="play-share-native-btn"
                  type="button"
                  onClick={share}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FEE500] py-2.5 text-xs font-black text-[#191919] transition-transform active:scale-95"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  카톡 등으로 공유
                </button>
              )}
              <button
                id="play-share-copy-btn"
                type="button"
                onClick={copyText}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold transition-transform active:scale-95 ${
                  canNativeShare ? 'bg-[#F1F3F5] text-[#2D3436]' : 'bg-[#FEE500] text-[#191919]'
                }`}
              >
                <Copy className="h-3.5 w-3.5" />
                문구 복사
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full py-2 text-[11px] font-bold text-[#A8ABAF] hover:text-[#636E72]"
            >
              다음에 할게요
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
