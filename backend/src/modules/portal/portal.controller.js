const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Invoice = require('../invoices/invoice.model');
const Subscription = require('../subscriptions/subscription.model');
const Payment = require('../payments/payment.model');
const Customer = require('../customers/customer.model');
const { generateInvoicePdf } = require('../invoices/invoice.pdf');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { startOfDay } = require('../../utils/dates');

// Explicit Portal Response Mappers (Hides createdBy, internal notes, cost fields)
const mapPortalSubscription = (sub) => ({
  _id: sub._id,
  subscriptionNumber: sub.subscriptionNumber,
  billingCycle: sub.billingCycle,
  startDate: sub.startDate,
  expiryDate: sub.expiryDate,
  nextBillingDate: sub.nextBillingDate,
  paymentTerms: sub.paymentTerms,
  status: sub.status,
  lines: (sub.lines || []).map((l) => ({
    productName: l.productName,
    variantName: l.variantName,
    planName: l.planName,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
  })),
  subtotal: sub.subtotal,
  taxTotal: sub.taxTotal,
  grandTotal: sub.grandTotal,
  statusHistory: (sub.statusHistory || []).map((h) => ({
    action: h.action,
    from: h.from,
    to: h.to,
    at: h.at,
  })),
  createdAt: sub.createdAt,
});

const mapPortalInvoice = (inv) => ({
  _id: inv._id,
  invoiceNumber: inv.invoiceNumber,
  invoiceDate: inv.invoiceDate,
  dueDate: inv.dueDate,
  billingPeriod: inv.billingPeriod,
  lines: (inv.lines || []).map((l) => ({
    productName: l.productName,
    variantName: l.variantName,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxAmount: l.taxAmount,
    discountAmount: l.discountAmount,
    lineTotal: l.lineTotal,
  })),
  subtotal: inv.subtotal,
  taxTotal: inv.taxTotal,
  discountTotal: inv.discountTotal,
  grandTotal: inv.grandTotal,
  amountPaid: inv.amountPaid,
  amountDue: inv.amountDue,
  status: inv.status,
  isOverdue:
    inv.status === 'confirmed' && inv.amountDue > 0 && new Date(inv.dueDate) < startOfDay(new Date()),
  paymentStatus: inv.amountPaid === 0 ? 'unpaid' : inv.amountDue === 0 ? 'paid' : 'partial',
  createdAt: inv.createdAt,
});

const mapPortalPayment = (pay) => ({
  _id: pay._id,
  paymentNumber: pay.paymentNumber,
  invoiceId: pay.invoiceId,
  amount: pay.amount,
  method: pay.method,
  paidAt: pay.paidAt,
  reference: pay.reference,
  status: pay.status,
});

const ensureCustomer = (req) => {
  if (!req.user.customerId) {
    throw ApiError.conflict('No customer profile linked to your user account');
  }
  return req.user.customerId;
};

const getPortalDashboard = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const startOfToday = startOfDay(new Date());

  const [activeSubscriptions, invoices, payments] = await Promise.all([
    Subscription.countDocuments({ customerId, status: 'active' }),
    Invoice.find({ customerId, status: { $in: ['confirmed', 'paid'] } })
      .sort({ createdAt: -1 })
      .lean(),
    Payment.find({ customerId, status: 'recorded' })
      .sort({ paidAt: -1 })
      .limit(5)
      .lean(),
  ]);

  let totalOutstanding = 0;
  let overdueCount = 0;

  invoices.forEach((inv) => {
    totalOutstanding += inv.amountDue;
    if (inv.status === 'confirmed' && inv.amountDue > 0 && new Date(inv.dueDate) < startOfToday) {
      overdueCount++;
    }
  });

  const nextSub = await Subscription.findOne({ customerId, status: 'active', nextBillingDate: { $ne: null } })
    .sort({ nextBillingDate: 1 })
    .lean();

  return ApiResponse.success(res, 'Portal dashboard retrieved successfully', {
    activeSubscriptionCount: activeSubscriptions,
    totalOutstandingAmount: Math.round(totalOutstanding * 100) / 100,
    overdueInvoiceCount: overdueCount,
    nextBillingDate: nextSub ? nextSub.nextBillingDate : null,
    recentInvoices: invoices.slice(0, 5).map(mapPortalInvoice),
    recentPayments: payments.map(mapPortalPayment),
  });
});

const getPortalSubscriptions = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { customerId };
  if (req.query.status === 'active') {
    filter.status = 'active';
  } else if (req.query.status === 'previous') {
    filter.status = { $in: ['closed'] };
  }

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscription.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return ApiResponse.success(res, 'Subscriptions retrieved successfully', subscriptions.map(mapPortalSubscription), meta);
});

const getPortalSubscriptionById = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const subscription = await Subscription.findOne({ _id: req.params.id, customerId }).lean();

  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }

  return ApiResponse.success(res, 'Subscription details retrieved successfully', mapPortalSubscription(subscription));
});

const getPortalInvoices = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const { page, limit, skip } = parsePagination(req.query);

  // Portal never shows draft or cancelled invoices
  const filter = {
    customerId,
    status: { $in: ['confirmed', 'paid'] },
  };

  const [invoices, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return ApiResponse.success(res, 'Invoices retrieved successfully', invoices.map(mapPortalInvoice), meta);
});

const getPortalInvoiceById = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    customerId,
    status: { $in: ['confirmed', 'paid'] },
  }).lean();

  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  return ApiResponse.success(res, 'Invoice details retrieved successfully', mapPortalInvoice(invoice));
});

const streamPortalInvoicePdf = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    customerId,
    status: { $in: ['confirmed', 'paid'] },
  }).populate('customerId', 'name email company phone gstin address');

  if (!invoice) {
    throw ApiError.notFound('Invoice not found');
  }

  const download = req.query.download === 'true';
  generateInvoicePdf(invoice, res, download);
});

const getPortalPayments = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const { page, limit, skip } = parsePagination(req.query);

  const [payments, total] = await Promise.all([
    Payment.find({ customerId, status: 'recorded' }).sort({ paidAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments({ customerId, status: 'recorded' }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return ApiResponse.success(res, 'Payments retrieved successfully', payments.map(mapPortalPayment), meta);
});

const getProfile = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const customer = await Customer.findById(customerId).select('-createdBy').lean();
  if (!customer) {
    throw ApiError.notFound('Customer profile not found');
  }
  return ApiResponse.success(res, 'Customer profile retrieved successfully', customer);
});

const updateProfile = asyncHandler(async (req, res) => {
  const customerId = ensureCustomer(req);
  const allowedUpdates = {};
  if (req.body.phone !== undefined) allowedUpdates.phone = req.body.phone;
  if (req.body.billingAddress !== undefined) allowedUpdates.billingAddress = req.body.billingAddress;
  if (req.body.shippingAddress !== undefined) allowedUpdates.shippingAddress = req.body.shippingAddress;

  const customer = await Customer.findByIdAndUpdate(customerId, { $set: allowedUpdates }, { new: true })
    .select('-createdBy')
    .lean();

  if (!customer) {
    throw ApiError.notFound('Customer profile not found');
  }

  return ApiResponse.success(res, 'Customer profile updated successfully', customer);
});

module.exports = {
  getPortalDashboard,
  getProfile,
  updateProfile,
  getPortalSubscriptions,
  getPortalSubscriptionById,
  getPortalInvoices,
  getPortalInvoiceById,
  streamPortalInvoicePdf,
  getPortalPayments,
};
