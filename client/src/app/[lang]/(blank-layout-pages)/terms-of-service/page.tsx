// Type Imports
import type { Metadata } from 'next'

import type { Locale } from '@configs/i18n'

// Config Imports
import { i18n } from '@configs/i18n'

// Component Imports
import TermsOfServiceView from '@views/front-pages/legal/TermsOfServiceView'

export const metadata: Metadata = {
  title: 'Terms of Service | AccounTrack',
  description: 'Read the terms that govern your use of AccounTrack.'
}

type Props = {
  params: Promise<{ lang: string }>
}

const Page = async (props: Props) => {
  const params = await props.params

  const lang: Locale = i18n.locales.includes(params.lang as Locale) ? (params.lang as Locale) : i18n.defaultLocale

  return <TermsOfServiceView lang={lang} />
}

export default Page
