const { addBillingCycle, addDays, startOfDay, endOfDay, isPast } = require('../../src/utils/dates');

describe('Date Utilities Unit Tests', () => {
  test('adds billing cycle monthly handling end of month', () => {
    const jan31 = new Date('2026-01-31T00:00:00Z');
    const nextMonth = addBillingCycle(jan31, 'monthly');
    expect(nextMonth.getUTCMonth()).toBe(1); // February
    expect(nextMonth.getUTCDate()).toBe(28); // 2026 is non-leap year
  });

  test('adds billing cycle yearly', () => {
    const date = new Date('2026-03-15T00:00:00Z');
    const nextYear = addBillingCycle(date, 'yearly');
    expect(nextYear.getUTCFullYear()).toBe(2027);
    expect(nextYear.getUTCMonth()).toBe(2);
    expect(nextYear.getUTCDate()).toBe(15);
  });

  test('adds days accurately', () => {
    const date = new Date('2026-05-10T12:00:00Z');
    const future = addDays(date, 5);
    expect(future.getUTCDate()).toBe(15);
  });

  test('startOfDay and endOfDay sets boundary UTC timestamps', () => {
    const date = new Date('2026-08-20T15:30:45.123Z');
    const start = startOfDay(date);
    expect(start.toISOString()).toBe('2026-08-20T00:00:00.000Z');

    const end = endOfDay(date);
    expect(end.toISOString()).toBe('2026-08-20T23:59:59.999Z');
  });

  test('isPast compares dates accurately', () => {
    const yesterday = new Date(Date.now() - 86400000);
    const tomorrow = new Date(Date.now() + 86400000);
    expect(isPast(yesterday)).toBe(true);
    expect(isPast(tomorrow)).toBe(false);
  });
});
