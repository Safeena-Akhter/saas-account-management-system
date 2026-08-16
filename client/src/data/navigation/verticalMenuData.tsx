// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

// -----------------------------------------------------------------------------
// Phase 0 — cleaned up for the AMS conversion.
//
// The original Materialize template menu (Front Pages / Apps & Pages / Forms &
// Tables / Charts & Misc — eCommerce, Academy, Logistics, Email, Chat,
// Calendar, Kanban, demo Invoice, demo User, Roles & Permissions, demo Pages,
// Wizard/Dialog/Widget examples, Forms, React Table, Charts) has been removed
// from the sidebar. Those route folders were NOT deleted - they were moved to
// backup/src/app/[lang]/(dashboard)/(private)/{apps,charts,forms,react-table,pages}
// so they can be restored or referenced later (e.g. the demo Invoice UI is a
// useful starting point for the real Invoice Builder in Phase 9).
//
// Below is the real navigation for what's actually built today. Add a new
// entry here as each phase ships:
//   Phase 9  -> Invoices     [done]
//   Phase 10 -> Expenses     [done]
//   Phase 11 -> Income       [done]
//   Phase 12 -> Payments     [done]
//   Phase 13 -> Reports
//   Phase 14 -> Notifications
//   Phase 15 -> Settings
//   Phase 16 -> Subscription (Super Admin: Plans, see below)
//   Phase 17 -> Super Admin panel (own top-level section, SUPER_ADMIN only)
// -----------------------------------------------------------------------------

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  // Single entry - resolves to the logged-in user's own role dashboard via
  // the redirect in /dashboards/page.tsx (see src/utils/roleRoutes.ts for
  // the role -> route mapping). Each role only ever sees their own
  // dashboard, so there's nothing to sub-menu here.
  {
    label: dictionary['navigation'].dashboards,
    icon: 'ri-home-smile-line',
    href: '/dashboards'
  },
  {
    label: dictionary['navigation'].businessModules,
    isSection: true,
    children: [
      {
        label: dictionary['navigation'].company,
        icon: 'ri-building-line',
        href: '/company/settings'
      },
      {
        label: dictionary['navigation'].userManagement,
        icon: 'ri-team-line',
        href: '/user-management'
      },
      {
        label: dictionary['navigation'].customers,
        icon: 'ri-group-line',
        href: '/customers'
      },
      {
        label: dictionary['navigation'].suppliers,
        icon: 'ri-truck-line',
        href: '/suppliers'
      },
      {
        label: dictionary['navigation'].categories,
        icon: 'ri-price-tag-3-line',
        href: '/categories'
      },
      {
        label: dictionary['navigation'].products,
        icon: 'ri-shopping-bag-3-line',
        href: '/products'
      }
    ]
  },
  {
    label: dictionary['navigation'].finance,
    isSection: true,
    children: [
      {
        label: dictionary['navigation'].invoices,
        icon: 'ri-file-list-3-line',
        href: '/invoices'
      },
      {
        label: dictionary['navigation'].expenses,
        icon: 'ri-wallet-3-line',
        href: '/expenses'
      },
      {
        label: dictionary['navigation'].income,
        icon: 'ri-hand-coin-line',
        href: '/income'
      },
      {
        label: dictionary['navigation'].payments,
        icon: 'ri-bank-card-line',
        href: '/payments'
      }
    ]
  }
]

export default verticalMenuData
