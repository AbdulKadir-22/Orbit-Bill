const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const {
  createSubscriptionValidation,
  updateSubscriptionValidation,
  pauseSubscriptionValidation,
  resumeSubscriptionValidation,
  renewSubscriptionValidation,
  closeSubscriptionValidation,
  cancelSubscriptionValidation,
  subscriptionIdParamValidation,
  listSubscriptionsValidation,
} = require('./subscription.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Lifecycle state machine and recurring subscription management
 */

/**
 * @swagger
 * /api/v1/subscriptions:
 *   post:
 *     summary: Create subscription manually in draft status (Admin and Staff with subscriptions:manage)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, lines, startDate, expiryDate]
 *             properties:
 *               customerId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               paymentTerms:
 *                 type: string
 *                 default: Net 15
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, planId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     planId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Draft subscription created
 *   get:
 *     summary: List subscriptions (Scoped for customers; full for Admin/Staff per permissions)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, quotation, confirmed, active, paused, closed]
 *       - in: query
 *         name: billingCycle
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *       - in: query
 *         name: expiringInDays
 *         schema:
 *           type: integer
 *       - in: query
 *         name: expired
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of subscriptions
 */
router.route('/')
  .post(
    requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
    validate(createSubscriptionValidation),
    subscriptionController.createSubscription
  )
  .get(
    validate(listSubscriptionsValidation),
    subscriptionController.listSubscriptions
  );

/**
 * @swagger
 * /api/v1/subscriptions/{id}:
 *   get:
 *     summary: Get subscription details including status history
 *     tags: [Subscriptions]
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
 *         description: Subscription details
 *       404:
 *         description: Not found or unauthorized customer
 *   patch:
 *     summary: Update subscription (Draft/quotation/confirmed full edit; active/paused quantity-only edit)
 *     tags: [Subscriptions]
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
 *         description: Subscription updated
 */
router.route('/:id')
  .get(
    validate(subscriptionIdParamValidation),
    subscriptionController.getSubscriptionById
  )
  .patch(
    requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
    validate(updateSubscriptionValidation),
    subscriptionController.updateSubscription
  );

/**
 * @swagger
 * /api/v1/subscriptions/{id}/history:
 *   get:
 *     summary: Get subscription lifecycle audit timeline
 *     tags: [Subscriptions]
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
 *         description: Status history array
 */
router.get(
  '/:id/history',
  validate(subscriptionIdParamValidation),
  subscriptionController.getSubscriptionHistory
);

/**
 * Lifecycle Action Endpoints
 */

/**
 * @swagger
 * /api/v1/subscriptions/{id}/quote:
 *   post:
 *     summary: Transition draft -> quotation
 *     tags: [Subscriptions]
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
 *         description: Subscription moved to quotation
 */
router.post(
  '/:id/quote',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(subscriptionIdParamValidation),
  subscriptionController.moveToQuotation
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/confirm:
 *   post:
 *     summary: Transition quotation -> confirmed
 *     tags: [Subscriptions]
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
 *         description: Subscription confirmed
 */
router.post(
  '/:id/confirm',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(subscriptionIdParamValidation),
  subscriptionController.confirmSubscription
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/activate:
 *   post:
 *     summary: Transition confirmed -> active (Sets nextBillingDate = startDate)
 *     tags: [Subscriptions]
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
 *         description: Subscription activated
 */
router.post(
  '/:id/activate',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(subscriptionIdParamValidation),
  subscriptionController.activateSubscription
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/pause:
 *   post:
 *     summary: Pause an active subscription (Respects plan.allowPause; admin force available)
 *     tags: [Subscriptions]
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
 *         description: Subscription paused
 */
router.post(
  '/:id/pause',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(pauseSubscriptionValidation),
  subscriptionController.pauseSubscription
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/resume:
 *   post:
 *     summary: Resume a paused subscription
 *     tags: [Subscriptions]
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
 *         description: Subscription resumed
 */
router.post(
  '/:id/resume',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(resumeSubscriptionValidation),
  subscriptionController.resumeSubscription
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/renew:
 *   post:
 *     summary: Renew an active or paused subscription for specified periods
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               periods:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Subscription renewed
 */
router.post(
  '/:id/renew',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(renewSubscriptionValidation),
  subscriptionController.renewSubscription
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/close:
 *   post:
 *     summary: Early close an active or paused subscription
 *     tags: [Subscriptions]
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
 *         description: Subscription closed early
 */
router.post(
  '/:id/close',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(closeSubscriptionValidation),
  subscriptionController.closeSubscription
);

/**
 * @swagger
 * /api/v1/subscriptions/{id}/cancel:
 *   post:
 *     summary: Cancel a draft, quotation, or confirmed subscription
 *     tags: [Subscriptions]
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
 *         description: Subscription cancelled
 */
router.post(
  '/:id/cancel',
  requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  validate(cancelSubscriptionValidation),
  subscriptionController.cancelSubscription
);

module.exports = router;
