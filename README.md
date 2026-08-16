# SaaS Account Management System (AMS)

A production-oriented, multi-tenant SaaS Account Management System designed to help businesses manage customers, suppliers, products, invoices, expenses, income, payments, subscriptions, users, companies, and business reports from a centralized platform.

The system is built with a modern full-stack architecture with tenant isolation, authentication, role-based access control, subscription management, reporting, and a scalable modular structure.

---

# 📌 Project Overview

The SaaS Account Management System (AMS) is a cloud-based, multi-tenant business management platform.

It is designed for small and medium-sized businesses that need a centralized system to manage:

- Customers
- Suppliers
- Products
- Categories
- Invoices
- Expenses
- Income
- Payments
- Notifications
- Users
- Companies
- Subscriptions
- Plans
- Reports & Analytics

The system supports multiple companies/tenants while maintaining tenant-level data isolation.

The platform also includes Super Admin functionality for managing companies, subscriptions, plans, and platform-level information.

---

# 🎯 Project Objectives

The main objectives of the system are to:

1. Centralize business and financial records.
2. Reduce manual accounting and record-keeping work.
3. Provide secure multi-tenant business management.
4. Implement role-based access control.
5. Provide dashboards for business insights.
6. Generate business reports and analytics.
7. Manage customer and supplier information.
8. Manage invoices, income, expenses, and payments.
9. Manage subscription plans and limits.
10. Provide a scalable architecture for future modules.
11. Provide a clean and responsive web-based interface.
12. Support future reporting exports, charts, and analytics.

---

# 🏗️ System Architecture

The project follows a modular full-stack architecture.

```text
                         ┌─────────────────────────┐
                         │        Frontend         │
                         │       Next.js 16        │
                         │    React + TypeScript   │
                         └────────────┬────────────┘
                                      │
                                      │ HTTP / REST API
                                      ▼
                         ┌─────────────────────────┐
                         │        Backend          │
                         │     Node.js + Express   │
                         │       TypeScript        │
                         └────────────┬────────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
                     ▼                ▼                ▼
                ┌─────────┐      ┌──────────┐    ┌───────────┐
                │ Prisma  │      │ Cloudinary│    │   SMTP    │
                │   ORM   │      │  Storage  │    │   Email   │
                └────┬────┘      └──────────┘    └───────────┘
                     │
                     ▼
                ┌─────────────┐
                │    MySQL    │
                │  Database   │
                └─────────────┘
````

---

# 🛠️ Technology Stack

## Frontend

* Next.js 16
* React
* TypeScript
* Material UI
* Materialize Admin Template foundation
* React Query
* Day.js
* ApexCharts / Recharts where applicable
* NextAuth
* REST API integration

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* MySQL
* JWT Authentication
* Role-Based Access Control
* Multi-Tenant Architecture
* Nodemailer / SMTP
* Cloudinary

## Development Tools

* Git
* GitHub
* VS Code
* npm
* Postman / Thunder Client
* Prisma CLI
* TypeScript

---

# 📁 Project Structure

```text
saas-account-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── data/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── libs/
│   │   ├── views/
│   │   └── ...
│   │
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── helpers/
│   │   ├── interfaces/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── templates/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.ts
│   │
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

# 🏢 Multi-Tenant Architecture

The application is designed as a multi-tenant SaaS platform.

Each business operates as a separate company/tenant.

```text
                    SaaS Platform
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Company A       Company B      Company C
          │              │              │
       Users           Users          Users
          │              │              │
       Data A          Data B         Data C
```

Tenant isolation ensures that company users only access data belonging to their authorized company.

---

# 🔐 Authentication & Authorization

The system includes authentication and authorization functionality.

Implemented authentication features include:

* User Registration
* Login
* JWT Authentication
* Refresh Tokens
* Email Verification
* Forgot Password
* Reset Password
* Invitation-based access
* Protected routes
* Session handling

Authorization is implemented using role-based permissions.

---

# 👥 User & Role Management

