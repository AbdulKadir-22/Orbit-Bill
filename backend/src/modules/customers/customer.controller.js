const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const customerService = require('./customer.service');
const Customer = require('./customer.model');

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user._id);
  return ApiResponse.created(res, 'Customer created successfully', customer);
});

const listCustomers = asyncHandler(async (req, res) => {
  const { customers, meta } = await customerService.listCustomers(req.query);
  return ApiResponse.success(res, 'Customers retrieved successfully', customers, meta);
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return ApiResponse.success(res, 'Customer retrieved successfully', customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  return ApiResponse.success(res, 'Customer updated successfully', customer);
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomerStatus(req.params.id, req.body.isActive);
  const statusLabel = customer.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, `Customer ${statusLabel} successfully`, customer);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const result = await customerService.deleteCustomer(req.params.id);
  return ApiResponse.success(res, result.message, result.customer);
});

const createPortalAccount = asyncHandler(async (req, res) => {
  const portalUser = await customerService.createPortalAccount(req.params.id, req.user._id);
  return ApiResponse.created(res, 'Portal account created and set-password email dispatched', portalUser);
});

const getCustomerSummary = asyncHandler(async (req, res) => {
  const summary = await customerService.getCustomerSummary(req.params.id);
  return ApiResponse.success(res, 'Customer summary retrieved successfully', summary);
});

// Self-service for logged-in customer portal user
const getCustomerMe = asyncHandler(async (req, res) => {
  if (!req.user.customerId) {
    throw ApiError.notFound('No customer profile linked to your user account');
  }

  const customer = await customerService.getCustomerById(req.user.customerId);
  return ApiResponse.success(res, 'Customer profile retrieved', customer);
});

const updateCustomerMe = asyncHandler(async (req, res) => {
  if (!req.user.customerId) {
    throw ApiError.notFound('No customer profile linked to your user account');
  }

  // Customers can only edit name, phone, company, gstin, address (never isActive, notes, createdBy)
  const allowedUpdates = {
    name: req.body.name,
    phone: req.body.phone,
    company: req.body.company,
    gstin: req.body.gstin,
    address: req.body.address,
  };

  // Remove undefined keys
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  const customer = await customerService.updateCustomer(req.user.customerId, allowedUpdates);
  return ApiResponse.success(res, 'Profile updated successfully', customer);
});

module.exports = {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  createPortalAccount,
  getCustomerSummary,
  getCustomerMe,
  updateCustomerMe,
};
