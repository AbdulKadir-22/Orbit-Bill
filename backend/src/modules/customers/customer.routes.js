const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const {
  createCustomerValidation,
  updateCustomerValidation,
  updateCustomerStatusValidation,
  listCustomersValidation,
  customerIdParamValidation,
  updateCustomerSelfValidation,
} = require('./customer.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer account and profile management
 */

/**
 * Customer Self-Service Endpoints
 */

/**
 * @swagger
 * /api/v1/customers/me:
 *   get:
 *     summary: Retrieve currently logged-in customer's profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile
 *       404:
 *         description: No linked customer profile
 *   patch:
 *     summary: Update currently logged-in customer's profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               gstin:
 *                 type: string
 *                 example: 22AAAAA0000A1Z5
 *               address:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.route('/me')
  .get(customerController.getCustomerMe)
  .patch(validate(updateCustomerSelfValidation), customerController.updateCustomerMe);

/**
 * Admin & Staff Customer Management Endpoints
 */

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create customer record (Admin and Staff with customers:write)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corp
 *               email:
 *                 type: string
 *                 example: contact@acmecorp.com
 *               phone:
 *                 type: string
 *                 example: "+91 9876543210"
 *               company:
 *                 type: string
 *                 example: Acme Enterprises Pvt Ltd
 *               gstin:
 *                 type: string
 *                 example: 27AABCU9603R1ZN
 *               address:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Customer created
 *       400:
 *         description: Validation error (e.g. invalid GSTIN)
 *       409:
 *         description: Email already in use
 *   get:
 *     summary: List customers with pagination and search (Admin and Staff with customers:read)
 *     tags: [Customers]
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
 *     responses:
 *       200:
 *         description: Paginated customer list
 */
router.route('/')
  .post(
    requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
    validate(createCustomerValidation),
    customerController.createCustomer
  )
  .get(
    requirePermission(PERMISSIONS.CUSTOMERS_READ),
    validate(listCustomersValidation),
    customerController.listCustomers
  );

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer details
 *   patch:
 *     summary: Update customer details (Admin and Staff with customers:write)
 *     tags: [Customers]
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
 *         description: Customer updated
 *   delete:
 *     summary: Delete customer (Admin and Staff with customers:write)
 *     tags: [Customers]
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
 *         description: Customer deleted
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.CUSTOMERS_READ),
    validate(customerIdParamValidation),
    customerController.getCustomerById
  )
  .patch(
    requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
    validate(updateCustomerValidation),
    customerController.updateCustomer
  )
  .delete(
    requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
    validate(customerIdParamValidation),
    customerController.deleteCustomer
  );

/**
 * @swagger
 * /api/v1/customers/{id}/status:
 *   patch:
 *     summary: Activate/deactivate customer (Admin and Staff with customers:write)
 *     tags: [Customers]
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
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  validate(updateCustomerStatusValidation),
  customerController.updateCustomerStatus
);

/**
 * @swagger
 * /api/v1/customers/{id}/portal-account:
 *   post:
 *     summary: Create a portal user for a customer and send invitation/set-password email
 *     tags: [Customers]
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
 *         description: Portal user created
 *       409:
 *         description: Customer already has a portal user
 */
router.post(
  '/:id/portal-account',
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  validate(customerIdParamValidation),
  customerController.createPortalAccount
);

/**
 * @swagger
 * /api/v1/customers/{id}/summary:
 *   get:
 *     summary: Summary placeholder for customer subscriptions, quotations, and invoices
 *     tags: [Customers]
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
 *         description: Summary object
 */
router.get(
  '/:id/summary',
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  validate(customerIdParamValidation),
  customerController.getCustomerSummary
);

module.exports = router;
