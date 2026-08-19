// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

const features = [
  { icon: 'ri-user-3-line', title: 'Customer Management', description: 'Keep a complete record of every customer, their contacts and their history.' },
  { icon: 'ri-truck-line', title: 'Supplier Management', description: 'Track suppliers and vendor details alongside the purchases you make from them.' },
  { icon: 'ri-box-3-line', title: 'Product Management', description: 'Organize your product and service catalog with categories that make sense for your business.' },
  { icon: 'ri-file-list-3-line', title: 'Invoice Management', description: 'Create, send and track invoices from a single, consistent workflow.' },
  { icon: 'ri-bank-card-line', title: 'Payment Tracking', description: 'Record payments against invoices and keep an accurate view of what is outstanding.' },
  { icon: 'ri-wallet-3-line', title: 'Expense Management', description: 'Log and categorize business expenses so nothing slips through the cracks.' },
  { icon: 'ri-line-chart-line', title: 'Income Tracking', description: 'Capture income sources separately from invoicing for a fuller financial picture.' },
  { icon: 'ri-bar-chart-2-line', title: 'Reports & Analytics', description: 'Turn your operational data into reports that support real business decisions.' },
  { icon: 'ri-group-line', title: 'User Management', description: 'Invite your team and manage who has access to your company workspace.' },
  { icon: 'ri-shield-keyhole-line', title: 'Role-Based Access Control', description: 'Give owners, managers, accountants and employees exactly the access they need.' },
  { icon: 'ri-building-4-line', title: 'Multi-Tenant Architecture', description: 'Run one or more companies from the same account with isolated, secure data.' },
  { icon: 'ri-dashboard-3-line', title: 'Dashboard & Business Insights', description: 'See revenue, expenses and activity at a glance the moment you log in.' }
]

const FeaturesSection = () => {
  return (
    <section id='features' className='bg-backgroundDefault scroll-mt-20'>
      <div className='mli-auto max-is-[1200px] pli-4 sm:pli-6 lg:pli-10 plb-16 lg:plb-20'>
        <div className='text-center max-is-[720px] mli-auto mbe-10'>
          <Typography variant='h3' className='font-bold mbe-3'>
            Everything your business operations need
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            A complete set of tools to run customers, suppliers, products, finances and your team — all in one
            connected platform.
          </Typography>
        </div>

        <Grid container spacing={5}>
          {features.map(feature => (
            <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant='outlined' className='h-full' sx={{ borderRadius: 3 }}>
                <CardContent className='flex flex-col items-start gap-3'>
                  <div className='flex items-center justify-center is-11 bs-11 rounded-lg bg-primaryLighter text-primary'>
                    <i className={feature.icon} style={{ fontSize: 22 }} />
                  </div>
                  <Typography variant='subtitle1' className='font-semibold'>
                    {feature.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    </section>
  )
}

export default FeaturesSection
