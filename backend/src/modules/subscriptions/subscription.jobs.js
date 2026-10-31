const cron = require('node-cron');
const Subscription = require('./subscription.model');
const Quotation = require('../quotations/quotation.model');
const Plan = require('../plans/plan.model');
const logger = require('../../config/logger');
const env = require('../../config/env');

let isJobRunning = false;

/**
 * Runs subscription auto-close and quotation expiration processing.
 * Idempotent, safe to run repeatedly, protected by an in-process lock flag.
 *
 * @param {Object} [options] - Optional trigger metadata
 * @returns {Promise<{
 *   closedSubscriptionsCount: number,
 *   expiredQuotationsCount: number,
 *   skippedRunning: boolean
 * }>}
 */
const runSubscriptionJobs = async (options = {}) => {
  if (isJobRunning) {
    logger.warn('[SubscriptionJobs] Job is already running. Skipping overlapping execution.');
    return { closedSubscriptionsCount: 0, expiredQuotationsCount: 0, skippedRunning: true };
  }

  isJobRunning = true;
  const now = new Date();
  logger.info(`[SubscriptionJobs] Starting automated jobs run at ${now.toISOString()}`);

  let closedSubscriptionsCount = 0;
  let expiredQuotationsCount = 0;

  try {
    // 1. Process Auto-Close for Expired Subscriptions
    // Target: status in ['active', 'paused'] with expiryDate <= now
    const candidateSubscriptions = await Subscription.find({
      status: { $in: ['active', 'paused'] },
      expiryDate: { $lte: now },
    });

    for (const sub of candidateSubscriptions) {
      const planIds = sub.lines.map((l) => l.planId);
      const plans = await Plan.find({ _id: { $in: planIds } });

      // Only auto-close if EVERY line's plan has autoClose === true
      const allAutoClose = plans.length > 0 && plans.every((p) => p.autoClose === true);

      if (allAutoClose) {
        sub.status = 'closed';
        sub.closedAt = now;
        sub.closeType = 'auto';
        sub.closeReason = 'Auto-closed on expiry';
        sub.nextBillingDate = null;
        sub.statusHistory.push({
          action: 'auto_close',
          from: sub.status,
          to: 'closed',
          at: now,
          by: sub.createdBy, // attributed to system/creator
          reason: 'Auto-closed on expiry',
        });

        await sub.save();
        closedSubscriptionsCount++;
      }
    }

    // 2. Process Expired Quotations
    // Target: status 'sent' with validUntil <= now
    const expiredQuotes = await Quotation.find({
      status: 'sent',
      validUntil: { $lte: now },
      isTemplate: false,
    });

    for (const quote of expiredQuotes) {
      quote.status = 'expired';
      await quote.save();
      expiredQuotationsCount++;
    }

    logger.info(
      `[SubscriptionJobs] Finished. Auto-closed subscriptions: ${closedSubscriptionsCount}, Expired quotations: ${expiredQuotationsCount}`
    );
  } catch (error) {
    logger.error(`[SubscriptionJobs] Error during automated jobs execution: ${error.message}`);
  } finally {
    isJobRunning = false;
  }

  return {
    closedSubscriptionsCount,
    expiredQuotationsCount,
    skippedRunning: false,
  };
};

/**
 * Initializes node-cron schedule using env.SUBSCRIPTION_CRON_SCHEDULE.
 */
const initSubscriptionCron = () => {
  const schedule = env.SUBSCRIPTION_CRON_SCHEDULE || '30 0 * * *';
  logger.info(`[SubscriptionJobs] Scheduling subscription cron with pattern: '${schedule}'`);

  cron.schedule(schedule, async () => {
    logger.info('[SubscriptionJobs] Cron trigger fired.');
    await runSubscriptionJobs();
  });
};

module.exports = {
  runSubscriptionJobs,
  initSubscriptionCron,
};
