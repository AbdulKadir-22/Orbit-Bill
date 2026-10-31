# OrbitBill Backend — Phase 1: Foundation, Auth & RBAC

OrbitBill is a modular Subscription Management System backend built with Node.js, Express, MongoDB (Mongoose), and CommonJS.

---

## Target Structure

```
backend/
├── scripts/
│   └── seedAdmin.js                     # Idempotent admin seeder
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
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   ├── users/                      # Staff management (Admin-only)
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   └── user.validation.js
│   │   └── counters/
│   │       └── counter.model.js        # Atomic sequence counter schema
│   └── utils/
│       ├── ApiError.js                 # Standardized operational error class
│       ├── ApiResponse.js              # Standardized API response class
│       ├── asyncHandler.js             # Async error wrapper
│       ├── pagination.js               # Pagination query parser & metadata builder
│       ├── search.js                   # Safe regex-escaped $or builder
│       ├── tokens.js                   # JWT generation, verification & crypto helpers
│       └── numberGenerator.js          # Atomic sequence generator (e.g. SUB-2026-00001)
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
Ensure all required variables are set, particularly `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Initial Admin Account
The seeding script is completely idempotent:
```bash
npm run seed:admin
```
Default credentials from `.env.example`:
- **Email**: `admin@orbitbill.com`
- **Password**: `Admin@12345`

### 5. Run the Server
```bash
# Development (with nodemon auto-restart)
npm run dev

# Production
npm start
```

---

## Interactive API Documentation
Swagger UI is available at:
```
http://localhost:5000/api-docs
```
Use the **Authorize** button with the Bearer JWT token obtained from `/api/v1/auth/login`.

---

## Endpoints & Sample `curl` Commands

### 1. Health Check
```bash
curl -X GET http://localhost:5000/health
```

### 2. Customer Registration (`POST /api/v1/auth/register`)
> Any `role` passed in the request body is strictly ignored and hardcoded to `customer`.
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Customer",
    "email": "customer@example.com",
    "password": "StrongPassword1!"
  }'
```

### 3. User Login (`POST /api/v1/auth/login`)
> Sets an httpOnly `refreshToken` cookie and returns an `accessToken` in the body.
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@orbitbill.com",
    "password": "Admin@12345"
  }'
```

### 4. Refresh Token Rotation (`POST /api/v1/auth/refresh`)
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -b "refreshToken=<REFRESH_COOKIE>" \
  -H "Content-Type: application/json"
```

### 5. Forgot Password (`POST /api/v1/auth/forgot-password`)
> Returns a generic success message regardless of whether the email exists.
```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com"
  }'
```

### 6. Reset Password (`POST /api/v1/auth/reset-password`)
```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "password": "NewStrongPass1!"
  }'
```

### 7. Get Current User (`GET /api/v1/auth/me`)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 8. Change Password (`PATCH /api/v1/auth/change-password`)
```bash
curl -X PATCH http://localhost:5000/api/v1/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "StrongPassword1!",
    "newPassword": "NewStrongPassword2@"
  }'
```

### 9. Logout (`POST /api/v1/auth/logout`)
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Staff Management Endpoints (Admin Only)

### 10. Create Staff Member (`POST /api/v1/staff`)
```bash
curl -X POST http://localhost:5000/api/v1/staff \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Staff",
    "email": "alex.staff@orbitbill.com",
    "password": "StaffSecret1!",
    "permissions": ["customers:read", "invoices:read", "payments:record"]
  }'
```

### 11. List Staff Members (`GET /api/v1/staff`)
```bash
curl -X GET "http://localhost:5000/api/v1/staff?page=1&limit=10&search=alex&isActive=true" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### 12. Get Staff by ID (`GET /api/v1/staff/:id`)
```bash
curl -X GET http://localhost:5000/api/v1/staff/6ae564c9a8d806581cf6fcf0 \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### 13. Update Staff Details (`PATCH /api/v1/staff/:id`)
```bash
curl -X PATCH http://localhost:5000/api/v1/staff/6ae564c9a8d806581cf6fcf0 \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex S. Updated",
    "permissions": ["customers:read", "customers:write"]
  }'
```

### 14. Update Staff Status (`PATCH /api/v1/staff/:id/status`)
```bash
curl -X PATCH http://localhost:5000/api/v1/staff/6ae564c9a8d806581cf6fcf0/status \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### 15. Update Staff Permissions (`PATCH /api/v1/staff/:id/permissions`)
```bash
curl -X PATCH http://localhost:5000/api/v1/staff/6ae564c9a8d806581cf6fcf0/permissions \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["subscriptions:read", "subscriptions:manage"]
  }'
```
