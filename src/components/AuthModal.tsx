import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, UserPlus, LogOut, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, signIn, signUp, signOut, signInAnonymously } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        showToast('성공적으로 로그인되었습니다.', 'success');
      } else {
        await signUp(email, password, nickname);
        showToast('회원가입이 완료되어 자동 로그인되었습니다.', 'success');
      }
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    try {
      await signInAnonymously();
      showToast('게스트 모드로 시작합니다.', 'info');
      onClose();
    } catch {
      showToast('게스트 로그인 실패', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await signOut();
      showToast('로그아웃 되었습니다.', 'info');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div id="auth-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-[#E9ECEF]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-base font-black text-[#1E272E]">
                {user && !user.isAnonymous ? '내 계정 정보' : mode === 'login' ? '로그인' : '회원가입'}
              </h2>
            </div>
            <button
              id="auth-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* If already logged in with permanent account */}
          {user && !user.isAnonymous ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#4834D4] text-white font-black flex items-center justify-center text-sm shadow-[0_4px_12px_rgba(72,52,212,0.3)]">
                    {user.nickname.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#1E272E]">{user.nickname}</p>
                    <p className="text-xs text-[#636E72]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#27AE60] pt-2 border-t border-[#E9ECEF] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>데이터가 이 계정에 안전하게 격리되어 보관됩니다.</span>
                </div>
              </div>

              <button
                id="auth-signout-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#636E72] rounded-full text-xs font-bold transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-[#A8ABAF]" />
                <span>로그아웃 (게스트 계정으로 전환)</span>
              </button>
            </div>
          ) : (
            <>
              {user?.isAnonymous && (
                <div className="mb-4 p-3 rounded-2xl bg-[#4834D4]/5 border border-[#4834D4]/20 text-xs text-[#1E272E] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#4834D4] shrink-0 mt-0.5" />
                  <span>현재 <strong>게스트 모드</strong>입니다. 회원가입하시면 다른 기기에서도 기록을 안전하게 관리할 수 있습니다.</span>
                </div>
              )}

              {/* Mode Toggle Tabs */}
              <div className="flex p-1 bg-[#F1F3F5] rounded-full mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-full transition-all ${
                    mode === 'login' ? 'bg-white text-[#1E272E] shadow-sm' : 'text-[#A8ABAF]'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-full transition-all ${
                    mode === 'signup' ? 'bg-white text-[#1E272E] shadow-sm' : 'text-[#A8ABAF]'
                  }`}
                >
                  회원가입
                </button>
              </div>

              {/* Error box */}
              {errorMessage && (
                <div className="mb-3.5 p-2.5 rounded-2xl bg-[#FEEBEC] border border-[#EB4D4B]/30 text-[#EB4D4B] text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E272E] mb-1">닉네임</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
                      <input
                        id="auth-input-nickname"
                        type="text"
                        placeholder="예: 보드게임마스터"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#F1F3F5] border border-[#E9ECEF] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors font-medium"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#1E272E] mb-1">이메일 주소</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
                    <input
                      id="auth-input-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#F1F3F5] border border-[#E9ECEF] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1E272E] mb-1">비밀번호</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8ABAF]" />
                    <input
                      id="auth-input-password"
                      type="password"
                      required
                      placeholder="6자리 이상 입력"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#F1F3F5] border border-[#E9ECEF] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors font-medium"
                    />
                  </div>
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(72,52,212,0.3)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isSubmitting ? '처리 중...' : mode === 'login' ? '로그인하기' : '회원가입 완료'}</span>
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E9ECEF]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-[#A8ABAF] font-bold">또는</span>
                </div>
              </div>

              <button
                id="auth-guest-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleGuestLogin}
                className="w-full py-2.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-full text-xs font-bold transition-colors disabled:opacity-50"
              >
                가입 없이 게스트로 계속 이용하기
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