The system supports role-based access control.

Different roles have different permissions.

Example roles include:

* Super Admin
* Business Owner
* Manager
* Accountant
* Other company-level roles

Permissions are checked at the backend and frontend levels.

Example permission:

```text
reports:view
```

Users without the required permission should not be able to access protected functionality.

---

# 🏢 Company Management

Company-level functionality includes management of:

* Company information
* Company users
* Company settings
* Company subscription
* Company-level business data

Super Admin functionality can operate at the platform level rather than being restricted to a single company.

---

# 📊 Dashboard

The system provides role-aware dashboards.

Dashboard functionality can include:

* Revenue overview
* Expense overview
* Income overview
* Customer statistics
* Supplier statistics
* Invoice statistics
* Payment information
* Subscription information
* Business performance indicators

Dashboard content is based on the user's role and permissions.

---

# 👤 Customer Management

Customer management allows businesses to maintain centralized customer records.

Planned/implemented functionality includes:

* Customer listing
* Customer creation
* Customer editing
* Customer details
* Customer contact information
* Customer transaction information
* Customer reporting

---

# 🚚 Supplier Management

Supplier management provides centralized supplier records.

Features include:

* Supplier listing
* Supplier creation
* Supplier editing
* Supplier details
* Supplier contact information
* Supplier-related business records

---

# 📦 Product Management

Product management allows businesses to maintain their products/services.

Features include:

* Product creation
* Product editing
* Product listing
* Categories
* Pricing information
* Product status
* Product-related business data

---

# 🧾 Invoice Management

Invoice functionality provides centralized invoice management.

The invoice module is designed to support:

* Invoice creation
* Invoice listing
* Invoice details
* Customer association
* Product association
* Invoice status
* Payment tracking
* Invoice totals

Future enhancements include advanced invoice reporting and export functionality.

---

# 💰 Expense Management

Expense management allows businesses to record and manage expenses.

Features include:

* Expense records
* Expense categories
* Amount
* Date
* Description
* Business association
* Reporting integration

---

# 💵 Income Management

Income management allows businesses to record incoming business transactions.

Features include:

* Income records
* Income categories
* Amount
* Date
* Description
* Business association
* Reporting integration

---

# 💳 Payment Management

The payment module manages payment-related records.

It is designed to support:

* Payment records
* Payment status
* Invoice association
* Customer association
* Amount
* Payment date

---

# 🔔 Notifications

The system includes notification functionality for communicating important events to users.

Notifications can be used for:

* Account events
* Invitations
* Business events
* Subscription events
* System notifications

---

# 💳 Subscription & Plan Management

The platform supports SaaS subscription functionality.

The system can manage:

* Subscription plans
* Company subscriptions
* Plan limits
* Subscription status
* Start dates
* End dates
* Feature restrictions

Platform-level administrators can manage subscription plans and company subscriptions.

---

# 📈 Reports & Analytics

## Phase 1

Reports & Analytics Phase 1 introduces the first production reporting functionality.

Implemented reports:

1. Sales Report
2. Profit & Loss Report
3. Outstanding Balance Report
4. Customer Report

The Reports Dashboard provides centralized access to these reports.

---

## Reports Architecture

The reporting module follows the existing backend architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
MySQL
```

Supporting components include:

```text
Validator
    ↓
Controller
    ↓
Service
    ↓
