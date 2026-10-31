const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const {
  updateInvoiceValidation,
  cancelInvoiceValidation,
  invoiceIdParamValidation,
  listInvoicesValidation,
} = require('./invoice.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice generation, state lifecycle, PDF streaming and cancellation
 */

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: List invoices with pagination, overdue calculation and status filters
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, confirmed, paid, cancelled]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [unpaid, partial, paid]
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated invoice list
 */
router.post(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.STAFF),
  invoiceController.createInvoice
);

router.post(
  '/generate',
  requirePermission(PERMISSIONS.INVOICES_MANAGE),
  invoiceController.runBilling
);

router.get(
  '/',
  requirePermission(PERMISSIONS.INVOICES_READ),
  validate(listInvoicesValidation),
  invoiceController.listInvoices
);

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice details
 *   patch:
 *     summary: Update draft invoice fields (Admin only)
 *     tags: [Invoices]
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
 *         description: Invoice updated
 *   delete:
 *     summary: Delete draft invoice (Admin only)
 *     tags: [Invoices]
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
 *         description: Invoice deleted
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.INVOICES_READ),
    validate(invoiceIdParamValidation),
    invoiceController.getInvoiceById
  )
  .patch(
    authorizeRoles(ROLES.ADMIN),
    validate(updateInvoiceValidation),
    invoiceController.updateInvoice
  )
  .delete(
    authorizeRoles(ROLES.ADMIN),
    validate(invoiceIdParamValidation),
    invoiceController.deleteInvoice
  );

/**
 * @swagger
 * /api/v1/invoices/{id}/confirm:
 *   post:
 *     summary: Confirm draft invoice
 *     tags: [Invoices]
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
 *         description: Invoice confirmed
 */
router.post(
  '/:id/confirm',
  requirePermission(PERMISSIONS.INVOICES_MANAGE),
  validate(invoiceIdParamValidation),
  invoiceController.confirmInvoice
);

/**
 * @swagger
 * /api/v1/invoices/{id}/cancel:
 *   post:
 *     summary: Cancel invoice (Allowed if amountPaid == 0; restores discount usage)
 *     tags: [Invoices]
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice cancelled
 *       409:
 *         description: Cannot cancel invoice with recorded payments
 */
router.post(
  '/:id/cancel',
  requirePermission(PERMISSIONS.INVOICES_MANAGE),
  validate(cancelInvoiceValidation),
  invoiceController.cancelInvoice
);

/**
 * @swagger
 * /api/v1/invoices/{id}/send:
 *   post:
 *     summary: Send invoice to customer email via Resend
 *     tags: [Invoices]
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
 *         description: Invoice dispatched
 */
router.post(
  '/:id/send',
  requirePermission(PERMISSIONS.INVOICES_MANAGE),
  validate(invoiceIdParamValidation),
  invoiceController.sendInvoice
);

/**
 * @swagger
 * /api/v1/invoices/{id}/pdf:
 *   get:
 *     summary: Stream professional PDF invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/:id/pdf',
  requirePermission(PERMISSIONS.INVOICES_READ),
  validate(invoiceIdParamValidation),
  invoiceController.streamInvoicePdf
);

module.exports = router;
