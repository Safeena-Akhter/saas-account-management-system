// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import NavSearch from '@components/layout/shared/search'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'
import { getLocalizedUrl } from '@/utils/i18n'

// Vars
// Phase 0: the original shortcuts all pointed at demo apps/pages that have
// been moved to backup/ (see Phase 0 report). Replaced with real AMS
// modules; extend as later phases ship (Invoices, Settings, etc.).
const shortcuts: ShortcutsType[] = [
  {
    url: '/dashboards',
    icon: 'ri-home-smile-line',
    title: 'Dashboard',
    subtitle: 'Your overview'
  },
  {
    url: '/customers',
    icon: 'ri-group-line',
    title: 'Customers',
    subtitle: 'Manage customers'
  },
  {
    url: '/suppliers',
    icon: 'ri-truck-line',
    title: 'Suppliers',
    subtitle: 'Manage suppliers'
  },
  {
    url: '/products',
    icon: 'ri-shopping-bag-3-line',
    title: 'Products',
    subtitle: 'Manage products'
  },
  {
    url: '/user-management',
    icon: 'ri-user-3-line',
    title: 'Users',
    subtitle: 'Manage users'
  },
  {
    url: '/company/settings',
    icon: 'ri-settings-4-line',
    title: 'Company Settings',
    subtitle: 'Business profile'
  }
]

const NavbarContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()
  const { lang: locale } = useParams()

  return (
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && (
          <Link href={getLocalizedUrl('/', locale as Locale)}>
            <Logo />
          </Link>
        )}
      </div>

      <div className='flex items-center'>
        <NavSearch />
        <LanguageDropdown />
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown />
        <UserDropdown />
        {/* Language Dropdown, Notification Dropdown, quick access menu dropdown, user dropdown will be placed here */}
      </div>
    </div>
  )
}

export default NavbarContent
