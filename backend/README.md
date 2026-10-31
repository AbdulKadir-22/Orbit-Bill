# OrbitBill Backend — Phase 2: Catalog & Customers

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
│   │   └── templates/index.js          # HTML templates: welcome, reset-password, staff-invite
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
│       └── discountEligibility.js       # Pure eligibility check & capped calcDiscountAmount
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

## Phase 2 Endpoints & Sample `curl` Requests

### Products & Variants (`/api/v1/products`)
- **Admin**: Full CRUD (`products:write`).
- **Staff**: View only (`products:view`).
- **Customers**: 403 Forbidden.

#### 1. Create Product with Variants
```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cloud ERP Base",
    "type": "software",
    "salesPrice": 1000,
    "costPrice": 400,
    "variants": [
      { "name": "Odoo", "priceDelta": 560, "sku": "ERP-ODOO-01" }
    ]
  }'
```

#### 2. List Products
```bash
curl -X GET "http://localhost:5000/api/v1/products?page=1&limit=10&type=software&isActive=true" \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

#### 3. Add Variant to Product
```bash
curl -X POST http://localhost:5000/api/v1/products/<PRODUCT_ID>/variants \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Tier",
    "priceDelta": 200,
    "sku": "ERP-PRO-01"
  }'
```

---

### Plans (`/api/v1/plans`)
- **Admin**: Full CRUD.
- **Staff**: View only (`plans:view`).

#### 4. Create Subscription Plan
```bash
curl -X POST http://localhost:5000/api/v1/plans \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Annual",
    "billingCycle": "yearly",
    "price": 4999,
    "minQuantity": 1,
    "availableFrom": "2026-01-01T00:00:00.000Z",
    "availableTo": "2026-12-31T23:59:59.000Z",
    "autoClose": true
  }'
```

#### 5. List Plans
```bash
curl -X GET "http://localhost:5000/api/v1/plans?billingCycle=yearly&available=true" \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

---

### Taxes (`/api/v1/taxes`)
- **Admin**: Full CRUD.
- **Staff**: View only (`taxes:view`).

#### 6. Create Tax Rate
```bash
curl -X POST http://localhost:5000/api/v1/taxes \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GST 18%",
    "rate": 18,
    "appliesTo": "all"
  }'
```

---

### Discounts (`/api/v1/discounts`)
- **Admin**: Full CRUD.
- **Staff**: View only (`discounts:view`).

#### 7. Create Discount Rule
```bash
curl -X POST http://localhost:5000/api/v1/discounts \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Early Bird 15%",
    "type": "percentage",
    "value": 15,
    "minPurchase": 1000,
    "appliesTo": "products",
    "productIds": ["<PRODUCT_ID>"],
    "usageLimit": 100
  }'
```

#### 8. List Discounts by Status
```bash
curl -X GET "http://localhost:5000/api/v1/discounts?status=running" \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

---

### Customers (`/api/v1/customers`)
- **Admin & Staff**: Full CRUD with permissions (`customers:read`, `customers:write`).
- **Customers**: Profile self-service via `/me`.

#### 9. Customer Self-Service Profile (`GET /me`, `PATCH /me`)
```bash
# Read profile
curl -X GET http://localhost:5000/api/v1/customers/me \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>"

# Update profile
curl -X PATCH http://localhost:5000/api/v1/customers/me \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Acme Global Solutions Ltd",
    "phone": "+91 9876543210"
  }'
```

#### 10. Staff/Admin Create Customer
```bash
curl -X POST http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tata Consultancy Services",
    "email": "billing@tcs.example.com",
    "company": "TCS Ltd",
    "gstin": "27AABCU9603R1ZN",
    "phone": "+91 2267789999"
  }'
```

#### 11. Create Portal Account for Customer
```bash
curl -X POST http://localhost:5000/api/v1/customers/<CUSTOMER_ID>/portal-account \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```

#### 12. Customer Summary Placeholder
```bash
curl -X GET http://localhost:5000/api/v1/customers/<CUSTOMER_ID>/summary \
  -H "Authorization: Bearer <STAFF_OR_ADMIN_TOKEN>"
```
