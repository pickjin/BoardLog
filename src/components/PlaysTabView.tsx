import React from 'react';
import { PlayRecord } from '../types';
import { PageHeading, SearchField, FilterTabs, EmptyNote, PlayLedgerRow } from './ledger';

export const RESULT_FILTERS = ['전체', '승리', '패배', '무승부'] as const;
export type ResultFilter = (typeof RESULT_FILTERS)[number];

interface PlaysTabViewProps {
  plays: PlayRecord[];
  filteredPlays: PlayRecord[];
  search: string;
  onSearchChange: (value: string) => void;
  result: ResultFilter;
  onResultChange: (value: ResultFilter) => void;
  onAddPlay: () => void;
  onSelectPlay: (play: PlayRecord) => void;
}

interface MonthGroup {
  key: string;
  label: string;
  plays: PlayRecord[];
}

/** Plays arrive newest first; grouping keeps that order, like pages of a score pad. */
function groupByMonth(plays: PlayRecord[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const play of plays) {
    const key = play.date.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const [year, month] = key.split('.');
      group = { key, label: month ? `${year}년 ${Number(month)}월` : '날짜 없음', plays: [] };
      groups.push(group);
    }
    group.plays.push(play);
  }
  return groups;
}

export const PlaysTabView: React.FC<PlaysTabViewProps> = ({
  plays,
  filteredPlays,
  search,
  onSearchChange,
  result,
  onResultChange,
  onAddPlay,
  onSelectPlay
}) => (
  <div className="flex flex-col gap-6 pt-4">
    <PageHeading
      title="플레이 기록"
      count={plays.length}
      unit="판"
      action={{ id: 'plays-tab-add-btn', label: '기록하기', onClick: onAddPlay }}
    />

    <div className="flex flex-col gap-4">
      <SearchField id="plays-search-input" value={search} onChange={onSearchChange} placeholder="게임명, 함께한 사람, 장소" />
      <FilterTabs options={RESULT_FILTERS} value={result} onChange={onResultChange} />
    </div>

    {filteredPlays.length > 0 ? (
      <div className="flex flex-col gap-8">
        {groupByMonth(filteredPlays).map((group) => {
          const wins = group.plays.filter((p) => p.myResult === '승리').length;
          return (
            <section key={group.key} className="flex flex-col">
              <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
                <h3 className="text-[15px] font-bold leading-6">{group.label}</h3>
                <span className="text-xs leading-4 text-graphite">
                  <span className="font-mono">{group.plays.length}</span>판 · <span className="font-mono">{wins}</span>승
                </span>
              </div>
              <ul className="divide-y divide-rule">
                {group.plays.map((play) => (
                  <li key={play.id}>
                    <PlayLedgerRow play={play} onClick={() => onSelectPlay(play)} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    ) : plays.length === 0 ? (
      <EmptyNote>아직 기록이 없어요. 게임이 끝나면 누가 이겼는지만 남겨도 충분해요.</EmptyNote>
    ) : (
      <EmptyNote>조건에 맞는 기록이 없어요.</EmptyNote>
    )}
  </div>
);
