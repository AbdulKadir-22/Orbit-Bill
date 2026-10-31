const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const quotationService = require('./quotation.service');

const createQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.createQuotation(req.body, req.user);
  return ApiResponse.created(res, 'Quotation created successfully', quotation);
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await quotationService.createTemplate(req.body, req.user);
  return ApiResponse.created(res, 'Quotation template created successfully', template);
});

const listTemplates = asyncHandler(async (req, res) => {
  const { templates, meta } = await quotationService.listTemplates(req.query);
  return ApiResponse.success(res, 'Quotation templates retrieved successfully', templates, meta);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await quotationService.updateTemplate(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Quotation template updated successfully', template);
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await quotationService.deleteTemplate(req.params.id);
  return ApiResponse.success(res, 'Quotation template deleted successfully', template);
});

const createFromTemplate = asyncHandler(async (req, res) => {
  const quotation = await quotationService.createFromTemplate(req.params.templateId, req.body, req.user);
  return ApiResponse.created(res, 'Quotation created from template successfully', quotation);
});

const listQuotations = asyncHandler(async (req, res) => {
  const { quotations, meta } = await quotationService.listQuotations(req.query, req.user);
  return ApiResponse.success(res, 'Quotations retrieved successfully', quotations, meta);
});

const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await quotationService.getQuotationById(req.params.id, req.user);
  return ApiResponse.success(res, 'Quotation retrieved successfully', quotation);
});

const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotation(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Quotation updated successfully', quotation);
});

const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.deleteQuotation(req.params.id);
  return ApiResponse.success(res, 'Quotation deleted successfully', quotation);
});

const sendQuotation = asyncHandler(async (req, res) => {
  const { quotation, emailSent } = await quotationService.sendQuotation(req.params.id);
  return ApiResponse.success(res, 'Quotation marked as sent', { quotation, emailSent });
});

const rejectQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.rejectQuotation(req.params.id, req.body.reason);
  return ApiResponse.success(res, 'Quotation rejected successfully', quotation);
});

const convertQuotation = asyncHandler(async (req, res) => {
  const result = await quotationService.convertQuotation(req.params.id, req.body, req.user);
  return ApiResponse.created(res, 'Quotation converted into subscription successfully', result);
});

const calculatePreview = asyncHandler(async (req, res) => {
  const result = await quotationService.calculatePreview(req.body.lines, req.user);
  return ApiResponse.success(res, 'Calculation preview computed', result);
});

module.exports = {
  createQuotation,
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  createFromTemplate,
  listQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
  rejectQuotation,
  convertQuotation,
  calculatePreview,
};
