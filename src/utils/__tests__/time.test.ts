import {
  addMinutes,
  generateTimeSlots,
  minutesToTime,
  nowMinutesOfDay,
  timeRangesOverlap,
  timeToMinutes,
} from '../time';

describe('timeToMinutes', () => {
  it.each([
    ['00:00', 0],
    ['09:30', 570],
    ['14:00', 840],
    ['23:59', 1439],
  ])('%s → %d', (input, expected) => {
    expect(timeToMinutes(input)).toBe(expected);
  });

  it('rejects invalid strings', () => {
    expect(() => timeToMinutes('25:00')).toThrow(RangeError);
    expect(() => timeToMinutes('9:30')).toThrow(RangeError);
    expect(() => timeToMinutes('12:60')).toThrow(RangeError);
    expect(() => timeToMinutes('')).toThrow(RangeError);
  });
});

describe('minutesToTime', () => {
  it.each([
    [0, '00:00'],
    [570, '09:30'],
    [1439, '23:59'],
  ])('%d → %s', (input, expected) => {
    expect(minutesToTime(input)).toBe(expected);
  });

  it('wraps overflow past midnight', () => {
    expect(minutesToTime(1440)).toBe('00:00');
    expect(minutesToTime(1500)).toBe('01:00');
  });

  it('wraps negative (e.g. going earlier than 00:00)', () => {
    expect(minutesToTime(-30)).toBe('23:30');
  });

  it('rejects NaN / Infinity', () => {
    expect(() => minutesToTime(NaN)).toThrow(RangeError);
    expect(() => minutesToTime(Infinity)).toThrow(RangeError);
  });
});

describe('addMinutes', () => {
  it('adds to a simple time', () => {
    expect(addMinutes('10:00', 90)).toBe('11:30');
  });
  it('handles day wrap', () => {
    expect(addMinutes('23:30', 60)).toBe('00:30');
  });
  it('handles negative delta', () => {
    expect(addMinutes('00:15', -30)).toBe('23:45');
  });
});

describe('generateTimeSlots', () => {
  it('30-min step from 09:00 to 11:00 gives 4 slots (end excluded)', () => {
    expect(generateTimeSlots('09:00', '11:00', 30)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });
  it('returns empty when end <= start', () => {
    expect(generateTimeSlots('11:00', '11:00', 30)).toEqual([]);
    expect(generateTimeSlots('11:00', '10:00', 30)).toEqual([]);
  });
  it('returns empty for non-positive step', () => {
    expect(generateTimeSlots('09:00', '10:00', 0)).toEqual([]);
    expect(generateTimeSlots('09:00', '10:00', -15)).toEqual([]);
  });
  it('handles uneven windows — last slot may not reach end', () => {
    // 09:00, 09:45 — 10:30 НЕ включается потому что это end
    expect(generateTimeSlots('09:00', '10:30', 45)).toEqual(['09:00', '09:45']);
  });
});

describe('nowMinutesOfDay', () => {
  it('reads from provided Date', () => {
    const d = new Date(2026, 3, 16, 14, 37);
    expect(nowMinutesOfDay(d)).toBe(14 * 60 + 37);
  });
});

describe('timeRangesOverlap', () => {
  it('detects overlap', () => {
    expect(timeRangesOverlap('10:00', '11:00', '10:30', '11:30')).toBe(true);
    expect(timeRangesOverlap('10:00', '12:00', '11:00', '11:30')).toBe(true);
    expect(timeRangesOverlap('11:00', '11:30', '10:00', '12:00')).toBe(true);
  });
  it('treats touching ranges as non-overlapping', () => {
    expect(timeRangesOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false);
  });
  it('no overlap when ranges are disjoint', () => {
    expect(timeRangesOverlap('10:00', '11:00', '14:00', '15:00')).toBe(false);
  });
});
