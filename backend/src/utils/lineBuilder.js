const Product = require('../modules/products/product.model');
const Plan = require('../modules/plans/plan.model');
const Tax = require('../modules/taxes/tax.model');
const Discount = require('../modules/discounts/discount.model');
const ApiError = require('./ApiError');
const { getUnitPrice, calcLine, roundMoney } = require('./pricing');
const { isEligible, calcDiscountAmount } = require('./discountEligibility');
const { isAvailableNow } = require('../modules/plans/plan.service');
const ROLES = require('../constants/roles');
const { PERMISSIONS } = require('../constants/permissions');

/**
 * Builds and snapshots line items with server-side pricing and tax calculations.
 * Never trusts prices, totals, or tax rates from the client.
 *
 * @param {Array<Object>} inputLines - Array of input line items
 * @param {Object} options - { session, user }
 * @returns {Promise<{
 *   lines: Array<Object>,
 *   subtotal: number,
 *   taxTotal: number,
 *   grandTotal: number,
 *   billingCycle: string,
 *   discountTotal: number,
 *   discountPreview: Array<Object>
 * }>}
 */
const buildLines = async (inputLines = [], options = {}) => {
  if (!Array.isArray(inputLines) || inputLines.length === 0) {
    throw ApiError.badRequest('At least one line item is required');
  }

  const { session = null, user = null } = options;

  // Extract unique IDs for bulk fetching (no N+1 queries)
  const productIds = [...new Set(inputLines.map((l) => l.productId).filter(Boolean))];
  const planIds = [...new Set(inputLines.map((l) => l.planId).filter(Boolean))];
  const taxIds = [...new Set(inputLines.map((l) => l.taxId).filter(Boolean))];

  const queryOptions = session ? { session } : {};

  const [products, plans, taxes] = await Promise.all([
    Product.find({ _id: { $in: productIds } }, null, queryOptions),
    Plan.find({ _id: { $in: planIds } }, null, queryOptions),
    taxIds.length ? Tax.find({ _id: { $in: taxIds } }, null, queryOptions) : [],
  ]);

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const planMap = new Map(plans.map((p) => [p._id.toString(), p]));
  const taxMap = new Map(taxes.map((t) => [t._id.toString(), t]));

  const outputLines = [];
  let detectedBillingCycle = null;

  for (let i = 0; i < inputLines.length; i++) {
    const item = inputLines[i];
    const lineIndex = i + 1;

    // 1. Verify Product
    const product = productMap.get(item.productId?.toString());
    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Line ${lineIndex}: Product is invalid, inactive, or not found`, [
        { field: `lines[${i}].productId`, message: 'Product is invalid or inactive' },
      ]);
    }

    // 2. Verify Variant (if specified)
    let variantName = null;
    let targetVariantId = null;
    if (item.variantId) {
      const variant = product.variants?.id(item.variantId);
      if (!variant || !variant.isActive) {
        throw ApiError.badRequest(`Line ${lineIndex}: Variant is invalid, inactive, or not found in product`, [
          { field: `lines[${i}].variantId`, message: 'Variant is invalid or inactive' },
        ]);
      }
      variantName = variant.name;
      targetVariantId = variant._id;
    }

    // 3. Verify Plan
    const plan = planMap.get(item.planId?.toString());
    if (!plan || !plan.isActive) {
      throw ApiError.badRequest(`Line ${lineIndex}: Plan is invalid, inactive, or not found`, [
        { field: `lines[${i}].planId`, message: 'Plan is invalid or inactive' },
      ]);
    }

    if (!isAvailableNow(plan)) {
      throw ApiError.badRequest(`Line ${lineIndex}: Plan '${plan.name}' is not currently available within its validity window`, [
        { field: `lines[${i}].planId`, message: 'Plan is outside of its availability date window' },
      ]);
    }

    // 4. Verify Uniform Billing Cycle across document
    if (!detectedBillingCycle) {
      detectedBillingCycle = plan.billingCycle;
    } else if (detectedBillingCycle !== plan.billingCycle) {
      throw ApiError.badRequest(
        `Mixed billing cycles are not allowed in one document. Expected '${detectedBillingCycle}', but line ${lineIndex} specifies '${plan.billingCycle}'.`,
        [
          {
            field: `lines[${i}].planId`,
            message: `All lines must share the billing cycle '${detectedBillingCycle}'`,
          },
        ]
      );
    }

    // 5. Verify Quantity vs minQuantity
    const quantity = Number(item.quantity);
    if (!quantity || quantity < 1) {
      throw ApiError.badRequest(`Line ${lineIndex}: Quantity must be an integer ≥ 1`, [
        { field: `lines[${i}].quantity`, message: 'Quantity must be ≥ 1' },
      ]);
    }

    if (quantity < plan.minQuantity) {
      throw ApiError.badRequest(
        `Line ${lineIndex}: Quantity ${quantity} is below plan minimum required quantity of ${plan.minQuantity}`,
        [
          {
            field: `lines[${i}].quantity`,
            message: `Quantity must be at least ${plan.minQuantity} for plan '${plan.name}'`,
          },
        ]
      );
    }

    // 6. Unit Price & Override Permission Check
    let unitPrice = getUnitPrice(product, targetVariantId);
    let priceOverridden = false;

    if (item.unitPriceOverride !== undefined && item.unitPriceOverride !== null) {
      const overridePrice = Number(item.unitPriceOverride);
      if (overridePrice < 0) {
        throw ApiError.badRequest(`Line ${lineIndex}: Unit price override cannot be negative`, [
          { field: `lines[${i}].unitPriceOverride`, message: 'Override price must be ≥ 0' },
        ]);
      }

      // Check user permissions for price override
      const canOverride =
        user &&
        (user.role === ROLES.ADMIN ||
          (user.permissions && user.permissions.includes(PERMISSIONS.QUOTATIONS_WRITE)));

      if (!canOverride) {
        throw ApiError.forbidden(
          `Line ${lineIndex}: You do not have permission to override unit prices (requires admin or quotations:write permission)`
        );
      }

      unitPrice = roundMoney(overridePrice);
      priceOverridden = true;
    }

    // 7. Verify Tax (if specified)
    let taxRate = 0;
    let targetTaxId = null;

    if (item.taxId) {
      const tax = taxMap.get(item.taxId.toString());
      if (!tax || !tax.isActive) {
        throw ApiError.badRequest(`Line ${lineIndex}: Tax is invalid, inactive, or not found`, [
          { field: `lines[${i}].taxId`, message: 'Tax is invalid or inactive' },
        ]);
      }

      // Check tax product eligibility
      if (tax.appliesTo === 'products') {
        const eligibleProductIds = (tax.productIds || []).map((id) => id.toString());
        if (!eligibleProductIds.includes(product._id.toString())) {
          throw ApiError.badRequest(
            `Line ${lineIndex}: Tax '${tax.name}' is not applicable to product '${product.name}'`,
            [
              {
                field: `lines[${i}].taxId`,
                message: `Tax '${tax.name}' does not apply to this product`,
              },
            ]
          );
        }
      }

      taxRate = tax.rate;
      targetTaxId = tax._id;
    }

    // 8. Line Total Calculation
    const { subtotal: lineSubtotal, taxAmount, lineTotal } = calcLine({
      unitPrice,
      quantity,
      taxRate,
    });

    outputLines.push({
      productId: product._id,
      variantId: targetVariantId,
      planId: plan._id,
      productName: product.name,
      variantName,
      planName: plan.name,
      billingCycle: plan.billingCycle,
      quantity,
      unitPrice,
      taxId: targetTaxId,
      taxRate,
      taxAmount,
      lineSubtotal,
      lineTotal,
      priceOverridden,
    });
  }

  // Calculate Document Totals
  const subtotal = roundMoney(outputLines.reduce((sum, l) => sum + l.lineSubtotal, 0));
  const taxTotal = roundMoney(outputLines.reduce((sum, l) => sum + l.taxAmount, 0));
  const preDiscountTotal = roundMoney(subtotal + taxTotal);

  // 9. Discount Preview Calculation (Preview ONLY; does NOT mutate usedCount)
  const activeDiscounts = await Discount.find({ isActive: true }, null, queryOptions);
  const totalQuantity = outputLines.reduce((sum, l) => sum + l.quantity, 0);
  const lineProductIds = outputLines.map((l) => l.productId);

  const discountPreview = [];
  let discountTotal = 0;

  for (const discount of activeDiscounts) {
    if (
      isEligible(discount, {
        subtotal,
        quantity: totalQuantity,
        productIds: lineProductIds,
        now: new Date(),
      })
    ) {
      const amount = calcDiscountAmount(discount, subtotal);
      if (amount > 0) {
        discountPreview.push({
          discountId: discount._id,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          previewAmount: amount,
        });
        discountTotal = roundMoney(discountTotal + amount);
      }
    }
  }

  // Capped grand total
  const grandTotal = roundMoney(Math.max(0, preDiscountTotal - discountTotal));

  return {
    lines: outputLines,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    billingCycle: detectedBillingCycle,
    discountPreview,
  };
};

module.exports = {
  buildLines,
};
