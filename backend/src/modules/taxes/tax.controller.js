const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const taxService = require('./tax.service');

const createTax = asyncHandler(async (req, res) => {
  const tax = await taxService.createTax(req.body, req.user._id);
  return ApiResponse.created(res, 'Tax created successfully', tax);
});

const listTaxes = asyncHandler(async (req, res) => {
  const { taxes, meta } = await taxService.listTaxes(req.query);
  return ApiResponse.success(res, 'Taxes retrieved successfully', taxes, meta);
});

const getTaxById = asyncHandler(async (req, res) => {
  const tax = await taxService.getTaxById(req.params.id);
  return ApiResponse.success(res, 'Tax retrieved successfully', tax);
});

const updateTax = asyncHandler(async (req, res) => {
  const tax = await taxService.updateTax(req.params.id, req.body);
  return ApiResponse.success(res, 'Tax updated successfully', tax);
});

const updateTaxStatus = asyncHandler(async (req, res) => {
  const tax = await taxService.updateTaxStatus(req.params.id, req.body.isActive);
  const statusLabel = tax.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, `Tax ${statusLabel} successfully`, tax);
});

const deleteTax = asyncHandler(async (req, res) => {
  const result = await taxService.deleteTax(req.params.id);
  return ApiResponse.success(res, result.message, result.tax);
});

module.exports = {
  createTax,
  listTaxes,
  getTaxById,
  updateTax,
  updateTaxStatus,
  deleteTax,
};
