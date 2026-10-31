const express = require('express');
const router = express.Router();
const discountController = require('./discount.controller');
const {
  createDiscountValidation,
  updateDiscountValidation,
  updateDiscountStatusValidation,
  listDiscountsValidation,
  discountIdParamValidation,
} = require('./discount.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Discounts
 *   description: Promotional and contract discount management
 */

/**
 * @swagger
 * /api/v1/discounts:
 *   post:
 *     summary: Create discount rule (Admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, value, appliesTo]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Summer Special 15%
 *               type:
 *                 type: string
 *                 enum: [fixed, percentage]
 *                 example: percentage
 *               value:
 *                 type: number
 *                 example: 15
 *               minPurchase:
 *                 type: number
 *                 example: 500
 *               minQuantity:
 *                 type: integer
 *                 example: 1
 *               appliesTo:
 *                 type: string
 *                 enum: [products, subscription]
 *                 example: subscription
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: integer
 *                 nullable: true
 *                 example: 100
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         description: Validation failed (percentage > 100, missing productIds, etc.)
 *   get:
 *     summary: List discounts (Admin and Staff with discounts:view)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [running, expired, upcoming, exhausted]
 *       - in: query
 *         name: appliesTo
 *         schema:
 *           type: string
 *           enum: [products, subscription]
 *     responses:
 *       200:
 *         description: List of discounts
 */
router.route('/')
  .post(
    authorizeRoles(ROLES.ADMIN),
    validate(createDiscountValidation),
    discountController.createDiscount
  )
  .get(
    requirePermission(PERMISSIONS.DISCOUNTS_VIEW),
    validate(listDiscountsValidation),
    discountController.listDiscounts
  );

/**
 * @swagger
 * /api/v1/discounts/{id}:
 *   get:
 *     summary: Get discount by ID
 *     tags: [Discounts]
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
 *         description: Discount details
 *   patch:
 *     summary: Update discount fields (Admin only, usedCount cannot be edited)
 *     tags: [Discounts]
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
 *         description: Discount updated
 *   delete:
 *     summary: Delete discount (Admin only)
 *     tags: [Discounts]
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
 *         description: Discount deleted
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.DISCOUNTS_VIEW),
    validate(discountIdParamValidation),
    discountController.getDiscountById
  )
  .patch(
    authorizeRoles(ROLES.ADMIN),
    validate(updateDiscountValidation),
    discountController.updateDiscount
  )
  .delete(
    authorizeRoles(ROLES.ADMIN),
    validate(discountIdParamValidation),
    discountController.deleteDiscount
  );

/**
 * @swagger
 * /api/v1/discounts/{id}/status:
 *   patch:
 *     summary: Activate/deactivate discount (Admin only)
 *     tags: [Discounts]
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
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validate(updateDiscountStatusValidation),
  discountController.updateDiscountStatus
);

module.exports = router;
