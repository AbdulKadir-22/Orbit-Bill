const mongoose = require('mongoose');
const Invoice = require('./invoice.model');
const Discount = require('../discounts/discount.model');
const Customer = require('../customers/customer.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const { assertInvoiceTransition } = require('./invoice.stateMachine');
const { startOfDay } = require('../../utils/dates');
const { sendEmail } = require('../../emails/email.service');
const { roundMoney, calcLine } = require('../../utils/pricing');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');
const { generateSequenceNumber } = require('../../utils/numberGenerator');
const logger = require('../../config/logger');

const createInvoice = async (data, user) => {
  const invoiceNumber = await generateSequenceNumber('invoice', 'INV');
  const lines = (data.lines || []).map((l) => {
    const calc = calcLine({ unitPrice: l.unitPrice, quantity: l.quantity, taxRate: l.taxRate || 0 });
    return {
      productId: l.productId,
      variantId: l.variantId,
      productName: l.productName || 'Line Item',
      variantName: l.variantName,
      description: l.description,
      quantity: l.quantity,
      unitPrice: roundMoney(l.unitPrice),
      taxId: l.taxId,
      taxRate: l.taxRate || 0,
      taxAmount: calc.taxAmount,
      discountAmount: l.discountAmount || 0,
      lineTotal: calc.lineTotal,
    };
  });

  const subtotal = roundMoney(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const taxTotal = roundMoney(lines.reduce((s, l) => s + l.taxAmount, 0));
  const discountTotal = roundMoney(lines.reduce((s, l) => s + l.discountAmount, 0));
  const grandTotal = roundMoney(Math.max(0, subtotal + taxTotal - discountTotal));

  const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 86400000 * 15);
  const billingPeriod = data.billingPeriod || {
    start: invoiceDate,
    end: dueDate,
  };

  const invoice = await Invoice.create({
    invoiceNumber,
    customerId: data.customerId,
    subscriptionId: data.subscriptionId,
    invoiceDate,
    dueDate,
    billingPeriod,
    lines,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    amountPaid: 0,
    amountDue: grandTotal,
    status: data.status || 'draft',
    source: data.source || 'manual',
    notes: data.notes,
    createdBy: user._id,
  });

  invalidateDashboardCache();
  return invoice;
};

const listInvoices = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.customerId) {
    filter.customerId = query.customerId;
  }

  if (query.subscriptionId) {
    filter.subscriptionId = query.subscriptionId;
  }

  // Payment Status filter
  if (query.paymentStatus === 'unpaid') {
    filter.amountPaid = 0;
  } else if (query.paymentStatus === 'paid') {
    filter.amountDue = 0;
  } else if (query.paymentStatus === 'partial') {
    filter.amountPaid = { $gt: 0 };
    filter.amountDue = { $gt: 0 };
  }

  // Overdue filter: status = confirmed AND amountDue > 0 AND dueDate < startOfToday
  if (query.overdue === true) {
    filter.status = 'confirmed';
    filter.amountDue = { $gt: 0 };
    filter.dueDate = { $lt: startOfDay(new Date()) };
  }

  if (query.invoiceDateStart || query.invoiceDateEnd) {
    filter.invoiceDate = {};
    if (query.invoiceDateStart) filter.invoiceDate.$gte = new Date(query.invoiceDateStart);
    if (query.invoiceDateEnd) filter.invoiceDate.$lte = new Date(query.invoiceDateEnd);
  }

  if (query.dueDateStart || query.dueDateEnd) {
    filter.dueDate = {};
    if (query.dueDateStart) filter.dueDate.$gte = new Date(query.dueDateStart);
    if (query.dueDateEnd) filter.dueDate.$lte = new Date(query.dueDateEnd);
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['invoiceNumber', 'notes']);
    Object.assign(filter, searchFilter);
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email company')
      .populate('subscriptionId', 'subscriptionNumber billingCycle')
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  // Compute virtuals for lean responses
  const formattedInvoices = invoices.map((inv) => {
    const isOverdue =
      inv.status === 'confirmed' && inv.amountDue > 0 && new Date(inv.dueDate) < startOfDay(new Date());
    const paymentStatus = inv.amountPaid === 0 ? 'unpaid' : inv.amountDue === 0 ? 'paid' : 'partial';
    return { ...inv, isOverdue, paymentStatus };
  });

  return { invoices: formattedInvoices, meta };
};

