const ApiError = require('../../utils/ApiError');

const INVOICE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
});

const ALLOWED_INVOICE_TRANSITIONS = Object.freeze({
  [INVOICE_STATUSES.DRAFT]: [
    INVOICE_STATUSES.CONFIRMED,
    INVOICE_STATUSES.CANCELLED,
  ],
  [INVOICE_STATUSES.CONFIRMED]: [
    INVOICE_STATUSES.PAID,
    INVOICE_STATUSES.CANCELLED,
  ],
  [INVOICE_STATUSES.PAID]: [
    INVOICE_STATUSES.CONFIRMED, // When a payment is voided and amountDue > 0
  ],
  [INVOICE_STATUSES.CANCELLED]: [], // terminal
});

const canTransitionInvoice = (from, to, { amountPaid = 0 } = {}) => {
  if (!from || !to) return false;
  if (from === to) return true; // idempotent

  // Cancellation rule: confirmed invoices can only be cancelled if amountPaid == 0
  if (from === INVOICE_STATUSES.CONFIRMED && to === INVOICE_STATUSES.CANCELLED) {
    if (amountPaid > 0) {
      return false;
    }
  }

  const validNext = ALLOWED_INVOICE_TRANSITIONS[from] || [];
  return validNext.includes(to);
};

const assertInvoiceTransition = (from, to, options = {}) => {
  const { amountPaid = 0, contextMessage = '' } = options;

  if (from === INVOICE_STATUSES.CONFIRMED && to === INVOICE_STATUSES.CANCELLED && amountPaid > 0) {
    throw ApiError.conflict(
      `Cannot cancel invoice because payments of amount ${amountPaid} have already been recorded. Void recorded payments first.`
    );
  }

  if (!canTransitionInvoice(from, to, { amountPaid })) {
    const prefix = contextMessage ? `${contextMessage}: ` : '';
    throw ApiError.conflict(
      `${prefix}Invalid invoice state transition from '${from}' to '${to}'. Allowed transitions: [${(
        ALLOWED_INVOICE_TRANSITIONS[from] || []
      ).join(', ')}]`
    );
  }
};

module.exports = {
  INVOICE_STATUSES,
  ALLOWED_INVOICE_TRANSITIONS,
  canTransitionInvoice,
  assertInvoiceTransition,
};
