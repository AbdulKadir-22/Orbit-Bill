const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const reportService = require('./report.service');

const getRevenueReport = asyncHandler(async (req, res) => {
  const report = await reportService.getRevenueReport(req.query);
  return ApiResponse.success(res, 'Revenue report retrieved successfully', report);
});

const getInvoicesSummaryReport = asyncHandler(async (req, res) => {
  const report = await reportService.getInvoicesSummaryReport(req.query);
  return ApiResponse.success(res, 'Invoices summary report retrieved successfully', report);
});

const getOutstandingReport = asyncHandler(async (req, res) => {
  const report = await reportService.getOutstandingReport(req.query);
  return ApiResponse.success(res, 'Outstanding invoices report retrieved successfully', report.invoices, report.meta);
});

const getOverdueAgingReport = asyncHandler(async (req, res) => {
  const report = await reportService.getOverdueAgingReport();
  return ApiResponse.success(res, 'Overdue aging report retrieved successfully', report);
});

const getSubscriptionsReport = asyncHandler(async (req, res) => {
  const report = await reportService.getSubscriptionsReport(req.query);
  return ApiResponse.success(res, 'Subscriptions & MRR report retrieved successfully', report);
});

const getTopCustomersReport = asyncHandler(async (req, res) => {
  const report = await reportService.getTopCustomersReport(req.query);
  return ApiResponse.success(res, 'Top customers report retrieved successfully', report);
});

const exportReportCsv = asyncHandler(async (req, res) => {
  await reportService.exportReportCsv(req.params.type, req.query, res);
});

module.exports = {
  getRevenueReport,
  getInvoicesSummaryReport,
  getOutstandingReport,
  getOverdueAgingReport,
  getSubscriptionsReport,
  getTopCustomersReport,
  exportReportCsv,
};
