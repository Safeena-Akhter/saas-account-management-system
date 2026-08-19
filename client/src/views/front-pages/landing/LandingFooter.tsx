'use client'

// Next Imports
import NextLink from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type FooterLink = {
  label: string
  href: string
}

const LandingFooter = ({ lang }: { lang: Locale }) => {
  const year = new Date().getFullYear()

  const productLinks: FooterLink[] = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Dashboard', href: getLocalizedUrl('/login', lang) }
  ]

  const companyLinks: FooterLink[] = [
    { label: 'About', href: '#benefits' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy Policy', href: getLocalizedUrl('/privacy-policy', lang) },
    { label: 'Terms of Service', href: getLocalizedUrl('/terms-of-service', lang) }
  ]

  const accountLinks: FooterLink[] = [
    { label: 'Login', href: getLocalizedUrl('/login', lang) },
    { label: 'Get Started', href: getLocalizedUrl('/register', lang) }
  ]

  const renderLink = (link: FooterLink) => {
    const isAnchor = link.href.startsWith('#')

    return (
      <li key={link.label}>
        <Typography
          component={isAnchor ? 'a' : NextLink}
          href={link.href}
          color='text.secondary'
          className='hover:text-primary transition-colors no-underline'
          variant='body2'
        >
          {link.label}
        </Typography>
      </li>
    )
  }

  return (
    <footer className='border-bs bg-backgroundPaper'>
      <div className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-14'>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-8'>
          <div className='col-span-2 sm:col-span-1 flex flex-col gap-3'>
            <Logo />
            <Typography variant='body2' color='text.secondary' className='max-is-[240px]'>
              Multi-tenant account management for growing businesses.
            </Typography>
          </div>

          <div>
            <Typography variant='subtitle2' className='font-semibold mbe-3'>
              Product
            </Typography>
            <ul className='flex flex-col gap-2 list-none pli-0'>{productLinks.map(renderLink)}</ul>
          </div>

          <div>
            <Typography variant='subtitle2' className='font-semibold mbe-3'>
              Company
            </Typography>
            <ul className='flex flex-col gap-2 list-none pli-0'>{companyLinks.map(renderLink)}</ul>
          </div>

          <div>
            <Typography variant='subtitle2' className='font-semibold mbe-3'>
              Account
            </Typography>
            <ul className='flex flex-col gap-2 list-none pli-0'>{accountLinks.map(renderLink)}</ul>
          </div>
        </div>

        <Divider className='mbs-10 mbe-6' />

        <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
          <Typography variant='body2' color='text.secondary'>
            © {year} {themeConfig.templateName}. All rights reserved.
          </Typography>
          <div className='flex items-center gap-4'>
            <Typography
              component={NextLink}
              href={getLocalizedUrl('/privacy-policy', lang)}
              variant='body2'
              color='text.secondary'
              className='hover:text-primary transition-colors no-underline'
            >
              Privacy Policy
            </Typography>
            <Typography
              component={NextLink}
              href={getLocalizedUrl('/terms-of-service', lang)}
              variant='body2'
              color='text.secondary'
              className='hover:text-primary transition-colors no-underline'
            >
              Terms of Service
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
