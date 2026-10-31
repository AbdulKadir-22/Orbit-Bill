const mongoose = require('mongoose');
const Invoice = require('./invoice.model');
const Subscription = require('../subscriptions/subscription.model');
const Discount = require('../discounts/discount.model');
const { generateSequenceNumber } = require('../../utils/numberGenerator');
const { addBillingCycle, addDays, startOfDay, endOfDay } = require('../../utils/dates');
const { calcLine, roundMoney } = require('../../utils/pricing');
const { isEligible, calcDiscountAmount } = require('../../utils/discountEligibility');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');
const logger = require('../../config/logger');
const env = require('../../config/env');

/**
 * Generates an invoice for a single subscription in its own atomic transaction.
 *
 * @param {string|mongoose.Types.ObjectId} subscriptionId
 * @param {Object} options - { asOf, source, userId, session: optionalParentSession }
 * @returns {Promise<{ invoice: Object|null, status: 'generated'|'skipped_already_billed'|'skipped_not_eligible'|'failed', error?: string }>}
 */
const generateInvoiceForSubscription = async (subscriptionId, options = {}) => {
  const { asOf = new Date(), source = 'auto', userId = null } = options;
  const asOfDate = new Date(asOf);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Re-read subscription with the transaction session
    const subscription = await Subscription.findById(subscriptionId).session(session);

    if (!subscription) {
      await session.abortTransaction();
      logger.info(`[Billing] Subscription ${subscriptionId} skipped: not found`);
      return { invoice: null, status: 'skipped_not_eligible', error: 'Subscription not found' };
    }

    if (subscription.status !== 'active') {
      await session.abortTransaction();
      logger.info(`[Billing] Subscription ${subscription.subscriptionNumber || subscriptionId} skipped: not active (status: '${subscription.status}')`);
      return { invoice: null, status: 'skipped_not_eligible', error: `Subscription is in status '${subscription.status}' (only active subscriptions can be billed)` };
    }

    if (!subscription.nextBillingDate) {
      await session.abortTransaction();
      logger.info(`[Billing] Subscription ${subscription.subscriptionNumber || subscriptionId} skipped: nextBillingDate is null`);
      return { invoice: null, status: 'skipped_not_eligible', error: 'Subscription has no nextBillingDate' };
    }

    // Must be due: nextBillingDate <= endOfDay(asOf) AND nextBillingDate <= expiryDate
    const dueThreshold = endOfDay(asOfDate);
    if (new Date(subscription.nextBillingDate) > dueThreshold) {
      await session.abortTransaction();
      logger.info(`[Billing] Subscription ${subscription.subscriptionNumber || subscriptionId} skipped: not due yet (${subscription.nextBillingDate} > ${dueThreshold})`);
      return { invoice: null, status: 'skipped_not_eligible', error: 'Subscription is not yet due for billing' };
    }

    if (new Date(subscription.nextBillingDate) > new Date(subscription.expiryDate)) {
      await session.abortTransaction();
      logger.info(`[Billing] Subscription ${subscription.subscriptionNumber || subscriptionId} skipped: nextBillingDate is past expiryDate`);
      return { invoice: null, status: 'skipped_not_eligible', error: 'nextBillingDate is past subscription expiryDate' };
    }

    // 2. Billing Period calculation
    const periodStart = new Date(subscription.nextBillingDate);
    // periodEnd = addBillingCycle(periodStart, cycle) - 1 day, capped at expiryDate
    const nextCycleDate = addBillingCycle(periodStart, subscription.billingCycle);
    const unCappedEnd = addDays(nextCycleDate, -1);
    const periodEnd = unCappedEnd > new Date(subscription.expiryDate) ? new Date(subscription.expiryDate) : unCappedEnd;

    // 3. Compute billingKey (<subscriptionId>:<YYYY-MM-DD>)
    const yyyy = periodStart.getUTCFullYear();
    const mm = String(periodStart.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(periodStart.getUTCDate()).padStart(2, '0');
    const billingKey = `${subscription._id.toString()}:${yyyy}-${mm}-${dd}`;

    // Fast pre-check
    const existing = await Invoice.findOne({ billingKey }).session(session);
    if (existing) {
      await session.abortTransaction();
      logger.info(`[Billing] Subscription ${subscription.subscriptionNumber || subscriptionId} skipped: already billed for period ${yyyy}-${mm}-${dd}`);
      return { invoice: existing, status: 'skipped_already_billed' };
    }

    // 4. Lines re-derivation from subscription snapshot (Never re-price against catalog)
    const rawLines = subscription.lines || [];
    let subtotal = 0;
    let taxTotal = 0;
    const appliedTaxIds = [];

    const computedLines = rawLines.map((l) => {
      const { subtotal: lineSub, taxAmount, lineTotal } = calcLine({
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        taxRate: l.taxRate || 0,
      });

      subtotal = roundMoney(subtotal + lineSub);
      taxTotal = roundMoney(taxTotal + taxAmount);

      if (l.taxId && !appliedTaxIds.some((id) => id.toString() === l.taxId.toString())) {
        appliedTaxIds.push(l.taxId);
      }

      return {
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        variantName: l.variantName,
        description: `${l.productName} (${l.planName})`,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxId: l.taxId,
        taxRate: l.taxRate || 0,
        taxAmount,
        discountAmount: 0, // Filled during discount step
        lineTotal,
      };
    });

    // 5. Automatic Discounts with race-safe atomic usage increment
    const activeDiscounts = await Discount.find({ isActive: true }).sort({ createdAt: 1 }).session(session);
    const totalQuantity = computedLines.reduce((sum, l) => sum + l.quantity, 0);
    const lineProductIds = computedLines.map((l) => l.productId);

    const appliedDiscountIds = [];
    let discountTotal = 0;

    for (const discount of activeDiscounts) {
      const eligible = isEligible(discount, {
        subtotal,
        quantity: totalQuantity,
        productIds: lineProductIds,
        now: asOfDate,
      });

      if (!eligible) continue;

      // 6. Race-safe conditional atomic usage increment
      const lockResult = await Discount.updateOne(
        {
          _id: discount._id,
          $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
        },
        { $inc: { usedCount: 1 } },
        { session }
      );

      // If matchedCount === 0, usage limit was just exhausted concurrently! Skip this discount.
      if (lockResult.matchedCount === 0) {
        logger.warn(`Discount '${discount.name}' usage limit reached during invoice generation. Dropping.`);
        continue;
      }

      appliedDiscountIds.push(discount._id);

      // Apply discount value
      let discountVal = 0;
      if (discount.appliesTo === 'products') {
        const targetIds = (discount.productIds || []).map((id) => id.toString());
        // Calculate subtotal of matching product lines
        const matchingLinesSubtotal = computedLines
          .filter((l) => targetIds.includes(l.productId.toString()))
          .reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

        discountVal = calcDiscountAmount(discount, matchingLinesSubtotal);

        // Attribute discountAmount proportionally to lines
        if (matchingLinesSubtotal > 0 && discountVal > 0) {
          computedLines.forEach((l) => {
            if (targetIds.includes(l.productId.toString())) {
              const lineBase = l.unitPrice * l.quantity;
              const share = roundMoney((lineBase / matchingLinesSubtotal) * discountVal);
              l.discountAmount = roundMoney(l.discountAmount + share);
              l.lineTotal = roundMoney(Math.max(0, l.lineTotal - share));
            }
          });
        }
      } else {
        // appliesTo === 'subscription'
        discountVal = calcDiscountAmount(discount, subtotal);
      }

      discountTotal = roundMoney(discountTotal + discountVal);
    }

    // Cap total discount at pre-discount sum
    const preDiscountTotal = roundMoney(subtotal + taxTotal);
    const cappedDiscountTotal = Math.min(preDiscountTotal, discountTotal);
    const grandTotal = roundMoney(Math.max(0, preDiscountTotal - cappedDiscountTotal));
    const amountDue = grandTotal;

    // 8. Invoice Number, Dates, Terms
    const invoiceNumber = await generateSequenceNumber('invoice', 'INV', { session });
    const paymentTermsDays = subscription.paymentTermsDays || env.DEFAULT_PAYMENT_TERMS_DAYS || 15;
    const dueDate = addDays(asOfDate, paymentTermsDays);

    const autoConfirm = env.BILLING_AUTO_CONFIRM !== false;
    const initialStatus = autoConfirm ? 'confirmed' : 'draft';

    const invoice = new Invoice({
      invoiceNumber,
      customerId: subscription.customerId,
      subscriptionId: subscription._id,
      invoiceDate: asOfDate,
      dueDate,
      billingPeriod: {
        start: periodStart,
        end: periodEnd,
      },
      lines: computedLines,
      subtotal,
      taxTotal,
      discountTotal: cappedDiscountTotal,
      grandTotal,
      amountPaid: 0,
      amountDue,
      appliedDiscountIds,
      appliedTaxIds,
      status: initialStatus,
      confirmedAt: autoConfirm ? asOfDate : null,
      billingKey,
      source,
      createdBy: userId,
    });

    await invoice.save({ session });

    // 9. Advance subscription nextBillingDate & record statusHistory
    subscription.nextBillingDate = nextCycleDate;
    subscription.lastInvoicedAt = asOfDate;
    subscription.statusHistory.push({
      action: 'invoice_generated',
      from: subscription.status,
      to: subscription.status,
      at: asOfDate,
      by: userId || subscription.createdBy,
      reason: `Invoice ${invoiceNumber} generated for period ${yyyy}-${mm}-${dd}`,
    });

    await subscription.save({ session });

    await session.commitTransaction();
    invalidateDashboardCache();
    return { invoice, status: 'generated' };
  } catch (error) {
    await session.abortTransaction();

    // 11000 duplicate key error on billingKey: treat as clean skip
    if (error.code === 11000 && error.keyPattern && error.keyPattern.billingKey) {
      return { invoice: null, status: 'skipped_already_billed' };
    }

    logger.error(`Error in generateInvoiceForSubscription (${subscriptionId}): ${error.message}`);
    return { invoice: null, status: 'failed', error: error.message };
  } finally {
    session.endSession();
  }
};

