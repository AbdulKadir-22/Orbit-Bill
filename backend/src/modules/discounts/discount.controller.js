const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const discountService = require('./discount.service');

const createDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.createDiscount(req.body, req.user._id);
  return ApiResponse.created(res, 'Discount created successfully', discount);
});

const listDiscounts = asyncHandler(async (req, res) => {
  const { discounts, meta } = await discountService.listDiscounts(req.query);
  return ApiResponse.success(res, 'Discounts retrieved successfully', discounts, meta);
});

const getDiscountById = asyncHandler(async (req, res) => {
  const discount = await discountService.getDiscountById(req.params.id);
  return ApiResponse.success(res, 'Discount retrieved successfully', discount);
});

const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.updateDiscount(req.params.id, req.body);
  return ApiResponse.success(res, 'Discount updated successfully', discount);
});

const updateDiscountStatus = asyncHandler(async (req, res) => {
  const discount = await discountService.updateDiscountStatus(req.params.id, req.body.isActive);
  const statusLabel = discount.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, `Discount ${statusLabel} successfully`, discount);
});

const deleteDiscount = asyncHandler(async (req, res) => {
  const result = await discountService.deleteDiscount(req.params.id);
  return ApiResponse.success(res, result.message, result.discount);
});

module.exports = {
  createDiscount,
  listDiscounts,
  getDiscountById,
  updateDiscount,
  updateDiscountStatus,
  deleteDiscount,
};
