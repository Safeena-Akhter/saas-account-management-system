import type { Role } from "@prisma/client";

// Which roles a given actor is allowed to CREATE or MODIFY via the User
// Management module. This is the single place privilege-escalation rules
// live - `user.service.ts` consults this instead of hardcoding role checks
// inline, so the rule is guaranteed identical for create/update/activate/
// deactivate/delete.
//
// Per the Phase 3 spec, User Management write access belongs to
// BUSINESS_OWNER alone (routes/user.routes.ts enforces this directly with
// requireRole("BUSINESS_OWNER") on every mutating route) - MANAGER's entry
// here is intentionally empty, not a lesser set, since Managers are
// view-only in this module now. This table stays as the defense-in-depth
// check in the service layer even though the route layer already blocks
// non-owners, so a future route change can't silently reopen a
// privilege-escalation hole.
//
// SUPER_ADMIN is excluded from every list: it's platform-level, never
// created or touched here.
export const MANAGEABLE_ROLES: Record<Role, Role[]> = {
  SUPER_ADMIN: [],
  BUSINESS_OWNER: ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT", "EMPLOYEE"],
  MANAGER: [],
  ACCOUNTANT: [],
  EMPLOYEE: []
};

// Roles allowed to access the User Management module at all, i.e. even see
// the user list. Employees and Accountants get a 403 before any handler
// runs (see user.routes.ts's router.use RBAC gate).
export const USER_MANAGEMENT_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER"];

// Roles allowed to create, edit, delete, activate, deactivate, or assign
// roles to users. Only the Business Owner - Managers can list/view but
// every mutating route also re-asserts this directly with requireRole.
export const USER_MANAGEMENT_WRITE_ROLES: Role[] = ["BUSINESS_OWNER"];

// Roles an owner may actually ASSIGN - when inviting a new user, or when
// reassigning an existing one's role. Deliberately narrower than
// MANAGEABLE_ROLES: MANAGEABLE_ROLES answers "can the actor touch a user
// who currently has this role at all" (still includes BUSINESS_OWNER, so an
// owner can deactivate/delete a fellow owner), whereas this answers "what
// value is the actor allowed to set `role` to" - which per spec is only
// ever Manager, Accountant, or Employee. An owner can never promote anyone
// to Business Owner or Super Admin through this module.
export const INVITABLE_ROLES: Role[] = ["MANAGER", "ACCOUNTANT", "EMPLOYEE"];

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return MANAGEABLE_ROLES[actorRole].includes(targetRole);
}

// Customer Management RBAC, per module spec: Business Owner (full access),
// Manager (create/update/view), Accountant (view only), Employee (no
// access). Kept as named constants (not inlined in customer.routes.ts) for
// the same reason as the User Management ones above: one place to read the
// intended policy, reused by both the route guards and anywhere else that
// needs to ask "can this role do X to a customer".
//
// Note: GET /customers (the plain, unfiltered list) is deliberately *not*
// gated by CUSTOMER_MODULE_VIEW_ROLES - it's also how the Invoices and
// Payments modules populate their "pick a customer" dropdown for every
// role, Employee included, since raising an invoice requires picking a
// customer. Only the standalone Customer Details view (GET /customers/:id)
// and the write routes below enforce this list. See customer.routes.ts.
export const CUSTOMER_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Create/update/activate/deactivate - Manager included, per spec.
export const CUSTOMER_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER"];

// Hard delete only - narrower than write, since "Full Access" (delete
// included) is a Business Owner-only privilege per spec; Manager's grant is
// limited to Create/Update/View.
export const CUSTOMER_MODULE_DELETE_ROLES: Role[] = ["BUSINESS_OWNER"];

// Category Management RBAC, per module spec: Business Owner (full access),
// Manager (full CRUD, delete included), Accountant (view only), Employee
// (no access). Unlike Customer/Supplier, "Manager: CRUD" for Category is
// NOT narrowed on delete - Business Owner's "Full Access" and Manager's
// "CRUD" grant are the same write surface here, so there's a single write
// role list rather than a separate WRITE/DELETE split.
//
// Note: unlike Customer's GET /customers, GET /categories has no
// "Employee needs the plain list for a picker" carve-out - Employees can't
// create/edit Products (that's Owner/Manager-only, see product.routes.ts),
// so they never need the category picker either. Every route in
// category.routes.ts can safely enforce this list, including the plain
// list route.
export const CATEGORY_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Create/update/delete/activate/deactivate - Manager included, per spec
// ("Manager: CRUD" is a full grant here, not narrower than Owner's).
export const CATEGORY_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER"];

// Supplier Management RBAC, per module spec: Business Owner (full access),
// Manager (create/update/view), Accountant (view only), Employee (no
// access). Same shape as the Customer module's constants above - unlike
// Customer, though, GET /suppliers (the plain, unfiltered list) IS gated by
// the view list here: Employees can't create Expenses at all
// (expense.routes.ts limits that to Business Owner/Accountant), so there's
// no "Employee needs the plain list for a picker" carve-out to make - see
// customer roles.ts comments above for the case where that carve-out *is*
// needed.
export const SUPPLIER_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Create/update/activate/deactivate - Manager included, per spec.
export const SUPPLIER_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER"];

