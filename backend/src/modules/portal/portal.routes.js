const express = require('express');
const portalController = require('./portal.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');

const router = express.Router();

// All portal routes require authentication and customer role
router.use(authenticate, authorizeRoles(ROLES.CUSTOMER));

/**
 * @swagger
 * tags:
 *   name: Portal
 *   description: Customer self-service portal endpoints
 */

/**
 * @swagger
 * /portal/dashboard:
 *   get:
 *     summary: Get customer portal dashboard metrics
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 */
router.get('/dashboard', portalController.getPortalDashboard);

router.route('/profile')
  .get(portalController.getProfile)
  .patch(portalController.updateProfile);

router.get('/subscriptions', portalController.getPortalSubscriptions);
router.get('/subscriptions/:id', portalController.getPortalSubscriptionById);

router.get('/invoices', portalController.getPortalInvoices);
router.get('/invoices/:id', portalController.getPortalInvoiceById);
router.get('/invoices/:id/pdf', portalController.streamPortalInvoicePdf);

router.get('/payments', portalController.getPortalPayments);

module.exports = router;
