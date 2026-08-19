// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

const capabilities = [
  {
    icon: 'ri-shield-keyhole-line',
    title: 'Role-Based Access Control',
    description: 'Every user is assigned a role — Owner, Manager, Accountant or Employee — that determines what they can see and do.'
  },
  {
    icon: 'ri-building-4-line',
    title: 'Multi-Tenant Data Isolation',
    description: "Each company's data is kept separate, so tenants never see each other's records."
  },
  {
    icon: 'ri-lock-2-line',
    title: 'JWT Authentication',
    description: 'Sessions are secured with industry-standard JSON Web Token authentication.'
  },
  {
    icon: 'ri-mail-check-line',
    title: 'Email Verification',
    description: 'New accounts confirm their email address before gaining full access to the platform.'
  }
]

const SecuritySection = () => {
  return (
    <section className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20'>
      <div className='text-center max-is-[720px] mli-auto mbe-10'>
        <Typography variant='h3' className='font-bold mbe-3'>
          Built with security in mind
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Access controls and data isolation designed for multi-company teams.
        </Typography>
      </div>

      <Grid container spacing={6}>
        {capabilities.map(item => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <div className='flex flex-col items-start gap-3 h-full p-5 rounded-2xl border'>
              <div className='flex items-center justify-center is-11 bs-11 rounded-lg bg-primaryLighter text-primary'>
                <i className={item.icon} style={{ fontSize: 22 }} />
              </div>
              <Typography variant='subtitle1' className='font-semibold'>
                {item.title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {item.description}
              </Typography>
            </div>
          </Grid>
        ))}
      </Grid>
    </section>
  )
}

export default SecuritySection
