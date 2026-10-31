const Subscription = require('./subscription.model');
const Quotation = require('../quotations/quotation.model');
const Customer = require('../customers/customer.model');
const Plan = require('../plans/plan.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const { buildLines } = require('../../utils/lineBuilder');
const { generateSequenceNumber } = require('../../utils/numberGenerator');
const { assertTransition, canTransition } = require('./subscription.stateMachine');
const { addBillingCycle, addDays, isPast, startOfDay } = require('../../utils/dates');
const ROLES = require('../../constants/roles');
const env = require('../../config/env');

const createSubscription = async (data, user) => {
  const customer = await Customer.findById(data.customerId);
  if (!customer || !customer.isActive) {
    throw ApiError.badRequest('Invalid or inactive customer specified');
  }

  const { lines, subtotal, taxTotal, grandTotal, billingCycle } = await buildLines(
    data.lines,
    { user }
  );

  const subscriptionNumber = await generateSequenceNumber('subscription', 'SUB');
  const resolvedPaymentTerms = data.paymentTerms || 'Net 15';
  const paymentDaysMatch = resolvedPaymentTerms.match(/\d+/);
  const paymentTermsDays = paymentDaysMatch ? parseInt(paymentDaysMatch[0], 10) : (env.DEFAULT_PAYMENT_TERMS_DAYS || 15);

  const subscription = await Subscription.create({
    subscriptionNumber,
    customerId: customer._id,
    lines,
    billingCycle,
    startDate: new Date(data.startDate),
    expiryDate: new Date(data.expiryDate),
    paymentTerms: resolvedPaymentTerms,
    paymentTermsDays,
    status: 'draft',
    subtotal,
    taxTotal,
    grandTotal,
    statusHistory: [
      {
        action: 'create',
        from: null,
        to: 'draft',
        at: new Date(),
        by: user._id,
        reason: 'Manually created draft subscription',
      },
    ],
    createdBy: user._id,
  });

  return subscription;
};

const listSubscriptions = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  // Customer scoping: Customers only see their own subscriptions
  if (user.role === ROLES.CUSTOMER) {
    if (!user.customerId) {
      return { subscriptions: [], meta: buildPaginationMeta(0, page, limit) };
    }
    filter.customerId = user.customerId;
  } else {
    // Admin / Staff filters
    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.status) {
      filter.status = query.status;
    }
  }

  if (query.billingCycle) {
    filter.billingCycle = query.billingCycle;
  }

  const now = new Date();
  if (query.expiringInDays) {
    const thresholdDate = addDays(now, query.expiringInDays);
    filter.expiryDate = { $gte: now, $lte: thresholdDate };
    filter.status = { $in: ['active', 'confirmed', 'paused'] };
  }

  if (query.expired === true) {
    filter.expiryDate = { $lt: now };
    filter.status = { $in: ['active', 'paused'] }; // expired-pending filter
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['subscriptionNumber']);
    Object.assign(filter, searchFilter);
  }

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email company')
      .populate('createdBy', 'name email'),
    Subscription.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return { subscriptions, meta };
};

const getSubscriptionById = async (id, user) => {
  const subscription = await Subscription.findById(id)
    .populate('customerId', 'name email company phone address')
    .populate('statusHistory.by', 'name email')
    .populate('createdBy', 'name email');

  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  // Customer scoping: Customers can only access their own records
  if (user.role === ROLES.CUSTOMER) {
    if (!user.customerId || subscription.customerId?._id.toString() !== user.customerId.toString()) {
      throw ApiError.notFound('Subscription not found');
    }
  }

  return subscription;
};

const getSubscriptionHistory = async (id, user) => {
  const subscription = await getSubscriptionById(id, user);
  return subscription.statusHistory;
};

