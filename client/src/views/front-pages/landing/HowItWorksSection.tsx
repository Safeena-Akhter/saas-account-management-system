import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

const steps = [
  {
    number: '01',
    icon: 'ri-user-add-line',
    title: 'Create Your Account',
    description: 'Sign up and set up your business profile in just a few simple steps.'
  },
  {
    number: '02',
    icon: 'ri-database-2-line',
    title: 'Set Up Your Business',
    description: 'Add your customers, suppliers, products and other important business information.'
  },
  {
    number: '03',
    icon: 'ri-file-list-3-line',
    title: 'Manage Your Daily Work',
    description: 'Create invoices, record payments, manage expenses and keep your business records organized.'
  },
  {
    number: '04',
    icon: 'ri-bar-chart-2-line',
    title: 'Track Your Business',
    description: 'Use clear dashboards and reports to understand your income, expenses and overall business performance.'
  }
]

const HowItWorksSection = () => {
  return (
    <section id='how-it-works' className='scroll-mt-20'>
      <div className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20'>
        <div className='text-center max-is-[720px] mli-auto mbe-10'>
          <Typography variant='h3' className='font-bold mbe-3'>
            How it works
          </Typography>

          <Typography variant='body1' color='text.secondary'>
            Get started quickly and manage your business in four simple steps.
          </Typography>
        </div>

        <Grid container spacing={6}>
          {steps.map(step => (
            <Grid key={step.number} size={{ xs: 12, sm: 6, md: 3 }}>
              <div className='flex flex-col items-start gap-3'>
                <Typography
                  variant='h4'
                  color='text.disabled'
                  className='font-bold'
                >
                  {step.number}
                </Typography>

                <div className='flex items-center justify-center is-11 bs-11 rounded-lg bg-primaryLighter text-primary'>
                  <i className={step.icon} style={{ fontSize: 22 }} />
                </div>

                <Typography variant='subtitle1' className='font-semibold'>
                  {step.title}
                </Typography>

                <Typography variant='body2' color='text.secondary'>
                  {step.description}
                </Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </div>
    </section>
  )
}

export default HowItWorksSection