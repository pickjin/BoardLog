import type React from 'react';
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import type { PlayRecord, MyGameResult } from '../types';
import { PlayCard } from './PlayCard';
import { EmptyState } from './StateViews';

const PLAY_RESULT_TABS: (MyGameResult | '전체')[] = ['전체', '승리', '패배', '무승부'];

interface PlaysViewProps {
  plays: PlayRecord[];
  onAddPlay: () => void;
  onSelectPlay: (play: PlayRecord) => void;
}

export const PlaysView: React.FC<PlaysViewProps> = ({ plays, onAddPlay, onSelectPlay }) => {
  const [playSearch, setPlaySearch] = useState('');
  const [selectedPlayResult, setSelectedPlayResult] = useState<MyGameResult | '전체'>('전체');

  // Filtered Plays
  const filteredPlays = plays.filter((p) => {
    const matchesSearch =
      !playSearch.trim() ||
      p.gameTitle.toLowerCase().includes(playSearch.toLowerCase()) ||
      p.location.toLowerCase().includes(playSearch.toLowerCase()) ||
      p.participants.some((part) => part.name.toLowerCase().includes(playSearch.toLowerCase()));

    const matchesResult = selectedPlayResult === '전체' || p.myResult === selectedPlayResult;

    return matchesSearch && matchesResult;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black italic text-[#1E272E]">플레이 기록</h2>
          <p className="text-xs text-[#636E72]">총 {plays.length}회의 플레이 기록</p>
        </div>

        <button
          id="plays-tab-add-btn"
          type="button"
          onClick={onAddPlay}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>새 기록</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
        <input
          id="plays-search-input"
          type="text"
          placeholder="게임명, 참여자 이름, 장소 검색..."
          value={playSearch}
          onChange={(e) => setPlaySearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9ECEF] rounded-full text-xs text-[#1E272E] focus:outline-hidden focus:ring-2 focus:ring-[#4834D4]/20 focus:border-[#4834D4] shadow-sm transition-all"
        />
      </div>

      {/* Result Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {PLAY_RESULT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSelectedPlayResult(tab)}
            className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              selectedPlayResult === tab
                ? 'bg-[#4834D4] text-white shadow-xs'
                : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F8F9FA]'
            }`}
          >
            {tab === '승리' ? '👑 승리' : tab}
          </button>
        ))}
      </div>

      {/* Plays List */}
      {filteredPlays.length > 0 ? (
        <div className="space-y-3.5">
          {filteredPlays.map((play) => (
            <PlayCard key={play.id} play={play} onClick={() => onSelectPlay(play)} />
          ))}
        </div>
      ) : plays.length === 0 ? (
        <EmptyState
          title="아직 기록된 플레이가 없습니다"
          description="오늘 진행한 보드게임의 참여자, 점수, 순위, 현장 사진을 기록해 보세요."
          actionText="첫 플레이 기록 남기기"
          onAction={onAddPlay}
        />
      ) : (
        <div className="p-8 bg-white rounded-[28px] border border-[#E9ECEF] text-center text-xs text-[#636E72] shadow-sm">
          '{playSearch}' 조건에 해당하는 플레이 기록이 없습니다.
        </div>
      )}
    </div>
  );
};