const updateSubscription = async (id, updateData, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  // In active or paused: allow quantity-only line changes
  if (['active', 'paused'].includes(subscription.status)) {
    if (updateData.lines && updateData.lines.length > 0) {
      if (updateData.lines.length !== subscription.lines.length) {
        throw ApiError.badRequest('In active/paused subscriptions, line items cannot be added or removed, only quantity adjusted');
      }

      for (let i = 0; i < updateData.lines.length; i++) {
        const newLine = updateData.lines[i];
        const existingLine = subscription.lines[i];
        existingLine.quantity = newLine.quantity;
        existingLine.lineSubtotal = existingLine.unitPrice * newLine.quantity;
        existingLine.taxAmount = existingLine.lineSubtotal * (existingLine.taxRate / 100);
        existingLine.lineTotal = existingLine.lineSubtotal + existingLine.taxAmount;
      }

      subscription.subtotal = subscription.lines.reduce((sum, l) => sum + l.lineSubtotal, 0);
      subscription.taxTotal = subscription.lines.reduce((sum, l) => sum + l.taxAmount, 0);
      subscription.grandTotal = subscription.subtotal + subscription.taxTotal;

      subscription.statusHistory.push({
        action: 'quantity_adjustment',
        from: subscription.status,
        to: subscription.status,
        at: new Date(),
        by: user._id,
        reason: 'Quantity adjusted on active/paused subscription (applies from next invoice)',
      });

      await subscription.save();
      return subscription;
    }
    throw ApiError.badRequest(`Header fields cannot be edited while in '${subscription.status}' status`);
  }

  // Only draft, quotation, or confirmed can have full edits
  if (!['draft', 'quotation', 'confirmed'].includes(subscription.status)) {
    throw ApiError.badRequest(`Subscription cannot be edited in '${subscription.status}' status`);
  }

  if (updateData.startDate) subscription.startDate = new Date(updateData.startDate);
  if (updateData.expiryDate) subscription.expiryDate = new Date(updateData.expiryDate);
  if (updateData.paymentTerms) subscription.paymentTerms = updateData.paymentTerms;
  if (updateData.paymentTermsDays !== undefined) subscription.paymentTermsDays = updateData.paymentTermsDays;

  if (updateData.lines && updateData.lines.length > 0) {
    const calculated = await buildLines(updateData.lines, { user });
    subscription.lines = calculated.lines;
    subscription.billingCycle = calculated.billingCycle;
    subscription.subtotal = calculated.subtotal;
    subscription.taxTotal = calculated.taxTotal;
    subscription.grandTotal = calculated.grandTotal;
  }

  await subscription.save();
  return subscription;
};

// Lifecycle transition helper
const transitionSubscription = async (id, toStatus, actionName, user, reason = '') => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  assertTransition(subscription.status, toStatus, `Cannot perform action '${actionName}'`);

  const fromStatus = subscription.status;
  subscription.status = toStatus;
  subscription.statusHistory.push({
    action: actionName,
    from: fromStatus,
    to: toStatus,
    at: new Date(),
    by: user._id,
    reason: reason || `Transitioned from ${fromStatus} to ${toStatus} via ${actionName}`,
  });

  await subscription.save();
  return subscription;
};

const moveToQuotation = async (id, user) => {
  return transitionSubscription(id, 'quotation', 'quote', user);
};

const confirmSubscription = async (id, user) => {
  return transitionSubscription(id, 'confirmed', 'confirm', user);
};

/**
 * Activates subscription: sets nextBillingDate = startDate.
 * Accepts startDate in the past and flags for Phase 4 backfill.
 */
const activateSubscription = async (id, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  assertTransition(subscription.status, 'active', 'Cannot activate subscription');

  const fromStatus = subscription.status;
  subscription.status = 'active';
  subscription.nextBillingDate = subscription.startDate; // First invoice due on start date

  subscription.statusHistory.push({
    action: 'activate',
    from: fromStatus,
    to: 'active',
    at: new Date(),
    by: user._id,
    reason: 'Subscription activated. First billing scheduled for startDate.',
  });

  await subscription.save();
  return subscription;
};

const pauseSubscription = async (id, { reason, force }, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  assertTransition(subscription.status, 'paused', 'Cannot pause subscription');

  // Verify plan rule: every line plan must have allowPause
  if (!force) {
    const planIds = subscription.lines.map((l) => l.planId);
    const plans = await Plan.find({ _id: { $in: planIds } });
    const disallowed = plans.some((p) => p.allowPause === false);
    if (disallowed) {
      throw ApiError.badRequest(
        'One or more plans in this subscription disallow pausing. Admin may pass force=true to override.'
      );
    }
  }

  const fromStatus = subscription.status;
  subscription.status = 'paused';
  subscription.pausedAt = new Date();

  subscription.statusHistory.push({
    action: 'pause',
    from: fromStatus,
    to: 'paused',
    at: new Date(),
    by: user._id,
    reason: reason || (force ? 'Paused with admin force override' : 'Paused by operator'),
  });

  await subscription.save();
  return subscription;
};

