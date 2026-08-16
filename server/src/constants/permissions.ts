import type { Role } from "@prisma/client";

// A single, explicit source of truth for "what can this role do", expressed
// as module:action strings. This is what /api/v1/auth/me returns alongside
// `role`, so the frontend can gate sidebar items and page/action-level UI
// without re-deriving role logic in two places (and without ever trusting
// a client-editable value for anything that actually matters - real
// enforcement still lives server-side in rbac.middleware.ts/requireRole and
// the per-module route definitions; this map must stay in sync with those,
// not replace them).
// invoice:view / invoice:manage were added to integrate the now-shipped
// Invoice module into the sidebar (see client/src/data/navigation/
// sidebarMenu.ts) using the same permission-gated pattern as every other
// real module here, rather than the "roadmap placeholder" pattern still
// used for modules with no route yet (Expenses, Payments, ...). This
// mirrors INVOICE_MODULE_VIEW_ROLES / INVOICE_MODULE_WRITE_ROLES in
// constants/roles.ts, which already enforce the real access control on the
// invoice routes - this map only controls what the frontend nav shows.
//
// reports:view was added the same way when the Reports & Analytics module
// shipped (Sales, Profit & Loss, Outstanding Balance, and Customer reports
// so far - see routes/report.routes.ts and REPORT_MODULE_VIEW_ROLES in
// constants/roles.ts). There is no reports:manage - Reports are read-only
// views over other modules' data, nothing to manage/write.
// notifications:view was added when the Notifications module shipped. Every
// company role gets it (Business Owner through Employee, including
// SUPER_ADMIN is deliberately still excluded below since Notifications is a
// company-scoped module, same as Company Settings) - a notification already
// belongs to exactly one user (see notification.repository.ts's fan-out
// model), so there's no "view someone else's notifications" surface to gate
// and therefore no notifications:manage either.
//
// subscription:view / subscription:manage were added to integrate the
// now-shipped (Business Owner self-service) Subscription module into the
// sidebar, same permission-gated pattern as invoice:view/invoice:manage
// above. Mirrors SUBSCRIPTION_MODULE_VIEW_ROLES / SUBSCRIPTION_MODULE_WRITE_ROLES
// in constants/roles.ts: Business Owner gets both (full self-service -
// upgrade/downgrade/renew/cancel), Manager gets view only, Accountant and
// Employee get neither (no access, per the module's RBAC spec).
export const PERMISSIONS = {
  SUPER_ADMIN: ["platform:manage", "companies:manage"],

  BUSINESS_OWNER: [
    "dashboard:view",
    "company:view",
    "company:manage",
    "users:view",
    "users:manage",
    "categories:view",
    "categories:manage",
    "products:view",
    "products:manage",
    "customers:view",
    "customers:manage",
    "suppliers:view",
    "suppliers:manage",
    "invoice:view",
    "invoice:manage",
    "reports:view",
    "notifications:view",
    "subscription:view",
    "subscription:manage"
  ],

  MANAGER: [
    "dashboard:view",
    "company:view",
    "users:view",
    "categories:view",
    "categories:manage",
    "products:view",
    "products:manage",
    "customers:view",
    "customers:manage",
    "suppliers:view",
    "suppliers:manage",
    "invoice:view",
    "invoice:manage",
    "reports:view",
    "notifications:view",
    "subscription:view"
  ],

  ACCOUNTANT: [
    "dashboard:view",
    "categories:view",
    "products:view",
    "customers:view",
    "suppliers:view",
    "invoice:view",
    "invoice:manage",
    "reports:view",
    "notifications:view"
  ],

  // Note: Employee deliberately does NOT get "customers:view" here, even
  // though it can still call the plain GET /customers list server-side (to
  // populate the "pick a customer" dropdown when raising an invoice/
  // payment - see customer.routes.ts). That call isn't gated by this
  // permission on the frontend; "customers:view" here only controls
  // whether the Customers module link shows up in the sidebar
  // (sidebarMenu.ts), and per the Customer Management RBAC spec Employee
  // has no access to that module - it should not see a nav link that just
  // dead-ends at "Not Authorized" (RoleGuard already blocks the page, and
  // CUSTOMER_MODULE_VIEW_ROLES already blocks GET /customers/:id).
  //
  // Employee also does NOT get "categories:view": per the Category
  // Management RBAC spec Employee has no access to that module at all, and
  // (unlike Customer) there's no picker carve-out needed either - Employees
  // can't create/edit Products, so they never need the category picker.
  // See CATEGORY_MODULE_VIEW_ROLES in constants/roles.ts, which
  // category.routes.ts enforces server-side on every route, including the
  // plain list.
  // Employee gets "invoice:view" (but not "invoice:manage") to match
  // INVOICE_MODULE_VIEW_ROLES / INVOICE_MODULE_WRITE_ROLES in
  // constants/roles.ts and the unguarded GET /invoices routes in
  // invoice.routes.ts - Employee is view-only for Invoices per spec, same
  // "view granted, manage withheld" shape as Owner/Manager/Accountant get
  // for every other module above.
  EMPLOYEE: ["dashboard:view", "products:view", "invoice:view", "notifications:view"]
} as const satisfies Record<Role, readonly string[]>;

export function getPermissionsForRole(role: Role): readonly string[] {
  return PERMISSIONS[role];
}
