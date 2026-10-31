const Discount = require('./discount.model');
const Product = require('../products/product.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');

const isReferenced = async (discountId) => {
  return false;
};

const createDiscount = async (data, userId) => {
  // If appliesTo === 'products', ensure specified productIds exist
  if (data.appliesTo === 'products' && data.productIds && data.productIds.length > 0) {
    const existingCount = await Product.countDocuments({ _id: { $in: data.productIds } });
    if (existingCount !== data.productIds.length) {
      throw ApiError.badRequest('One or more specified product IDs do not exist', [
        { field: 'productIds', message: 'All productIds must reference existing products' },
      ]);
    }
  }

  // Strip usedCount if sent
  const { usedCount, ...safeData } = data;

  const discount = await Discount.create({
    ...safeData,
    createdBy: userId,
  });

  return discount;
};

const listDiscounts = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.type) {
    filter.type = query.type;
  }

  if (query.appliesTo) {
    filter.appliesTo = query.appliesTo;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const now = new Date();
  if (query.status === 'running') {
    filter.isActive = true;
    filter.$and = [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      { $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
    ];
  } else if (query.status === 'expired') {
    filter.endDate = { $lt: now };
  } else if (query.status === 'upcoming') {
    filter.startDate = { $gt: now };
  } else if (query.status === 'exhausted') {
    filter.usageLimit = { $ne: null };
    filter.$expr = { $gte: ['$usedCount', '$usageLimit'] };
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['name']);
    Object.assign(filter, searchFilter);
  }

  const [discounts, total] = await Promise.all([
    Discount.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productIds', 'name salesPrice')
      .populate('createdBy', 'name email'),
    Discount.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { discounts, meta };
};

const getDiscountById = async (id) => {
  const discount = await Discount.findById(id)
    .populate('productIds', 'name salesPrice')
    .populate('createdBy', 'name email');
  if (!discount) {
    throw ApiError.notFound('Discount not found');
  }
  return discount;
};

const updateDiscount = async (id, updateData) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    throw ApiError.notFound('Discount not found');
  }

  // Reject modifying usedCount directly
  if (updateData.usedCount !== undefined) {
    throw ApiError.badRequest('usedCount cannot be modified directly via the API', [
      { field: 'usedCount', message: 'usedCount is a system-managed field' },
    ]);
  }

  if (updateData.productIds && updateData.productIds.length > 0) {
    const existingCount = await Product.countDocuments({ _id: { $in: updateData.productIds } });
    if (existingCount !== updateData.productIds.length) {
      throw ApiError.badRequest('One or more specified product IDs do not exist', [
        { field: 'productIds', message: 'All productIds must reference existing products' },
      ]);
    }
  }

  Object.assign(discount, updateData);
  await discount.save();
  return discount;
};

const updateDiscountStatus = async (id, isActive) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    throw ApiError.notFound('Discount not found');
  }

  discount.isActive = isActive;
  await discount.save();
  return discount;
};

const deleteDiscount = async (id) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    throw ApiError.notFound('Discount not found');
  }

  const referenced = await isReferenced(id);
  if (referenced) {
    discount.isActive = false;
    await discount.save();
    return { discount, hardDeleted: false, message: 'Discount is referenced; soft-deleted (deactivated).' };
  }

  await Discount.findByIdAndDelete(id);
  return { discount, hardDeleted: true, message: 'Discount deleted permanently.' };
};

module.exports = {
  isReferenced,
  createDiscount,
  listDiscounts,
  getDiscountById,
  updateDiscount,
  updateDiscountStatus,
  deleteDiscount,
};
