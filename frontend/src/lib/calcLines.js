/**
 * Calculate line item amounts and totals
 * per line amount = quantity * unitPrice
 * subtotal = sum of amounts
 * taxTotal = sum of (amount * taxRate / 100)
 * grandTotal = subtotal + taxTotal
 *
 * @param {Array} lines
 * @returns {{ lines: Array, subtotal: number, taxTotal: number, discountTotal: number, grandTotal: number }}
 */
export const calcLines = (lines = []) => {
  let subtotal = 0;
  let taxTotal = 0;

  const computedLines = (lines || []).map((line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    const rate = Number(line.taxRate) || 0;

    const amount = Math.round(qty * price * 100) / 100;
    const lineTax = Math.round(amount * (rate / 100) * 100) / 100;

    subtotal += amount;
    taxTotal += lineTax;

    return {
      ...line,
      amount,
      taxAmount: lineTax,
      lineSubtotal: amount,
      lineTotal: Math.round((amount + lineTax) * 100) / 100,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  taxTotal = Math.round(taxTotal * 100) / 100;
  const discountTotal = 0;
  const grandTotal = Math.round((subtotal + taxTotal - discountTotal) * 100) / 100;

  return {
    lines: computedLines,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal: Math.max(0, grandTotal),
  };
};
