'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Component Imports
import CardStatVertical from '@components/card-statistics/Vertical'

// Feature Imports
import { usePlatformRevenue } from '@/features/platformRevenue/usePlatformRevenue'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

const PlatformRevenueView = () => {
  const { data: revenue, isLoading, isError } = usePlatformRevenue()
  const currency = useCurrencyFormatter()

  if (isLoading) {
    return (
      <Grid container spacing={6}>
        {[0, 1, 2].map(i => (
          <Grid key={i} size={{ xs: 12, sm: 4 }}>
            <Skeleton variant='rectangular' height={120} />
          </Grid>
        ))}
        <Grid size={12}>
          <Skeleton variant='rectangular' height={320} />
        </Grid>
      </Grid>
    )
  }

  if (isError || !revenue) {
    return <Alert severity='error'>Couldn&apos;t load platform revenue right now. Please refresh to try again.</Alert>
  }

  const hasRevenue = revenue.byPlan.length > 0

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <CardStatVertical
          title='Monthly Recurring Revenue'
          stats={currency(revenue.mrr)}
          avatarIcon='ri-money-dollar-circle-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='MRR'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <CardStatVertical
          title='Annual Run Rate'
          stats={currency(revenue.arr)}
          avatarIcon='ri-line-chart-line'
          avatarColor='primary'
          avatarSkin='light'
          chipColor='secondary'
          chipText='ARR (MRR × 12)'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <CardStatVertical
          title='Paying Subscriptions'
          stats={String(revenue.payingSubscriptions)}
          avatarIcon='ri-vip-crown-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Active + Trial'
        />
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card className='h-full'>
          <CardHeader title='Revenue by Plan' subheader='Monthly recurring revenue contributed by each plan' />
          <CardContent>
            {!hasRevenue ? (
              <div className='flex items-center justify-center h-[260px]'>
                <Typography color='text.disabled'>No active or trial subscriptions yet</Typography>
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={260}>
                <BarChart data={revenue.byPlan} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--mui-palette-divider)' />
                  <XAxis
                    dataKey='planName'
                    tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => currency(value)} />
                  <Bar dataKey='mrr' name='MRR' fill='var(--mui-palette-success-main)' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card className='h-full'>
          <CardHeader title='By Billing Cycle' />
          <CardContent className='flex flex-col gap-4'>
            <div className='flex justify-between items-center'>
              <div>
                <Typography className='font-medium'>Monthly</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {revenue.byBillingCycle.MONTHLY.subscriptions} subscription
                  {revenue.byBillingCycle.MONTHLY.subscriptions === 1 ? '' : 's'}
                </Typography>
              </div>
              <Typography variant='h6'>{currency(revenue.byBillingCycle.MONTHLY.mrr)}</Typography>
            </div>
            <div className='flex justify-between items-center'>
              <div>
                <Typography className='font-medium'>Yearly</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {revenue.byBillingCycle.YEARLY.subscriptions} subscription
                  {revenue.byBillingCycle.YEARLY.subscriptions === 1 ? '' : 's'}
                </Typography>
              </div>
              <Typography variant='h6'>{currency(revenue.byBillingCycle.YEARLY.mrr)}</Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardHeader title='Top Companies by Revenue' subheader='Highest monthly recurring revenue contributors' />
          {revenue.topCompanies.length === 0 ? (
            <div className='text-center p-12'>
              <i className='ri-money-dollar-circle-line text-[48px] text-textSecondary mbe-2' />
              <Typography variant='h6'>No revenue yet</Typography>
              <Typography color='text.secondary'>Assign plans to companies to start generating revenue.</Typography>
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Billing Cycle</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='right'>MRR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenue.topCompanies.map(company => (
                    <TableRow key={company.companyId} hover>
                      <TableCell>{company.companyName}</TableCell>
                      <TableCell>{company.planName}</TableCell>
                      <TableCell className='capitalize'>{company.billingCycle.toLowerCase()}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={company.status}
                          color={company.status === 'TRIAL' ? 'info' : 'success'}
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell align='right'>{currency(company.mrr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Grid>
    </Grid>
  )
}

export default PlatformRevenueView
