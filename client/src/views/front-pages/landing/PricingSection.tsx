'use client'

// Next Imports
import NextLink from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const plans = [
  {
    name: 'Free',
    description: 'For solo owners just getting started.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: ['Up to 2 users', 'Basic invoicing', 'Community support']
  },
  {
    name: 'Regular',
    description: 'For small teams with growing invoice volume.',
    monthlyPrice: 15,
    yearlyPrice: 150,
    popular: false,
    features: ['Up to 5 users', 'Email support', 'Basic reports']
  },
  {
    name: 'Standard',
    description: 'For established businesses that need more room to grow.',
    monthlyPrice: 35,
    yearlyPrice: 350,
    popular: true,
    features: ['Up to 15 users', 'Priority email support', 'Advanced reports', 'Custom categories']
  },
  {
    name: 'Premium',
    description: 'For larger companies with no limits on growth.',
    monthlyPrice: 79,
    yearlyPrice: 790,
    popular: false,
    features: ['Unlimited users', '24/7 priority support', 'All reports', 'Custom branding', 'API access']
  }
]

const PricingSection = ({ lang }: { lang: Locale }) => {
  return (
    <section id='pricing' className='bg-backgroundDefault scroll-mt-20'>
      <div className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20'>
        <div className='text-center max-is-[720px] mli-auto mbe-10'>
          <Typography variant='h3' className='font-bold mbe-3'>
            Simple, transparent pricing
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Start free and upgrade as your business grows. No hidden fees, cancel anytime.
          </Typography>
        </div>

        <Grid container spacing={5} alignItems='stretch'>
          {plans.map(plan => (
            <Grid key={plan.name} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                variant='outlined'
                className='h-full relative flex flex-col'
                sx={{ borderRadius: 3, ...(plan.popular && { borderColor: 'primary.main', borderWidth: 2 }) }}
              >
                {plan.popular ? (
                  <Chip
                    label='Most Popular'
                    color='primary'
                    size='small'
                    className='absolute block-start-4 inline-end-4'
                  />
                ) : null}
                <CardContent className='flex flex-col gap-4 flex-1'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='h5' className='font-semibold'>
                      {plan.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {plan.description}
                    </Typography>
                  </div>

                  <div className='flex items-end gap-1'>
                    <Typography variant='h3' className='font-bold'>
                      ${plan.monthlyPrice}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' className='mbe-1'>
                      /month
                    </Typography>
                  </div>
                  {plan.monthlyPrice > 0 ? (
                    <Typography variant='caption' color='text.secondary' className='mbs-[-0.75rem]'>
                      or ${plan.yearlyPrice}/year
                    </Typography>
                  ) : null}

                  <div className='flex flex-col gap-3 flex-1'>
                    {plan.features.map(feature => (
                      <div key={feature} className='flex items-center gap-2'>
                        <i className='ri-check-line text-primary' />
                        <Typography variant='body2'>{feature}</Typography>
                      </div>
                    ))}
                  </div>

                  <Button
                    component={NextLink}
                    href={getLocalizedUrl('/register', lang)}
                    fullWidth
                    variant={plan.popular ? 'contained' : 'outlined'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    </section>
  )
}

export default PricingSection
