/**
 * Pure date utility functions for billing cycle calculations.
 * All computations are performed in UTC.
 */

/**
 * Returns a new Date object representing the start of the day (00:00:00.000 UTC).
 * @param {Date|string|number} date
 * @returns {Date}
 */
const startOfDay = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Returns a new Date object representing the end of the day (23:59:59.999 UTC).
 * @param {Date|string|number} date
 * @returns {Date}
 */
const endOfDay = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
};

/**
 * Adds an integer number of days to a date.
 * @param {Date|string|number} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const d = new Date(date);
  const result = new Date(d.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

/**
 * Checks if a date is strictly before another reference date, comparing by start of day UTC.
 * @param {Date|string|number} date
 * @param {Date|string|number} [referenceDate] - defaults to current UTC time
 * @returns {boolean}
 */
const isPast = (date, referenceDate = new Date()) => {
  const targetDay = startOfDay(date).getTime();
  const refDay = startOfDay(referenceDate).getTime();
  return targetDay < refDay;
};

/**
 * Adds billing cycles to a date.
 * Accurately handles month-end clamping (e.g., Jan 31 + 1 month = Feb 28 or Feb 29 in leap years)
 * and leap years for yearly cycles (e.g., Feb 29, 2024 + 1 year = Feb 28, 2025).
 *
 * @param {Date|string|number} date - Starting date
 * @param {'daily'|'weekly'|'monthly'|'yearly'} cycle - Billing cycle unit
 * @param {number} [count=1] - Number of cycles to advance
 * @returns {Date}
 */
const addBillingCycle = (date, cycle, count = 1) => {
  const d = new Date(date);
  const n = parseInt(count, 10) || 1;

  if (cycle === 'daily') {
    return addDays(d, n);
  }

  if (cycle === 'weekly') {
    return addDays(d, n * 7);
  }

  if (cycle === 'monthly') {
    const originalYear = d.getUTCFullYear();
    const originalMonth = d.getUTCMonth();
    const originalDay = d.getUTCDate();
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const seconds = d.getUTCSeconds();
    const ms = d.getUTCMilliseconds();

    const targetMonth = originalMonth + n;
    // Find the total number of days in the target month:
    // new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate()
    const daysInTargetMonth = new Date(Date.UTC(originalYear, targetMonth + 1, 0)).getUTCDate();
    const clampedDay = Math.min(originalDay, daysInTargetMonth);

    return new Date(Date.UTC(originalYear, targetMonth, clampedDay, hours, minutes, seconds, ms));
  }

  if (cycle === 'yearly') {
    const originalYear = d.getUTCFullYear();
    const originalMonth = d.getUTCMonth();
    const originalDay = d.getUTCDate();
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const seconds = d.getUTCSeconds();
    const ms = d.getUTCMilliseconds();

    const targetYear = originalYear + n;
    const daysInTargetMonth = new Date(Date.UTC(targetYear, originalMonth + 1, 0)).getUTCDate();
    const clampedDay = Math.min(originalDay, daysInTargetMonth);

    return new Date(Date.UTC(targetYear, originalMonth, clampedDay, hours, minutes, seconds, ms));
  }

  throw new Error(`Unsupported billing cycle: '${cycle}'`);
};

module.exports = {
  startOfDay,
  endOfDay,
  addDays,
  isPast,
  addBillingCycle,
};
