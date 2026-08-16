'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Components Imports
import CardStatVertical from '@components/card-statistics/Vertical'
import WelcomeHeaderCard from '@views/dashboards/shared/WelcomeHeaderCard'
import DashboardSkeleton from '@views/dashboards/shared/DashboardSkeleton'
import TrendLineChart from '@views/dashboards/shared/TrendLineChart'
import RevenueVsExpenseChart from '@views/dashboards/shared/RevenueVsExpenseChart'
import TopCustomersCard from '@views/dashboards/shared/TopCustomersCard'
import RecentActivitiesCard from '@views/dashboards/shared/RecentActivitiesCard'
import QuickActionsCard from '@views/dashboards/shared/QuickActionsCard'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import type { Locale } from '@configs/i18n'

// Hooks Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { useBusinessOwnerDashboard } from '@/features/dashboard/useDashboardStats'

type Props = {
  userName: string
  companyName?: string | null
}

const BusinessOwnerDashboardView = ({ userName, companyName }: Props) => {
  const currency = useCurrencyFormatter()
  const { data, isLoading, isError } = useBusinessOwnerDashboard()
  const { lang } = useParams()

  if (isLoading) {
    return <DashboardSkeleton statCount={10} chartCount={4} />
  }

  if (isError || !data) {
    return (
      <Alert severity='error'>Couldn&apos;t load your dashboard right now. Please refresh to try again.</Alert>
    )
  }

  const { stats, charts, subscription } = data

  return (
    <Grid container spacing={6}>
      <WelcomeHeaderCard
        userName={userName}
        roleLabel='Business Owner'
        companyName={companyName}
        subtitle="Here's how your company is doing."
      />

      {/* Current Plan Card / Subscription Status / Expiry Warning / Feature
          Usage - Dashboard Integration per the Subscription Management
          module spec. Hidden (not an error state) when the company somehow
          has no active subscription - shouldn't normally happen, see
          server/src/services/auth.service.ts's register(). */}
      {subscription && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center justify-center rounded-full bg-primary/10 is-12 bs-12'>
                  <i className='ri-vip-crown-line text-primary text-[24px]' />
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <Typography variant='h6'>{subscription.planName} Plan</Typography>
                    <Chip
                      size='small'
                      label={subscription.status}
                      color={subscription.status === 'ACTIVE' ? 'success' : 'warning'}
                      variant='tonal'
                    />
                  </div>
                  <Typography color='text.secondary'>
                    {subscription.billingCycle === 'YEARLY' ? 'Billed yearly' : 'Billed monthly'} &middot; Expires{' '}
                    {new Date(subscription.endDate).toLocaleDateString()} ({subscription.remainingDays} days left)
                  </Typography>
                </div>
              </div>
              <Button
                component={Link}
                href={getLocalizedUrl('/subscription', (lang as Locale) ?? 'en')}
                variant={subscription.expiringSoon ? 'contained' : 'outlined'}
                color={subscription.expiringSoon ? 'warning' : 'primary'}
              >
                {subscription.expiringSoon ? 'Renew Now' : 'Manage Subscription'}
              </Button>
            </CardContent>

            {subscription.expiringSoon && (
              <Alert severity='warning' className='mx-6 mbe-4'>
                Your subscription expires in {subscription.remainingDays} day
                {subscription.remainingDays === 1 ? '' : 's'}. Renew to avoid interruption.
              </Alert>
            )}

            {subscription.usage && (
              <CardContent className='pbs-0'>
                <Grid container spacing={4}>
                  {Object.entries(subscription.usage).map(([resource, entry]) => (
                    <Grid key={resource} size={{ xs: 12, sm: 6, md: 4 }}>
                      <div className='flex justify-between mbe-1'>
                        <Typography variant='body2' className='capitalize'>
                          {resource}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {entry.used} / {entry.limit ?? '∞'}
                        </Typography>
                      </div>
                      <LinearProgress
                        variant='determinate'
                        value={entry.percentUsed}
                        color={entry.percentUsed >= 90 ? 'error' : entry.percentUsed >= 70 ? 'warning' : 'primary'}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            )}
          </Card>
        </Grid>
      )}

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Revenue'
          stats={currency(stats.totalRevenue)}
          avatarIcon='ri-money-dollar-circle-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='All time'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Expenses'
          stats={currency(stats.totalExpenses)}
          avatarIcon='ri-wallet-3-line'
          avatarColor='error'
          avatarSkin='light'
          chipColor='secondary'
          chipText='All time'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Net Profit'
          stats={currency(stats.netProfit)}
          avatarIcon='ri-line-chart-line'
          avatarColor={stats.netProfit >= 0 ? 'success' : 'error'}
          avatarSkin='light'
          chipColor='secondary'
          chipText='Revenue - Expenses'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Monthly Sales'
          stats={currency(stats.monthlySales)}
          avatarIcon='ri-shopping-cart-2-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='This month'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Customers'
          stats={String(stats.customers)}
          avatarIcon='ri-group-line'
          avatarColor='primary'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Active'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Suppliers'
          stats={String(stats.suppliers)}
          avatarIcon='ri-truck-line'
          avatarColor='warning'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Active'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Products'
          stats={String(stats.products)}
          avatarIcon='ri-shopping-bag-3-line'
          avatarColor='secondary'
          avatarSkin='light'
          chipColor='secondary'
          chipText='In catalog'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Invoices'
          stats={String(stats.invoices)}
          avatarIcon='ri-file-list-3-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='All time'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Pending Payments'
          stats={String(stats.pendingPayments)}
          avatarIcon='ri-time-line'
          avatarColor='warning'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Awaiting payment'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Outstanding Balance'
          stats={currency(stats.outstandingBalance)}
          avatarIcon='ri-error-warning-line'
          avatarColor='error'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Unpaid invoices'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Outstanding Payable'
          stats={currency(stats.outstandingPayable)}
          avatarIcon='ri-truck-line'
          avatarColor='warning'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Owed to suppliers'
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <QuickActionsCard />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TrendLineChart title='Revenue Trend' data={charts.revenueTrend} color='var(--mui-palette-success-main)' formatValue={currency} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TrendLineChart title='Expense Trend' data={charts.expenseTrend} color='var(--mui-palette-error-main)' formatValue={currency} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TrendLineChart title='Monthly Sales' data={charts.monthlySales} color='var(--mui-palette-info-main)' formatValue={currency} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <RevenueVsExpenseChart data={charts.revenueVsExpense} />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TopCustomersCard customers={charts.topCustomers} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <RecentActivitiesCard activities={charts.recentActivities} />
      </Grid>
    </Grid>
  )
}

export default BusinessOwnerDashboardView