/**
 * Orchestrates a billing cycle run for all due subscriptions with catch-up logic.
 *
 * @param {Object} options - { asOf, dryRun, maxCatchupPeriods, batchSize }
 * @returns {Promise<Object>} Billing run report
 */
const runBillingCycle = async (options = {}) => {
  const startTime = Date.now();
  const {
    asOf = new Date(),
    dryRun = false,
    maxCatchupPeriods = env.BILLING_MAX_CATCHUP_PERIODS || 3,
    batchSize = env.BILLING_BATCH_SIZE || 100,
  } = options;

  const asOfDate = new Date(asOf);
  const dueThreshold = endOfDay(asOfDate);

  // Find due active subscriptions
  const dueSubscriptions = await Subscription.find({
    status: 'active',
    nextBillingDate: { $lte: dueThreshold },
  }).sort({ nextBillingDate: 1 });

  const report = {
    asOf: asOfDate.toISOString(),
    dryRun,
    scanned: dueSubscriptions.length,
    generated: 0,
    skippedAlreadyBilled: 0,
    skippedNotEligible: 0,
    failed: [],
    invoices: [],
    durationMs: 0,
  };

  if (dryRun) {
    report.durationMs = Date.now() - startTime;
    return report;
  }

  for (const sub of dueSubscriptions) {
    let catchupCount = 0;

    // Catch-up loop for subscriptions that missed periods
    while (catchupCount < maxCatchupPeriods) {
      // Re-check date eligibility
      if (new Date(sub.nextBillingDate) > dueThreshold || new Date(sub.nextBillingDate) > new Date(sub.expiryDate)) {
        break;
      }

      const result = await generateInvoiceForSubscription(sub._id, {
        asOf: asOfDate,
        source: 'auto',
      });

      if (result.status === 'generated') {
        report.generated++;
        report.invoices.push(result.invoice.invoiceNumber);
        // Refresh local sub nextBillingDate to continue catchup if still due
        sub.nextBillingDate = addBillingCycle(sub.nextBillingDate, sub.billingCycle);
        catchupCount++;
      } else if (result.status === 'skipped_already_billed') {
        report.skippedAlreadyBilled++;
        break;
      } else if (result.status === 'skipped_not_eligible') {
        report.skippedNotEligible++;
        break;
      } else if (result.status === 'failed') {
        report.failed.push({ subscriptionId: sub._id, error: result.error });
        break;
      }
    }
  }

  report.durationMs = Date.now() - startTime;
  logger.info(`[BillingCycle] Completed. Generated: ${report.generated}, Failed: ${report.failed.length}, Duration: ${report.durationMs}ms`);
  return report;
};

module.exports = {
  generateInvoiceForSubscription,
  runBillingCycle,
};
