const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Customer = require('../../src/modules/customers/customer.model');
const Product = require('../../src/modules/products/product.model');
const Plan = require('../../src/modules/plans/plan.model');
const Invoice = require('../../src/modules/invoices/invoice.model');
const Payment = require('../../src/modules/payments/payment.model');
const Subscription = require('../../src/modules/subscriptions/subscription.model');
const ROLES = require('../../src/constants/roles');
const { ALL_PERMISSIONS } = require('../../src/constants/permissions');
const { generateAccessToken } = require('../../src/utils/tokens');

let mongoServer;
let adminToken;
let customer1Token;
let customer2Token;
let customer1Id;
let customer2Id;
let adminUser;

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Setup admin user
  adminUser = await User.create({
    name: 'Test Admin',
    email: 'admin.test@orbitbill.com',
    password: 'Password123!',
    role: ROLES.ADMIN,
    permissions: ALL_PERMISSIONS,
    isActive: true,
  });
  adminToken = generateAccessToken({ id: adminUser._id, role: adminUser.role, permissions: adminUser.permissions });

  // Setup 2 customers for tenant isolation tests
  const cust1 = await Customer.create({
    name: 'Customer One Corp',
    email: 'cust1@test.com',
    createdBy: adminUser._id,
  });
  customer1Id = cust1._id;

  const user1 = await User.create({
    name: 'User Cust One',
    email: 'cust1@test.com',
    password: 'Password123!',
    role: ROLES.CUSTOMER,
    customerId: cust1._id,
    isActive: true,
  });
  customer1Token = generateAccessToken({ id: user1._id, role: user1.role, customerId: cust1._id });

  const cust2 = await Customer.create({
    name: 'Customer Two Corp',
    email: 'cust2@test.com',
    createdBy: adminUser._id,
  });
  customer2Id = cust2._id;

  const user2 = await User.create({
    name: 'User Cust Two',
    email: 'cust2@test.com',
    password: 'Password123!',
    role: ROLES.CUSTOMER,
    customerId: cust2._id,
    isActive: true,
  });
  customer2Token = generateAccessToken({ id: user2._id, role: user2.role, customerId: cust2._id });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 4 Integration Suite: Billing, Invoices, Payments, Reports & Portal', () => {
  let createdInvoice;

  test('Staff/Admin creates draft invoice and confirms it', async () => {
    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customer1Id,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
        lines: [
          {
            productName: 'Web Hosting Tier 1',
            quantity: 1,
            unitPrice: 1000,
            taxRate: 18,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.subtotal).toBe(1000);
    expect(res.body.data.taxTotal).toBe(180);
    expect(res.body.data.grandTotal).toBe(1180);
    expect(res.body.data.amountDue).toBe(1180);

    createdInvoice = res.body.data;

    // Confirm invoice
    const confirmRes = await request(app)
      .post(`/api/v1/invoices/${createdInvoice._id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('confirmed');
    expect(confirmRes.body.data.confirmedAt).toBeDefined();
  });

  test('Records partial payment, checks invoice status remains confirmed', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: createdInvoice._id,
        amount: 500,
        method: 'bank_transfer',
        reference: 'UTR12345678',
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.data.amount).toBe(500);

    // Verify invoice amount recomputation
    const invRes = await request(app)
      .get(`/api/v1/invoices/${createdInvoice._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invRes.body.data.amountPaid).toBe(500);
    expect(invRes.body.data.amountDue).toBe(680);
    expect(invRes.body.data.status).toBe('confirmed');
  });

  test('Records remaining payment, marks invoice as paid', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: createdInvoice._id,
        amount: 680,
        method: 'upi',
      });

    expect(payRes.status).toBe(201);

    const invRes = await request(app)
      .get(`/api/v1/invoices/${createdInvoice._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invRes.body.data.amountPaid).toBe(1180);
    expect(invRes.body.data.amountDue).toBe(0);
    expect(invRes.body.data.status).toBe('paid');
  });

  test('Voids a payment and re-opens invoice from paid to confirmed', async () => {
    const paymentsList = await request(app)
      .get(`/api/v1/payments?invoiceId=${createdInvoice._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const secondPayment = paymentsList.body.data[0];

    const voidRes = await request(app)
      .post(`/api/v1/payments/${secondPayment._id}/void`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Customer chargeback initiated' });

    expect(voidRes.status).toBe(200);
    expect(voidRes.body.data.payment.status).toBe('voided');

    // Invoice recomputed
    const invRes = await request(app)
      .get(`/api/v1/invoices/${createdInvoice._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invRes.body.data.status).toBe('confirmed');
    expect(invRes.body.data.amountDue).toBeGreaterThan(0);
  });

  test('Customer Portal tenant scoping: Customer 1 sees their invoice, Customer 2 receives 404', async () => {
    // Customer 1 viewing own invoice
    const cust1Res = await request(app)
      .get(`/api/v1/portal/invoices/${createdInvoice._id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(cust1Res.status).toBe(200);
    expect(cust1Res.body.data._id).toBe(createdInvoice._id);
    // Ensure sensitive internal fields are omitted
    expect(cust1Res.body.data.createdBy).toBeUndefined();

    // Customer 2 viewing Customer 1's invoice -> MUST RETURN 404
    const cust2Res = await request(app)
      .get(`/api/v1/portal/invoices/${createdInvoice._id}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(cust2Res.status).toBe(404);
  });

  test('Reports summary and aging buckets endpoint returns valid structure', async () => {
    const reportRes = await request(app)
      .get('/api/v1/reports/invoices-summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.data.totalInvoiced).toBeDefined();

    const overdueRes = await request(app)
      .get('/api/v1/reports/overdue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(overdueRes.status).toBe(200);
    expect(overdueRes.body.data.agingBuckets).toHaveProperty('1_30');
    expect(overdueRes.body.data.agingBuckets).toHaveProperty('31_60');
    expect(overdueRes.body.data.agingBuckets).toHaveProperty('61_90');
    expect(overdueRes.body.data.agingBuckets).toHaveProperty('90_plus');
  });

  test('Streams Invoice PDF', async () => {
    const pdfRes = await request(app)
      .get(`/api/v1/invoices/${createdInvoice._id}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.headers['x-response-time']).toBeDefined();
  });
});
