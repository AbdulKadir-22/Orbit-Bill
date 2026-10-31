const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const paymentService = require('./payment.service');

const recordPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.recordPayment(req.body, req.user);
  return ApiResponse.created(res, 'Payment recorded successfully', result.payment);
});

const listPayments = asyncHandler(async (req, res) => {
  const { payments, meta } = await paymentService.listPayments(req.query);
  return ApiResponse.success(res, 'Payments retrieved successfully', payments, meta);
});

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  return ApiResponse.success(res, 'Payment details retrieved successfully', payment);
});

const updatePayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.updatePayment(req.params.id, req.body);
  return ApiResponse.success(res, 'Payment updated successfully', payment);
});

const voidPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.voidPayment(req.params.id, req.body.reason, req.user);
  return ApiResponse.success(res, 'Payment voided successfully', result);
});

module.exports = {
  recordPayment,
  listPayments,
  getPaymentById,
  updatePayment,
  voidPayment,
};
