'use client'

import NextLink from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

import type { Locale } from '@configs/i18n'

import DashboardMockup from './DashboardMockup'

import { getLocalizedUrl } from '@/utils/i18n'

const HeroSection = ({ lang }: { lang: Locale }) => {
  return (
    <section className='relative overflow-hidden'>
      <div
        aria-hidden
        className='absolute inset-block-start-0 inset-inline-0 bs-[420px] bg-primaryLighter opacity-40 -z-10'
        style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}
      />

      <div className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-24'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
          <div className='flex flex-col gap-6 items-start'>
            <Chip
              label='Simple. Organized. Powerful.'
              color='primary'
              variant='tonal'
              size='small'
              className='font-medium'
            />

            <Typography
              variant='h1'
              className='text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold leading-[1.15]'
            >
              Everything your business needs, all in one place
            </Typography>

            <Typography
              variant='h6'
              color='text.secondary'
              className='font-normal leading-relaxed max-is-[560px]'
            >
              AccounTrack helps you manage customers, suppliers, products, invoices,
              payments, expenses and reports from one simple platform — so you can
              stay organized, save time and focus on growing your business.
            </Typography>

            <div className='flex flex-wrap gap-4 mbs-2'>
              <Button
                component={NextLink}
                href={getLocalizedUrl('/register', lang)}
                variant='contained'
                size='large'
              >
                Get Started
              </Button>

              <Button
                component={NextLink}
                href={getLocalizedUrl('/login', lang)}
                variant='outlined'
                size='large'
              >
                Login
              </Button>
            </div>

            <div className='flex items-center gap-6 mbs-4 flex-wrap'>
              <div className='flex items-center gap-2'>
                <i className='ri-checkbox-circle-line text-primary text-[20px]' />

                <Typography variant='body2' color='text.secondary'>
                  Easy to use
                </Typography>
              </div>

              <div className='flex items-center gap-2'>
                <i className='ri-global-line text-primary text-[20px]' />

                <Typography variant='body2' color='text.secondary'>
                  Flexible for businesses worldwide
                </Typography>
              </div>
            </div>
          </div>

          <div className='relative'>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection