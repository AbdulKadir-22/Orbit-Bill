const { z } = require('zod');

// Password rule: minimum 9 characters, at least one uppercase, one lowercase, one special character
const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(9, 'Password must be at least 9 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address');

const registerValidation = {
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
  }),
};

const loginValidation = {
  body: z.object({
    email: emailSchema,
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
  }),
};

const forgotPasswordValidation = {
  body: z.object({
    email: emailSchema,
  }),
};

const resetPasswordValidation = {
  body: z.object({
    token: z.string({ required_error: 'Reset token is required' }).min(1, 'Reset token cannot be empty'),
    password: passwordSchema,
  }),
};

const changePasswordValidation = {
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password cannot be empty'),
    newPassword: passwordSchema,
  }),
};

module.exports = {
  passwordSchema,
  emailSchema,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
};
