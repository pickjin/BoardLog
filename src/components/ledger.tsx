import React from 'react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { PlayRecord, MyGameResult } from '../types';

/* Shared score-pad primitives: every list screen draws from these so they stay one system. */

export const SectionHeading: React.FC<{ title: string; action?: { label: string; onClick: () => void } }> = ({
  title,
  action
}) => (
  <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
    <h3 className="text-[15px] font-bold leading-6">{title}</h3>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="flex items-center gap-1 text-[13px] leading-5 text-graphite hover:text-ink"
      >
        {action.label}
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </button>
    )}
  </div>
);

export const PageHeading: React.FC<{
  title: string;
  count: number;
  unit: string;
  action: { id: string; label: string; onClick: () => void };
}> = ({ title, count, unit, action }) => (
  <div className="flex items-end justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-[22px] font-bold leading-8 tracking-tight">{title}</h2>
      <p className="text-xs leading-4 text-graphite">
        <span className="font-mono">{count}</span>
        {unit}
      </p>
    </div>
    <button
      id={action.id}
      type="button"
      onClick={action.onClick}
      className="flex h-10 shrink-0 items-center gap-1 rounded bg-felt px-4 text-[13px] font-semibold text-paper hover:opacity-90 active:opacity-80"
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
      {action.label}
    </button>
  </div>
);

export interface TextLink {
  id?: string;
  label: string;
  onClick: () => void;
}

export const TextLinks: React.FC<{ links: TextLink[] }> = ({ links }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-2">
    {links.map((link) => (
      <button
        key={link.label}
        id={link.id}
        type="button"
        onClick={link.onClick}
        className="text-[13px] leading-5 text-graphite underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
      >
        {link.label}
      </button>
    ))}
  </div>
);

export const SearchField: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ id, value, onChange, placeholder }) => (
  <label className="flex items-center gap-2 border-b border-rule py-2 focus-within:border-ink">
    <Search className="h-4 w-4 shrink-0 text-graphite" strokeWidth={1.75} />
    <input
      id={id}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-[15px] leading-6 placeholder:text-graphite focus:outline-none"
    />
  </label>
);

export function FilterTabs<T extends string>({
  options,
  value,
  onChange
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 scrollbar-none" role="tablist">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={`shrink-0 border-b-2 pb-1 text-[13px] leading-5 ${
              active ? 'border-felt font-semibold text-felt' : 'border-transparent text-graphite hover:text-ink'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="py-6 text-[13px] leading-5 text-graphite">{children}</p>
);

const RESULT_MARK: Record<MyGameResult, string> = { 승리: '승', 패배: '패', 무승부: '무', 참여: '참' };

/** The score-pad habit: wins get a red circle, everything else stays in pencil grey. */
export const ResultMark: React.FC<{ result: MyGameResult }> = ({ result }) => (
  <span
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
      result === '승리' ? 'border-2 border-mark text-mark' : 'text-graphite'
    }`}
    aria-label={result}
  >
    {RESULT_MARK[result]}
  </span>
);

export const PlayLedgerRow: React.FC<{ play: PlayRecord; onClick: () => void }> = ({ play, onClick }) => {
  const others = play.participants.length - 1;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 py-4 text-left hover:bg-ink/[0.03]">
      <span className="w-12 shrink-0 font-mono text-xs leading-4 text-graphite">{play.date.slice(5)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold leading-6">{play.gameTitle}</span>
        <span className="truncate text-xs leading-4 text-graphite">
          {others > 0 ? `나 외 ${others}명` : '혼자'}
          {play.location ? ` · ${play.location}` : ''}
        </span>
      </span>
      <ResultMark result={play.myResult} />
    </button>
  );
};
