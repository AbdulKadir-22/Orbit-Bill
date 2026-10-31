const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const productService = require('./product.service');

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user._id);
  return ApiResponse.created(res, 'Product created successfully', product);
});

const listProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.listProducts(req.query);
  return ApiResponse.success(res, 'Products retrieved successfully', products, meta);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return ApiResponse.success(res, 'Product retrieved successfully', product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return ApiResponse.success(res, 'Product updated successfully', product);
});

const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await productService.updateProductStatus(req.params.id, req.body.isActive);
  const statusLabel = product.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, `Product ${statusLabel} successfully`, product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  return ApiResponse.success(res, result.message, result.product);
});

const addVariant = asyncHandler(async (req, res) => {
  const product = await productService.addVariant(req.params.id, req.body);
  return ApiResponse.created(res, 'Variant added successfully', product);
});

const updateVariant = asyncHandler(async (req, res) => {
  const product = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
  return ApiResponse.success(res, 'Variant updated successfully', product);
});

const deleteVariant = asyncHandler(async (req, res) => {
  const product = await productService.deleteVariant(req.params.id, req.params.variantId);
  return ApiResponse.success(res, 'Variant removed successfully', product);
});

module.exports = {
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
