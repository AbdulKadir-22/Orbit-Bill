const mongoose = require('mongoose');
const Payment = require('./payment.model');
const Invoice = require('../invoices/invoice.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const { generateSequenceNumber } = require('../../utils/numberGenerator');
const { roundMoney } = require('../../utils/pricing');
const { sendEmail } = require('../../emails/email.service');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');
const logger = require('../../config/logger');

/**
 * Records a payment against an invoice inside an atomic transaction.
 * Recomputes invoice amountPaid and amountDue to prevent drift, marks invoice paid if amountDue === 0.
 */
const recordPayment = async (data, user) => {
  let session = null;
  // Transactions are only supported on MongoDB replica sets
  if (mongoose.connection.client?.topology?.description?.type === 'ReplicaSetWithPrimary' ||
      mongoose.connection.client?.topology?.description?.type === 'Sharded') {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }
  }

  try {
    const query = Invoice.findById(data.invoiceId);
    if (session) query.session(session);
    const invoice = await query;

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    if (invoice.status !== 'confirmed') {
      throw ApiError.badRequest(
        `Payments can only be recorded on confirmed invoices. Current status is '${invoice.status}'.`
      );
    }

    const payAmount = roundMoney(data.amount);
    if (payAmount <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than 0', [
        { field: 'amount', message: 'Amount must be > 0' },
      ]);
    }

    if (payAmount > invoice.amountDue) {
      throw ApiError.badRequest(
        `Payment amount (${payAmount}) exceeds invoice amount due (${invoice.amountDue})`,
        [{ field: 'amount', message: `Cannot exceed amount due of ${invoice.amountDue}` }]
      );
    }

    const paymentNumber = await generateSequenceNumber('payment', 'PAY', session ? { session } : {});
    const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

    const payment = new Payment({
      paymentNumber,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amount: payAmount,
      method: data.method,
      paidAt,
      reference: data.reference || '',
      notes: data.notes || '',
      status: 'recorded',
      recordedBy: user._id,
    });

    if (session) {
      await payment.save({ session });
    } else {
      await payment.save();
    }

    // Recompute sum of all recorded payments for this invoice to prevent drift
    const payQuery = Payment.find({
      invoiceId: invoice._id,
      status: 'recorded',
    });
    if (session) payQuery.session(session);
    const recordedPayments = await payQuery;

    const totalPaid = roundMoney(recordedPayments.reduce((sum, p) => sum + p.amount, 0));
    const newAmountDue = roundMoney(Math.max(0, invoice.grandTotal - totalPaid));

    invoice.amountPaid = totalPaid;
    invoice.amountDue = newAmountDue;

    if (newAmountDue === 0) {
      invoice.status = 'paid';
    }

    if (session) {
      await invoice.save({ session });
      await session.commitTransaction();
    } else {
      await invoice.save();
    }

    invalidateDashboardCache();

    // Best-effort receipt email
    Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .then((inv) => {
        if (inv?.customerId?.email) {
          sendEmail({
            to: inv.customerId.email,
            subject: `Payment Receipt ${paymentNumber} - OrbitBill`,
            html: `<p>Dear ${inv.customerId.name},</p><p>We received your payment of <strong>₹${payAmount.toFixed(2)}</strong> via ${data.method} for Invoice ${inv.invoiceNumber}. Remaining due: ₹${newAmountDue.toFixed(2)}.</p>`,
          }).catch(() => {});
        }
      })
      .catch(() => {});

    return { payment, invoice };
  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const listPayments = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.invoiceId) filter.invoiceId = query.invoiceId;
  if (query.customerId) filter.customerId = query.customerId;
  if (query.method) filter.method = query.method;
  if (query.status) {
    filter.status = query.status;
  } else {
    filter.status = 'recorded';
  }

  const start = query.fromDate || query.startDate;
  const end = query.toDate || query.endDate;
  if (start || end) {
    filter.paidAt = {};
    if (start) filter.paidAt.$gte = new Date(start);
    if (end) filter.paidAt.$lte = new Date(end);
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['paymentNumber', 'reference', 'notes']);
    Object.assign(filter, searchFilter);
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email company')
      .populate('invoiceId', 'invoiceNumber grandTotal')
      .populate('recordedBy', 'name email')
      .lean(),
    Payment.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return { payments, meta };
};

const getPaymentById = async (id) => {
  const payment = await Payment.findById(id)
    .populate('customerId', 'name email company')
    .populate('invoiceId', 'invoiceNumber grandTotal amountDue amountPaid status')
    .populate('recordedBy', 'name email')
    .populate('voidedBy', 'name email');

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  return payment;
};

const updatePayment = async (id, updateData) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  if (payment.status === 'voided') {
    throw ApiError.badRequest('Voided payments cannot be updated');
  }

  if (updateData.reference !== undefined) payment.reference = updateData.reference;
  if (updateData.notes !== undefined) payment.notes = updateData.notes;

  await payment.save();
  return payment;
};

/**
 * Voids a payment, reverts invoice status from paid to confirmed, and recomputes amounts due.
 */
const voidPayment = async (id, reason, user) => {
  let session = null;
  if (mongoose.connection.client?.topology?.description?.type === 'ReplicaSetWithPrimary' ||
      mongoose.connection.client?.topology?.description?.type === 'Sharded') {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }
  }

  try {
    const payQuery = Payment.findById(id);
    if (session) payQuery.session(session);
    const payment = await payQuery;

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    if (payment.status === 'voided') {
      throw ApiError.badRequest('Payment is already voided');
    }

    payment.status = 'voided';
    payment.voidedAt = new Date();
    payment.voidReason = reason;
    payment.voidedBy = user._id;

    if (session) {
      await payment.save({ session });
    } else {
      await payment.save();
    }

    // Recompute invoice amounts
    const invQuery = Invoice.findById(payment.invoiceId);
    if (session) invQuery.session(session);
    const invoice = await invQuery;

    if (invoice) {
      const activeQuery = Payment.find({
        invoiceId: invoice._id,
        status: 'recorded',
      });
      if (session) activeQuery.session(session);
      const activeRecorded = await activeQuery;

      const totalPaid = roundMoney(activeRecorded.reduce((s, p) => s + p.amount, 0));
      const amountDue = roundMoney(Math.max(0, invoice.grandTotal - totalPaid));

      invoice.amountPaid = totalPaid;
      invoice.amountDue = amountDue;

      if (invoice.status === 'paid' && amountDue > 0) {
        invoice.status = 'confirmed';
      }

      if (session) {
        await invoice.save({ session });
      } else {
        await invoice.save();
      }
    }

    if (session) {
      await session.commitTransaction();
    }
    invalidateDashboardCache();
    return { payment, invoice };
  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  recordPayment,
  listPayments,
  getPaymentById,
  updatePayment,
  voidPayment,
};
