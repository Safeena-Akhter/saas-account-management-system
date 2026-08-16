// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type DefaultSuggestionsType = {
  sectionLabel: string
  items: {
    label: string
    href: string
    icon?: string
  }[]
}

// Phase 0: the template's original suggestions all pointed at demo apps/pages
// that have been moved to backup/ (see Phase 0 report). Replaced with the
// real AMS modules that exist today; extend this list as later phases ship
// (invoices, expenses, income, payments, reports, settings, ...).
const defaultSuggestions: DefaultSuggestionsType[] = [
  {
    sectionLabel: 'Popular Searches',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboards',
        icon: 'ri-home-smile-line'
      },
      {
        label: 'Customers',
        href: '/customers',
        icon: 'ri-group-line'
      },
      {
        label: 'Products',
        href: '/products',
        icon: 'ri-shopping-bag-3-line'
      },
      {
        label: 'User Management',
        href: '/user-management',
        icon: 'ri-file-user-line'
      }
    ]
  },
  {
    sectionLabel: 'Business Modules',
    items: [
      {
        label: 'Suppliers',
        href: '/suppliers',
        icon: 'ri-truck-line'
      },
      {
        label: 'Categories',
        href: '/categories',
        icon: 'ri-price-tag-3-line'
      },
      {
        label: 'Company',
        href: '/company/settings',
        icon: 'ri-building-line'
      }
    ]
  }
]

const DefaultSuggestions = ({ setOpen }: { setOpen: (value: boolean) => void }) => {
  // Hooks
  const { lang: locale } = useParams()

  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      {defaultSuggestions.map((section, index) => (
        <div
          key={index}
          className='flex flex-col justify-center overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
        >
          <p className='text-xs uppercase text-textDisabled tracking-[0.8px]'>{section.sectionLabel}</p>
          <ul className='flex flex-col gap-4'>
            {section.items.map((item, i) => (
              <li key={i} className='flex'>
                <Link
                  href={getLocalizedUrl(item.href, locale as Locale)}
                  className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <i className={classnames(item.icon, 'flex text-xl shrink-0')} />}
                  <p className='text-[15px] truncate'>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default DefaultSuggestions
