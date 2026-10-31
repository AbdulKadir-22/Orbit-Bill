const Product = require('./product.model');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const logger = require('../../config/logger');

/**
 * Checks if a product is referenced in quotations, subscriptions, or invoices.
 * TODO: In Phase 3 and Phase 4, check Quotation, Subscription, and Invoice collections.
 *
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
const isReferenced = async (productId) => {
  // Currently unreferenced in Phase 2
  return false;
};

const createProduct = async (data, userId) => {
  if (data.costPrice !== undefined && data.salesPrice < data.costPrice) {
    logger.warn(`Product '${data.name}' created with salesPrice (${data.salesPrice}) lower than costPrice (${data.costPrice})`);
  }

  const product = await Product.create({
    ...data,
    createdBy: userId,
  });

  return product;
};

const listProducts = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['name', 'notes', 'variants.sku', 'variants.name']);
    Object.assign(filter, searchFilter);
  }

  const sortField = query.sortBy || 'createdAt';
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Product.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { products, meta };
};

const getProductById = async (id) => {
  const product = await Product.findById(id).populate('createdBy', 'name email');
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
};

const updateProduct = async (id, updateData) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check salesPrice vs existing/incoming variants
  const newSalesPrice = updateData.salesPrice !== undefined ? updateData.salesPrice : product.salesPrice;
  const newCostPrice = updateData.costPrice !== undefined ? updateData.costPrice : product.costPrice;

  if (newSalesPrice < newCostPrice) {
    logger.warn(`Product '${product.name}' updated with salesPrice (${newSalesPrice}) lower than costPrice (${newCostPrice})`);
  }

  for (const v of product.variants) {
    if (newSalesPrice + v.priceDelta < 0) {
      throw ApiError.badRequest(
        `New sales price ${newSalesPrice} would cause variant '${v.name}' price to be negative (${newSalesPrice + v.priceDelta})`
      );
    }
  }

  Object.assign(product, updateData);
  await product.save();
  return product;
};

const updateProductStatus = async (id, isActive) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  product.isActive = isActive;
  await product.save();
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const referenced = await isReferenced(id);
  if (referenced) {
    // Soft delete if referenced
    product.isActive = false;
    await product.save();
    return { product, hardDeleted: false, message: 'Product is referenced by active documents; soft-deleted (deactivated).' };
  }

  // Hard delete allowed when unreferenced
  await Product.findByIdAndDelete(id);
  return { product, hardDeleted: true, message: 'Product deleted permanently.' };
};

// --- Variant Operations ---

const addVariant = async (productId, variantData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check unique name and SKU
  const lowerName = variantData.name.toLowerCase();
  const lowerSku = variantData.sku.toLowerCase();

  const nameExists = product.variants.some((v) => v.name.toLowerCase() === lowerName);
  if (nameExists) {
    throw ApiError.conflict(`Variant name '${variantData.name}' already exists in this product`);
  }

  const skuExists = product.variants.some((v) => v.sku.toLowerCase() === lowerSku);
  if (skuExists) {
    throw ApiError.conflict(`Variant SKU '${variantData.sku}' already exists in this product`);
  }

  if (product.salesPrice + variantData.priceDelta < 0) {
    throw ApiError.badRequest(
      `salesPrice + priceDelta (${product.salesPrice} + ${variantData.priceDelta}) cannot result in a negative price`
    );
  }

  product.variants.push(variantData);
  await product.save();
  return product;
};

const updateVariant = async (productId, variantId, updateData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const variant = product.variants.id(variantId);
  if (!variant) {
    throw ApiError.notFound('Variant not found in product');
  }

  if (updateData.name) {
    const lowerName = updateData.name.toLowerCase();
    const duplicate = product.variants.some(
      (v) => v._id.toString() !== variantId && v.name.toLowerCase() === lowerName
    );
    if (duplicate) {
      throw ApiError.conflict(`Variant name '${updateData.name}' already exists in this product`);
    }
  }

  if (updateData.sku) {
    const lowerSku = updateData.sku.toLowerCase();
    const duplicate = product.variants.some(
      (v) => v._id.toString() !== variantId && v.sku.toLowerCase() === lowerSku
    );
    if (duplicate) {
      throw ApiError.conflict(`Variant SKU '${updateData.sku}' already exists in this product`);
    }
  }

  const priceDelta = updateData.priceDelta !== undefined ? updateData.priceDelta : variant.priceDelta;
  if (product.salesPrice + priceDelta < 0) {
    throw ApiError.badRequest(
      `salesPrice + priceDelta (${product.salesPrice} + ${priceDelta}) cannot result in a negative price`
    );
  }

  Object.assign(variant, updateData);
  await product.save();
  return product;
};

const deleteVariant = async (productId, variantId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const variant = product.variants.id(variantId);
  if (!variant) {
    throw ApiError.notFound('Variant not found in product');
  }

  product.variants.pull(variantId);
  await product.save();
  return product;
};

module.exports = {
  isReferenced,
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
};
