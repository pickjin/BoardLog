/**
 * Formatting utility functions for Korean Board Log
 */

export function formatWon(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return '₩0';
  }
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }
  // Convert standard ISO or dash format to YYYY.MM.DD
  return dateStr.replace(/-/g, '.');
}

export function formatCurrentTime(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function calculateDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;

  let startTotal = sH * 60 + sM;
  let endTotal = eH * 60 + eM;

  if (endTotal < startTotal) {
    // Cross midnight
    endTotal += 24 * 60;
  }
  return Math.max(0, endTotal - startTotal);
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0분';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}