const resumeSubscription = async (id, { reason }, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  assertTransition(subscription.status, 'active', 'Cannot resume subscription');

  const now = new Date();
  if (subscription.pausedAt) {
    const diffMs = now.getTime() - new Date(subscription.pausedAt).getTime();
    const pausedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    subscription.totalPausedDays = (subscription.totalPausedDays || 0) + pausedDays;
    subscription.pausedAt = null;
  }

  // Ensure no backlog of invoices: nextBillingDate = max(nextBillingDate, today)
  if (subscription.nextBillingDate && subscription.nextBillingDate < now) {
    subscription.nextBillingDate = now;
  }

  const fromStatus = subscription.status;
  subscription.status = 'active';

  subscription.statusHistory.push({
    action: 'resume',
    from: fromStatus,
    to: 'active',
    at: new Date(),
    by: user._id,
    reason: reason || 'Subscription resumed from pause',
  });

  await subscription.save();
  return subscription;
};

const renewSubscription = async (id, { periods = 1, reason, force }, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  if (!['active', 'paused'].includes(subscription.status)) {
    throw ApiError.badRequest(`Subscription in '${subscription.status}' status cannot be renewed. Must be active or paused.`);
  }

  if (!force) {
    const planIds = subscription.lines.map((l) => l.planId);
    const plans = await Plan.find({ _id: { $in: planIds } });
    const disallowed = plans.some((p) => p.allowRenewal === false);
    if (disallowed) {
      throw ApiError.badRequest('One or more plans in this subscription do not allow renewal. Admin may pass force=true to override.');
    }
  }

  // Extend expiryDate by periods × billingCycle
  const newExpiry = addBillingCycle(subscription.expiryDate, subscription.billingCycle, periods);
  subscription.expiryDate = newExpiry;
  subscription.renewalCount = (subscription.renewalCount || 0) + 1;

  subscription.statusHistory.push({
    action: 'renew',
    from: subscription.status,
    to: subscription.status,
    at: new Date(),
    by: user._id,
    reason: reason || `Renewed for ${periods} period(s). New expiry: ${newExpiry.toISOString()}` + (force ? ' (Admin Force)' : ''),
  });

  await subscription.save();
  return subscription;
};

const closeSubscription = async (id, { reason, force }, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  assertTransition(subscription.status, 'closed', 'Cannot close subscription');

  if (!force) {
    const planIds = subscription.lines.map((l) => l.planId);
    const plans = await Plan.find({ _id: { $in: planIds } });
    const disallowed = plans.some((p) => p.allowEarlyClose === false);
    if (disallowed) {
      throw ApiError.badRequest('One or more plans disallow early closing. Admin may pass force=true to override.');
    }
  }

  const fromStatus = subscription.status;
  subscription.status = 'closed';
  subscription.closedAt = new Date();
  subscription.closeReason = reason;
  subscription.closeType = 'early';
  subscription.nextBillingDate = null;

  subscription.statusHistory.push({
    action: 'close',
    from: fromStatus,
    to: 'closed',
    at: new Date(),
    by: user._id,
    reason: reason + (force ? ' (Admin Force)' : ''),
  });

  await subscription.save();
  return subscription;
};

const cancelSubscription = async (id, { reason }, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  if (!['draft', 'quotation', 'confirmed'].includes(subscription.status)) {
    throw ApiError.badRequest(`Cannot cancel subscription in '${subscription.status}' status. Only draft, quotation, or confirmed can be cancelled.`);
  }

  const fromStatus = subscription.status;
  subscription.status = 'closed';
  subscription.closedAt = new Date();
  subscription.closeReason = reason || 'Cancelled by operator';
  subscription.closeType = 'manual';
  subscription.nextBillingDate = null;

  subscription.statusHistory.push({
    action: 'cancel',
    from: fromStatus,
    to: 'closed',
    at: new Date(),
    by: user._id,
    reason: reason || 'Subscription cancelled before activation',
  });

  await subscription.save();
  return subscription;
};

module.exports = {
  createSubscription,
  listSubscriptions,
  getSubscriptionById,
  getSubscriptionHistory,
  updateSubscription,
  moveToQuotation,
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscription,
  cancelSubscription,
};