Repository
```

This keeps reporting logic separated and maintainable.

---

# 📊 Sales Report

The Sales Report provides sales-related business information based on the selected date range.

Users can select a reporting period and view relevant sales information.

Supported reporting periods can include:

* Today
* This Week
* This Month
* This Quarter
* This Year
* Custom Date Range

---

# 📉 Profit & Loss Report

The Profit & Loss Report provides an overview of business income and expenses.

The report is designed to help businesses understand:

```text
Profit / Loss = Income - Expenses
```

The report can be filtered by date range.

---

# 💳 Outstanding Balance Report

The Outstanding Balance Report provides information about unpaid or outstanding customer balances.

The report helps businesses identify:

* Outstanding invoices
* Amounts due
* Customer balances
* Payment-related information

---

# 👥 Customer Report

The Customer Report provides customer-related business information.

It can be used to analyze customer records and their associated financial activity.

---

# 📅 Date Range Filtering

Reports include a reusable date range filter.

The reporting utilities support date-based filtering using Day.js.

Supported date concepts include:

* Day
* Week
* ISO Week
* Month
* Quarter
* Year
* Custom Date Range

The backend contains a centralized date range utility:

```text
server/src/utils/dateRange.ts
```

This keeps date calculations consistent across reports.

---

# 🛡️ Reports Permissions

Reports are protected using role-based permissions.

The following permission is used:

```text
reports:view
```

The permission is available to appropriate business roles such as:

* Business Owner
* Manager
* Accountant

The frontend sidebar also checks the permission before displaying the Reports module.

---

# 🧭 Reports Navigation

Reports are available through:

```text
/reports
```

Individual reports are available through:

```text
/reports/sales
/reports/profit-loss
/reports/outstanding-balance
/reports/customer
```

---

# 📁 Reports Module Structure

## Backend

```text
server/src/
├── utils/
│   └── dateRange.ts
│
├── validators/
│   └── report.validator.ts
│
├── repositories/
│   └── report.repository.ts
│
├── services/
│   └── report.service.ts
│
├── controllers/
│   └── report.controller.ts
│
└── routes/
    └── report.routes.ts
```

Reports are mounted under:

```text
/api/v1/reports
```

---

## Frontend

```text
client/src/
├── features/
│   └── reports/
│       ├── types.ts
│       └── useReports.ts
│
├── views/
│   └── reports/
│       ├── shared/
│       │   └── DateRangeFilter.tsx
│       │
│       ├── SalesReport.tsx
│       ├── ProfitLossReport.tsx
│       ├── OutstandingBalanceReport.tsx
│       ├── CustomerReport.tsx
│       └── ReportsDashboard.tsx
│
└── app/
    └── [lang]/
        └── (dashboard)/
            └── (private)/
                └── reports/
                    ├── page.tsx
                    ├── sales/
                    │   └── page.tsx
                    ├── profit-loss/
                    │   └── page.tsx
                    ├── outstanding-balance/
                    │   └── page.tsx
                    └── customer/
                        └── page.tsx
