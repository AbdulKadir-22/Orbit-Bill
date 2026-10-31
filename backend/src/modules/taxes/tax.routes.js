const express = require('express');
const router = express.Router();
const taxController = require('./tax.controller');
const {
  createTaxValidation,
  updateTaxValidation,
  updateTaxStatusValidation,
  listTaxesValidation,
  taxIdParamValidation,
} = require('./tax.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Taxes
 *   description: Tax rate configuration and management
 */

/**
 * @swagger
 * /api/v1/taxes:
 *   post:
 *     summary: Create a tax rate (Admin only)
 *     tags: [Taxes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: GST 18%
 *               rate:
 *                 type: number
 *                 example: 18
 *               appliesTo:
 *                 type: string
 *                 enum: [all, products]
 *                 default: all
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tax created successfully
 *       409:
 *         description: Tax with name already exists
 *   get:
 *     summary: List taxes (Admin and Staff with taxes:view)
 *     tags: [Taxes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of taxes
 */
router.route('/')
  .post(
    authorizeRoles(ROLES.ADMIN),
    validate(createTaxValidation),
    taxController.createTax
  )
  .get(
    requirePermission(PERMISSIONS.TAXES_VIEW),
    validate(listTaxesValidation),
    taxController.listTaxes
  );

/**
 * @swagger
 * /api/v1/taxes/{id}:
 *   get:
 *     summary: Get tax by ID
 *     tags: [Taxes]
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
 *         description: Tax details
 *   patch:
 *     summary: Update tax (Admin only)
 *     tags: [Taxes]
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
 *         description: Tax updated
 *   delete:
 *     summary: Delete tax (Admin only)
 *     tags: [Taxes]
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
 *         description: Tax deleted
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.TAXES_VIEW),
    validate(taxIdParamValidation),
    taxController.getTaxById
  )
  .patch(
    authorizeRoles(ROLES.ADMIN),
    validate(updateTaxValidation),
    taxController.updateTax
  )
  .delete(
    authorizeRoles(ROLES.ADMIN),
    validate(taxIdParamValidation),
    taxController.deleteTax
  );

/**
 * @swagger
 * /api/v1/taxes/{id}/status:
 *   patch:
 *     summary: Activate/deactivate tax (Admin only)
 *     tags: [Taxes]
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
 *         description: Tax status updated
 */
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validate(updateTaxStatusValidation),
  taxController.updateTaxStatus
);

module.exports = router;
