const { roundMoney } = require('./pricing');

/**
 * Checks if a discount is eligible given purchase context.
 * Pure function with no database calls.
 *
 * @param {Object} discount - Discount model or plain object
 * @param {Object} context - { subtotal, quantity, productIds, now }
 * @returns {boolean}
 */
const isEligible = (discount, { subtotal = 0, quantity = 0, productIds = [], now = new Date() } = {}) => {
  if (!discount || typeof discount !== 'object') {
    return false;
  }

  // 1. Must be active
  if (!discount.isActive) {
    return false;
  }

  const checkTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  // 2. Check startDate if specified
  if (discount.startDate) {
    const startTime = new Date(discount.startDate).getTime();
    if (checkTime < startTime) {
      return false; // Upcoming
    }
  }

  // 3. Check endDate if specified
  if (discount.endDate) {
    const endTime = new Date(discount.endDate).getTime();
    if (checkTime > endTime) {
      return false; // Expired
    }
  }

  // 4. Check usage limit
  if (typeof discount.usageLimit === 'number' && discount.usageLimit !== null) {
    const usedCount = Number(discount.usedCount) || 0;
    if (usedCount >= discount.usageLimit) {
      return false; // Exhausted
    }
  }

  // 5. Check minimum purchase
  const minPurchase = Number(discount.minPurchase) || 0;
  if (Number(subtotal) < minPurchase) {
    return false;
  }

  // 6. Check minimum quantity
  const minQuantity = Number(discount.minQuantity) || 0;
  if (Number(quantity) < minQuantity) {
    return false;
  }

  // 7. Check appliesTo product scoping
  if (discount.appliesTo === 'products') {
    const targetProductIds = (discount.productIds || []).map((id) => id.toString());
    const incomingProductIds = (productIds || []).map((id) => id.toString());

    // Must match at least one of the specified products
    const hasMatchingProduct = incomingProductIds.some((pId) => targetProductIds.includes(pId));
    if (!hasMatchingProduct) {
      return false;
    }
  }

  return true;
};

/**
 * Calculates discount amount capped so it never exceeds the base amount.
 *
 * @param {Object} discount - { type: 'fixed' | 'percentage', value: number }
 * @param {number} baseAmount - Base monetary amount to apply discount against
 * @returns {number}
 */
const calcDiscountAmount = (discount, baseAmount) => {
  const base = Math.max(0, Number(baseAmount) || 0);
  if (!discount || base === 0) {
    return 0;
  }

  let amount = 0;
  const value = Math.max(0, Number(discount.value) || 0);

  if (discount.type === 'percentage') {
    const percentage = Math.min(100, value);
    amount = base * (percentage / 100);
  } else if (discount.type === 'fixed') {
    amount = value;
  }

  // Cap at base amount and round
  const cappedAmount = Math.min(base, amount);
  return roundMoney(cappedAmount);
};

module.exports = {
  isEligible,
  calcDiscountAmount,
};
