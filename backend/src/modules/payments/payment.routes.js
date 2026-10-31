const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const {
  createPaymentValidation,
  updatePaymentValidation,
  voidPaymentValidation,
  paymentIdParamValidation,
  listPaymentsValidation,
} = require('./payment.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment recording, verification, and transactional voiding
 */

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Record payment against confirmed invoice (Admin and Staff with payments:record)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, amount, method]
 *             properties:
 *               invoiceId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               method:
 *                 type: string
 *                 enum: [cash, bank_transfer, upi, card, cheque, other]
 *                 example: upi
 *               paidAt:
 *                 type: string
 *                 format: date-time
 *               reference:
 *                 type: string
 *                 example: UPI/2026/8892182
 *     responses:
 *       201:
 *         description: Payment recorded
 *       400:
 *         description: Overpayment or invalid amount
 *   get:
 *     summary: List payments (Admin and Staff with payments:read)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated payment list
 */
router.route('/')
  .post(
    requirePermission(PERMISSIONS.PAYMENTS_RECORD),
    validate(createPaymentValidation),
    paymentController.recordPayment
  )
  .get(
    requirePermission(PERMISSIONS.PAYMENTS_READ),
    validate(listPaymentsValidation),
    paymentController.listPayments
  );

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment details by ID
 *     tags: [Payments]
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
 *         description: Payment details
 *   patch:
 *     summary: Update payment reference or notes (Admin and Staff with payments:record)
 *     tags: [Payments]
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
 *         description: Payment updated
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.PAYMENTS_READ),
    validate(paymentIdParamValidation),
    paymentController.getPaymentById
  )
  .patch(
    requirePermission(PERMISSIONS.PAYMENTS_RECORD),
    validate(updatePaymentValidation),
    paymentController.updatePayment
  );

/**
 * @swagger
 * /api/v1/payments/{id}/void:
 *   post:
 *     summary: Void a payment and revert invoice totals (Admin only)
 *     tags: [Payments]
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
 *                 example: Erroneous duplicate payment entry
 *     responses:
 *       200:
 *         description: Payment voided and invoice updated
 */
router.post(
  '/:id/void',
  authorizeRoles(ROLES.ADMIN),
  validate(voidPaymentValidation),
  paymentController.voidPayment
);

module.exports = router;
