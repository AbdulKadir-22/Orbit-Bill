const Customer = require('./customer.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const ROLES = require('../../constants/roles');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const { generateCryptoToken, hashToken } = require('../../utils/tokens');
const { sendPasswordResetEmail } = require('../../emails/email.service');
const env = require('../../config/env');

const isReferenced = async (customerId) => {
  return false;
};

const createCustomer = async (data, creatorId = null) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existing = await Customer.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.conflict(`A customer with email '${data.email}' already exists`, [
      { field: 'email', message: 'Customer email must be unique' },
    ]);
  }

  const customer = await Customer.create({
    ...data,
    email: normalizedEmail,
    createdBy: creatorId,
  });

  return customer;
};

const listCustomers = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['name', 'email', 'phone', 'company']);
    Object.assign(filter, searchFilter);
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Customer.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { customers, meta };
};

const getCustomerById = async (id) => {
  const customer = await Customer.findById(id).populate('createdBy', 'name email');
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }
  return customer;
};

const updateCustomer = async (id, updateData) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  if (updateData.email && updateData.email.toLowerCase().trim() !== customer.email) {
    const normalizedEmail = updateData.email.toLowerCase().trim();
    const existing = await Customer.findOne({ _id: { $ne: id }, email: normalizedEmail });
    if (existing) {
      throw ApiError.conflict(`A customer with email '${updateData.email}' already exists`, [
        { field: 'email', message: 'Customer email must be unique' },
      ]);
    }
    updateData.email = normalizedEmail;
  }

  Object.assign(customer, updateData);
  await customer.save();
  return customer;
};

const updateCustomerStatus = async (id, isActive) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  customer.isActive = isActive;
  await customer.save();

  // If customer is deactivated, deactivate any linked User portal account as well
  if (!isActive) {
    await User.updateMany(
      { customerId: customer._id },
      { isActive: false, refreshTokenHash: null }
    );
  }

  return customer;
};

const deleteCustomer = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  const referenced = await isReferenced(id);
  if (referenced) {
    customer.isActive = false;
    await customer.save();
    return { customer, hardDeleted: false, message: 'Customer has active subscriptions/invoices; soft-deleted (deactivated).' };
  }

  await Customer.findByIdAndDelete(id);
  return { customer, hardDeleted: true, message: 'Customer deleted permanently.' };
};

/**
 * Creates a portal user linked to an existing Customer record, sends password setup link.
 */
const createPortalAccount = async (customerId, creatorId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  // Check if a portal user already exists for this customerId or email
  const existingUserByCustomer = await User.findOne({ customerId: customer._id });
  if (existingUserByCustomer) {
    throw ApiError.conflict('Customer already has a linked portal user account');
  }

  const existingUserByEmail = await User.findOne({ email: customer.email });
  if (existingUserByEmail) {
    if (existingUserByEmail.customerId) {
      throw ApiError.conflict('A portal user account with this email already exists and is linked');
    }
    // Link existing user if found
    existingUserByEmail.customerId = customer._id;
    await existingUserByEmail.save();
    return existingUserByEmail;
  }

  // Generate a random temporary password and a password reset token
  const temporaryPassword = `Portal@${generateCryptoToken(8)}!`;
  const rawResetToken = generateCryptoToken(32);
  const hashedToken = hashToken(rawResetToken);
  const expiresAt = new Date(Date.now() + env.RESET_PASSWORD_EXPIRES_MIN * 60 * 1000);

  const newUser = await User.create({
    name: customer.name,
    email: customer.email,
    password: temporaryPassword,
    role: ROLES.CUSTOMER,
    customerId: customer._id,
    isActive: true,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: expiresAt,
    createdBy: creatorId,
  });

  // Dispatch setup/reset password link via email
  sendPasswordResetEmail({
    name: customer.name,
    email: customer.email,
    resetToken: rawResetToken,
  }).catch(() => {});

  return newUser;
};

/**
 * Summary placeholder for Phase 3 and 4 subscriptions, quotations, and invoices.
 */
const getCustomerSummary = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  // TODO: In Phase 3 and Phase 4, populate subscriptions, quotations, and invoices
  return {
    customerId: customer._id,
    customerName: customer.name,
    subscriptions: [],
    quotations: [],
    invoices: [],
  };
};

module.exports = {
  isReferenced,
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  createPortalAccount,
  getCustomerSummary,
};
