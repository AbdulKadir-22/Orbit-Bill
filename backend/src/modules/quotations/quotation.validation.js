const { z } = require('zod');

const lineInputSchema = z.object({
  productId: z.string({ required_error: 'productId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid productId format'),
  variantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid variantId format').nullable().optional(),
  planId: z.string({ required_error: 'planId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid planId format'),
  quantity: z.number({ required_error: 'quantity is required' }).int().min(1, 'Quantity must be an integer ≥ 1'),
  taxId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid taxId format').nullable().optional(),
  unitPriceOverride: z.number().min(0, 'unitPriceOverride must be ≥ 0').nullable().optional(),
});

const createQuotationValidation = {
  body: z.object({
    customerId: z.string({ required_error: 'customerId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid customerId format'),
    lines: z.array(lineInputSchema).min(1, 'At least one line item is required'),
    validityDays: z.number().int().min(1).default(30),
    notes: z.string().trim().optional().default(''),
  }),
};

const createTemplateValidation = {
  body: z.object({
    templateName: z.string({ required_error: 'templateName is required' }).trim().min(2, 'templateName must be at least 2 characters'),
    lines: z.array(lineInputSchema).min(1, 'At least one line item is required'),
    validityDays: z.number().int().min(1).default(30),
    notes: z.string().trim().optional().default(''),
  }),
};

const fromTemplateValidation = {
  params: z.object({
    templateId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid templateId format'),
  }),
  body: z.object({
    customerId: z.string({ required_error: 'customerId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid customerId format'),
    validityDays: z.number().int().min(1).optional(),
    notes: z.string().trim().optional(),
  }),
};

const updateQuotationValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quotation ID format'),
  }),
  body: z.object({
    lines: z.array(lineInputSchema).min(1).optional(),
    validityDays: z.number().int().min(1).optional(),
    notes: z.string().trim().optional(),
  }),
};

const updateTemplateValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid template ID format'),
  }),
  body: z.object({
    templateName: z.string().trim().min(2).optional(),
    lines: z.array(lineInputSchema).min(1).optional(),
    validityDays: z.number().int().min(1).optional(),
    notes: z.string().trim().optional(),
  }),
};

const rejectQuotationValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quotation ID format'),
  }),
  body: z.object({
    reason: z.string().trim().optional().default(''),
  }),
};

const convertQuotationValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quotation ID format'),
  }),
  body: z.object({
    startDate: z.string({ required_error: 'startDate is required' }).datetime(),
    expiryDate: z.string({ required_error: 'expiryDate is required' }).datetime(),
    paymentTerms: z.string().trim().optional(),
  }).superRefine((data, ctx) => {
    if (new Date(data.expiryDate) <= new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'expiryDate must be strictly after startDate',
      });
    }
  }),
};

const quotationIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quotation ID format'),
  }),
};

const listQuotationsValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.enum(['draft', 'sent', 'confirmed', 'rejected', 'expired']).optional(),
    customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    isTemplate: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().default(false)),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

module.exports = {
  lineInputSchema,
  createQuotationValidation,
  createTemplateValidation,
  fromTemplateValidation,
  updateQuotationValidation,
  updateTemplateValidation,
  rejectQuotationValidation,
  convertQuotationValidation,
  quotationIdParamValidation,
  listQuotationsValidation,
};
