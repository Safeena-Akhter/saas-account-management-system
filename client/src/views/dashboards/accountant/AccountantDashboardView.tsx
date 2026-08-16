'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

// Components Imports
import CardStatVertical from '@components/card-statistics/Vertical'
import WelcomeHeaderCard from '@views/dashboards/shared/WelcomeHeaderCard'
import DashboardSkeleton from '@views/dashboards/shared/DashboardSkeleton'
import TrendLineChart from '@views/dashboards/shared/TrendLineChart'
import RecentActivitiesCard from '@views/dashboards/shared/RecentActivitiesCard'
import ReportsLinksCard from '@views/dashboards/accountant/ReportsLinksCard'

// Hooks Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { useAccountantDashboard } from '@/features/dashboard/useDashboardStats'

type Props = {
  userName: string
  companyName?: string | null
}

const AccountantDashboardView = ({ userName, companyName }: Props) => {
  const currency = useCurrencyFormatter()
  const { data, isLoading, isError } = useAccountantDashboard()

  if (isLoading) {
    return <DashboardSkeleton statCount={6} chartCount={2} />
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load your dashboard right now. Please refresh to try again.</Alert>
  }

  const { stats, charts } = data

  return (
    <Grid container spacing={6}>
      <WelcomeHeaderCard
        userName={userName}
        roleLabel='Accountant'
        companyName={companyName}
        subtitle="Here's the company's financial snapshot."
      />

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Income' stats={currency(stats.income)} avatarIcon='ri-money-dollar-circle-line' avatarColor='success' avatarSkin='light' chipColor='secondary' chipText='All time' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Expenses' stats={currency(stats.expenses)} avatarIcon='ri-wallet-3-line' avatarColor='error' avatarSkin='light' chipColor='secondary' chipText='All time' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Net Profit' stats={currency(stats.netProfit)} avatarIcon='ri-line-chart-line' avatarColor={stats.netProfit >= 0 ? 'success' : 'error'} avatarSkin='light' chipColor='secondary' chipText='Income - Expenses' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Payments Pending' stats={String(stats.pendingPayments)} avatarIcon='ri-time-line' avatarColor='warning' avatarSkin='light' chipColor='secondary' chipText='Invoices awaiting payment' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Outstanding Balance' stats={currency(stats.outstandingBalance)} avatarIcon='ri-error-warning-line' avatarColor='error' avatarSkin='light' chipColor='secondary' chipText='Unpaid invoices' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Outstanding Payable' stats={currency(stats.outstandingPayable)} avatarIcon='ri-truck-line' avatarColor='warning' avatarSkin='light' chipColor='secondary' chipText='Owed to suppliers' />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TrendLineChart title='Revenue Trend' data={charts.revenueTrend} color='var(--mui-palette-success-main)' formatValue={currency} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TrendLineChart title='Expense Trend' data={charts.expenseTrend} color='var(--mui-palette-error-main)' formatValue={currency} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <RecentActivitiesCard activities={charts.recentActivities} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <ReportsLinksCard />
      </Grid>
    </Grid>
  )
}

export default AccountantDashboardView
