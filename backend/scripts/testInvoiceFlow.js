const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('--- Starting OrbitBill Invoice Flow E2E Smoke Test ---\n');
  const timestamp = Date.now();

  // 1. Admin login
  console.log('Step 0: Admin Login...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@orbitbill.com', password: 'Admin@12345' }),
  });
  if (!loginRes.ok) {
    console.error('FAIL: Admin login failed', loginRes.data);
    process.exit(1);
  }
  const adminToken = loginRes.data.data.accessToken || loginRes.data.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('PASS: Admin logged in successfully.\n');

  // Step 1: Admin creates a product, a monthly plan, and a customer
  console.log('Step 1: Admin creates product, monthly plan, and customer...');
  const prodRes = await request('/products', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Test Product ${timestamp}`,
      type: 'service',
      salesPrice: 1500,
      costPrice: 500,
    }),
  });
  if (!prodRes.ok) throw new Error(`Product creation failed: ${JSON.stringify(prodRes.data)}`);
  const product = prodRes.data.data;
  console.log(`  Product created: ${product.name} (_id: ${product._id})`);

  const planRes = await request('/plans', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Test Monthly Plan ${timestamp}`,
      productId: product._id,
      billingCycle: 'monthly',
      price: 1500,
      paymentTerms: 'Immediate',
      paymentTermsDays: 0,
      isActive: true,
    }),
  });
  if (!planRes.ok) throw new Error(`Plan creation failed: ${JSON.stringify(planRes.data)}`);
  const plan = planRes.data.data;
  console.log(`  Plan created: ${plan.name} (_id: ${plan._id})`);

  const customerEmail = `customer_${timestamp}@example.com`;
  const custRes = await request('/customers', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Customer ${timestamp}`,
      email: customerEmail,
      phone: '+91 9988776655',
      company: 'Test Company Ltd',
      gstin: '27AABCT3518Q1ZV',
    }),
  });
  if (!custRes.ok) throw new Error(`Customer creation failed: ${JSON.stringify(custRes.data)}`);
  const customer = custRes.data.data;
  console.log(`  Customer created: ${customer.name} (_id: ${customer._id}, email: ${customerEmail})`);
  console.log('PASS: Step 1 complete.\n');

  // Step 2: Register customer user linked to that customer email
  console.log('Step 2: Register portal user with customer email...');
  const customerPassword = 'Customer@12345';
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: customer.name,
      email: customerEmail,
      password: customerPassword,
    }),
  });
  if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  const customerToken = regRes.data.data.accessToken || regRes.data.data.token;
  const customerHeaders = { Authorization: `Bearer ${customerToken}` };

  // Verify /auth/me links to the exact Customer _id
  const meRes = await request('/auth/me', { headers: customerHeaders });
  const meUser = meRes.data.data?.user || meRes.data.data;
  if ((meUser?.customerId?._id || meUser?.customerId)?.toString() !== customer._id.toString()) {
    throw new Error(`Customer ID mismatch in /auth/me: ${meUser?.customerId} !== ${customer._id}`);
  }
  console.log(`  Portal user registered and verified linked to Customer _id: ${customer._id}`);
  console.log('PASS: Step 2 complete.\n');

  // Step 3: Create quotation, convert to subscription, activate
  console.log('Step 3: Create quotation, convert to subscription, activate...');
  const quoteRes = await request('/quotations', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      customerId: customer._id,
      paymentTerms: 'Immediate',
      validityDays: 30,
      lines: [
        {
          productId: product._id,
          planId: plan._id,
          quantity: 1,
          unitPrice: 1500,
        },
      ],
    }),
  });
  if (!quoteRes.ok) throw new Error(`Quotation failed: ${JSON.stringify(quoteRes.data)}`);
  const quotation = quoteRes.data.data;
  console.log(`  Quotation created: ${quotation.quotationNumber} (_id: ${quotation._id})`);

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Convert to subscription
  const convRes = await request(`/quotations/${quotation._id}/convert`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      startDate: now.toISOString(),
      expiryDate: nextMonth.toISOString(),
      paymentTerms: 'Immediate',
    }),
  });
  if (!convRes.ok) throw new Error(`Convert failed: ${JSON.stringify(convRes.data)}`);
  const convData = convRes.data.data;
  const subscription = convData.subscription || convData;
  console.log(`  Converted to subscription: ${subscription.subscriptionNumber} (_id: ${subscription._id}, status: ${subscription.status})`);

  // Activate subscription
  const actRes = await request(`/subscriptions/${subscription._id}/activate`, {
    method: 'POST',
    headers: adminHeaders,
  });
  if (!actRes.ok) throw new Error(`Activate failed: ${JSON.stringify(actRes.data)}`);
  console.log(`  Subscription activated: nextBillingDate = ${actRes.data.data.nextBillingDate}`);
  console.log('PASS: Step 3 complete.\n');

  // Step 4: POST /invoices/generate -> expect created >= 1
  console.log('Step 4: POST /invoices/generate (1st run)...');
  const gen1 = await request('/invoices/generate', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({}),
  });
  console.log('  Generate Report:', gen1.data.data);
  if (!gen1.ok || gen1.data.data.generated < 1) {
    throw new Error(`Expected generated >= 1, got ${gen1.data?.data?.generated}`);
  }
  console.log('PASS: Step 4 complete (created >= 1).\n');

  // Step 5: POST /invoices/generate again -> expect created = 0, skipped >= 1 or scanned = 0
  console.log('Step 5: POST /invoices/generate (2nd run)...');
  const gen2 = await request('/invoices/generate', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({}),
  });
  console.log('  Second Generate Report:', gen2.data.data);
  if (!gen2.ok || gen2.data.data.generated !== 0) {
    throw new Error(`Expected generated == 0 on second run, got ${gen2.data?.data?.generated}`);
  }
  console.log('PASS: Step 5 complete (created = 0, no duplicate invoices).\n');

  // Step 6: Customer portal verification
  console.log('Step 6: Customer views /portal/invoices, /portal/dashboard, /portal/subscriptions...');
  const portInvRes = await request('/portal/invoices', { headers: customerHeaders });
  console.log(`  Portal invoices found: ${portInvRes.data.data?.length}`);
  if (!portInvRes.ok || !portInvRes.data.data || portInvRes.data.data.length === 0) {
    throw new Error(`Portal invoices empty! ${JSON.stringify(portInvRes.data)}`);
  }
  const customerInvoice = portInvRes.data.data[0];
  console.log(`  Customer Invoice: ${customerInvoice.invoiceNumber}, Grand Total: ₹${customerInvoice.grandTotal}, Status: ${customerInvoice.status}, Due: ₹${customerInvoice.amountDue}`);

  const portDashRes = await request('/portal/dashboard', { headers: customerHeaders });
  console.log(`  Portal Dashboard: activeSubscriptions = ${portDashRes.data.data?.activeSubscriptionCount}, totalOutstanding = ₹${portDashRes.data.data?.totalOutstandingAmount}`);
  if (portDashRes.data.data?.activeSubscriptionCount < 1) {
    throw new Error('Portal dashboard shows 0 active subscriptions');
  }

  const portSubRes = await request('/portal/subscriptions', { headers: customerHeaders });
  console.log(`  Portal Subscriptions count: ${portSubRes.data.data?.length}`);
  if (portSubRes.data.data?.length < 1) {
    throw new Error('Portal subscriptions returned 0');
  }
  console.log('PASS: Step 6 complete.\n');

  // Step 7: Record partial payment, then full payment
  console.log('Step 7: Admin records partial payment and full payment...');
  const invoiceId = customerInvoice._id;

  // Partial payment: ₹500
  const pay1Res = await request('/payments', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      invoiceId,
      amount: 500,
      method: 'bank_transfer',
      reference: 'PARTIAL-001',
    }),
  });
  if (!pay1Res.ok) throw new Error(`Partial payment failed: ${JSON.stringify(pay1Res.data)}`);
  console.log(`  Recorded partial payment ₹500. Remaining amountDue: ₹${pay1Res.data.data.invoice.amountDue}`);

  // Remaining payment
  const remaining = pay1Res.data.data.invoice.amountDue;
  const pay2Res = await request('/payments', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      invoiceId,
      amount: remaining,
      method: 'upi',
      reference: 'FINAL-002',
    }),
  });
  if (!pay2Res.ok) throw new Error(`Final payment failed: ${JSON.stringify(pay2Res.data)}`);
  console.log(`  Recorded final payment ₹${remaining}. Final Invoice Status: ${pay2Res.data.data.invoice.status}, AmountDue: ₹${pay2Res.data.data.invoice.amountDue}`);

  if (pay2Res.data.data.invoice.status !== 'paid' || pay2Res.data.data.invoice.amountDue !== 0) {
    throw new Error('Invoice status did not transition to paid or amountDue != 0');
  }

  // Confirm customer portal dashboard reflects amountPaid and 0 outstanding
  const updatedDashRes = await request('/portal/dashboard', { headers: customerHeaders });
  console.log(`  Customer Portal Dashboard updated: totalOutstanding = ₹${updatedDashRes.data.data?.totalOutstandingAmount}, recentPayments = ${updatedDashRes.data.data?.recentPayments?.length}`);
  if (updatedDashRes.data.data?.totalOutstandingAmount !== 0) {
    throw new Error(`Expected totalOutstanding == 0, got ${updatedDashRes.data.data?.totalOutstandingAmount}`);
  }
  console.log('PASS: Step 7 complete.\n');

  // Step 8: Customer access control (trying to access another customer invoice)
  console.log('Step 8: Customer tries to access another customer invoice...');
  // Find an invoice belonging to another customer
  const adminInvoices = await request('/invoices?limit=20', { headers: adminHeaders });
  const otherInvoice = adminInvoices.data.data.find(
    (inv) => (inv.customerId?._id || inv.customerId) !== customer._id
  );
  if (otherInvoice) {
    const leakRes = await request(`/portal/invoices/${otherInvoice._id}`, { headers: customerHeaders });
    console.log(`  Access attempt for ${otherInvoice.invoiceNumber} returned status: ${leakRes.status}`);
    if (leakRes.status !== 404 && leakRes.status !== 403) {
      throw new Error(`Security breach! Customer was able to access other customer invoice (${leakRes.status})`);
    }
    console.log('PASS: Step 8 complete (Customer cannot access other customer invoices).\n');
  } else {
    console.log('PASS: Step 8 skipped (no other invoices in DB).\n');
  }

  console.log('=====================================================');
  console.log('🎉 ALL 8 STEPS PASSED SUCCESSFULLY WITHOUT ERRORS! 🎉');
  console.log('=====================================================');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
