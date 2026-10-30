import { ShieldCheck, X } from 'lucide-react';
import type React from 'react';
import { isGoogleAnalyticsEnabled } from '../services/analytics';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NoticeSection {
  heading: string;
  lines: string[];
}

/**
 * Plain statements of what the app does today (FR-PRIV-01). Update this whenever data starts to
 * leave the browser in a new way (cloud backup, new analytics). Its legal sufficiency is unchecked (TBD-005).
 */
const buildSections = (googleAnalytics: boolean): NoticeSection[] => [
  {
    heading: '내 기록은 어디에 저장되나요?',
    lines: [
      '게임, 플레이 기록, 함께한 사람의 이름, 사진은 이 기기의 브라우저에만 저장됩니다. 보드로그 서버로 보내지 않습니다.',
      '그래서 브라우저 데이터를 지우거나 기기를 바꾸면 기록이 사라질 수 있어요. 마이페이지의 백업 파일로 미리 저장해 두세요.'
    ]
  },
  {
    heading: '사진으로 게임 등록',
    lines: [
      "'사진으로 게임 등록'을 쓰면 고른 사진이 서버를 거쳐 Google의 AI(Gemini)로 전달되어 게임 이름을 읽는 데 쓰입니다. 보드로그는 이 사진을 저장하지 않습니다."
    ]
  },
  {
    heading: '이용 통계',
    lines: [
      googleAnalytics
        ? '어떤 기능이 얼마나 쓰이는지 알기 위해 Google Analytics를 사용하며, 이때 쿠키가 사용됩니다. 방문 횟수, 기기·브라우저 종류, 대략적인 지역, 기능 사용 횟수(기록 저장, 공유, 백업 등)가 집계됩니다.'
        : '이 버전에서는 Google Analytics를 사용하지 않습니다.',
      '방문 추세는 Vercel Web Analytics로 집계하며 쿠키를 사용하지 않습니다.',
      '게임 이름, 함께한 사람의 이름, 장소, 점수, 사진, 공유 링크의 내용은 통계로 보내지 않습니다.'
    ]
  },
  {
    heading: '공유 링크',
    lines: [
      '기록 공유 링크 안에는 게임, 날짜, 장소, 함께한 사람의 이름과 점수가 들어 있어요. 링크를 받은 사람은 이 내용을 볼 수 있으니 믿을 수 있는 사람에게만 보내세요.'
    ]
  }
];

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const sections = buildSections(isGoogleAnalyticsEnabled());

  return (
    <div
      id="privacy-notice-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-2xl border border-[#E9ECEF]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 id="privacy-notice-title" className="text-base font-black text-[#1E272E]">
              개인정보·이용 통계 안내
            </h3>
          </div>
          <button
            id="privacy-notice-close-btn"
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="p-1.5 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#1E272E]">{section.heading}</h4>
              {section.lines.map((line) => (
                <p key={line} className="text-[11px] text-[#636E72] leading-relaxed">
                  {line}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
