// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

const benefits = [
  { icon: 'ri-stack-line', title: 'Centralized business management', description: 'Stop switching between spreadsheets and tools — manage operations from one place.' },
  { icon: 'ri-time-line', title: 'Save time on manual work', description: 'Streamlined workflows for invoices, payments and expenses cut down repetitive tasks.' },
  { icon: 'ri-line-chart-line', title: 'Better financial visibility', description: 'See revenue, expenses and outstanding payments whenever you need to.' },
  { icon: 'ri-shield-keyhole-line', title: 'Secure, role-based access', description: 'Give each team member access that matches their responsibilities.' },
  { icon: 'ri-building-4-line', title: 'Multi-company support', description: 'Run more than one business from a single account without mixing data.' },
  { icon: 'ri-dashboard-3-line', title: 'Real-time business insights', description: 'Dashboards reflect your latest data so you always know where things stand.' }
]

const BenefitsSection = () => {
  return (
    <section id='benefits' className='bg-backgroundDefault scroll-mt-20'>
      <div className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20'>
        <div className='text-center max-is-[720px] mli-auto mbe-10'>
          <Typography variant='h3' className='font-bold mbe-3'>
            Why teams choose AccounTrack
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Built to help growing businesses stay organized as they scale their operations.
          </Typography>
        </div>

        <Grid container spacing={6}>
          {benefits.map(benefit => (
            <Grid key={benefit.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <div className='flex items-start gap-4'>
                <div className='flex items-center justify-center is-10 bs-10 shrink-0 rounded-lg bg-primaryLighter text-primary'>
                  <i className={benefit.icon} style={{ fontSize: 20 }} />
                </div>
                <div>
                  <Typography variant='subtitle1' className='font-semibold mbe-1'>
                    {benefit.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {benefit.description}
                  </Typography>
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      </div>
    </section>
  )
}

export default BenefitsSection
