const mongoose = require('mongoose');
const Quotation = require('./quotation.model');
const Customer = require('../customers/customer.model');
const Subscription = require('../subscriptions/subscription.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const { buildLines } = require('../../utils/lineBuilder');
const { generateSequenceNumber } = require('../../utils/numberGenerator');
const { addDays, isPast } = require('../../utils/dates');
const { sendQuotationEmail } = require('../../emails/email.service');
const ROLES = require('../../constants/roles');
const env = require('../../config/env');

const createQuotation = async (data, user) => {
  const customer = await Customer.findById(data.customerId);
  if (!customer || !customer.isActive) {
    throw ApiError.badRequest('Invalid or inactive customer specified');
  }

  const { lines, subtotal, taxTotal, discountTotal, grandTotal, discountPreview } = await buildLines(
    data.lines,
    { user }
  );

  const validityDays = data.validityDays || 30;
  const quoteNumber = await generateSequenceNumber('quotation', 'QT');

  const quotation = await Quotation.create({
    quoteNumber,
    customerId: customer._id,
    lines,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    discountPreview,
    validityDays,
    validUntil: null, // set upon send or when created from template
    notes: data.notes || '',
    status: 'draft',
    isTemplate: false,
    createdBy: user._id,
  });

  return quotation;
};

const createTemplate = async (data, user) => {
  const { lines, subtotal, taxTotal, discountTotal, grandTotal, discountPreview } = await buildLines(
    data.lines,
    { user }
  );

  const template = await Quotation.create({
    quoteNumber: undefined,
    customerId: null,
    templateName: data.templateName.trim(),
    lines,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    discountPreview,
    validityDays: data.validityDays || 30,
    notes: data.notes || '',
    status: 'draft',
    isTemplate: true,
    createdBy: user._id,
  });

  return template;
};

const listTemplates = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { isTemplate: true };

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['templateName', 'notes']);
    Object.assign(filter, searchFilter);
  }

  const [templates, total] = await Promise.all([
    Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Quotation.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return { templates, meta };
};

const updateTemplate = async (id, data, user) => {
  const template = await Quotation.findOne({ _id: id, isTemplate: true });
  if (!template) {
    throw ApiError.notFound('Quotation template not found');
  }

  if (data.templateName) {
    template.templateName = data.templateName.trim();
  }
  if (data.notes !== undefined) {
    template.notes = data.notes;
  }
  if (data.validityDays !== undefined) {
    template.validityDays = data.validityDays;
  }

  if (data.lines && data.lines.length > 0) {
    const calculated = await buildLines(data.lines, { user });
    template.lines = calculated.lines;
    template.subtotal = calculated.subtotal;
    template.taxTotal = calculated.taxTotal;
    template.discountTotal = calculated.discountTotal;
    template.grandTotal = calculated.grandTotal;
    template.discountPreview = calculated.discountPreview;
  }

  await template.save();
  return template;
};

const deleteTemplate = async (id) => {
  const template = await Quotation.findOne({ _id: id, isTemplate: true });
  if (!template) {
    throw ApiError.notFound('Quotation template not found');
  }

  await Quotation.findByIdAndDelete(id);
  return template;
};

const createFromTemplate = async (templateId, data, user) => {
  const template = await Quotation.findOne({ _id: templateId, isTemplate: true });
  if (!template) {
    throw ApiError.notFound('Quotation template not found');
  }

  const customer = await Customer.findById(data.customerId);
  if (!customer || !customer.isActive) {
    throw ApiError.badRequest('Invalid or inactive customer specified');
  }

  // RE-PRICE against current live catalog data
  const templateRawLines = template.lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    planId: l.planId,
    quantity: l.quantity,
    taxId: l.taxId,
    unitPriceOverride: l.priceOverridden ? l.unitPrice : undefined,
  }));

  const { lines, subtotal, taxTotal, discountTotal, grandTotal, discountPreview } = await buildLines(
    templateRawLines,
    { user }
  );

  const validityDays = data.validityDays || template.validityDays || 30;
  const quoteNumber = await generateSequenceNumber('quotation', 'QT');
  const validUntil = addDays(new Date(), validityDays);

  const quotation = await Quotation.create({
    quoteNumber,
    customerId: customer._id,
    lines,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    discountPreview,
    validityDays,
    validUntil,
    notes: data.notes !== undefined ? data.notes : template.notes,
    status: 'draft',
    isTemplate: false,
    createdBy: user._id,
  });

  return quotation;
};

