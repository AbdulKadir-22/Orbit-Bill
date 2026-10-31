const quotationSentTemplate = ({ quoteNumber, customerName, validUntil, grandTotal, lines = [] }) => {
  const lineRows = lines
    .map(
      (l) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          <strong>${l.productName}</strong> ${l.variantName ? `(${l.variantName})` : ''}<br/>
          <small style="color: #6b7280;">Plan: ${l.planName} (${l.billingCycle})</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${l.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${l.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${l.lineTotal.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${quoteNumber} - OrbitBill</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    th { background: #f9fafb; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; color: #374151; }
    .total-box { margin-top: 16px; text-align: right; font-size: 16px; font-weight: 700; color: #111827; }
    .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">OrbitBill</div>
    <div class="title">Quotation ${quoteNumber}</div>
    <p>Dear ${customerName || 'Valued Customer'},</p>
    <p>Thank you for your interest in our subscription services. Please review your quotation below:</p>
    ${validUntil ? `<p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>` : ''}

    <table>
      <thead>
        <tr>
          <th>Item & Plan</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <div class="total-box">
      Grand Total: ₹${grandTotal.toFixed(2)}
    </div>

    <p style="margin-top: 24px; font-size: 14px; color: #4b5563;">
      To accept or discuss this quotation, please reach out to your sales representative or log in to your OrbitBill customer portal.
    </p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} OrbitBill Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
  quotationSentTemplate,
};
