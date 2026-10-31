const express = require('express');
const router = express.Router();
const quotationController = require('./quotation.controller');
const {
  createQuotationValidation,
  createTemplateValidation,
  fromTemplateValidation,
  updateQuotationValidation,
  updateTemplateValidation,
  rejectQuotationValidation,
  convertQuotationValidation,
  quotationIdParamValidation,
  listQuotationsValidation,
} = require('./quotation.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Quotations
 *   description: Quotations, estimation templates, and subscription conversion
 */

/**
 * Quotation Template Endpoints
 */

/**
 * @swagger
 * /api/v1/quotations/templates:
 *   post:
 *     summary: Create quotation template (Admin and Staff with quotations:write)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateName, lines]
 *             properties:
 *               templateName:
 *                 type: string
 *                 example: Standard SaaS Enterprise Template
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, planId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     planId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     taxId:
 *                       type: string
 *     responses:
 *       201:
 *         description: Template created
 *   get:
 *     summary: List quotation templates (Admin and Staff with quotations:read)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 */
router.route('/templates')
  .post(
    requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
    validate(createTemplateValidation),
    quotationController.createTemplate
  )
  .get(
    requirePermission(PERMISSIONS.QUOTATIONS_READ),
    quotationController.listTemplates
  );

/**
 * @swagger
 * /api/v1/quotations/templates/{id}:
 *   patch:
 *     summary: Update quotation template (Admin and Staff with quotations:write)
 *     tags: [Quotations]
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
 *         description: Template updated
 *   delete:
 *     summary: Delete quotation template (Admin and Staff with quotations:write)
 *     tags: [Quotations]
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
 *         description: Template deleted
 */
router.route('/templates/:id')
  .patch(
    requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
    validate(updateTemplateValidation),
    quotationController.updateTemplate
  )
  .delete(
    requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
    validate(quotationIdParamValidation),
    quotationController.deleteTemplate
  );

/**
 * @swagger
 * /api/v1/quotations/from-template/{templateId}:
 *   post:
 *     summary: Create quotation from a template with live catalog re-pricing (Admin and Staff with quotations:write)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId]
 *             properties:
 *               customerId:
 *                 type: string
 *               validityDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Quotation generated from template
 */
router.post(
  '/from-template/:templateId',
  requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
  validate(fromTemplateValidation),
  quotationController.createFromTemplate
);

/**
 * Main Quotations Endpoints
 */

/**
 * @swagger
 * /api/v1/quotations:
 *   post:
 *     summary: Create a quotation (Admin and Staff with quotations:write)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, lines]
 *             properties:
 *               customerId:
 *                 type: string
 *               validityDays:
 *                 type: integer
 *                 default: 30
 *               notes:
 *                 type: string
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, planId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     planId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     taxId:
 *                       type: string
 *     responses:
 *       201:
 *         description: Quotation created
 *   get:
 *     summary: List quotations (Customers see own sent/confirmed; Admin/Staff see all per permissions)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, confirmed, rejected, expired]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quotations
 */
router.route('/')
  .post(
    requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
    validate(createQuotationValidation),
    quotationController.createQuotation
  )
  .get(
    validate(listQuotationsValidation),
    quotationController.listQuotations
  );

/**
 * @swagger
 * /api/v1/quotations/{id}:
 *   get:
 *     summary: Get quotation details by ID
 *     tags: [Quotations]
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
 *         description: Quotation details
 *   patch:
 *     summary: Update quotation (Draft status only; Admin and Staff with quotations:write)
 *     tags: [Quotations]
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
 *         description: Quotation updated
 *   delete:
 *     summary: Delete quotation (Draft status only; Admin and Staff with quotations:write)
 *     tags: [Quotations]
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
 *         description: Quotation deleted
 */
router.route('/:id')
  .get(
    validate(quotationIdParamValidation),
    quotationController.getQuotationById
  )
  .patch(
    requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
    validate(updateQuotationValidation),
    quotationController.updateQuotation
  )
  .delete(
    requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
    validate(quotationIdParamValidation),
    quotationController.deleteQuotation
  );

/**
 * @swagger
 * /api/v1/quotations/{id}/send:
 *   post:
 *     summary: Mark quotation as sent and dispatch email to customer
 *     tags: [Quotations]
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
 *         description: Quotation sent
 */
router.post(
  '/:id/send',
  requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
  validate(quotationIdParamValidation),
  quotationController.sendQuotation
);

/**
 * @swagger
 * /api/v1/quotations/{id}/reject:
 *   post:
 *     summary: Mark quotation as rejected
 *     tags: [Quotations]
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
 *         description: Quotation rejected
 */
router.post(
  '/:id/reject',
  requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
  validate(rejectQuotationValidation),
  quotationController.rejectQuotation
);

/**
 * @swagger
 * /api/v1/quotations/{id}/convert:
 *   post:
 *     summary: Convert quotation to a confirmed subscription in an atomic transaction
 *     tags: [Quotations]
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
 *             required: [startDate, expiryDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               paymentTerms:
 *                 type: string
 *                 default: Net 15
 *     responses:
 *       201:
 *         description: Subscription created and quotation confirmed
 *       409:
 *         description: Already converted or invalid state
 */
router.post(
  '/:id/convert',
  requirePermission(PERMISSIONS.QUOTATIONS_WRITE),
  validate(convertQuotationValidation),
  quotationController.convertQuotation
);

module.exports = router;
