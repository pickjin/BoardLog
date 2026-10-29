import React from 'react';
import { Home, Layers, Plus, Trophy, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickAddPlay: () => void;
}

const TABS: { id: TabType; domId: string; label: string; Icon: typeof Home }[] = [
  { id: 'home', domId: 'nav-tab-home', label: '홈', Icon: Home },
  { id: 'games', domId: 'nav-tab-games', label: '내 게임', Icon: Layers },
  { id: 'plays', domId: 'nav-tab-plays', label: '플레이 기록', Icon: Trophy },
  { id: 'mypage', domId: 'nav-tab-mypage', label: '마이', Icon: User }
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onQuickAddPlay }) => {
  const tabButton = ({ id, domId, label, Icon }: (typeof TABS)[number]) => {
    const active = currentTab === id;
    return (
      <button
        key={id}
        id={domId}
        type="button"
        onClick={() => onTabChange(id)}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-1 ${
          active ? 'text-felt' : 'text-graphite hover:text-ink'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
        <span className={`text-[11px] leading-4 ${active ? 'font-semibold' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-40 border-t border-rule bg-paper">
      <div className="mx-auto flex h-16 max-w-xl items-stretch px-4">
        {TABS.slice(0, 2).map(tabButton)}
        <div className="flex flex-1 items-center justify-center">
          {/* Outlined on purpose: the filled 기록하기 button on Home stays the single loudest element. */}
          <button
            id="nav-fab-add-play"
            type="button"
            onClick={onQuickAddPlay}
            aria-label="기록 추가"
            className="flex h-10 w-10 items-center justify-center rounded border-2 border-ink text-ink hover:bg-ink hover:text-paper"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        {TABS.slice(2).map(tabButton)}
      </div>
    </nav>
  );
};
