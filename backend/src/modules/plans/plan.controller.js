const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const planService = require('./plan.service');

const createPlan = asyncHandler(async (req, res) => {
  const plan = await planService.createPlan(req.body, req.user._id);
  return ApiResponse.created(res, 'Plan created successfully', plan);
});

const listPlans = asyncHandler(async (req, res) => {
  const { plans, meta } = await planService.listPlans(req.query);
  return ApiResponse.success(res, 'Plans retrieved successfully', plans, meta);
});

const getPlanById = asyncHandler(async (req, res) => {
  const plan = await planService.getPlanById(req.params.id);
  return ApiResponse.success(res, 'Plan retrieved successfully', plan);
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  return ApiResponse.success(res, 'Plan updated successfully', plan);
});

const updatePlanStatus = asyncHandler(async (req, res) => {
  const plan = await planService.updatePlanStatus(req.params.id, req.body.isActive);
  const statusLabel = plan.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, `Plan ${statusLabel} successfully`, plan);
});

const deletePlan = asyncHandler(async (req, res) => {
  const result = await planService.deletePlan(req.params.id);
  return ApiResponse.success(res, result.message, result.plan);
});

module.exports = {
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  updatePlanStatus,
  deletePlan,
};
