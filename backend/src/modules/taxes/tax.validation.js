const { z } = require('zod');

const createTaxValidation = {
  body: z.object({
    name: z.string({ required_error: 'Tax name is required' }).trim().min(1, 'Tax name cannot be empty'),
    rate: z.number({ required_error: 'Tax rate is required' }).min(0, 'Tax rate must be ≥ 0').max(100, 'Tax rate must be ≤ 100'),
    appliesTo: z.enum(['all', 'products']).default('all'),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')).default([]),
    isActive: z.boolean().default(true),
  }),
};

const updateTaxValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid tax ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    rate: z.number().min(0).max(100).optional(),
    appliesTo: z.enum(['all', 'products']).optional(),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')).optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateTaxStatusValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid tax ID format'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
};

const listTaxesValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(500).default(10),
    search: z.string().optional(),
    isActive: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  }),
};

const taxIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid tax ID format'),
  }),
};

module.exports = {
  createTaxValidation,
  updateTaxValidation,
  updateTaxStatusValidation,
  listTaxesValidation,
  taxIdParamValidation,
};
