// -----------------------------------------------------------------------------
// Single source of truth for sidebar structure + visibility (Vertical AND
// Horizontal layouts both consume this - see components/layout/vertical/
// VerticalMenu.tsx and components/layout/horizontal/HorizontalMenu.tsx).
//
// Two different rules decide whether an item appears, and they are NOT the
// same thing:
//
// 1. Real, shipped modules (Company, Users, Customers, Suppliers,
//    Categories, Products, Invoices) are gated purely on the permission
//    strings already returned by the backend at /api/v1/auth/me and exposed
//    on `session.user.permissions` (see server/src/constants/permissions.ts -
//    that file's own comment says this array exists so "the frontend can
//    gate sidebar items"). There is deliberately no `role === 'X'` check
//    anywhere below for these - if a role's permission set changes on the
//    server, the sidebar updates automatically with zero frontend changes.
//
// 2. Modules that are on the product roadmap but have no route, page, or
//    backend permission key yet (Expenses, Income, Payments, Subscription,
//    and the Super Admin platform modules) can't be permission-gated
//    because no permission for them exists yet. Linking them to a real
//    href would 404 or bounce through RoleGuard, and hiding them entirely
//    would understate the agreed-upon information architecture. They're
//    rendered as disabled, "Soon"-tagged placeholders instead, listed per
//    role in ROLE_ROADMAP_MODULES below. The moment a module ships:
//      a) add its permission key(s) to server/src/constants/permissions.ts
//      b) move the item out of ROLE_ROADMAP_MODULES and into the
//         permission-driven section of buildSidebarMenu, with a real href
//    ...exactly like Company/Users/etc. already work, and like Invoices,
//    Reports, Notifications, and Settings were each moved in turn.
//    Settings has no permission check at all (like Dashboard) since every
//    role needs their own Profile/Security/Preferences regardless of what
//    else they can access.
// -----------------------------------------------------------------------------

import type { getDictionary } from '@/utils/getDictionary'
import type { AppRole } from '@/utils/roleRoutes'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export type SidebarLeaf = {
  type: 'item'
  key: string
  label: string
  icon: string
  href?: string
  comingSoon?: boolean

  /**
   * Match rule for highlighting this item as active. Defaults to an exact
   * pathname match (`exactMatch: true`, the MenuItem default) when omitted,
   * which is correct for every existing item since they're single pages
   * with no nested routes. Items with nested/child routes (e.g. Invoices -
   * /invoices, /invoices/create, /invoices/:id, /invoices/:id/edit,
   * /invoices/:id/print) should instead set `exactMatch: false` and
   * `activeUrl` to the shared path prefix, so the sidebar stays highlighted
   * on every route under that prefix - see MenuItem.tsx's active-state
   * effect, which checks `pathname.includes(activeUrl)` in that mode.
   */
  exactMatch?: boolean
  activeUrl?: string
}

export type SidebarGroup = {
  type: 'group'
  key: string
  label: string
  icon: string

  /** Render as a collapsible SubMenu (vertical + horizontal) rather than a static section header. */
  collapsible: boolean
  items: SidebarLeaf[]
}

export type SidebarNode = SidebarLeaf | SidebarGroup

// Roadmap modules with no backend permission key / page yet, listed per role
// exactly as agreed with the business. Each entry is a key into
// ROADMAP_ITEM_DEFS below.
// Reports shipped (real permission key "reports:view", handled in the
// permission-gated `businessItems` block below) - so it's deliberately
// removed from every role's roadmap list here. Leaving it in both places
// was rendering two separate "Reports" sidebar entries for Business Owner/
// Manager/Accountant (one permission-gated, one roadmap placeholder) - see
// buildSidebarMenu's `has('reports:view')` block for the real one.
// Notifications and Settings shipped the same way (real "notifications:view"
// permission key; Settings is unconditional like Dashboard, see
// buildSidebarMenu) - moved out of here for the same reason, into the
// permission-driven section below.
// Subscription shipped too (real "subscription:view"/"subscription:manage"
// permission keys) - same move, out of BUSINESS_OWNER/MANAGER's roadmap
// list here and into the permission-gated `businessItems` block. The Super
// Admin side (Plan CRUD + assigning companies to plans) shipped on the
// backend at the same time, so 'platformPlans' moved out of the Super
// Admin roadmap list too, replaced by a real 'platformSubscriptions' item
// alongside it (see the isSuperAdmin branch below) - platformUsers shipped
// the same way (real cross-company user list/activate/deactivate,
// permission key "platform:manage") and moved out of the roadmap list too.
// platformRevenue (MRR/ARR analytics) and platformSettings (platform name/
// support contact/maintenance mode) shipped last, also gated on
// "platform:manage" - the SUPER_ADMIN roadmap list is now empty since
// every Super Admin module has a real route/page. Company Management
// shipped the same way
// (real "companies:manage" permission key - SUPER_ADMIN already has it -
// gating a new /platform/companies page), so 'platformCompanies' moved out
// of the roadmap list too.
const ROLE_ROADMAP_MODULES: Record<AppRole, string[]> = {
  SUPER_ADMIN: [],
  BUSINESS_OWNER: ['expenses', 'income', 'payments'],
  MANAGER: [],
  ACCOUNTANT: ['expenses', 'income', 'payments'],
  EMPLOYEE: []
}

