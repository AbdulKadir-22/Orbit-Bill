const mongoose = require('mongoose');
const env = require('../src/config/env');
const connectDB = require('../src/config/db');
const logger = require('../src/config/logger');

const User = require('../src/modules/users/user.model');
const Customer = require('../src/modules/customers/customer.model');
const Product = require('../src/modules/products/product.model');
const Plan = require('../src/modules/plans/plan.model');
const Tax = require('../src/modules/taxes/tax.model');
const Discount = require('../src/modules/discounts/discount.model');
const Subscription = require('../src/modules/subscriptions/subscription.model');
const Invoice = require('../src/modules/invoices/invoice.model');
const Payment = require('../src/modules/payments/payment.model');
const Counter = require('../src/modules/counters/counter.model');

const ROLES = require('../src/constants/roles');
const { ALL_PERMISSIONS } = require('../src/constants/permissions');
const { addDays } = require('../src/utils/dates');

const seedDemoData = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB. Starting Demo Data Seed...');

    // 1. Ensure Admin User
    let admin = await User.findOne({ role: ROLES.ADMIN });
    if (!admin) {
      admin = await User.create({
        name: 'Orbit Admin',
        email: 'admin@orbitbill.com',
        password: 'Password123!',
        role: ROLES.ADMIN,
        isActive: true,
        permissions: ALL_PERMISSIONS,
      });
      logger.info('Admin user created: admin@orbitbill.com');
    }

    // 2. Taxes
    const taxes = await Tax.bulkWrite([
      {
        updateOne: {
          filter: { name: 'GST 18%' },
          update: {
            $set: {
              name: 'GST 18%',
              rate: 18,
              description: 'Standard 18% Goods & Services Tax',
              isActive: true,
              createdBy: admin._id,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { name: 'GST 5%' },
          update: {
            $set: {
              name: 'GST 5%',
              rate: 5,
              description: 'Reduced 5% Goods & Services Tax',
              isActive: true,
              createdBy: admin._id,
            },
          },
          upsert: true,
        },
      },
    ]);
    const gst18 = await Tax.findOne({ name: 'GST 18%' });
    const gst5 = await Tax.findOne({ name: 'GST 5%' });

    // 3. Discounts
    let promo10 = await Discount.findOne({ name: 'SAVE10' });
    if (!promo10) {
      promo10 = await Discount.create({
        name: 'SAVE10',
        type: 'percentage',
        value: 10,
        appliesTo: 'subscription',
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        createdBy: admin._id,
      });
    }

    let flat500 = await Discount.findOne({ name: 'FLAT500' });
    if (!flat500) {
      flat500 = await Discount.create({
        name: 'FLAT500',
        type: 'fixed',
        value: 500,
        minPurchase: 2000,
        appliesTo: 'subscription',
        usageLimit: 50,
        usedCount: 0,
        isActive: true,
        createdBy: admin._id,
      });
    }

    // 4. Products with Variants
    let cloudHosting = await Product.findOne({ name: 'Cloud Hosting' });
    if (!cloudHosting) {
      cloudHosting = await Product.create({
        name: 'Cloud Hosting',
        type: 'service',
        salesPrice: 2000,
        costPrice: 800,
        notes: 'High-availability compute cluster',
        variants: [
          { name: 'Standard 4-Core', priceDelta: 0, sku: 'HOST-STD-4C', isActive: true },
          { name: 'Performance 8-Core', priceDelta: 1500, sku: 'HOST-PERF-8C', isActive: true },
          { name: 'Enterprise 16-Core', priceDelta: 4000, sku: 'HOST-ENT-16C', isActive: true },
        ],
        isActive: true,
        createdBy: admin._id,
      });
    }

    let storageAddon = await Product.findOne({ name: 'NVMe Storage 100GB' });
    if (!storageAddon) {
      storageAddon = await Product.create({
        name: 'NVMe Storage 100GB',
        type: 'addon',
        salesPrice: 500,
        costPrice: 150,
        variants: [],
        isActive: true,
        createdBy: admin._id,
      });
    }

    // 5. Plans
    let monthlyPlan = await Plan.findOne({ code: 'HOST-MONTHLY' });
    if (!monthlyPlan) {
      monthlyPlan = await Plan.create({
        name: 'Cloud Monthly Flexible',
        code: 'HOST-MONTHLY',
        billingCycle: 'monthly',
        billingCycleCount: 1,
        price: 2000,
        productId: cloudHosting._id,
        autoRenew: true,
        paymentTermsDays: 15,
        isActive: true,
        createdBy: admin._id,
      });
    }

    let yearlyPlan = await Plan.findOne({ code: 'HOST-YEARLY' });
    if (!yearlyPlan) {
      yearlyPlan = await Plan.create({
        name: 'Cloud Annual Advantage',
        code: 'HOST-YEARLY',
        billingCycle: 'yearly',
        billingCycleCount: 1,
        price: 20000,
        productId: cloudHosting._id,
        autoRenew: true,
        paymentTermsDays: 30,
        isActive: true,
        createdBy: admin._id,
      });
    }

    // 6. Customers & Portal Users
    let acmeCorp = await Customer.findOne({ email: 'billing@acme.com' });
    if (!acmeCorp) {
      acmeCorp = await Customer.create({
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: '+91 98765 43210',
        company: 'Acme Enterprises Ltd',
        currency: 'INR',
        billingAddress: {
          street: '101 Cyber Towers, HITEC City',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'India',
        },
        shippingAddress: {
          street: '101 Cyber Towers, HITEC City',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'India',
        },
        isActive: true,
        createdBy: admin._id,
      });
    }

    let acmeUser = await User.findOne({ email: 'billing@acme.com' });
    if (!acmeUser) {
      acmeUser = await User.create({
        name: 'Acme Billing Admin',
        email: 'billing@acme.com',
        password: 'Password123!',
        role: ROLES.CUSTOMER,
        customerId: acmeCorp._id,
        isActive: true,
      });
    }

    let globexCorp = await Customer.findOne({ email: 'finance@globex.io' });
    if (!globexCorp) {
      globexCorp = await Customer.create({
        name: 'Globex Innovations',
        email: 'finance@globex.io',
        phone: '+91 91234 56789',
        company: 'Globex Corp',
        currency: 'INR',
        billingAddress: {
          street: '42 Silicon Boulevard, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560034',
          country: 'India',
        },
        isActive: true,
        createdBy: admin._id,
      });
    }

    let globexUser = await User.findOne({ email: 'finance@globex.io' });
    if (!globexUser) {
      globexUser = await User.create({
        name: 'Globex Finance Lead',
        email: 'finance@globex.io',
        password: 'Password123!',
        role: ROLES.CUSTOMER,
        customerId: globexCorp._id,
        isActive: true,
      });
    }

    // 7. Subscriptions
    const perfVariant = cloudHosting.variants.find((v) => v.name.includes('Performance'));

    let acmeSub = await Subscription.findOne({ customerId: acmeCorp._id });
    if (!acmeSub) {
      acmeSub = await Subscription.create({
        subscriptionNumber: 'SUB-2026-00001',
        customerId: acmeCorp._id,
        status: 'active',
        startDate: new Date('2026-01-01T00:00:00Z'),
        expiryDate: new Date('2027-01-01T00:00:00Z'),
        billingCycle: 'monthly',
        billingCycleCount: 1,
        nextBillingDate: new Date('2026-11-01T00:00:00Z'),
        lastInvoicedAt: new Date('2026-10-01T00:00:00Z'),
        paymentTermsDays: 15,
        currency: 'INR',
        lines: [
          {
            productId: cloudHosting._id,
            variantId: perfVariant?._id,
            productName: cloudHosting.name,
            variantName: perfVariant?.name,
            planId: monthlyPlan._id,
            planName: monthlyPlan.name,
            billingCycle: 'monthly',
            quantity: 1,
            unitPrice: 3500, // 2000 + 1500
            lineSubtotal: 3500,
            taxId: gst18._id,
            taxRate: 18,
            taxAmount: 630,
            lineTotal: 4130,
          },
        ],
        subtotal: 3500,
        taxTotal: 630,
        grandTotal: 4130,
        statusHistory: [
          {
            action: 'created',
            from: 'active',
            to: 'active',
            at: new Date('2026-01-01T00:00:00Z'),
            by: admin._id,
            reason: 'Demo subscription created',
          },
        ],
        createdBy: admin._id,
      });
    }

    let globexSub = await Subscription.findOne({ customerId: globexCorp._id });
    if (!globexSub) {
      globexSub = await Subscription.create({
        subscriptionNumber: 'SUB-2026-00002',
        customerId: globexCorp._id,
        status: 'active',
        startDate: new Date('2026-05-01T00:00:00Z'),
        expiryDate: new Date('2027-05-01T00:00:00Z'),
        billingCycle: 'monthly',
        billingCycleCount: 1,
        nextBillingDate: new Date('2026-10-15T00:00:00Z'), // Past due!
        lastInvoicedAt: new Date('2026-09-15T00:00:00Z'),
        paymentTermsDays: 15,
        currency: 'INR',
        lines: [
          {
            productId: cloudHosting._id,
            productName: cloudHosting.name,
            planId: monthlyPlan._id,
            planName: monthlyPlan.name,
            billingCycle: 'monthly',
            quantity: 2,
            unitPrice: 2000,
            lineSubtotal: 4000,
            taxId: gst18._id,
            taxRate: 18,
            taxAmount: 720,
            lineTotal: 4720,
          },
        ],
        subtotal: 4000,
        taxTotal: 720,
        grandTotal: 4720,
        statusHistory: [
          {
            action: 'created',
            from: 'active',
            to: 'active',
            at: new Date('2026-05-01T00:00:00Z'),
            by: admin._id,
            reason: 'Demo subscription created',
          },
        ],
        createdBy: admin._id,
      });
    }

    // 8. Invoices (Paid, Partial, Overdue)
    // Invoice 1: Paid invoice for Acme
    let inv1 = await Invoice.findOne({ invoiceNumber: 'INV-2026-00001' });
    if (!inv1) {
      inv1 = await Invoice.create({
        invoiceNumber: 'INV-2026-00001',
        customerId: acmeCorp._id,
        subscriptionId: acmeSub._id,
        invoiceDate: new Date('2026-09-01T00:00:00Z'),
        dueDate: new Date('2026-09-16T00:00:00Z'),
        billingPeriod: {
          start: new Date('2026-09-01T00:00:00Z'),
          end: new Date('2026-09-30T23:59:59Z'),
        },
        lines: acmeSub.lines,
        subtotal: 3500,
        taxTotal: 630,
        discountTotal: 0,
        grandTotal: 4130,
        amountPaid: 4130,
        amountDue: 0,
        status: 'paid',
        confirmedAt: new Date('2026-09-01T00:00:00Z'),
        source: 'auto',
        billingKey: `${acmeSub._id}:2026-09-01`,
        createdBy: admin._id,
      });

      // Record payment for inv1
      await Payment.create({
        paymentNumber: 'PAY-2026-00001',
        customerId: acmeCorp._id,
        invoiceId: inv1._id,
        amount: 4130,
        currency: 'INR',
        method: 'bank_transfer',
        reference: 'TXN-HDFC-9918231',
        paidAt: new Date('2026-09-05T10:00:00Z'),
        status: 'recorded',
        notes: 'Full payment cleared via RTGS',
        recordedBy: admin._id,
      });
    }

    // Invoice 2: Partially Paid invoice for Acme
    let inv2 = await Invoice.findOne({ invoiceNumber: 'INV-2026-00002' });
    if (!inv2) {
      inv2 = await Invoice.create({
        invoiceNumber: 'INV-2026-00002',
        customerId: acmeCorp._id,
        subscriptionId: acmeSub._id,
        invoiceDate: new Date('2026-10-01T00:00:00Z'),
        dueDate: new Date('2026-10-16T00:00:00Z'),
        billingPeriod: {
          start: new Date('2026-10-01T00:00:00Z'),
          end: new Date('2026-10-31T23:59:59Z'),
        },
        lines: acmeSub.lines,
        subtotal: 3500,
        taxTotal: 630,
        discountTotal: 0,
        grandTotal: 4130,
        amountPaid: 2000,
        amountDue: 2130,
        status: 'confirmed',
        confirmedAt: new Date('2026-10-01T00:00:00Z'),
        source: 'auto',
        billingKey: `${acmeSub._id}:2026-10-01`,
        createdBy: admin._id,
      });

      // Partial payment
      await Payment.create({
        paymentNumber: 'PAY-2026-00002',
        customerId: acmeCorp._id,
        invoiceId: inv2._id,
        amount: 2000,
        currency: 'INR',
        method: 'upi',
        reference: 'UPI/62819283719',
        paidAt: new Date('2026-10-05T14:30:00Z'),
        status: 'recorded',
        notes: 'Part payment via UPI',
        recordedBy: admin._id,
      });
    }

    // Invoice 3: Overdue invoice for Globex (due in past, unpaid)
    let inv3 = await Invoice.findOne({ invoiceNumber: 'INV-2026-00003' });
    if (!inv3) {
      inv3 = await Invoice.create({
        invoiceNumber: 'INV-2026-00003',
        customerId: globexCorp._id,
        subscriptionId: globexSub._id,
        invoiceDate: new Date('2026-09-15T00:00:00Z'),
        dueDate: new Date('2026-09-30T00:00:00Z'), // Overdue > 30 days
        billingPeriod: {
          start: new Date('2026-09-15T00:00:00Z'),
          end: new Date('2026-10-14T23:59:59Z'),
        },
        lines: globexSub.lines,
        subtotal: 4000,
        taxTotal: 720,
        discountTotal: 0,
        grandTotal: 4720,
        amountPaid: 0,
        amountDue: 4720,
        status: 'confirmed',
        confirmedAt: new Date('2026-09-15T00:00:00Z'),
        source: 'auto',
        billingKey: `${globexSub._id}:2026-09-15`,
        createdBy: admin._id,
      });
    }

    // Invoice 4: Draft invoice for Globex
    let inv4 = await Invoice.findOne({ invoiceNumber: 'INV-2026-00004' });
    if (!inv4) {
      inv4 = await Invoice.create({
        invoiceNumber: 'INV-2026-00004',
        customerId: globexCorp._id,
        invoiceDate: new Date(),
        dueDate: addDays(new Date(), 15),
        billingPeriod: {
          start: new Date(),
          end: addDays(new Date(), 30),
        },
        lines: [
          {
            productId: storageAddon._id,
            productName: storageAddon.name,
            quantity: 4,
            unitPrice: 500,
            taxId: gst18._id,
            taxRate: 18,
            taxAmount: 360,
            lineTotal: 2360,
          },
        ],
        subtotal: 2000,
        taxTotal: 360,
        discountTotal: 0,
        grandTotal: 2360,
        amountPaid: 0,
        amountDue: 2360,
        status: 'draft',
        source: 'manual',
        createdBy: admin._id,
      });
    }

    logger.info('✅ Demo data seeded successfully:');
    logger.info(`   - Admin: ${admin.email}`);
    logger.info(`   - Customers: ${acmeCorp.email}, ${globexCorp.email}`);
    logger.info(`   - Subscriptions: 2 active subscriptions created`);
    logger.info(`   - Invoices: 4 invoices (Paid, Partial, Overdue, Draft)`);
    logger.info(`   - Payments: 2 payments recorded`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error seeding demo data: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedDemoData();
