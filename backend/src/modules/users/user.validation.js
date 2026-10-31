const { z } = require('zod');
const { passwordSchema, emailSchema } = require('../auth/auth.validation');
const { ALL_PERMISSIONS } = require('../../constants/permissions');

const createStaffValidation = {
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    permissions: z.array(z.enum(ALL_PERMISSIONS, {
      errorMap: () => ({ message: 'Invalid permission specified' }),
    })).default([]),
  }),
};

const updateStaffValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    permissions: z.array(z.enum(ALL_PERMISSIONS, {
      errorMap: () => ({ message: 'Invalid permission specified' }),
    })).optional(),
  }).refine((data) => data.name !== undefined || data.permissions !== undefined, {
    message: 'At least one field (name or permissions) must be provided for update',
  }),
};

const updateStaffStatusValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID format'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
};

const updateStaffPermissionsValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID format'),
  }),
  body: z.object({
    permissions: z.array(z.enum(ALL_PERMISSIONS, {
      errorMap: () => ({ message: 'Invalid permission specified' }),
    })),
  }),
};

const staffIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID format'),
  }),
};

const listStaffValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    isActive: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  }),
};

module.exports = {
  createStaffValidation,
  updateStaffValidation,
  updateStaffStatusValidation,
  updateStaffPermissionsValidation,
  staffIdParamValidation,
  listStaffValidation,
};
