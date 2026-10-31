const { z } = require('zod');

const dateValidation = (data, ctx) => {
  if (data.availableFrom && data.availableTo) {
    const fromTime = new Date(data.availableFrom).getTime();
    const toTime = new Date(data.availableTo).getTime();
    if (toTime <= fromTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['availableTo'],
        message: 'availableTo date must be strictly after availableFrom date',
      });
    }
  }

  if (data.autoClose === true && !data.availableTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['availableTo'],
      message: 'availableTo date is required when autoClose is true',
    });
  }
};

const createPlanValidation = {
  body: z.object({
    name: z.string({ required_error: 'Plan name is required' }).trim().min(1, 'Plan name cannot be empty'),
    billingCycle: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
      errorMap: () => ({ message: 'billingCycle must be one of: daily, weekly, monthly, yearly' }),
    }),
    price: z.number({ required_error: 'Price is required' }).min(0, 'Price must be ≥ 0'),
    minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
    availableFrom: z.string().datetime().nullable().optional(),
    availableTo: z.string().datetime().nullable().optional(),
    autoClose: z.boolean().default(false),
    allowEarlyClose: z.boolean().default(true),
    allowPause: z.boolean().default(false),
    allowRenewal: z.boolean().default(true),
    isActive: z.boolean().default(true),
  }).superRefine(dateValidation),
};

const updatePlanValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    billingCycle: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    price: z.number().min(0).optional(),
    minQuantity: z.number().int().min(1).optional(),
    availableFrom: z.string().datetime().nullable().optional(),
    availableTo: z.string().datetime().nullable().optional(),
    autoClose: z.boolean().optional(),
    allowEarlyClose: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowRenewal: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    if (data.availableFrom && data.availableTo) {
      const fromTime = new Date(data.availableFrom).getTime();
      const toTime = new Date(data.availableTo).getTime();
      if (toTime <= fromTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableTo'],
          message: 'availableTo date must be strictly after availableFrom date',
        });
      }
    }
    if (data.autoClose === true && data.availableTo === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['availableTo'],
        message: 'availableTo date cannot be null when autoClose is true',
      });
    }
  }),
};

const updatePlanStatusValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID format'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
};

const listPlansValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(500).default(10),
    search: z.string().optional(),
    billingCycle: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    isActive: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    available: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  }),
};

const planIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID format'),
  }),
};

module.exports = {
  createPlanValidation,
  updatePlanValidation,
  updatePlanStatusValidation,
  listPlansValidation,
  planIdParamValidation,
};
