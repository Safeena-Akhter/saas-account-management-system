// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import Chip from '@mui/material/Chip'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { Locale } from '@configs/i18n'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import type { MenuItemExactMatchUrlProps } from '@menu/types'
import type { SidebarLeaf } from '@/data/navigation/sidebarMenu'

// Component Imports
import HorizontalNav, { Menu, SubMenu, MenuItem } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { buildSidebarMenu } from '@/data/navigation/sidebarMenu'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'

// -----------------------------------------------------------------------------
// Phase 0 (superseded) - this is the horizontal-layout equivalent of
// src/components/layout/vertical/VerticalMenu.tsx - only reachable if a user
// switches Layout to "Horizontal" via the Customizer panel (the app defaults
// to vertical, see src/configs/themeConfig.ts), but it's live code so it
// needs to match, not just the vertical sidebar. Both now render the same
// src/data/navigation/sidebarMenu.ts tree - see VerticalMenu.tsx for the
// full explanation of the permission-gated-vs-roadmap-placeholder split.
// (MenuSection has no horizontal equivalent, so "group" nodes render as a
// SubMenu here instead - same convention the original template used.)
// -----------------------------------------------------------------------------

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='ri-arrow-right-s-line' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = ({ dictionary }: { dictionary: Awaited<ReturnType<typeof getDictionary>> }) => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()
  const params = useParams()
  const { data: session } = useSession()

  // Vars
  const { transitionDuration } = verticalNavOptions
  const { lang: locale } = params

  const menuTree = buildSidebarMenu({
    dictionary,
    role: session?.user.role,
    permissions: session?.user.permissions ?? []
  })

  const localizedHref = (href: string) => getLocalizedUrl(href, locale as Locale)

  // See VerticalMenu.tsx for why this is built as one object rather than
  // two independently-spread props (MenuItem's exactMatch/activeUrl props
  // are a discriminated union).
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

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-default)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuItemStyles={menuItemStyles(theme, 'ri-circle-fill')}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 4 : 14),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='ri-circle-fill' /> }
        }}
      >
        {/* Generated from src/data/navigation/sidebarMenu.ts - see
            VerticalMenu.tsx for the full explanation. "group" nodes always
            render as a SubMenu here since horizontal has no MenuSection. */}
        {menuTree.map(node => {
          if (node.type === 'item') {
            return renderLeaf(node)
          }

          return (
            <SubMenu key={node.key} label={node.label} icon={<i className={node.icon} />}>
              {node.items.map(renderLeaf)}
            </SubMenu>
          )
        })}
      </Menu>
    </HorizontalNav>
  )
}

export default HorizontalMenu
