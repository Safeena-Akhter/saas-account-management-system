// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import Chip from '@mui/material/Chip'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useSession } from 'next-auth/react'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { Locale } from '@configs/i18n'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import type { MenuItemExactMatchUrlProps } from '@menu/types'
import type { SidebarLeaf } from '@/data/navigation/sidebarMenu'

// Component Imports
import { Menu, MenuItem, MenuSection, SubMenu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { buildSidebarMenu } from '@/data/navigation/sidebarMenu'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// -----------------------------------------------------------------------------
// Phase 0 (superseded) - the original Materialize template sidebar (Dashboards
// demo list, Front Pages, Apps & Pages, Forms & Tables, Charts & Misc, demo
// Invoice/User/Roles & Permissions/Pages, Wizard/Dialog/Widget examples, Forms,
// React Table, Charts) was removed. Those route folders were NOT deleted -
// they were moved to
// backup/src/app/[lang]/(dashboard)/(private)/{apps,charts,forms,react-table,pages}
// so they can be restored or referenced later.
//
// The sidebar structure itself now lives in one place -
// src/data/navigation/sidebarMenu.ts - shared with HorizontalMenu.tsx. Real
// modules (Company/Users/Customers/Suppliers/Categories/Products) are
// permission-gated from session.user.permissions; nothing here hardcodes a
// role check for visibility. Modules that don't have a route/permission yet
// (Invoices, Expenses, Income, Payments, Reports, Notifications, Settings,
// Subscription, and the Super Admin platform section) render as disabled
// "Soon" placeholders - see the comment at the top of sidebarMenu.ts for how
// to promote one to a real, permission-gated item once it ships.
// -----------------------------------------------------------------------------

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()
  const { data: session } = useSession()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale } = params

  const menuTree = buildSidebarMenu({
    dictionary,
    role: session?.user.role,
    permissions: session?.user.permissions ?? []
  })

  const localizedHref = (href: string) => getLocalizedUrl(href, locale as Locale)

  // Items that opt into prefix-matching (e.g. Invoices, so /invoices,
  // /invoices/create, /invoices/:id, /invoices/:id/edit, /invoices/:id/print
  // all keep the sidebar item highlighted) vs. the default exact match every
  // other single-page item relies on. Built as one object, rather than two
  // independently-spread props, so it satisfies MenuItem's discriminated
  // exactMatch/activeUrl union type.
  const activeMatchProps = (leaf: SidebarLeaf): MenuItemExactMatchUrlProps =>
    leaf.exactMatch === false && leaf.activeUrl ? { exactMatch: false, activeUrl: localizedHref(leaf.activeUrl) } : {}

  const renderLeaf = (leaf: SidebarLeaf) => (
    <MenuItem
      key={leaf.key}
      icon={<i className={leaf.icon} />}
      disabled={leaf.comingSoon}
      {...(leaf.href ? { href: localizedHref(leaf.href) } : {})}
      {...activeMatchProps(leaf)}
      {...(leaf.comingSoon
        ? { suffix: <Chip label={dictionary['navigation'].soon} size='small' variant='tonal' color='default' /> }
        : {})}
    >
      {leaf.label}
    </MenuItem>
  )

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {/* Dashboard - single entry, resolves to the logged-in user's own
            role dashboard via the redirect in /dashboards/page.tsx (see
            src/utils/roleRoutes.ts for the role -> route mapping). Each role
            only ever sees their own dashboard, so there's nothing to
            sub-menu here. */}
        {/* Everything below is generated from src/data/navigation/sidebarMenu.ts -
            permission-gated real modules first, then any roadmap
            placeholders that apply to this role (rendered disabled, with a
            "Soon" chip, and no href, so nothing here can 404 or dead-end at
            a Not Authorized page). */}
        {menuTree.map(node => {
          if (node.type === 'item') {
            return renderLeaf(node)
          }

          if (!node.collapsible) {
            return (
              <MenuSection key={node.key} label={node.label}>
                {node.items.map(renderLeaf)}
              </MenuSection>
            )
          }

          return (
            <SubMenu key={node.key} label={node.label} icon={<i className={node.icon} />}>
              {node.items.map(renderLeaf)}
            </SubMenu>
          )
        })}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
