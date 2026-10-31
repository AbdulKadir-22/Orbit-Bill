const PDFDocument = require('pdfkit');
const env = require('../../config/env');

/**
 * Builds and streams a professional PDF invoice into an Express response stream.
 *
 * @param {Object} invoice - Invoice document populated with customer and lines
 * @param {Object} res - Express response stream
 * @param {boolean} [download=false] - If true, sets attachment disposition
 */
const generateInvoicePdf = (invoice, res, download = false) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const filename = `${invoice.invoiceNumber}.pdf`;
  const disposition = download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', disposition);

  doc.pipe(res);

  // 1. Header (Company details)
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#2563eb')
    .text(env.COMPANY_NAME || 'OrbitBill Inc.', 50, 50);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(env.COMPANY_ADDRESS || '123 Enterprise Way, Tech City, India', 50, 75)
    .text(`GSTIN: ${env.COMPANY_GSTIN || '29AAAAA0000A1Z5'} | Email: ${env.COMPANY_EMAIL || 'billing@orbitbill.com'}`, 50, 88);

  // Status Stamp on top right
  const statusColor =
    invoice.status === 'paid' ? '#16a34a' : invoice.status === 'confirmed' ? '#2563eb' : '#dc2626';

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(statusColor)
    .text(invoice.status.toUpperCase(), 400, 50, { align: 'right' });

  if (invoice.isOverdue) {
    doc.fontSize(10).fillColor('#dc2626').text('OVERDUE', 400, 72, { align: 'right' });
  }

  doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e5e7eb').stroke();

  // 2. Invoice & Customer Meta
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text('INVOICE TO:', 50, 125);

  const cust = invoice.customerId || {};
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#374151')
    .text(cust.name || 'Valued Customer', 50, 142)
    .text(cust.company ? `Company: ${cust.company}` : '', 50, 155)
    .text(cust.gstin ? `GSTIN: ${cust.gstin}` : '', 50, 168)
    .text(cust.email || '', 50, 181);

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text(`Invoice No:`, 350, 125)
    .font('Helvetica')
    .text(invoice.invoiceNumber, 450, 125)
    .font('Helvetica-Bold')
    .text(`Invoice Date:`, 350, 140)
    .font('Helvetica')
    .text(new Date(invoice.invoiceDate).toLocaleDateString(), 450, 140)
    .font('Helvetica-Bold')
    .text(`Due Date:`, 350, 155)
    .font('Helvetica')
    .text(new Date(invoice.dueDate).toLocaleDateString(), 450, 155);

  if (invoice.billingPeriod && invoice.billingPeriod.start) {
    doc
      .font('Helvetica-Bold')
      .text(`Period:`, 350, 170)
      .font('Helvetica')
      .text(
        `${new Date(invoice.billingPeriod.start).toLocaleDateString()} - ${new Date(
          invoice.billingPeriod.end
        ).toLocaleDateString()}`,
        450,
        170
      );
  }

  // 3. Line Items Table Header
  const tableTop = 220;
  doc
    .rect(50, tableTop, 500, 22)
    .fillColor('#f3f4f6')
    .fill();

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#374151')
    .text('ITEM & DESCRIPTION', 55, tableTop + 6)
    .text('QTY', 290, tableTop + 6, { width: 35, align: 'center' })
    .text('PRICE', 335, tableTop + 6, { width: 60, align: 'right' })
    .text('TAX', 405, tableTop + 6, { width: 50, align: 'right' })
    .text('AMOUNT', 465, tableTop + 6, { width: 80, align: 'right' });

  // 4. Line Items Rows
  let y = tableTop + 28;
  const currencySymbol = env.DEFAULT_CURRENCY === 'INR' ? '₹' : '$';

  (invoice.lines || []).forEach((line) => {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(line.productName, 55, y);

    const desc = line.variantName ? `(${line.variantName})` : '';
    if (desc) {
      doc.font('Helvetica').fillColor('#6b7280').text(desc, 55, y + 11);
    }

    doc
      .font('Helvetica')
      .fillColor('#374151')
      .text(String(line.quantity), 290, y, { width: 35, align: 'center' })
      .text(`${currencySymbol}${line.unitPrice.toFixed(2)}`, 335, y, { width: 60, align: 'right' })
      .text(`${currencySymbol}${line.taxAmount.toFixed(2)}`, 405, y, { width: 50, align: 'right' })
      .text(`${currencySymbol}${line.lineTotal.toFixed(2)}`, 465, y, { width: 80, align: 'right' });

    y += 26;
    doc.moveTo(50, y - 4).lineTo(550, y - 4).strokeColor('#f3f4f6').stroke();
  });

  // 5. Totals Section
  const totalsY = Math.max(y + 10, 420);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text('Subtotal:', 350, totalsY)
    .text(`${currencySymbol}${invoice.subtotal.toFixed(2)}`, 465, totalsY, { width: 80, align: 'right' })
    .text('Tax Total:', 350, totalsY + 14)
    .text(`${currencySymbol}${invoice.taxTotal.toFixed(2)}`, 465, totalsY + 14, { width: 80, align: 'right' });

  if (invoice.discountTotal > 0) {
    doc
      .text('Discount Total:', 350, totalsY + 28)
      .text(`-${currencySymbol}${invoice.discountTotal.toFixed(2)}`, 465, totalsY + 28, {
        width: 80,
        align: 'right',
      });
  }

  doc
    .rect(340, totalsY + 44, 210, 24)
    .fillColor('#f9fafb')
    .fill();

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text('Grand Total:', 350, totalsY + 50)
    .text(`${currencySymbol}${invoice.grandTotal.toFixed(2)}`, 465, totalsY + 50, { width: 80, align: 'right' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#16a34a')
    .text('Amount Paid:', 350, totalsY + 74)
    .text(`${currencySymbol}${invoice.amountPaid.toFixed(2)}`, 465, totalsY + 74, { width: 80, align: 'right' })
    .font('Helvetica-Bold')
    .fillColor('#dc2626')
    .text('Amount Due:', 350, totalsY + 88)
    .text(`${currencySymbol}${invoice.amountDue.toFixed(2)}`, 465, totalsY + 88, { width: 80, align: 'right' });

  // 6. Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#9ca3af')
    .text(
      'Thank you for your business. For billing queries, please contact billing@orbitbill.com.',
      50,
      750,
      { align: 'center', width: 500 }
    );

  doc.end();
};

module.exports = {
  generateInvoicePdf,
};
