const { z } = require('zod');
const { lineInputSchema } = require('../quotations/quotation.validation');

const createSubscriptionValidation = {
  body: z.object({
    customerId: z.string({ required_error: 'customerId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid customerId format'),
    lines: z.array(lineInputSchema).min(1, 'At least one line item is required'),
    startDate: z.string({ required_error: 'startDate is required' }).datetime(),
    expiryDate: z.string({ required_error: 'expiryDate is required' }).datetime(),
    paymentTerms: z.string().trim().optional().default('Net 15'),
    paymentTermsDays: z.number().int().min(0).optional(),
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

const updateSubscriptionValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
  body: z.object({
    lines: z.array(lineInputSchema).min(1).optional(),
    startDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    paymentTerms: z.string().trim().optional(),
    paymentTermsDays: z.number().int().min(0).optional(),
  }).superRefine((data, ctx) => {
    if (data.startDate && data.expiryDate) {
      if (new Date(data.expiryDate) <= new Date(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expiryDate'],
          message: 'expiryDate must be strictly after startDate',
        });
      }
    }
  }),
};

const pauseSubscriptionValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
  body: z.object({
    reason: z.string().trim().optional().default(''),
    force: z.boolean().optional().default(false),
  }),
};

const resumeSubscriptionValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
  body: z.object({
    reason: z.string().trim().optional().default(''),
  }),
};

const renewSubscriptionValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
  body: z.object({
    periods: z.number().int().min(1).default(1),
    reason: z.string().trim().optional().default(''),
    force: z.boolean().optional().default(false),
  }),
};

const closeSubscriptionValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
  body: z.object({
    reason: z.string({ required_error: 'Reason is required for closing a subscription' }).trim().min(2, 'Reason must be at least 2 characters'),
    force: z.boolean().optional().default(false),
  }),
};

const cancelSubscriptionValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
  body: z.object({
    reason: z.string().trim().optional().default(''),
  }),
};

const subscriptionIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription ID format'),
  }),
};

const listSubscriptionsValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.enum(['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed']).optional(),
    customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    billingCycle: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    expiringInDays: z.coerce.number().int().min(1).optional(),
    expired: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

module.exports = {
  createSubscriptionValidation,
  updateSubscriptionValidation,
  pauseSubscriptionValidation,
  resumeSubscriptionValidation,
  renewSubscriptionValidation,
  closeSubscriptionValidation,
  cancelSubscriptionValidation,
  subscriptionIdParamValidation,
  listSubscriptionsValidation,
};
