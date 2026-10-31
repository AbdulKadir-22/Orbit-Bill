/**
 * Central currency symbol configuration for OrbitBill
 * Easily changeable to ₹, €, £, etc.
 */
export const CURRENCY_SYMBOL = '$';

/**
 * Format numeric value as currency
 * @param {number|string} amount 
 * @param {boolean} showSymbol 
 * @returns {string}
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const num = Number(amount);
  if (isNaN(num)) return showSymbol ? `${CURRENCY_SYMBOL}0.00` : '0.00';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
};

/**
 * Format Date as "1 Jan 2024"
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format Date & Time as "2 Jan 2024, 10:30 AM"
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
};
