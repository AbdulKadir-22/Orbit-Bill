const cron = require('node-cron');
const JobLock = require('../jobs/jobLock.model');
const { runBillingCycle } = require('./billing.engine');
const logger = require('../../config/logger');
const env = require('../../config/env');

const BILLING_LOCK_KEY = 'billing_cycle_cron_job';

/**
 * Executes scheduled billing run guarded by distributed atomic JobLock.
 */
const executeScheduledBilling = async () => {
  const acquired = await JobLock.acquireLock(BILLING_LOCK_KEY, 30 * 60 * 1000); // 30 mins TTL
  if (!acquired) {
    logger.warn('[BillingJobs] Distributed lock active on another instance. Skipping run.');
    return;
  }

  try {
    logger.info('[BillingJobs] Acquired distributed lock. Executing billing cycle...');
    const report = await runBillingCycle({ asOf: new Date() });
    logger.info(`[BillingJobs] Automated billing cycle completed: ${JSON.stringify(report)}`);
  } catch (err) {
    logger.error(`[BillingJobs] Error executing automated billing cycle: ${err.message}`);
  } finally {
    await JobLock.releaseLock(BILLING_LOCK_KEY);
    logger.info('[BillingJobs] Released distributed lock.');
  }
};

/**
 * Initializes node-cron schedule for automatic billing.
 */
const initBillingCron = () => {
  const schedule = env.BILLING_CRON_SCHEDULE || '0 1 * * *';
  logger.info(`[BillingJobs] Scheduling billing engine cron with pattern: '${schedule}'`);

  cron.schedule(schedule, async () => {
    logger.info('[BillingJobs] Billing cron trigger fired.');
    await executeScheduledBilling();
  });
};

module.exports = {
  executeScheduledBilling,
  initBillingCron,
};
