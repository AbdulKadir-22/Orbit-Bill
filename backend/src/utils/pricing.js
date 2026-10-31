/**
 * Pure money and pricing calculation helper functions.
 * All functions are unit-testable and contain no database dependencies.
 */

/**
 * Rounds a number to exactly 2 decimal places using safe integer-paise math.
 * @param {number} n
 * @returns {number}
 */
const roundMoney = (n) => {
  if (typeof n !== 'number' || isNaN(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * Resolves the unit price for a product, optionally adjusted by an embedded variant.
 * @param {Object} product - Product object or mongoose document with salesPrice and variants[]
 * @param {string|Object} [variantId] - Optional variant _id or variant subdocument
 * @returns {number}
 */
const getUnitPrice = (product, variantId = null) => {
  if (!product) {
    throw new Error('Product is required to calculate unit price');
  }

  const basePrice = Number(product.salesPrice) || 0;

  if (!variantId) {
    return roundMoney(Math.max(0, basePrice));
  }

  const targetIdStr = variantId?._id ? variantId._id.toString() : variantId.toString();
  const variants = product.variants || [];
  const variant = variants.find((v) => v._id && v._id.toString() === targetIdStr);

  if (!variant) {
    throw new Error(`Variant with ID '${targetIdStr}' not found in product`);
  }

  const delta = Number(variant.priceDelta) || 0;
  const unitPrice = roundMoney(basePrice + delta);

  if (unitPrice < 0) {
    throw new Error('Sales price plus variant price delta cannot result in a negative price');
  }

  return unitPrice;
};

/**
 * Calculates line subtotal, tax amount, and total with 2-decimal precision.
 * @param {Object} lineParams - { unitPrice, quantity, taxRate }
 * @returns {{ subtotal: number, taxAmount: number, lineTotal: number }}
 */
const calcLine = ({ unitPrice, quantity, taxRate = 0 }) => {
  const price = Number(unitPrice) || 0;
  const qty = Number(quantity) || 0;
  const rate = Number(taxRate) || 0;

  if (price < 0 || qty < 0 || rate < 0) {
    throw new Error('Negative values are not permitted in line calculation');
  }

  const subtotal = roundMoney(price * qty);
  const taxAmount = roundMoney(subtotal * (rate / 100));
  const lineTotal = roundMoney(subtotal + taxAmount);

  return {
    subtotal,
    taxAmount,
    lineTotal,
  };
};

module.exports = {
  roundMoney,
  getUnitPrice,
  calcLine,
};
