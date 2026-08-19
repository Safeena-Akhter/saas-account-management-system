'use client'

import NextLink from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import type { Locale } from '@configs/i18n'

import { getLocalizedUrl } from '../../../utils/i18n'

const CtaSection = ({ lang }: { lang: Locale }) => {
  return (
    <section id='contact' className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20 scroll-mt-20'>
      <Card
        className='relative overflow-hidden text-center'
        sx={{
          borderRadius: 5,
          background: theme =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
        }}
      >
        <div className='flex flex-col items-center gap-5 pli-6 sm:pli-10 plb-14 sm:plb-16'>
          <Typography variant='h3' className='font-bold text-white'>
            Ready to take control of your business?
          </Typography>

          <Typography variant='body1' className='text-white opacity-90 max-is-[560px]'>
            Start managing your customers, invoices, payments, expenses and business records in one simple platform.
          </Typography>

          <div className='flex flex-wrap justify-center gap-4 mbs-2'>
            <Button
              component={NextLink}
              href={getLocalizedUrl('/register', lang)}
              variant='contained'
              size='large'
              color='inherit'
              className='!bg-white !text-primary hover:!bg-white/90'
            >
              Get Started
            </Button>

            <Button
              component={NextLink}
              href={getLocalizedUrl('/login', lang)}
              variant='outlined'
              size='large'
              className='!border-white !text-white hover:!border-white'
            >
              Login
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}

export default CtaSection