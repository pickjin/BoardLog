import { GameOwnershipStatus } from '../types';

export const getOwnershipBadgeColor = (status: GameOwnershipStatus): string => {
  switch (status) {
    case '보유중':
      return 'bg-[#EBFAEF] text-[#27AE60] border-[#27AE60]/30';
    case '빌려줌':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case '빌림':
      return 'bg-sky-50 text-sky-800 border-sky-300';
    case '판매예정':
      return 'bg-[#4834D4]/10 text-[#4834D4] border-[#4834D4]/30';
    case '판매완료':
      return 'bg-[#F1F3F5] text-[#A8ABAF] border-[#E9ECEF] line-through';
    case '분실':
    case '처분':
      return 'bg-[#FEEBEC] text-[#EB4D4B] border-[#EB4D4B]/30';
    default:
      return 'bg-[#F1F3F5] text-[#636E72] border-[#E9ECEF]';
  }
};
