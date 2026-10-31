const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const {
  createProductValidation,
  updateProductValidation,
  updateProductStatusValidation,
  listProductsValidation,
  productIdParamValidation,
  addVariantValidation,
  updateVariantValidation,
  variantIdParamValidation,
} = require('./product.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product & Variant catalog management
 */

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a product with optional variants (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, salesPrice]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cloud ERP Suite
 *               type:
 *                 type: string
 *                 enum: [service, goods, software, addon]
 *                 example: software
 *               salesPrice:
 *                 type: number
 *                 example: 2400
 *               costPrice:
 *                 type: number
 *                 example: 800
 *               notes:
 *                 type: string
 *                 example: Enterprise ERP subscription
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, priceDelta, sku]
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Odoo
 *                     priceDelta:
 *                       type: number
 *                       example: 560
 *                     sku:
 *                       type: string
 *                       example: ERP-ODOO-01
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation failed (e.g. salesPrice + priceDelta < 0)
 *       403:
 *         description: Forbidden (Staff/Customer cannot mutate)
 *   get:
 *     summary: List products with pagination, search, and filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [service, goods, software, addon]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.route('/')
  .post(
    authorizeRoles(ROLES.ADMIN),
    validate(createProductValidation),
    productController.createProduct
  )
  .get(
    requirePermission(PERMISSIONS.PRODUCTS_VIEW),
    validate(listProductsValidation),
    productController.listProducts
  );

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *   patch:
 *     summary: Update product fields (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 *   delete:
 *     summary: Delete a product (Hard delete if unreferenced, soft-delete otherwise) (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.PRODUCTS_VIEW),
    validate(productIdParamValidation),
    productController.getProductById
  )
  .patch(
    authorizeRoles(ROLES.ADMIN),
    validate(updateProductValidation),
    productController.updateProduct
  )
  .delete(
    authorizeRoles(ROLES.ADMIN),
    validate(productIdParamValidation),
    productController.deleteProduct
  );

/**
 * @swagger
 * /api/v1/products/{id}/status:
 *   patch:
 *     summary: Activate or deactivate product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validate(updateProductStatusValidation),
  productController.updateProductStatus
);

/**
 * @swagger
 * /api/v1/products/{id}/variants:
 *   post:
 *     summary: Add variant to an existing product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Variant added
 */
router.post(
  '/:id/variants',
  authorizeRoles(ROLES.ADMIN),
  validate(addVariantValidation),
  productController.addVariant
);

/**
 * @swagger
 * /api/v1/products/{id}/variants/{variantId}:
 *   patch:
 *     summary: Update variant fields (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variant updated
 *   delete:
 *     summary: Delete variant from product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variant removed
 */
router.route('/:id/variants/:variantId')
  .patch(
    authorizeRoles(ROLES.ADMIN),
    validate(updateVariantValidation),
    productController.updateVariant
  )
  .delete(
    authorizeRoles(ROLES.ADMIN),
    validate(variantIdParamValidation),
    productController.deleteVariant
  );

module.exports = router;
