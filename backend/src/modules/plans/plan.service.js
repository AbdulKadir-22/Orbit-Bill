const Plan = require('./plan.model');
const Quotation = require('../quotations/quotation.model');
const Subscription = require('../subscriptions/subscription.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');

/**
 * Checks if a plan is referenced in quotations or subscriptions.
 *
 * @param {string} planId
 * @returns {Promise<boolean>}
 */
const isReferenced = async (planId) => {
  const [quoteCount, subCount] = await Promise.all([
    Quotation.countDocuments({ 'lines.planId': planId }),
    Subscription.countDocuments({ 'lines.planId': planId }),
  ]);
  return (quoteCount + subCount) > 0;
};

/**
 * Service helper: checks if a plan is currently available.
 * @param {Object} plan
 * @param {Date} [now]
 * @returns {boolean}
 */
const isAvailableNow = (plan, now = new Date()) => {
  if (!plan || !plan.isActive) {
    return false;
  }

  const checkTime = now.getTime();

  if (plan.availableFrom && checkTime < new Date(plan.availableFrom).getTime()) {
    return false;
  }

  if (plan.availableTo && checkTime > new Date(plan.availableTo).getTime()) {
    return false;
  }

  return true;
};

const createPlan = async (data, userId) => {
  const plan = await Plan.create({
    ...data,
    createdBy: userId,
  });
  return plan;
};

const listPlans = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.billingCycle) {
    filter.billingCycle = query.billingCycle;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const now = new Date();
  if (query.available === true) {
    filter.isActive = true;
    filter.$and = [
      {
        $or: [
          { availableFrom: null },
          { availableFrom: { $lte: now } },
        ],
      },
      {
        $or: [
          { availableTo: null },
          { availableTo: { $gte: now } },
        ],
      },
    ];
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['name']);
    Object.assign(filter, searchFilter);
  }

  const [plans, total] = await Promise.all([
    Plan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Plan.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { plans, meta };
};

const getPlanById = async (id) => {
  const plan = await Plan.findById(id).populate('createdBy', 'name email');
  if (!plan) {
    throw ApiError.notFound('Plan not found');
  }
  return plan;
};

const updatePlan = async (id, updateData) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Plan not found');
  }

  Object.assign(plan, updateData);
  await plan.save();
  return plan;
};

const updatePlanStatus = async (id, isActive) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Plan not found');
  }

  plan.isActive = isActive;
  await plan.save();
  return plan;
};

const deletePlan = async (id) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Plan not found');
  }

  const referenced = await isReferenced(id);
  if (referenced) {
    plan.isActive = false;
    await plan.save();
    return { plan, hardDeleted: false, message: 'Plan is referenced by subscriptions; soft-deleted (deactivated).' };
  }

  await Plan.findByIdAndDelete(id);
  return { plan, hardDeleted: true, message: 'Plan deleted permanently.' };
};

module.exports = {
  isReferenced,
  isAvailableNow,
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  updatePlanStatus,
  deletePlan,
};