const roadmapItemDefs = (dictionary: Dictionary): Record<string, SidebarLeaf> => ({
  expenses: {
    type: 'item',
    key: 'expenses',
    label: dictionary['navigation'].expenses,
    icon: 'ri-wallet-3-line',
    href: '/expenses',
  },
  income: {
    type: 'item',
    key: 'income',
    label: dictionary['navigation'].income,
    icon: 'ri-hand-coin-line',
    href: '/income',
  },
  payments: {
    type: 'item',
    key: 'payments',
    label: dictionary['navigation'].payments,
    icon: 'ri-bank-card-line',
    href: '/payments',
  },
  reports: {
    type: 'item',
    key: 'reports',
    label: dictionary['navigation'].reports,
    icon: 'ri-bar-chart-box-line',
    href: '/reports',
  },
  platformCompanies: {
    type: 'item',
    key: 'platformCompanies',
    label: dictionary['navigation'].companies,
    icon: 'ri-building-4-line',
    href: '/platform/companies',
    exactMatch: false,
    activeUrl: '/platform/companies'
  },
  platformUsers: {
    type: 'item',
    key: 'platformUsers',
    label: dictionary['navigation'].users,
    icon: 'ri-group-3-line',
    href: '/platform/users',
    exactMatch: false,
    activeUrl: '/platform/users'
  },
  platformPlans: {
    type: 'item',
    key: 'platformPlans',
    label: dictionary['navigation'].plans,
    icon: 'ri-stack-line',
    href: '/plans',
    exactMatch: false,
    activeUrl: '/plans'
  },
  platformSubscriptions: {
    type: 'item',
    key: 'platformSubscriptions',
    label: dictionary['navigation'].subscriptions,
    icon: 'ri-vip-crown-line',
    href: '/company-subscriptions'
  },
  platformRevenue: {
    type: 'item',
    key: 'platformRevenue',
    label: dictionary['navigation'].revenue,
    icon: 'ri-line-chart-line',
    href: '/platform/revenue',
    exactMatch: false,
    activeUrl: '/platform/revenue'
  },
  platformSettings: {
    type: 'item',
    key: 'platformSettings',
    label: dictionary['navigation'].platformSettings,
    icon: 'ri-shield-keyhole-line',
    href: '/platform/settings',
    exactMatch: false,
    activeUrl: '/platform/settings'
  }
})

export type BuildSidebarMenuParams = {
  dictionary: Dictionary
  role?: AppRole

  /** session.user.permissions - module:action strings from /api/v1/auth/me. */
  permissions: readonly string[]
}

