import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '삭제하기',
  cancelText = '취소',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="confirm-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-[#E9ECEF]"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isDestructive ? 'bg-[#FEEBEC] text-[#EB4D4B]' : 'bg-[#4834D4]/10 text-[#4834D4]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#1E272E]">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#636E72] mb-6 leading-relaxed whitespace-pre-line pl-12.5">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
            <button
              id="confirm-modal-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-[#636E72] bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-full transition-colors"
            >
              {cancelText}
            </button>
            <button
              id="confirm-modal-action-btn"
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 text-xs font-bold text-white rounded-full transition-all ${
                isDestructive
                  ? 'bg-[#EB4D4B] hover:bg-[#d63b39] shadow-[0_4px_12px_rgba(235,77,75,0.3)]'
                  : 'bg-[#4834D4] hover:bg-[#3c2ab9] shadow-[0_4px_12px_rgba(72,52,212,0.3)]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

