import React from 'react';
import { PackageOpen, SearchX, AlertTriangle, Loader2, Plus, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = '데이터를 불러오는 중입니다...' }) => (
  <div id="loading-state-view" className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="relative mb-4">
      <div className="w-12 h-12 rounded-2xl bg-[#4834D4]/10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#4834D4] animate-spin" />
      </div>
    </div>
    <p className="text-sm font-bold text-[#1E272E]">{message}</p>
    <p className="text-xs text-[#A8ABAF] mt-1">잠시만 기다려 주세요</p>
  </div>
);

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon
}) => (
  <div id="empty-state-view" className="flex flex-col items-center justify-center py-14 px-6 text-center bg-white rounded-[28px] border border-dashed border-[#E9ECEF] my-4 shadow-sm">
    <div className="w-14 h-14 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF] flex items-center justify-center mb-3 text-[#A8ABAF]">
      {icon || <PackageOpen className="w-7 h-7 text-[#4834D4]" />}
    </div>
    <h3 className="text-base font-black italic text-[#1E272E] mb-1">{title}</h3>
    <p className="text-xs text-[#636E72] max-w-xs mb-5 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        id="empty-state-action-btn"
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-all"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>{actionText}</span>
      </button>
    )}
  </div>
);

interface NoSearchResultStateProps {
  query: string;
  onDirectAdd?: () => void;
  onReset?: () => void;
}

export const NoSearchResultState: React.FC<NoSearchResultStateProps> = ({
  query,
  onDirectAdd,
  onReset
}) => (
  <div id="no-search-results-view" className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-[28px] border border-[#E9ECEF] my-4 shadow-sm">
    <div className="w-12 h-12 rounded-2xl bg-[#F1F3F5] flex items-center justify-center mb-3 text-[#A8ABAF]">
      <SearchX className="w-6 h-6" />
    </div>
    <h3 className="text-base font-black italic text-[#1E272E] mb-1">
      <span className="text-[#4834D4]">'{query}'</span> 검색 결과가 없습니다
    </h3>
    <p className="text-xs text-[#636E72] max-w-xs mb-5 leading-relaxed">
      시드 목록에 없는 게임인가요? 필요한 정보만 쏙 입력하여 직접 등록할 수 있습니다.
    </p>
    <div className="flex items-center gap-2.5">
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-full text-xs font-bold transition-colors"
        >
          검색 초기화
        </button>
      )}
      {onDirectAdd && (
        <button
          id="direct-add-from-search-btn"
          type="button"
          onClick={onDirectAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>'{query}' 직접 등록하기</span>
        </button>
      )}
    </div>
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = '일시적인 오류가 발생했습니다.',
  onRetry
}) => (
  <div id="error-state-view" className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-[28px] border border-[#EB4D4B]/30 my-4 shadow-sm">
    <div className="w-12 h-12 rounded-2xl bg-[#FEEBEC] flex items-center justify-center mb-3 text-[#EB4D4B]">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-black italic text-[#1E272E] mb-1">불러오기에 실패했습니다</h3>
    <p className="text-xs text-[#EB4D4B] max-w-xs mb-5 leading-relaxed">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EB4D4B] hover:bg-[#d63b39] text-white rounded-full text-xs font-bold shadow-xs transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>다시 시도하기</span>
      </button>
    )}
  </div>
);