```

---

# 🚧 Reports Roadmap

Phase 1 does NOT include every planned report.

The following reports are planned for future phases:

* Invoice Report
* Expense Report
* Income Report
* Payment Report
* Supplier Report
* Product Report
* Tax Report
* Monthly Summary Report

---

# 📤 Export Roadmap

Export functionality is planned for a future phase.

Planned formats:

* PDF
* Excel
* CSV

These are intentionally not included in Reports Phase 1.

---

# 📊 Analytics Roadmap

Future analytics functionality includes:

* Interactive charts
* Revenue trends
* Expense trends
* Profit trends
* Customer analytics
* Product analytics
* Sales analytics
* Monthly comparisons
* Year-over-year comparisons
* KPI cards
* Advanced dashboards

---

# 🖨️ Print View Roadmap

A dedicated print-friendly report view is planned for a future phase.

Future functionality may include:

* Print reports
* Print invoices
* Print summaries
* Print-friendly layouts
* PDF generation

---

# 🔌 API Structure

The backend follows RESTful API conventions.

Base API:

```text
/api/v1
```

Reports:

```text
/api/v1/reports
```

The exact report endpoints are defined in:

```text
server/src/routes/report.routes.ts
```

---

# 🗄️ Database

The project uses:

* MySQL
* Prisma ORM

Prisma schema:

```text
server/prisma/schema.prisma
```

Migrations:

```text
server/prisma/migrations/
```

After pulling the project, generate the Prisma client:

```bash
npx prisma generate
```

For database migrations:

```bash
npx prisma migrate dev
```

For production deployments, use the appropriate production migration command and database configuration.

---

# ⚙️ Environment Variables

Environment variables are intentionally excluded from Git.

Create:

```text
server/.env
client/.env.local
```

based on:

```text
server/.env.example
client/.env.example
```

---

# 🔐 Environment Variable Security

Never commit:

```text
.env
.env.local
.env.production
server/.env
client/.env.local
```

Never expose private secrets through `NEXT_PUBLIC_*` variables.

Sensitive backend variables may include:

```text
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
SMTP_PASS
CLOUDINARY_API_SECRET
```

These must remain server-side.

---

# 🚀 Local Development

## 1. Clone the repository

```bash
git clone <repository-url>
cd saas-account-management-system
```

---

# 2. Install frontend dependencies

```bash
cd client
npm install
```

---

# 3. Configure frontend environment

Create:

```text
client/.env.local
```

using:

```text
client/.env.example
```

---

# 4. Start frontend

```bash
npm run dev
```

The frontend normally runs on:

```text
http://localhost:3000
```

---

# 5. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

---

# 6. Configure backend environment

Create:

```text
server/.env
```

using:

```text
server/.env.example
```

---

# 7. Generate Prisma Client

```bash
npx prisma generate
```

---

# 8. Run database migrations

For development:

```bash
npx prisma migrate dev
```

---

# 9. Start backend

```bash
npm run dev
```

The backend normally runs on:

```text
http://localhost:5000
```

---

# 🧪 Testing & Validation

Before deployment, validate both applications.

## Frontend TypeScript

```bash
cd client
npx tsc --noEmit
```

## Frontend production build

```bash
npm run build
```

## Backend TypeScript

```bash
cd server
npx tsc --noEmit
```

## Backend build

```bash
npm run build
```

If Prisma types are stale:

```bash
npx prisma generate
```

Then run the checks again.

---

# 🧪 Reports Phase 1 Testing

Test the following:

## Sales Report

* Open `/reports/sales`
* Select a date range
* Verify report data
* Verify unauthorized users cannot access the report

## Profit & Loss

* Open `/reports/profit-loss`
* Select a date range
* Verify income
* Verify expenses
* Verify calculated profit/loss

## Outstanding Balance

* Open `/reports/outstanding-balance`
* Select a date range
* Verify outstanding amounts
* Verify customer/invoice associations

## Customer Report

* Open `/reports/customer`
* Verify customer data
* Verify date filtering
* Verify tenant isolation

---

# 🔒 Security Considerations

The system follows several security principles:

* JWT authentication
* Protected API routes
* Role-based permissions
* Tenant isolation
* Server-side authorization
* Environment-based secrets
* Password hashing
* Email verification
* Refresh token support
* Input validation
* Prisma ORM
* API-level access control

---

# 🏢 Tenant Isolation

Tenant isolation is a critical requirement.

A company user should only be able to access records belonging to their company.

For example:

```text
Company A
 ├── Customer A1
 ├── Invoice A1
 └── Expense A1

Company B
 ├── Customer B1
 ├── Invoice B1
 └── Expense B1
```

Company A users must not be able to access:

```text
Customer B1
Invoice B1
Expense B1
```

Tenant filtering must be applied at the backend layer and should never rely only on frontend restrictions.

---

# 👑 Super Admin

The platform supports Super Admin-level functionality.

Super Admin functionality is different from company-level functionality.

Examples include:

* Platform company management
* Company information
* Company status
* Subscription management
* Plan management
* Platform-level users/companies where permitted
* Platform dashboard information

Company-level users remain restricted to their tenant.

---

# 📦 Deployment Architecture

The recommended production deployment is:

```text
                    GitHub
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
         Frontend             Backend
         Vercel               Node Host
             │                   │
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
                     MySQL