export const buildSidebarMenu = ({ dictionary, role, permissions }: BuildSidebarMenuParams): SidebarNode[] => {
  const has = (permission: string) => permissions.includes(permission)
  const nav = dictionary['navigation']
  const roadmap = roadmapItemDefs(dictionary)
  const roadmapKeysForRole = role ? (ROLE_ROADMAP_MODULES[role] ?? []) : []
  const roadmapItem = (key: string) => roadmap[key]

  const nodes: SidebarNode[] = [
    {
      type: 'item',
      key: 'dashboard',
      label: nav.dashboards,
      icon: 'ri-home-smile-line',
      href: '/dashboards'
    }
  ]

  const isSuperAdmin = role === 'SUPER_ADMIN'

  if (isSuperAdmin) {
    // Plan management (CRUD/activate/deactivate/assign), the per-company
    // subscriptions list, and Company Management are real, shipped
    // modules - gated on "platform:manage"/"companies:manage" (both keys
    // SUPER_ADMIN has, per permissions.ts) the same way every other real
    // module below is gated on its own permission key, rather than living
    // in the roadmap list with the modules that still have no route/page.
    const platformItems: SidebarLeaf[] = [
      ...(has('companies:manage') ? [roadmap.platformCompanies] : []),
      ...(has('platform:manage')
        ? [roadmap.platformUsers, roadmap.platformPlans, roadmap.platformSubscriptions, roadmap.platformRevenue, roadmap.platformSettings]
        : [])
    ]

    platformItems.push(...roadmapKeysForRole.map(roadmapItem).filter(Boolean))

    if (platformItems.length) {
      nodes.push({
        type: 'group',
        key: 'platform',
        label: nav.platform,
        icon: 'ri-shield-star-line',
        collapsible: true,
        items: platformItems
      })
    }

    // Settings is unconditional for every role, including SUPER_ADMIN (see
    // the longer comment on the non-admin push below) - added here too
    // since the admin branch returns early, before that code runs.
    nodes.push({
      type: 'item',
      key: 'settings',
      label: nav.settings,
      icon: 'ri-settings-4-line',
      href: '/settings'
    })

    return nodes
  }

  // --- Real, permission-gated modules -------------------------------------
  const businessItems: SidebarLeaf[] = []

  if (has('company:view') || has('company:manage')) {
    businessItems.push({
      type: 'item',
      key: 'company',
      label: nav.company,
      icon: 'ri-building-line',
      href: '/company/settings'
    })
  }

  if (has('users:view') || has('users:manage')) {
    businessItems.push({
      type: 'item',
      key: 'users',
      label: nav.users,
      icon: 'ri-team-line',
      href: '/user-management'
    })
  }

  if (has('customers:view') || has('customers:manage')) {
    businessItems.push({
      type: 'item',
      key: 'customers',
      label: nav.customers,
      icon: 'ri-user-star-line',
      href: '/customers'
    })
  }

  if (has('suppliers:view') || has('suppliers:manage')) {
    businessItems.push({
      type: 'item',
      key: 'suppliers',
      label: nav.suppliers,
      icon: 'ri-truck-line',
      href: '/suppliers'
    })
  }

  if (has('categories:view') || has('categories:manage')) {
    businessItems.push({
      type: 'item',
      key: 'categories',
      label: nav.categories,
      icon: 'ri-price-tag-3-line',
      href: '/categories'
    })
  }

  if (has('products:view') || has('products:manage')) {
    businessItems.push({
      type: 'item',
      key: 'products',
      label: nav.products,
      icon: 'ri-shopping-bag-3-line',
      href: '/products'
    })
  }

  // Invoices: Business Owner, Manager, Accountant always have "invoice:view"
  // (see server/src/constants/permissions.ts); Employee only has it because
  // the Invoice module's RBAC spec makes Employee view-only rather than
  // no-access (unlike Customers/Categories) - same permission-driven gate
  // as every item above, just happening to resolve to "always visible" for
  // three of the four roles and "visible" for Employee too today. `href`
  // points at the existing Invoice List page; `exactMatch: false` +
  // `activeUrl` keep this item highlighted on every nested invoice route
  // (create/:id/:id/edit/:id/print), not just the exact /invoices path.
  if (has('invoice:view') || has('invoice:manage')) {
    businessItems.push({
      type: 'item',
      key: 'invoices',
      label: nav.invoices,
      icon: 'ri-file-list-3-line',
      href: '/invoices',
      exactMatch: false,
      activeUrl: '/invoices'
    })
  }

  if (has('reports:view')) {
    businessItems.push({
      type: 'item',
      key: 'reports',
      label: nav.reports,
      icon: 'ri-bar-chart-box-line',
      href: '/reports',
      exactMatch: false,
      activeUrl: '/reports'
    })
  }

  // Notifications: every company role gets "notifications:view" (see
  // server/src/constants/permissions.ts) - a notification already belongs
  // to exactly one user, so unlike Company/Users/etc. there's no narrower
  // role split to encode here, just the standard permission check.
  if (has('notifications:view')) {
    businessItems.push({
      type: 'item',
      key: 'notifications',
      label: nav.notifications,
      icon: 'ri-notification-3-line',
      href: '/notifications'
    })
  }

  // Subscription: Business Owner (full self-service) / Manager (view only)
  // per SUBSCRIPTION_MODULE_VIEW_ROLES/WRITE_ROLES in constants/roles.ts -
  // Accountant/Employee have neither permission so never see this item.
  if (has('subscription:view') || has('subscription:manage')) {
    businessItems.push({
      type: 'item',
      key: 'subscription',
      label: nav.subscription,
      icon: 'ri-vip-crown-line',
      href: '/subscription'
    })
  }
  
  if (businessItems.length) {
    nodes.push({
      type: 'group',
      key: 'business',
      label: nav.businessModules,
      icon: 'ri-building-line',
      collapsible: false,
      items: businessItems
    })
  }

  // --- Roadmap placeholders, grouped to match the shipped IA -------------
  const financeKeys = ['expenses', 'income', 'payments']
  const financeItems = roadmapKeysForRole.filter(key => financeKeys.includes(key)).map(roadmapItem).filter(Boolean)

  if (financeItems.length > 1) {
    nodes.push({
      type: 'group',
      key: 'finance',
      label: nav.finance,
      icon: 'ri-money-dollar-circle-line',
      collapsible: true,
      items: financeItems
    })
  } else if (financeItems.length === 1) {
    nodes.push(financeItems[0])
  }

  if (roadmapKeysForRole.includes('reports')) {
    nodes.push(roadmap.reports)
  }

  // Settings: unconditional, like Dashboard above - every authenticated
  // role (including Employee/Accountant, who have the fewest business
  // permissions) still needs to reach their own Profile/Security/
  // Preferences. No permission check needed since it's inherently
  // self-service - see server/src/routes/auth.routes.ts's Settings module
  // routes, which are gated on requireAuth only, not any role/permission.
  nodes.push({
    type: 'item',
    key: 'settings',
    label: nav.settings,
    icon: 'ri-settings-4-line',
    href: '/settings'
  })

  return nodes
}