const listQuotations = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { isTemplate: query.isTemplate === true };

  // Customer scoping: Customers can only see their own quotations in sent or confirmed status
  if (user.role === ROLES.CUSTOMER) {
    if (!user.customerId) {
      return { quotations: [], meta: buildPaginationMeta(0, page, limit) };
    }
    filter.customerId = user.customerId;
    filter.status = { $in: ['sent', 'confirmed'] };
  } else {
    // Admin / Staff filters
    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.status) {
      filter.status = query.status;
    }
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['quoteNumber', 'notes']);
    Object.assign(filter, searchFilter);
  }

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email company')
      .populate('createdBy', 'name email'),
    Quotation.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return { quotations, meta };
};

const getQuotationById = async (id, user) => {
  const quotation = await Quotation.findById(id)
    .populate('customerId', 'name email company phone address')
    .populate('createdBy', 'name email');

  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  // Customer scoping
  if (user.role === ROLES.CUSTOMER) {
    if (
      !user.customerId ||
      quotation.customerId?._id.toString() !== user.customerId.toString() ||
      ['draft', 'rejected'].includes(quotation.status) ||
      quotation.isTemplate
    ) {
      throw ApiError.notFound('Quotation not found');
    }
  }

  return quotation;
};

const updateQuotation = async (id, updateData, user) => {
  const quotation = await Quotation.findById(id);
  if (!quotation || quotation.isTemplate) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status !== 'draft') {
    throw ApiError.badRequest(`Quotation cannot be edited while in '${quotation.status}' status. Only draft quotations can be modified.`);
  }

  if (updateData.notes !== undefined) {
    quotation.notes = updateData.notes;
  }
  if (updateData.validityDays !== undefined) {
    quotation.validityDays = updateData.validityDays;
  }

  if (updateData.lines && updateData.lines.length > 0) {
    const calculated = await buildLines(updateData.lines, { user });
    quotation.lines = calculated.lines;
    quotation.subtotal = calculated.subtotal;
    quotation.taxTotal = calculated.taxTotal;
    quotation.discountTotal = calculated.discountTotal;
    quotation.grandTotal = calculated.grandTotal;
    quotation.discountPreview = calculated.discountPreview;
  }

  await quotation.save();
  return quotation;
};

const deleteQuotation = async (id) => {
  const quotation = await Quotation.findById(id);
  if (!quotation || quotation.isTemplate) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status !== 'draft') {
    throw ApiError.badRequest(`Only draft quotations can be deleted. Current status is '${quotation.status}'.`);
  }

  await Quotation.findByIdAndDelete(id);
  return quotation;
};

const sendQuotation = async (id) => {
  const quotation = await Quotation.findById(id).populate('customerId', 'name email');
  if (!quotation || quotation.isTemplate) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status !== 'draft') {
    throw ApiError.badRequest(`Only draft quotations can be sent. Current status is '${quotation.status}'.`);
  }

  const sentAt = new Date();
  const validUntil = addDays(sentAt, quotation.validityDays || 30);

  quotation.status = 'sent';
  quotation.sentAt = sentAt;
  quotation.validUntil = validUntil;
  await quotation.save();

  // Send email via Resend
  let emailSent = false;
  if (quotation.customerId && quotation.customerId.email) {
    const result = await sendQuotationEmail({
      quoteNumber: quotation.quoteNumber,
      customerName: quotation.customerId.name,
      customerEmail: quotation.customerId.email,
      validUntil,
      grandTotal: quotation.grandTotal,
      lines: quotation.lines,
    });
    emailSent = result.success;
  }

  return { quotation, emailSent };
};