```

Recommended separation:

```text
client/  → Vercel
server/  → Node.js-compatible hosting
database → Managed MySQL
```

---

# ☁️ Vercel Frontend

The Next.js frontend can be deployed using Vercel.

For the monorepo, configure the project root as:

```text
client
```

The backend should not be treated as the Next.js application.

Production environment variables should be configured through the deployment platform rather than committed to Git.

---

# 🔗 Production API

After deploying the backend, configure the frontend to use the production backend URL.

Example:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

Do not hard-code production URLs throughout the source code.

---

# 🌐 CORS

The production backend must allow requests from the production frontend domain.

Development:

```text
http://localhost:3000
```

Production:

```text
https://your-frontend-domain.com
```

CORS should be configured using environment variables rather than allowing all origins in production.

---

# 📧 Email Configuration

The backend uses SMTP for email-related functionality.

Possible email features include:

* Email verification
* Password reset
* Invitations
* System notifications

SMTP credentials must be stored as environment variables.

Never commit:

```text
SMTP_PASS
```

or other SMTP credentials to GitHub.

---

# ☁️ Cloudinary

Cloudinary can be used for managed media/file storage.

Credentials should remain in backend environment variables:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

The API secret must never be exposed to the frontend.

---

# 🔄 Git Workflow

Recommended branch structure:

```text
main
│
└── development
```

Development work should happen on feature/development branches.

Example:

```bash
git checkout -b feature/reports-phase-1
```

After testing:

```text
feature branch
      ↓
development
      ↓
testing
      ↓
main
```

Production deployments should be associated with stable code on the `main` branch.

---

# 📝 Git Commit Convention

Recommended commit style:

```text
feat: add reports phase 1
fix: correct outstanding balance calculation
refactor: improve report repository
docs: update reports documentation
chore: update dependencies
```

---

# 🧹 Code Quality

The project follows a modular architecture.

Backend:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
Prisma
```

Frontend:

```text
Pages
   ↓
Views
   ↓
Features / Hooks
   ↓
API
```

Business logic should not be unnecessarily placed inside route handlers or UI components.

---

# 📌 Reports Phase 1 Files

## New Backend Files

```text
server/src/utils/dateRange.ts
server/src/validators/report.validator.ts
server/src/repositories/report.repository.ts
server/src/services/report.service.ts
server/src/controllers/report.controller.ts
server/src/routes/report.routes.ts
```

## New Frontend Files

```text
client/src/features/reports/types.ts
client/src/features/reports/useReports.ts

client/src/views/reports/shared/DateRangeFilter.tsx
client/src/views/reports/SalesReport.tsx
client/src/views/reports/ProfitLossReport.tsx
client/src/views/reports/OutstandingBalanceReport.tsx
client/src/views/reports/CustomerReport.tsx
client/src/views/reports/ReportsDashboard.tsx

client/src/app/[lang]/(dashboard)/(private)/reports/page.tsx
client/src/app/[lang]/(dashboard)/(private)/reports/sales/page.tsx
client/src/app/[lang]/(dashboard)/(private)/reports/profit-loss/page.tsx
client/src/app/[lang]/(dashboard)/(private)/reports/outstanding-balance/page.tsx
client/src/app/[lang]/(dashboard)/(private)/reports/customer/page.tsx
```

---

# 📝 Modified Files — Reports Phase 1

```text
server/src/app.ts
server/src/constants/roles.ts
server/src/constants/permissions.ts

client/src/data/navigation/sidebarMenu.ts
client/src/views/dashboards/accountant/ReportsLinksCard.tsx
```

---

# 📦 Dependencies

Reports Phase 1 does not introduce any new npm dependencies.

The project already uses:

```text
dayjs
```

The following Day.js plugins are used:

```text
dayjs/plugin/isoWeek
dayjs/plugin/quarterOfYear
```

These plugins are included within the Day.js package.

No additional `npm install` is required for Reports Phase 1.

---

# 🔄 Prisma

If Prisma Client types are stale, run:

```bash
npx prisma generate
```

Then perform a TypeScript/build check:

```bash
npx tsc --noEmit
```

and:

```bash
npm run build
```

---

# 🚧 Current Project Status

## Core Platform

