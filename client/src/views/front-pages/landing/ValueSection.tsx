import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

const pillars = [
  {
    icon: 'ri-layout-grid-line',
    title: 'Everything your business needs, in one place',
    description:
      'Manage customers, suppliers, products, invoices, payments, expenses, income and reports from one simple and organized system.'
  },
  {
    icon: 'ri-time-line',
    title: 'Spend less time managing, more time growing',
    description:
      'Replace scattered spreadsheets and manual work with a faster way to keep your business records organized and your daily tasks under control.'
  },
  {
    icon: 'ri-team-line',
    title: 'Built for the whole team',
    description:
      'Give owners, managers, accountants and employees access to the information and tools they need to do their work efficiently.'
  }
]

const ValueSection = () => {
  return (
    <section className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20'>
      <div className='text-center max-is-[720px] mli-auto mbe-10'>
        <Typography variant='h3' className='font-bold mbe-3'>
          Everything you need to run your business
        </Typography>

        <Typography variant='body1' color='text.secondary'>
          AccounTrack brings your everyday business operations together in one
          simple, organized and easy-to-use platform.
        </Typography>
      </div>

      <Grid container spacing={6}>
        {pillars.map(pillar => (
          <Grid key={pillar.title} size={{ xs: 12, md: 4 }}>
            <div className='flex flex-col items-start gap-3 h-full'>
              <div className='flex items-center justify-center is-12 bs-12 rounded-xl bg-primaryLighter text-primary'>
                <i className={pillar.icon} style={{ fontSize: 24 }} />
              </div>

              <Typography variant='h6' className='font-semibold'>
                {pillar.title}
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                {pillar.description}
              </Typography>
            </div>
          </Grid>
        ))}
      </Grid>
    </section>
  )
}

export default ValueSection