const rejectQuotation = async (id, reason = '') => {
  const quotation = await Quotation.findById(id);
  if (!quotation || quotation.isTemplate) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status === 'confirmed') {
    throw ApiError.badRequest('Confirmed quotations cannot be rejected');
  }

  quotation.status = 'rejected';
  if (reason) {
    quotation.notes = quotation.notes ? `${quotation.notes} | Rejected reason: ${reason}` : `Rejected reason: ${reason}`;
  }
  await quotation.save();
  return quotation;
};

/**
 * Converts a quotation into a confirmed subscription inside an atomic transaction.
 */
const convertQuotation = async (id, { startDate, expiryDate, paymentTerms }, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Re-read quotation inside the transaction
    const quotation = await Quotation.findById(id).session(session);
    if (!quotation || quotation.isTemplate) {
      throw ApiError.notFound('Quotation not found');
    }

    if (!['draft', 'sent'].includes(quotation.status)) {
      throw ApiError.conflict(
        `Quotation cannot be converted. Status must be 'draft' or 'sent', but is '${quotation.status}'.`
      );
    }

    // Check expiration
    if (quotation.validUntil && isPast(quotation.validUntil)) {
      quotation.status = 'expired';
      await quotation.save({ session });
      throw ApiError.badRequest('Quotation has expired and cannot be converted into a subscription');
    }

    // 2. Re-price lines via buildLines to ensure current catalog validity
    const rawLines = quotation.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      planId: l.planId,
      quantity: l.quantity,
      taxId: l.taxId,
      unitPriceOverride: l.priceOverridden ? l.unitPrice : undefined,
    }));

    const calculated = await buildLines(rawLines, { session, user });

    // 3. Date rules validation
    const parsedStart = new Date(startDate);
    const parsedExpiry = new Date(expiryDate);
    if (parsedExpiry <= parsedStart) {
      throw ApiError.badRequest('expiryDate must be strictly after startDate');
    }

    // 4. Generate unique subscription number using the transaction session
    const subscriptionNumber = await generateSequenceNumber('subscription', 'SUB', { session });

    // 5. Create Subscription with status confirmed
    const resolvedPaymentTerms = paymentTerms || 'Net 15';
    const paymentDaysMatch = resolvedPaymentTerms.match(/\d+/);
    const paymentTermsDays = paymentDaysMatch ? parseInt(paymentDaysMatch[0], 10) : (env.DEFAULT_PAYMENT_TERMS_DAYS || 15);

    const subscription = new Subscription({
      subscriptionNumber,
      customerId: quotation.customerId,
      quotationId: quotation._id,
      lines: calculated.lines,
      billingCycle: calculated.billingCycle,
      startDate: parsedStart,
      expiryDate: parsedExpiry,
      nextBillingDate: null,
      paymentTerms: resolvedPaymentTerms,
      paymentTermsDays,
      status: 'confirmed',
      subtotal: calculated.subtotal,
      taxTotal: calculated.taxTotal,
      grandTotal: calculated.grandTotal,
      statusHistory: [
        {
          action: 'convert',
          from: null,
          to: 'confirmed',
          at: new Date(),
          by: user._id,
          reason: `Converted from quotation ${quotation.quoteNumber}`,
        },
      ],
      createdBy: user._id,
    });

    await subscription.save({ session });

    // 6. Mark quotation as confirmed and record subscriptionId
    quotation.status = 'confirmed';
    quotation.subscriptionId = subscription._id;
    await quotation.save({ session });

    await session.commitTransaction();
    return { quotation, subscription };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createQuotation,
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  createFromTemplate,
  listQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
  rejectQuotation,
  convertQuotation,
};
