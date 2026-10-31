const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const invoiceService = require('./invoice.service');
const { runBillingCycle, generateInvoiceForSubscription } = require('./billing.engine');
const { generateInvoicePdf } = require('./invoice.pdf.js');

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user);
  return ApiResponse.created(res, 'Invoice created successfully', invoice);
});

const listInvoices = asyncHandler(async (req, res) => {
  const { invoices, meta } = await invoiceService.listInvoices(req.query);
  return ApiResponse.success(res, 'Invoices retrieved successfully', invoices, meta);
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
  return ApiResponse.success(res, 'Invoice details retrieved successfully', invoice);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Invoice updated successfully', invoice);
});

const confirmInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.confirmInvoice(req.params.id, req.user);
  return ApiResponse.success(res, 'Invoice confirmed successfully', invoice);
});

const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.cancelInvoice(req.params.id, req.body.reason, req.user);
  return ApiResponse.success(res, 'Invoice cancelled and discount usage restored', invoice);
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.deleteInvoice(req.params.id);
  return ApiResponse.success(res, 'Invoice deleted successfully', invoice);
});

const sendInvoice = asyncHandler(async (req, res) => {
  const { invoice, emailSent } = await invoiceService.sendInvoice(req.params.id);
  return ApiResponse.success(res, 'Invoice marked as sent', { invoice, emailSent });
});

const streamInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  const download = req.query.download === 'true';
  generateInvoicePdf(invoice, res, download);
});

const runBilling = asyncHandler(async (req, res) => {
  const report = await runBillingCycle({
    asOf: req.body.asOf,
    dryRun: req.body.dryRun,
  });
  return ApiResponse.success(res, 'Billing cycle executed successfully', report);
});

const generateSubscriptionInvoice = asyncHandler(async (req, res) => {
  const result = await generateInvoiceForSubscription(req.params.id, {
    asOf: new Date(),
    source: 'manual',
    userId: req.user._id,
  });

  if (result.status === 'failed') {
    return res.status(400).json({ success: false, message: result.error });
  }

  return ApiResponse.success(res, `Subscription invoice generation: ${result.status}`, result);
});

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceById,
  updateInvoice,
  confirmInvoice,
  cancelInvoice,
  deleteInvoice,
  sendInvoice,
  streamInvoicePdf,
  runBilling,
  generateSubscriptionInvoice,
};
