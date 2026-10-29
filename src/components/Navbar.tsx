import React from 'react';
import { Database, UserCheck, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();

  return (
    <header
      id="top-app-header"
      className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E9ECEF]"
    >
      <div className="max-w-xl mx-auto px-4 h-15 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#4834D4] flex items-center justify-center text-white font-black text-lg shadow-[0_4px_12px_rgba(72,52,212,0.3)]">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight text-[#1E272E]">보드로그</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F3F5] text-[#4834D4] border border-[#E9ECEF]">
                Board Log
              </span>
            </div>
          </div>
        </div>

        {/* Right action & status */}
        <div className="flex items-center gap-2">
          <div
            title="브라우저 고속 IndexedDB 가동 중 (새로고침 후에도 영구 유지)"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F3F5] border border-[#E9ECEF] text-[11px] text-[#636E72] font-medium"
          >
            <Database className="w-3 h-3 text-[#27AE60]" />
            <span>로컬 DB</span>
          </div>

          <button
            id="header-user-profile-btn"
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F3F5] hover:bg-[#E9ECEF] active:bg-[#DFE4EA] text-[#2D3436] text-xs font-semibold transition-colors"
          >
            {user?.isAnonymous ? (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#636E72]" />
                <span className="max-w-[70px] truncate">로그인</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#4834D4]" />
                <span className="max-w-[80px] truncate">{user?.nickname || '내 계정'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

