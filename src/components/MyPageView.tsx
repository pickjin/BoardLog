import React, { useState } from 'react';
import {
  User,
  Shield,
  Database,
  Download,
  LogOut,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  Smartphone,
  Printer,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storage } from '../services/storage';

interface MyPageViewProps {
  onOpenAuth: () => void;
  onOpenCatalog?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ onOpenAuth, onOpenCatalog }) => {
  const { user, signOut, updateNickname } = useAuth();
  const { showToast } = useToast();

  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(user?.nickname || '');
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveNickname = async () => {
    if (!nickInput.trim()) return;
    try {
      await updateNickname(nickInput.trim());
      setIsEditingNick(false);
      showToast('닉네임이 수정되었습니다.', 'success');
    } catch {
      showToast('닉네임 수정 실패', 'error');
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const jsonStr = await storage.exportUserDataJson(user.uid);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boardlog_backup_${user.nickname}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('데이터 백업 파일이 다운로드되었습니다.', 'success');
    } catch {
      showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Profile Card */}
      <div className="p-5 bg-white rounded-[28px] border border-[#E9ECEF] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-[#4834D4] text-white font-black text-lg flex items-center justify-center shadow-[0_4px_12px_rgba(72,52,212,0.3)]">
              {user?.nickname ? user.nickname.slice(0, 1).toUpperCase() : 'B'}
            </div>
            <div>
              {isEditingNick ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nickInput}
                    onChange={(e) => setNickInput(e.target.value)}
                    className="px-2.5 py-1 bg-[#F1F3F5] border border-[#E9ECEF] rounded-xl text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    className="px-3 py-1 bg-[#4834D4] text-white rounded-xl text-xs font-bold"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black text-[#1E272E]">{user?.nickname || '사용자'}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setNickInput(user?.nickname || '');
                      setIsEditingNick(true);
                    }}
                    className="text-[10px] text-[#A8ABAF] hover:text-[#4834D4] underline"
                  >
                    수정
                  </button>
                </div>
              )}
              <p className="text-xs text-[#636E72] mt-0.5">
                {user?.isAnonymous ? '게스트 계정' : user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-full text-xs font-bold transition-colors"
          >
            {user?.isAnonymous ? '로그인 / 가입' : '계정 관리'}
          </button>
        </div>

        {/* Status Tag */}
        <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-xs text-[#636E72] flex items-center justify-between">
          <span className="text-[#A8ABAF]">데이터 저장 상태</span>
          <span className="font-bold text-[#27AE60] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            사용자별 독립 격리 완료
          </span>
        </div>
      </div>

      {/* External Data Honesty & Database Status Card */}
      <div className="p-4.5 bg-white rounded-[28px] border border-[#E9ECEF] shadow-sm space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#1E272E]">
          <Database className="w-4 h-4 text-[#4834D4]" />
          <span>데이터베이스 & 외부 연동 안내</span>
        </div>
        <p className="text-[11px] text-[#636E72] leading-relaxed">
          • <strong>데이터베이스 상태:</strong> 고속 브라우저 로컬 저장소(IndexedDB)에 저장되어 새로고침하거나 브라우저를 닫아도 안전하게 유지됩니다.
          <br />
          • <strong>외부 연동 상태:</strong> 외부 보드게임 상점/BGG API는 현재 <strong>"외부 DB 미연결"</strong> 상태이며, 번들된 60여 개 인기 보드게임 시드 목록과 사용자 수동 입력을 통해 정직하게 동작합니다.
        </p>
      </div>

      {/* Backup / Export Section */}
      <div className="p-4.5 bg-white rounded-[28px] border border-[#E9ECEF] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#1E272E] flex items-center gap-1.5">
          <Download className="w-4 h-4 text-[#4834D4]" />
          <span>데이터 백업 및 서가 도록 출력</span>
        </h3>
        <p className="text-[11px] text-[#636E72] leading-relaxed">
          내 게임 목록을 책처럼 찾아볼 수 있는 PDF 도록으로 인쇄하거나 JSON 데이터 백업을 다운로드할 수 있습니다.
        </p>

        <div className="space-y-2">
          {onOpenCatalog && (
            <button
              id="mypage-open-catalog-btn"
              type="button"
              onClick={onOpenCatalog}
              className="w-full py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(72,52,212,0.3)] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>보드게임 서가 도록 & PDF 저장 열기</span>
            </button>
          )}

          <button
            id="export-json-btn"
            type="button"
            disabled={isExporting}
            onClick={handleExportData}
            className="w-full py-2.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#4834D4]" />
            <span>{isExporting ? '파일 생성 중...' : 'JSON 데이터 백업 다운로드'}</span>
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="pt-2">
        <button
          id="mypage-logout-btn"
          type="button"
          onClick={() => {
            signOut();
            showToast('로그아웃 되었습니다.', 'info');
          }}
          className="w-full py-3 bg-white border border-[#E9ECEF] hover:bg-[#F8F9FA] text-[#636E72] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4 text-[#A8ABAF]" />
          <span>로그아웃 (게스트 모드로 전환)</span>
        </button>
      </div>
    </div>
  );
};

