import React from 'react';
import { Home, Layers, Plus, Trophy, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickAddPlay: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onQuickAddPlay
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E9ECEF] shadow-lg safe-area-bottom"
    >
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* 1. 홈 */}
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'home' ? 'text-[#4834D4] font-bold' : 'text-[#A8ABAF] hover:text-[#2D3436]'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">홈</span>
        </button>

        {/* 2. 내 게임 */}
        <button
          id="nav-tab-games"
          type="button"
          onClick={() => onTabChange('games')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'games' ? 'text-[#4834D4] font-bold' : 'text-[#A8ABAF] hover:text-[#2D3436]'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">내 게임</span>
        </button>

        {/* 3. 중앙 원형 FAB: 기록 추가 */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-3">
          <button
            id="nav-fab-add-play"
            type="button"
            onClick={onQuickAddPlay}
            aria-label="기록 추가"
            className="w-13 h-13 rounded-full bg-[#4834D4] text-white flex items-center justify-center shadow-[0_12px_24px_rgba(72,52,212,0.35)] hover:scale-105 active:scale-95 transition-all ring-4 ring-white"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-[#4834D4] mt-0.5">기록 추가</span>
        </div>

        {/* 4. 플레이 기록 */}
        <button
          id="nav-tab-plays"
          type="button"
          onClick={() => onTabChange('plays')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'plays' ? 'text-[#4834D4] font-bold' : 'text-[#A8ABAF] hover:text-[#2D3436]'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">플레이 기록</span>
        </button>

        {/* 5. 마이페이지 */}
        <button
          id="nav-tab-mypage"
          type="button"
          onClick={() => onTabChange('mypage')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'mypage' ? 'text-[#4834D4] font-bold' : 'text-[#A8ABAF] hover:text-[#2D3436]'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">마이</span>
        </button>
      </div>
    </nav>
  );
};
