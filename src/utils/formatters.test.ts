import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateDurationMinutes, formatCurrentTime, formatDate, formatDuration, formatWon } from './formatters';

describe('formatWon', () => {
  it('formats a positive amount with the won sign and thousands separators', () => {
    expect(formatWon(45000)).toBe('₩45,000');
  });

  it.each([undefined, null, 0, Number.NaN])('shows ₩0 for %s', (amount) => {
    expect(formatWon(amount)).toBe('₩0');
  });
});

describe('formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 9, 7));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses today, zero padded, when no date is given', () => {
    expect(formatDate()).toBe('2026.10.05');
  });

  it('converts a dash date to dots', () => {
    expect(formatDate('2026-03-09')).toBe('2026.03.09');
  });

  it('formats the current time as HH:MM', () => {
    expect(formatCurrentTime()).toBe('09:07');
  });
});

describe('calculateDurationMinutes', () => {
  it('returns the minutes between two times', () => {
    expect(calculateDurationMinutes('19:00', '20:30')).toBe(90);
  });

  it('wraps past midnight', () => {
    expect(calculateDurationMinutes('23:30', '00:15')).toBe(45);
  });

  it('is zero for equal times', () => {
    expect(calculateDurationMinutes('10:00', '10:00')).toBe(0);
  });

  it.each([
    ['', '10:00'],
    ['10:00', ''],
    ['aa:bb', '10:00'],
    ['10:00', 'x']
  ])('is zero for missing or unparsable input (%j, %j)', (start, end) => {
    expect(calculateDurationMinutes(start, end)).toBe(0);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0분'],
    [-5, '0분'],
    [45, '45분'],
    [60, '1시간'],
    [125, '2시간 5분']
  ])('%i minutes -> %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