| Module              | Status        |
| ------------------- | ------------- |
| Authentication      | ✅ Implemented |
| User Management     | ✅ Implemented |
| Company Management  | ✅ Implemented |
| Customer Management | ✅ Implemented |
| Supplier Management | ✅ Implemented |
| Product Management  | ✅ Implemented |
| Categories          | ✅ Implemented |
| Invoices            | ✅ Implemented |
| Expenses            | ✅ Implemented |
| Income              | ✅ Implemented |
| Payments            | ✅ Implemented |
| Notifications       | ✅ Implemented |
| Subscriptions       | ✅ Implemented |
| Plans               | ✅ Implemented |
| Dashboards          | ✅ Implemented |
| Reports Phase 1     | ✅ Implemented |

---

# 📊 Reports Status

| Report              | Status       |
| ------------------- | ------------ |
| Sales               | ✅ Phase 1    |
| Profit & Loss       | ✅ Phase 1    |
| Outstanding Balance | ✅ Phase 1    |
| Customer            | ✅ Phase 1    |
| Invoice             | 🚧 Planned   |
| Expense             | 🚧 Planned   |
| Income              | 🚧 Planned   |
| Payment             | 🚧 Planned   |
| Supplier            | 🚧 Planned   |
| Product             | 🚧 Planned   |
| Tax                 | 🚧 Planned   |
| Monthly Summary     | 🚧 Planned   |
| PDF Export          | 🚧 Phase 2/3 |
| Excel Export        | 🚧 Phase 2/3 |
| CSV Export          | 🚧 Phase 2/3 |
| Charts              | 🚧 Phase 2/3 |
| Print View          | 🚧 Planned   |

---

# 🗺️ Development Roadmap

## Phase 1 — Core Reports

Completed:

* Sales Report
* Profit & Loss
* Outstanding Balance
* Customer Report
* Reports Dashboard
* Date range filtering
* Reports permission
* Reports sidebar navigation
* Reports API
* Tenant-aware reporting

---

## Phase 2 — Additional Reports

Planned:

* Invoice Report
* Expense Report
* Income Report
* Payment Report
* Supplier Report
* Product Report
* Tax Report
* Monthly Summary

---

## Phase 3 — Advanced Analytics

Planned:

* Interactive charts
* Revenue trends
* Expense trends
* Profit trends
* Customer analytics
* Product analytics
* Monthly comparisons
* KPI dashboards
* Advanced filtering

---

## Phase 4 — Export & Print

Planned:

* PDF export
* Excel export
* CSV export
* Print reports
* Printable summaries

---

# 🧪 Pre-Production Checklist

Before production deployment:

* [ ] Frontend TypeScript passes
* [ ] Backend TypeScript passes
* [ ] Frontend production build passes
* [ ] Backend production build passes
* [ ] Prisma Client generated
* [ ] Database migrations verified
* [ ] Environment variables configured
* [ ] Secrets removed from repository
* [ ] CORS configured
* [ ] Authentication tested
* [ ] Authorization tested
* [ ] Tenant isolation tested
* [ ] Reports tested
* [ ] SMTP tested
* [ ] Cloudinary tested
* [ ] Production API tested
* [ ] Production frontend tested
* [ ] Error handling verified
* [ ] Database backups configured

---

# 🔐 Production Security Checklist

Before making the application publicly accessible:

* [ ] Use strong JWT secrets
* [ ] Use a production database
* [ ] Never expose database credentials
* [ ] Never expose SMTP credentials
* [ ] Never expose Cloudinary API secret
* [ ] Configure production CORS
* [ ] Disable development debugging
* [ ] Use HTTPS
* [ ] Configure secure cookies where applicable
* [ ] Validate all incoming requests
* [ ] Verify tenant isolation
* [ ] Verify role permissions
* [ ] Configure database backups
* [ ] Configure monitoring/logging

---

# 📜 License

This project is currently maintained as a private software project.

License terms can be added when the project is prepared for public distribution.

---

