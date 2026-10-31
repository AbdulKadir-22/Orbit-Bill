const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const dashboardService = require('./dashboard.service');

const getDashboard = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getDashboardMetrics(req.user);
  return ApiResponse.success(res, 'Dashboard metrics retrieved successfully', metrics);
});

module.exports = {
  getDashboard,
};
