// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

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
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-[7px]'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center'>
        <LanguageDropdown />
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
