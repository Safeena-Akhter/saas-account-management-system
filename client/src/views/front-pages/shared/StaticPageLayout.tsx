// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import LandingNavbar from '@views/front-pages/landing/LandingNavbar'
import LandingFooter from '@views/front-pages/landing/LandingFooter'

type Props = {
  lang: Locale
  title: string
  lastUpdated: string
  children: ReactNode
}

const StaticPageLayout = ({ lang, title, lastUpdated, children }: Props) => {
  return (
    <div className='flex flex-col is-full bs-full'>
      <LandingNavbar lang={lang} />
      <main className='flex-1'>
        <div className='mli-auto max-is-[820px] pli-4 sm:pli-6 plb-16 lg:plb-20'>
          <Typography variant='h3' className='font-bold mbe-2'>
            {title}
          </Typography>
          <Typography variant='body2' color='text.secondary' className='mbe-8'>
            Last updated: {lastUpdated}
          </Typography>
          <div className='flex flex-col gap-6'>{children}</div>
        </div>
      </main>
      <LandingFooter lang={lang} />
    </div>
  )
}

export default StaticPageLayout
