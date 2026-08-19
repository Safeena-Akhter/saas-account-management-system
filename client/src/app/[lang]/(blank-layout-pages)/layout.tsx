// Next.js Imports
import type { Metadata } from 'next'

// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: {
    template: '%s | AccountTrack',
    default: 'AccountTrack - SaaS Account Management System'
  },
  description: 'Multi-tenant SaaS Account Management System',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}

type Props = ChildrenType & {
  params: Promise<{ lang: string }>
}

const Layout = async (props: Props) => {
  const params = await props.params
  const { children } = props

  // Type guard to ensure lang is a valid Locale
  const lang: Locale = i18n.locales.includes(params.lang as Locale) ? (params.lang as Locale) : i18n.defaultLocale

  // Vars
  const direction = i18n.langDirection[lang]
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout