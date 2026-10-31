const Tax = require('./tax.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');

const isReferenced = async (taxId) => {
  return false;
};

const createTax = async (data, userId) => {
  const existing = await Tax.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
  });
  if (existing) {
    throw ApiError.conflict(`Tax with name '${data.name}' already exists`, [
      { field: 'name', message: 'Tax name must be unique' },
    ]);
  }

  const tax = await Tax.create({
    ...data,
    createdBy: userId,
  });
  return tax;
};

const listTaxes = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['name']);
    Object.assign(filter, searchFilter);
  }

  const [taxes, total] = await Promise.all([
    Tax.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Tax.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { taxes, meta };
};

const getTaxById = async (id) => {
  const tax = await Tax.findById(id).populate('createdBy', 'name email');
  if (!tax) {
    throw ApiError.notFound('Tax not found');
  }
  return tax;
};

const updateTax = async (id, updateData) => {
  const tax = await Tax.findById(id);
  if (!tax) {
    throw ApiError.notFound('Tax not found');
  }

  if (updateData.name && updateData.name.trim().toLowerCase() !== tax.name.toLowerCase()) {
    const existing = await Tax.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
    });
    if (existing) {
      throw ApiError.conflict(`Tax with name '${updateData.name}' already exists`, [
        { field: 'name', message: 'Tax name must be unique' },
      ]);
    }
  }

  Object.assign(tax, updateData);
  await tax.save();
  return tax;
};

const updateTaxStatus = async (id, isActive) => {
  const tax = await Tax.findById(id);
  if (!tax) {
    throw ApiError.notFound('Tax not found');
  }

  tax.isActive = isActive;
  await tax.save();
  return tax;
};

const deleteTax = async (id) => {
  const tax = await Tax.findById(id);
  if (!tax) {
    throw ApiError.notFound('Tax not found');
  }

  const referenced = await isReferenced(id);
  if (referenced) {
    tax.isActive = false;
    await tax.save();
    return { tax, hardDeleted: false, message: 'Tax is referenced in existing transactions; soft-deleted (deactivated).' };
  }

  await Tax.findByIdAndDelete(id);
  return { tax, hardDeleted: true, message: 'Tax deleted permanently.' };
};

module.exports = {
  isReferenced,
  createTax,
  listTaxes,
  getTaxById,
  updateTax,
  updateTaxStatus,
  deleteTax,
};