// Hard delete only - Business Owner only, same "Full Access" reasoning as
// CUSTOMER_MODULE_DELETE_ROLES above.
export const SUPPLIER_MODULE_DELETE_ROLES: Role[] = ["BUSINESS_OWNER"];

// Invoice Management RBAC, per module spec: Business Owner, Manager, and
// Accountant all get full CRUD (create/edit/soft-delete/restore); Employee
// is view-only. Unlike Customer/Supplier, there's no Owner-only "Full
// Access vs CRUD" split to make here - the spec lists Manager and
// Accountant's grant as "CRUD" outright, same as Category's shape - so a
// single WRITE/DELETE role list (rather than a narrower delete-only list)
// is correct.
//
// Note: GET /invoices (list + byId) is intentionally NOT gated by
// INVOICE_MODULE_VIEW_ROLES in invoice.routes.ts - Employees can view
// invoices (per spec) and also need the plain list for the Payments
// module's "which invoice is this payment against" picker, same
// "everyone in the company can view" reasoning as Customer's GET
// /customers. This constant exists for symmetry/documentation and for any
// future route that does need to assert "any authenticated company role",
// which is already the default for unguarded routes.
export const INVOICE_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT", "EMPLOYEE"];

// Create/edit/soft-delete/restore - Owner, Manager, Accountant all get full
// CRUD per spec. Employee is excluded (view only).
export const INVOICE_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Soft delete + restore - same set as WRITE (no narrower "Full Access"
// carve-out for Invoice, unlike Customer/Supplier's delete-only lists).
export const INVOICE_MODULE_DELETE_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Expense Management RBAC. Formalizes the roles expense.routes.ts already
// enforced inline before this module was completed: Manager can see
// company financials (view) but only Business Owner/Accountant can
// actually record or edit an expense - Manager's grant here is narrower
// than Category's "Manager: CRUD", intentionally.
export const EXPENSE_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Create/update/delete a single expense, and manage the ExpenseCategory
// picker list.
export const EXPENSE_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER", "ACCOUNTANT"];

// Income Management RBAC - deliberately the same shape as Expense's above
// (Owner+Accountant write, +Manager view): Income and Expense are peer
// "money in / money out" ledgers, so there's no principled reason for one
// to have different access than the other.
export const INCOME_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];
export const INCOME_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER", "ACCOUNTANT"];

// Payment Management RBAC. GET /payments (the plain list) is intentionally
// NOT gated by a view-role list here, same "everyone in the company can
// see it" reasoning as Invoice - Employees need it to record a customer
// payment and to see payment history for a customer they're serving. See
// payment.routes.ts.
//
// Recording a RECEIVED (customer) payment keeps its existing, wider grant
// (Owner/Manager/Accountant/Employee - front-desk staff take customer
// payments). Recording a PAID (supplier) payment is narrower, matching
// Expense's write roles - paying money OUT to a supplier is the same kind
// of action as recording an Expense, not a routine front-desk task.
export const PAYMENT_MODULE_RECEIVE_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT", "EMPLOYEE"];
export const PAYMENT_MODULE_SUPPLIER_PAY_ROLES: Role[] = ["BUSINESS_OWNER", "ACCOUNTANT"];

// Reports & Analytics RBAC, per module spec: Business Owner (Full Access),
// Manager (View + Export Reports), Accountant (Full Reports Access),
// Employee (No Reports). Reports have no write/delete surface of their own
// (they're read-only views over other modules' data), so unlike every
// module above there's a single VIEW list rather than a VIEW/WRITE split -
// "Full Access" and "Full Reports Access" both cash out to "can view every
// report" since there's nothing to write. Export permission (PDF/Excel/CSV)
// reuses this same list for now - all three roles that can view a report
// can also export it, so a separate EXPORT_ROLES constant would just
// duplicate this one; split it out if that ever diverges.
// SUPER_ADMIN is deliberately excluded - platform-level reports are a
// separate, not-yet-built module (see sidebarMenu.ts's platformRevenue
// roadmap item), not this company-scoped one.
export const REPORT_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT"];

// Subscription Management RBAC, per module spec: Business Owner (manage own
// subscription - view/upgrade/downgrade/renew/cancel), Manager (view only),
// Accountant and Employee (no access). SUPER_ADMIN is excluded - its
// platform-level plan/subscription management is a completely separate
// route tree (see subscription.routes.ts / plan.routes.ts, both gated by
// requireRole("SUPER_ADMIN") instead of these).
export const SUBSCRIPTION_MODULE_VIEW_ROLES: Role[] = ["BUSINESS_OWNER", "MANAGER"];
export const SUBSCRIPTION_MODULE_WRITE_ROLES: Role[] = ["BUSINESS_OWNER"];
