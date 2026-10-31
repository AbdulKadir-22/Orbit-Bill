OrbitBill — Product Requirements
Document
Hackathon MVP
Web Application
21 planned screens
1. Solution
OrbitBill is a centralized Subscription Management System designed to help businesses
manage their recurring-revenue operations from a single platform.
The system allows administrators to configure products, variants, subscription plans, taxes
and discounts. Internal staff can manage customers, quotations, subscriptions, invoices and
payments according to their assigned permissions.
Customers can access a dedicated portal to view their subscriptions, invoices and payment
information without contacting the company's staff.
The platform automates the subscription lifecycle, including recurring invoice generation,
billing calculations, payment tracking and revenue reporting.
Primary objective: Replace manual spreadsheet-based subscription management with a
unified, role-based platform that automates recurring billing and provides real-time business
visibility.
2. Functional Requirements
2.1 Authentication & Authorization
● Login and customer registration.
● Unique email validation.
● Password validation: minimum 9 characters, uppercase, lowercase and special
character.
● Forgot password and email-based reset link.
● Role-based access control (RBAC).
● Admin can create staff accounts.
● Customers can register independently.
● Staff cannot create other staff accounts.
2.2 Dashboard
● Display total revenue.
● Display active subscriptions.
● Display total customers.
● Display pending and overdue invoices.
● Show recent payments and subscriptions.
● Provide relevant summary charts.
2.3 Products & Variants
● Create, update and delete products.
● Store product name, type, sales price, cost price and notes.
● Support multiple product variants.
● Allow variants to add or modify product pricing.
● Activate or deactivate products.
2.4 Subscription Plans
● Create and manage plans.
● Configure daily, weekly, monthly and yearly billing cycles.
● Configure minimum quantities.
● Set plan availability dates.
● Configure automatic closure, pause, early closure and renewal rules.
2.5 Customers
● Create and manage customer records.
● Store customer contact and business information.
● View customer subscriptions, quotations and invoices.
● Search and filter customers.
2.6 Quotations
● Create reusable quotation templates.
● Generate quotations for customers.
● Add products, plans, quantities and prices.
● Configure quotation validity.
● Convert quotations into confirmed subscriptions.
2.7 Subscriptions
● Create subscriptions from quotations.
● Generate unique subscription numbers.
● Set start date, expiry date and payment terms.
● Manage subscription products and quantities.
● Support pause, renewal, early closure and automatic closure.
● Track subscription lifecycle.
2.8 Invoices
● Automatically generate invoices from subscriptions.
● Calculate product totals, taxes and discounts.
● Confirm, cancel, send and print invoices.
● Track invoice status.
● Prevent duplicate invoice generation.
2.9 Taxes
● Create and manage tax rules.
● Configure tax rates.
● Apply taxes to eligible products and invoices.
● Calculate taxes automatically.
2.10 Discounts
● Create fixed-amount and percentage discounts.
● Configure minimum purchase and quantity requirements.
● Set start and expiry dates.
● Configure usage limits.
● Apply eligible discounts automatically to invoices.
2.11 Payments
● Record payments against invoices.
● Store payment method, amount, date and notes.
● Track paid and outstanding invoices.
● Support multiple payment records where applicable.
2.12 Reports
● Display total revenue.
● Show active subscriptions.
● Show outstanding payments.
● Identify overdue invoices.
● Provide date-based filters and financial summaries.
2.13 Staff Management
● Admin can create staff accounts.
● View staff members.
● Activate or deactivate staff accounts.
● Assign and manage staff permissions.
2.14 Customer Portal
● View customer profile.
● View active and previous subscriptions.
● View subscription details and status.
● View and download invoices.
● View payment history.
3. Roles & Permissions
The application will have three roles.
Feature Admin Staff Customer
Dashboard Full Limited —
Products CRUD View —
Plans CRUD View —
Customers CRUD CRUD Own profile
Quotations CRUD CRUD View own
Subscriptions CRUD Manage View own
Invoices CRUD Manage View own
Taxes CRUD View —
Discounts CRUD View —
Payments CRUD Record View own
Reports Full Limited —
Staff
management
CRUD — —
Customer portal — — Full own
access
CRUD = Create, Read, Update, Delete. Final permissions should be enforced by the
backend, not merely by hiding frontend buttons.
4. Total Screens
21 planned screens
The following is the proposed screen inventory. Forms, modals, filters and detail drawers
should be reused wherever possible.
No. Screen Description
1 Auth Login, signup and forgot password
2 Dashboard Admin/staff overview
3 Products Product listing
4 Product Management Create/edit products and variants
5 Plans Plans listing and management
6 Customers Customer listing
7 Customer Details Customer information and history
8 Quotations Quotation listing
9 Quotation
Management
Create/edit quotations
10 Subscriptions Subscription listing
11 Subscription Details Subscription information and lifecycle actions
12 Invoices Invoice listing
13 Invoice Details Invoice information and actions
14 Taxes Tax configuration
15 Discounts Discount management
16 Payments Payment records
17 Reports Financial reports
18 Staff Staff management
19 Customer Dashboard Customer overview
20 My Subscriptions Customer subscriptions
21 My Invoices Customer invoices
Important Auth design decision:
The Auth screen must follow your supplied OrbitBill reference:
● Left section: OrbitBill branding, logo and tagline.
● Right section: Authentication card.
● Login and Create Account as tabs.
● Forgot Password as an alternate state within the same page.
● Language selector at the top-right.
● Responsive layout.
No separate login, signup or forgot-password routes.
6. Core Business Workflow
The most important end-to-end workflow:
1. Admin creates a product.
2. Admin creates a subscription plan.
3. Customer registers or is added by staff.
4. Staff prepares a quotation.
5. Customer and staff proceed with the offer.
6. Quotation is confirmed and converted into a subscription.
7. Subscription becomes active.
8. System generates invoices when billing is due.
9. Taxes and eligible discounts are calculated.
10. Staff records the customer's payment.
11. Dashboard and reports reflect the updated financial information.
7. Technical & Non-functional Requirements
● Responsive web application.
● Secure authentication and authorization.
● Backend-enforced RBAC.
● Modular and reusable components.
● Database-backed CRUD operations.
● Automatic recurring invoice generation.
● Prevention of duplicate billing.
● Proper validation and error handling.
● Search, filtering and pagination for large datasets.
● API documentation through Swagger UI.
● Every page should respond in under two seconds, as specified in the problem
statement.
● Use database transactions for critical financial operations.
8. MVP Acceptance Criteria
The application will be considered functionally complete when:
● All three roles can authenticate and access their permitted areas.
● Admin can configure products, plans, taxes and discounts.
● Staff can manage customers and quotations.
● Quotations can be converted into subscriptions.
● Subscriptions can be activated, paused, renewed and closed.
● Due subscriptions can generate invoices without duplicates.
● Payments can be recorded against invoices.
● Invoice statuses and financial summaries update correctly.
● Customers can view their own subscription and invoice information