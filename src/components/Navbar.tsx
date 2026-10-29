import React from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();

  return (
    <header id="top-app-header" className="sticky top-0 z-30 border-b border-rule bg-paper">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <h1 className="text-lg font-bold leading-7 tracking-tight">보드로그</h1>
        <button
          id="header-user-profile-btn"
          type="button"
          onClick={onOpenAuth}
          className="max-w-[160px] truncate text-[13px] leading-5 text-graphite underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          {user?.isAnonymous ? '로그인' : user?.nickname || '내 계정'}
        </button>
      </div>
    </header>
  );
};
