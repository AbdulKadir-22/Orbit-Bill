const { assertInvoiceTransition, INVOICE_TRANSITIONS } = require('../../src/modules/invoices/invoice.stateMachine');

describe('Invoice State Machine Unit Tests', () => {
  test('allows draft -> confirmed transition', () => {
    expect(() => assertInvoiceTransition('draft', 'confirmed')).not.toThrow();
  });

  test('allows draft -> cancelled transition', () => {
    expect(() => assertInvoiceTransition('draft', 'cancelled')).not.toThrow();
  });

  test('allows confirmed -> paid transition', () => {
    expect(() => assertInvoiceTransition('confirmed', 'paid')).not.toThrow();
  });

  test('allows confirmed -> cancelled transition only when amountPaid is 0', () => {
    expect(() => assertInvoiceTransition('confirmed', 'cancelled', { amountPaid: 0 })).not.toThrow();
    expect(() => assertInvoiceTransition('confirmed', 'cancelled', { amountPaid: 100 })).toThrow(
      /Cannot cancel invoice because payments of amount 100 have already been recorded/
    );
  });

  test('rejects paid -> cancelled transition', () => {
    expect(() => assertInvoiceTransition('paid', 'cancelled')).toThrow(
      /Invalid invoice state transition from 'paid' to 'cancelled'/
    );
  });

  test('allows paid -> confirmed transition upon payment voiding', () => {
    expect(() => assertInvoiceTransition('paid', 'confirmed')).not.toThrow();
  });

  test('rejects cancelled -> confirmed transition', () => {
    expect(() => assertInvoiceTransition('cancelled', 'confirmed')).toThrow(
      /Invalid invoice state transition from 'cancelled' to 'confirmed'/
    );
  });
});
