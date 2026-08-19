// Type Imports
import type { Metadata } from 'next'

import type { Locale } from '@configs/i18n'

// Config Imports
import { i18n } from '@configs/i18n'

// Component Imports
import LandingPage from '@views/front-pages/landing/LandingPage'

export const metadata: Metadata = {
  title: 'Business Account Management System | AccounTrack',
  description:
    'Manage customers, suppliers, products, invoices, payments, expenses and business operations from one centralized, multi-tenant platform.',
  openGraph: {
    title: 'AccounTrack | Business Account Management System',
    description:
      'Manage customers, suppliers, products, invoices, payments, expenses and business operations from one centralized, multi-tenant platform.',
    type: 'website'
  }
}

type Props = {
  params: Promise<{ lang: string }>
}

const Page = async (props: Props) => {
  const params = await props.params

  const lang: Locale = i18n.locales.includes(params.lang as Locale) ? (params.lang as Locale) : i18n.defaultLocale

  return <LandingPage lang={lang} />
}

export default Page
