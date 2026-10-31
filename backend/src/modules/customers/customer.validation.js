const { z } = require('zod');

// GSTIN validation regex: exactly 15 characters, valid state code and PAN structure
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const addressValidation = z.object({
  line1: z.string().trim().optional().default(''),
  line2: z.string().trim().optional().default(''),
  city: z.string().trim().optional().default(''),
  state: z.string().trim().optional().default(''),
  pincode: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default('India'),
});

const createCustomerValidation = {
  body: z.object({
    name: z.string({ required_error: 'Customer name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please enter a valid email address'),
    phone: z.string().trim().optional().default(''),
    company: z.string().trim().optional().default(''),
    gstin: z.string().trim().toUpperCase().regex(gstinRegex, 'Invalid 15-character GSTIN format').or(z.literal('')).optional().default(''),
    address: addressValidation.optional().default(() => ({})),
    notes: z.string().trim().optional().default(''),
    isActive: z.boolean().default(true),
  }),
};

const updateCustomerValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().optional(),
    company: z.string().trim().optional(),
    gstin: z.string().trim().toUpperCase().regex(gstinRegex, 'Invalid 15-character GSTIN format').or(z.literal('')).optional(),
    address: addressValidation.optional(),
    notes: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateCustomerStatusValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
};

const listCustomersValidation = {
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

const customerIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
  }),
};

// Customer self-service validation (cannot touch isActive, notes, createdBy)
const updateCustomerSelfValidation = {
  body: z.object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().optional(),
    company: z.string().trim().optional(),
    gstin: z.string().trim().toUpperCase().regex(gstinRegex, 'Invalid 15-character GSTIN format').or(z.literal('')).optional(),
    address: addressValidation.optional(),
  }),
};

module.exports = {
  createCustomerValidation,
  updateCustomerValidation,
  updateCustomerStatusValidation,
  listCustomersValidation,
  customerIdParamValidation,
  updateCustomerSelfValidation,
};
