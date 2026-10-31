const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const subscriptionService = require('./subscription.service');

const createSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.createSubscription(req.body, req.user);
  return ApiResponse.created(res, 'Subscription created successfully in draft status', subscription);
});

const listSubscriptions = asyncHandler(async (req, res) => {
  const { subscriptions, meta } = await subscriptionService.listSubscriptions(req.query, req.user);
  return ApiResponse.success(res, 'Subscriptions retrieved successfully', subscriptions, meta);
});

const getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
  return ApiResponse.success(res, 'Subscription details retrieved successfully', subscription);
});

const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const history = await subscriptionService.getSubscriptionHistory(req.params.id, req.user);
  return ApiResponse.success(res, 'Subscription timeline retrieved successfully', history);
});

const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.updateSubscription(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Subscription updated successfully', subscription);
});

const moveToQuotation = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.moveToQuotation(req.params.id, req.user);
  return ApiResponse.success(res, 'Subscription moved to quotation status', subscription);
});

const confirmSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.confirmSubscription(req.params.id, req.user);
  return ApiResponse.success(res, 'Subscription confirmed', subscription);
});

const activateSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.activateSubscription(req.params.id, req.user);
  return ApiResponse.success(res, 'Subscription activated successfully', subscription);
});

const pauseSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.pauseSubscription(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Subscription paused successfully', subscription);
});

const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.resumeSubscription(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Subscription resumed successfully', subscription);
});

const renewSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.renewSubscription(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Subscription renewed successfully', subscription);
});

const closeSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.closeSubscription(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Subscription closed successfully', subscription);
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.cancelSubscription(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Subscription cancelled successfully', subscription);
});

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