const getInvoiceById = async (id) => {
  const invoice = await Invoice.findById(id)
    .populate('customerId', 'name email company phone gstin address')
    .populate('subscriptionId', 'subscriptionNumber billingCycle startDate expiryDate')
    .populate('appliedDiscountIds', 'name value type')
    .populate('appliedTaxIds', 'name rate');

  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  return invoice;
};

const updateInvoice = async (id, updateData, user) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  if (invoice.status !== 'draft') {
    throw ApiError.badRequest(`Only draft invoices can be edited. Current status is '${invoice.status}'`);
  }

  if (updateData.notes !== undefined) invoice.notes = updateData.notes;
  if (updateData.dueDate) invoice.dueDate = new Date(updateData.dueDate);

  // Allow admin line adjustments
  if (updateData.lines && Array.isArray(updateData.lines)) {
    updateData.lines.forEach((adjLine, idx) => {
      const existing = invoice.lines[idx];
      if (existing) {
        if (adjLine.description !== undefined) existing.description = adjLine.description;
        if (adjLine.discountAmount !== undefined) existing.discountAmount = roundMoney(adjLine.discountAmount);
        existing.lineTotal = roundMoney(
          Math.max(0, existing.unitPrice * existing.quantity + existing.taxAmount - existing.discountAmount)
        );
      }
    });

    invoice.subtotal = roundMoney(invoice.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
    invoice.taxTotal = roundMoney(invoice.lines.reduce((s, l) => s + l.taxAmount, 0));
    invoice.discountTotal = roundMoney(invoice.lines.reduce((s, l) => s + l.discountAmount, 0));
    invoice.grandTotal = roundMoney(Math.max(0, invoice.subtotal + invoice.taxTotal - invoice.discountTotal));
    invoice.amountDue = roundMoney(Math.max(0, invoice.grandTotal - invoice.amountPaid));
  }

  await invoice.save();
  invalidateDashboardCache();
  return invoice;
};

const confirmInvoice = async (id, user) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  assertInvoiceTransition(invoice.status, 'confirmed', { amountPaid: invoice.amountPaid });

  invoice.status = 'confirmed';
  invoice.confirmedAt = new Date();
  await invoice.save();

  return invoice;
};

/**
 * Cancels an invoice and restores discount usage atomically in a transaction.
 */
const cancelInvoice = async (id, reason, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findById(id).session(session);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    assertInvoiceTransition(invoice.status, 'cancelled', {
      amountPaid: invoice.amountPaid,
      contextMessage: 'Cannot cancel invoice',
    });

    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    invoice.cancelReason = reason;

    // Restore discount usage (never below 0)
    if (invoice.appliedDiscountIds && invoice.appliedDiscountIds.length > 0) {
      await Discount.updateMany(
        {
          _id: { $in: invoice.appliedDiscountIds },
          usedCount: { $gt: 0 },
        },
        { $inc: { usedCount: -1 } },
        { session }
      );
    }

    await invoice.save({ session });
    await session.commitTransaction();
    invalidateDashboardCache();

    return invoice;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const deleteInvoice = async (id) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  if (invoice.status !== 'draft') {
    throw ApiError.badRequest(`Only draft invoices can be deleted. Current status is '${invoice.status}'`);
  }

  await Invoice.findByIdAndDelete(id);
  return invoice;
};

const sendInvoice = async (id) => {
  const invoice = await Invoice.findById(id).populate('customerId', 'name email company');
  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  // Sending a draft invoice confirms it first
  if (invoice.status === 'draft') {
    invoice.status = 'confirmed';
    invoice.confirmedAt = new Date();
  }

  invoice.sentAt = new Date();
  await invoice.save();

  let emailSent = false;
  if (invoice.customerId && invoice.customerId.email) {
    const result = await sendEmail({
      to: invoice.customerId.email,
      subject: `Invoice ${invoice.invoiceNumber} from OrbitBill`,
      html: `
        <p>Dear ${invoice.customerId.name || 'Valued Customer'},</p>
        <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong> for the amount of <strong>${invoice.grandTotal.toFixed(2)}</strong>.</p>
        <p>Due Date: <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong></p>
      `,
    });
    emailSent = Boolean(result.success);
  }

  return { invoice, emailSent };
};

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceById,
  updateInvoice,
  confirmInvoice,
  cancelInvoice,
  deleteInvoice,
  sendInvoice,
};
