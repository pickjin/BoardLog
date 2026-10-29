import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = '불러오는 중이에요.' }) => (
  <div id="loading-state-view" className="flex flex-col gap-2 py-16" role="status">
    <div className="flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 animate-pulse bg-ink" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
    <p className="text-[13px] leading-5 text-graphite">{message}</p>
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = '일시적인 오류가 발생했습니다.',
  onRetry
}) => (
  <div id="error-state-view" className="flex flex-col gap-4 border-y-2 border-mark py-6" role="alert">
    <div className="flex flex-col gap-1">
      <h3 className="text-[15px] font-bold leading-6">불러오지 못했어요</h3>
      <p className="text-[13px] leading-5 text-graphite">{message}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="self-start text-[13px] font-semibold leading-5 underline underline-offset-4"
      >
        다시 시도
      </button>
    )}
  </div>
);
