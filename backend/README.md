# OrbitBill Backend — Phase 3: Quotations & Subscriptions

OrbitBill is a modular Subscription Management System backend built with Node.js, Express, MongoDB (Mongoose), and CommonJS.

---

## Target Structure

```
backend/
├── scripts/
│   ├── seedAdmin.js                     # Idempotent admin seeder
│   └── backfillCustomers.js             # Idempotent customer user-to-customer backfill
├── src/
│   ├── app.js                          # Express app configuration & middlewares
│   ├── server.js                       # Server entrypoint & graceful shutdown
│   ├── config/
│   │   ├── env.js                      # Strict Zod environment variable validation
│   │   ├── db.js                       # Mongoose MongoDB connection
│   │   ├── logger.js                   # Pino logger with pino-pretty in dev
│   │   ├── swagger.js                  # Swagger JSDoc & Bearer Auth definitions
│   │   └── resend.js                   # Resend email client instance
│   ├── constants/
│   │   ├── roles.js                    # System roles (admin, staff, customer)
│   │   └── permissions.js              # Granular RBAC permissions
│   ├── emails/
│   │   ├── email.service.js            # Resend integration with non-blocking error logging
│   │   └── templates/                  # welcome, reset-password, staff-invite, quotation-sent
│   ├── middlewares/
│   │   ├── auth.middleware.js          # Bearer JWT verification & active user check
│   │   ├── rbac.middleware.js          # authorizeRoles, requirePermission, ownResource helper
│   │   ├── validate.middleware.js      # Zod validation middleware for body, params, query
│   │   ├── error.middleware.js         # Centralized error handler with unified error shape
│   │   ├── notFound.middleware.js      # 404 handler
│   │   └── rateLimit.middleware.js     # Global and strict auth rate limiters
│   ├── modules/
│   │   ├── auth/                       # Auth module (register, login, refresh, logout, reset)
│   │   ├── users/                      # Staff management (Admin-only)
│   │   ├── products/                   # Products & embedded variants
│   │   ├── plans/                      # Subscription plans (daily/weekly/monthly/yearly)
│   │   ├── taxes/                      # Taxes & scoped products
│   │   ├── discounts/                  # Fixed/percentage discounts & scoping
│   │   ├── customers/                  # Customers, portal linking & self-service
│   │   ├── quotations/                 # Quotations, templates & convert to subscription
│   │   ├── subscriptions/              # Recurring subscriptions, state machine & cron jobs
│   │   └── counters/
│   │       └── counter.model.js        # Atomic sequence counter schema
│   └── utils/
│       ├── ApiError.js                 # Standardized operational error class
│       ├── ApiResponse.js              # Standardized API response class
│       ├── asyncHandler.js             # Async error wrapper
│       ├── pagination.js               # Pagination query parser & metadata builder
│       ├── search.js                   # Safe regex-escaped $or builder
│       ├── tokens.js                   # JWT generation, verification & crypto helpers
│       ├── numberGenerator.js          # Atomic sequence generator (e.g. SUB-2026-00001)
│       ├── pricing.js                  # Pure money math, getUnitPrice, calcLine
│       ├── discountEligibility.js       # Pure eligibility check & capped calcDiscountAmount
│       ├── dates.js                    # Billing cycle math, month-end clamping & leap year logic
│       └── lineBuilder.js              # Server-side pricing, tax & preview discount calculation
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (local instance or MongoDB Atlas cluster)

### 2. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Seed & Backfill Scripts
- **Seed Super Admin** (idempotent):
  ```bash
  npm run seed:admin
  ```
- **Backfill Existing Customers** (idempotent):
  ```bash
  npm run backfill:customers
  ```

### 5. Run the Server
```bash
# Development (with nodemon auto-restart)
npm run dev

# Production
npm start
```

---

## Interactive API Documentation
Swagger UI is live at:
```
http://localhost:5000/api-docs
```
Use the **Authorize** button with the Bearer JWT token obtained from `/api/v1/auth/login`.

---

## Phase 3 Endpoints & Sample `curl` Requests

### Quotations & Templates (`/api/v1/quotations`)
- **Admin & Staff**: Full management (`quotations:read`, `quotations:write`).
- **Customers**: Read-only for their own quotations in `sent` or `confirmed` status.

#### 1. Create a Quotation Template
```bash
curl -X POST http://localhost:5000/api/v1/quotations/templates \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "Enterprise SaaS Template",
    "validityDays": 45,
    "lines": [
      {
        "productId": "<PRODUCT_ID>",
        "planId": "<PLAN_ID>",
        "quantity": 2,
        "taxId": "<TAX_ID>"
      }
    ]
  }'
```

#### 2. Create Quotation from Template (With Live Catalog Re-Pricing)
```bash
curl -X POST http://localhost:5000/api/v1/quotations/from-template/<TEMPLATE_ID> \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "<CUSTOMER_ID>",
    "validityDays": 30
  }'
```

#### 3. Send Quotation to Customer (Triggers Email via Resend)
```bash
curl -X POST http://localhost:5000/api/v1/quotations/<QUOTATION_ID>/send \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

#### 4. Convert Quotation into a Subscription (Atomic MongoDB Transaction)
```bash
curl -X POST http://localhost:5000/api/v1/quotations/<QUOTATION_ID>/convert \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-06-01T00:00:00.000Z",
    "expiryDate": "2027-06-01T00:00:00.000Z",
    "paymentTerms": "Net 30"
  }'
```

---

### Subscriptions (`/api/v1/subscriptions`)
- **Admin & Staff**: Full lifecycle management (`subscriptions:read`, `subscriptions:manage`).
- **Customers**: Read-only for their own subscriptions.

#### 5. Activate Subscription (`confirmed -> active`)
> First invoice scheduled on `startDate`.
```bash
curl -X POST http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>/activate \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

#### 6. Pause Subscription (`active -> paused`)
> Respects `plan.allowPause`; admin can supply `"force": true` to override.
```bash
curl -X POST http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>/pause \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Temporary business pause request",
    "force": false
  }'
```

#### 7. Resume Subscription (`paused -> active`)
> Automatically adds paused days to `totalPausedDays` and adjusts `nextBillingDate = max(nextBillingDate, today)` to prevent invoice backlogs.
```bash
curl -X POST http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>/resume \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

#### 8. Renew Subscription
> Extends `expiryDate` by `periods × billingCycle` and increments `renewalCount`.
```bash
curl -X POST http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>/renew \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "periods": 1
  }'
```

#### 9. View Subscription Timeline History
```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>/history \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

---

### Automated Background Jobs
Trigger manually via Admin API:
```bash
curl -X POST http://localhost:5000/api/v1/admin/jobs/subscriptions/run \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
Scheduled automatically via `node-cron` with `SUBSCRIPTION_CRON_SCHEDULE` (default: `30 0 * * *`).
