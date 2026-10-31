const { z } = require('zod');

const createPaymentValidation = {
  body: z.object({
    invoiceId: z.string({ required_error: 'invoiceId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid invoiceId format'),
    amount: z.number({ required_error: 'amount is required' }).positive('Payment amount must be greater than 0'),
    method: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'credit_card', 'debit_card', 'cheque', 'other'], {
      errorMap: () => ({ message: 'method must be one of: cash, bank_transfer, upi, card, credit_card, debit_card, cheque, other' }),
    }),
    paidAt: z.string().optional(),
    reference: z.string().trim().optional().default(''),
    notes: z.string().trim().optional().default(''),
  }).superRefine((data, ctx) => {
    if (data.paidAt) {
      const parsedDate = new Date(data.paidAt);
      if (isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paidAt'],
          message: 'Invalid paidAt date format',
        });
      } else {
        // Permit current day local / UTC buffer
        const nowEndOfDay = new Date();
        nowEndOfDay.setHours(23, 59, 59, 999);
        if (parsedDate > nowEndOfDay) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['paidAt'],
            message: 'Payment date cannot be in the future',
          });
        }
      }
    }
  }),
};

const updatePaymentValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID format'),
  }),
  body: z.object({
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
};

const voidPaymentValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID format'),
  }),
  body: z.object({
    reason: z.string({ required_error: 'Reason is required to void payment' }).trim().min(2, 'Reason must be at least 2 characters'),
  }),
};

const paymentIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID format'),
  }),
};

const listPaymentsValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    invoiceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    method: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'credit_card', 'debit_card', 'cheque', 'other']).optional(),
    status: z.enum(['recorded', 'voided']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
};

module.exports = {
  createPaymentValidation,
  updatePaymentValidation,
  voidPaymentValidation,
  paymentIdParamValidation,
  listPaymentsValidation,
};
