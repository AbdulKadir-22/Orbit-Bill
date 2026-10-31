const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const userService = require('./user.service');

const createStaff = asyncHandler(async (req, res) => {
  const staff = await userService.createStaff(req.body, req.user._id);
  return ApiResponse.created(res, 'Staff member created successfully', staff);
});

const listStaff = asyncHandler(async (req, res) => {
  const { staffMembers, meta } = await userService.listStaff(req.query);
  return ApiResponse.success(res, 'Staff members retrieved successfully', staffMembers, meta);
});

const getStaffById = asyncHandler(async (req, res) => {
  const staff = await userService.getStaffById(req.params.id);
  return ApiResponse.success(res, 'Staff member retrieved successfully', staff);
});

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await userService.updateStaff(req.params.id, req.body);
  return ApiResponse.success(res, 'Staff member updated successfully', staff);
});

const updateStaffStatus = asyncHandler(async (req, res) => {
  const staff = await userService.updateStaffStatus(req.params.id, req.body.isActive, req.user);
  const statusLabel = staff.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, `Staff member ${statusLabel} successfully`, staff);
});

const updateStaffPermissions = asyncHandler(async (req, res) => {
  const staff = await userService.updateStaffPermissions(req.params.id, req.body.permissions);
  return ApiResponse.success(res, 'Staff permissions updated successfully', staff);
});

module.exports = {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  updateStaffPermissions,
};
