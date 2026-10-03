import { athensDateTime, athensDateTimeToIso, businessDate } from './business-date';

describe('Greek business dates', () => {
  it('uses the Greek business day rather than the UTC date', () => {
    expect(businessDate(new Date('2026-10-02T22:30:00Z'))).toBe('2026-10-03');
  });
  it('round-trips both winter and summer local times', () => {
    expect(athensDateTimeToIso('2026-01-10T10:00')).toBe('2026-01-10T08:00:00.000Z');
    expect(athensDateTimeToIso('2026-07-10T10:00')).toBe('2026-07-10T07:00:00.000Z');
    expect(athensDateTime('2026-01-10T08:00:00Z')).toBe('2026-01-10T10:00');
  });
  it('rejects missing and repeated local hours at clock changes', () => {
    expect(() => athensDateTimeToIso('2026-03-29T03:30')).toThrow();
    expect(() => athensDateTimeToIso('2026-10-25T03:30')).toThrow();
  });
});
