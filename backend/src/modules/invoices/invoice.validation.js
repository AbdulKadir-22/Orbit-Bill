const { z } = require('zod');

const updateInvoiceValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invoice ID format'),
  }),
  body: z.object({
    notes: z.string().trim().optional(),
    dueDate: z.string().datetime().optional(),
    lines: z.array(
      z.object({
        description: z.string().trim().optional(),
        discountAmount: z.number().min(0).optional(),
      })
    ).optional(),
  }),
};

const cancelInvoiceValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invoice ID format'),
  }),
  body: z.object({
    reason: z.string({ required_error: 'Cancellation reason is required' }).trim().min(2, 'Reason must be at least 2 characters'),
  }),
};

const invoiceIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invoice ID format'),
  }),
};

const listInvoicesValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.enum(['draft', 'confirmed', 'paid', 'cancelled']).optional(),
    paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
    overdue: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    subscriptionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    invoiceDateStart: z.string().datetime().optional(),
    invoiceDateEnd: z.string().datetime().optional(),
    dueDateStart: z.string().datetime().optional(),
    dueDateEnd: z.string().datetime().optional(),
  }),
};

const runBillingValidation = {
  body: z.object({
    asOf: z.string().datetime().optional(),
    dryRun: z.boolean().optional().default(false),
  }),
};

module.exports = {
  updateInvoiceValidation,
  cancelInvoiceValidation,
  invoiceIdParamValidation,
  listInvoicesValidation,
  runBillingValidation,
};
