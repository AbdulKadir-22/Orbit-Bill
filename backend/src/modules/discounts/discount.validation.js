const { z } = require('zod');

const validateDiscountBusinessRules = (data, ctx) => {
  // 1. Percentage discounts cannot exceed 100%
  if (data.type === 'percentage' && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Percentage discount cannot exceed 100%',
    });
  }

  // 2. Fixed discounts must be > 0
  if (data.type === 'fixed' && data.value <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Fixed discount value must be greater than 0',
    });
  }

  // 3. endDate must be strictly after startDate
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be strictly after startDate',
      });
    }
  }

  // 4. productIds required when appliesTo === 'products'
  if (data.appliesTo === 'products') {
    if (!data.productIds || data.productIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productIds'],
        message: 'productIds are required when discount appliesTo is set to products',
      });
    }
  }
};

const createDiscountValidation = {
  body: z.object({
    name: z.string({ required_error: 'Discount name is required' }).trim().min(1, 'Discount name cannot be empty'),
    type: z.enum(['fixed', 'percentage'], {
      errorMap: () => ({ message: 'type must be fixed or percentage' }),
    }),
    value: z.number({ required_error: 'Discount value is required' }).min(0, 'Discount value cannot be negative'),
    minPurchase: z.number().min(0).default(0),
    minQuantity: z.number().int().min(0).default(0),
    appliesTo: z.enum(['products', 'subscription'], {
      errorMap: () => ({ message: 'appliesTo must be products or subscription' }),
    }),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')).default([]),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().default(true),
  }).superRefine(validateDiscountBusinessRules),
};

const updateDiscountValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid discount ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    type: z.enum(['fixed', 'percentage']).optional(),
    value: z.number().min(0).optional(),
    minPurchase: z.number().min(0).optional(),
    minQuantity: z.number().int().min(0).optional(),
    appliesTo: z.enum(['products', 'subscription']).optional(),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
    usedCount: z.any().optional(), // Caught by refinement to reject manual edits
  }).superRefine((data, ctx) => {
    if (data.usedCount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['usedCount'],
        message: 'usedCount cannot be modified directly via the API',
      });
    }

    if (data.type === 'percentage' && data.value !== undefined && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Percentage discount cannot exceed 100%',
      });
    }

    if (data.type === 'fixed' && data.value !== undefined && data.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Fixed discount value must be greater than 0',
      });
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDate must be strictly after startDate',
        });
      }
    }
  }),
};

const updateDiscountStatusValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid discount ID format'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
};

const listDiscountsValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    type: z.enum(['fixed', 'percentage']).optional(),
    appliesTo: z.enum(['products', 'subscription']).optional(),
    isActive: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    status: z.enum(['running', 'expired', 'upcoming', 'exhausted']).optional(),
  }),
};

const discountIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid discount ID format'),
  }),
};

module.exports = {
  createDiscountValidation,
  updateDiscountValidation,
  updateDiscountStatusValidation,
  listDiscountsValidation,
  discountIdParamValidation,
};
