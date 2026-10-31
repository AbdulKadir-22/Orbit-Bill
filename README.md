# OrbitBill Backend — Production API Reference

OrbitBill is an enterprise-grade Subscription Management, Recurring Billing, and Invoicing platform built on Node.js, Express, MongoDB (Mongoose), and clean modular architecture.

---

## 🚀 Key Features

1. **Enterprise Foundation & RBAC**:
   - Strictly validated environment variables with fail-fast startup.
   - Fine-grained role-based access control (`admin`, `staff`, `customer`) with modular permission gates.
   - Dual-token JWT authentication (HTTP-only secure refresh cookies + short-lived Bearer access tokens).
   - Atomic counter-based sequence number generator (`INV-YYYY-NNNNN`, `PAY-YYYY-NNNNN`, `SUB-YYYY-NNNNN`).

2. **Catalog & Customer Management**:
   - Products with embedded variants and dynamic `priceDelta` calculations.
   - Subscription plans across multiple cycles (`daily`, `weekly`, `monthly`, `yearly`).
   - Pure pricing and discount engine (`isEligible`, `calcLine`, `roundMoney`).
   - Customer registry linked seamlessly to authenticated portal users.

3. **Quotations & Subscription State Machine**:
   - Quotation lifecycle (`draft` -> `sent` -> `approved` -> `converted`).
   - One-click quotation-to-subscription conversion.
   - Subscription lifecycle (`draft`, `confirmed`, `active`, `paused`, `closed`) with automated expiration checks and immutable audit trail (`statusHistory`).

4. **Transactional Billing Engine (Phase 4)**:
   - Automated recurring billing engine with atomic MongoDB transactions.
   - Unique `billingKey` index (`<subscriptionId>:<YYYY-MM-DD>`) guaranteeing idempotent single-execution runs.
   - Batch catch-up processing for missed billing periods.
   - Race-safe discount usage increments with atomic conditional counters.
   - Distributed cron runner protected by `JobLock` with MongoDB TTL expiration.

5. **Payments & Ledger Consistency (Phase 4)**:
   - Atomic payment recording that recomputes `amountPaid` and `amountDue` directly from active ledger payments to eliminate numerical drift.
   - Seamless payment voiding that reopens paid invoices (`paid` -> `confirmed`).

6. **Executive Dashboard & Financial Reports (Phase 4)**:
   - High-performance dashboard powered by MongoDB `$facet` aggregation pipelines.
   - Role-keyed TTL in-memory caching with mutation-triggered invalidation.
   - Normalized Monthly Recurring Revenue (MRR) formulas:
     - `daily * 30`
     - `weekly * (52 / 12)`
     - `monthly * 1`
     - `yearly / 12`
   - Overdue aging analysis buckets (`1-30`, `31-60`, `61-90`, `90+` days).
   - RFC 4180 streaming CSV report exports.

7. **Customer Self-Service Portal (Phase 4)**:
   - Strict tenant isolation enforced at the controller level (`customerId = req.user.customerId`).
   - Sensitive internal fields (`createdBy`, cost prices, internal notes) sanitized from all customer views.
   - Unauthorized tenant access strictly returns `404 Not Found` (never 403) to prevent resource enumeration.
   - High-fidelity streaming PDF invoice generator using `pdfkit`.

8. **Production Hardening**:
   - `responseTimeMiddleware` logging slow requests (>= 2000ms) and attaching `X-Response-Time`.
   - Gzip response compression.
   - Helmet security headers and Mongo injection sanitization.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB Replica Set (or MongoDB Atlas)

### Environment Configuration
Copy `.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

### Installation
```bash
cd backend
npm install
```

### Seeding Initial Data
```bash
# Seed initial administrator
npm run seed:admin

# Seed comprehensive demo dataset (Catalog, Customers, Subscriptions, Invoices, Payments)
npm run seed:demo
```

### Running the Server
```bash
# Production mode
npm start

# Development mode with hot reload
npm run dev
```

### Automated Testing
```bash
# Runs full unit and integration suite (27 passing tests)
npm test
```

---

## 📖 Swagger API Documentation
When the server is running, interactive Swagger documentation is available at:
```
http://localhost:5000/api-docs
```

---

## 📮 Postman Collection
A full end-to-end Postman collection with automated bearer token assignment is available at:
[`postman/OrbitBill.postman_collection.json`](file:///home/ariont/Code/Hackathons/FLUX/postman/OrbitBill.postman_collection.json)
