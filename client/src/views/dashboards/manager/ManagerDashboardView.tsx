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

// Hooks Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { useManagerDashboard } from '@/features/dashboard/useDashboardStats'

type Props = {
  userName: string
  companyName?: string | null
}

const ManagerDashboardView = ({ userName, companyName }: Props) => {
  const currency = useCurrencyFormatter()
  const { data, isLoading, isError } = useManagerDashboard()

  if (isLoading) {
    return <DashboardSkeleton statCount={6} chartCount={1} />
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load your dashboard right now. Please refresh to try again.</Alert>
  }

  const { stats, charts } = data

  return (
    <Grid container spacing={6}>
      <WelcomeHeaderCard
        userName={userName}
        roleLabel='Manager'
        companyName={companyName}
        subtitle="Here's your team's performance overview."
      />

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Sales' stats={currency(stats.sales)} avatarIcon='ri-line-chart-line' avatarColor='success' avatarSkin='light' chipColor='secondary' chipText='Last 6 months' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Customers' stats={String(stats.customers)} avatarIcon='ri-group-line' avatarColor='primary' avatarSkin='light' chipColor='secondary' chipText='Active' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Products' stats={String(stats.products)} avatarIcon='ri-shopping-bag-3-line' avatarColor='secondary' avatarSkin='light' chipColor='secondary' chipText='In catalog' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Invoices' stats={String(stats.invoices)} avatarIcon='ri-file-list-3-line' avatarColor='info' avatarSkin='light' chipColor='secondary' chipText='All time' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Pending Approvals' stats={String(stats.pendingApprovals)} avatarIcon='ri-time-line' avatarColor='warning' avatarSkin='light' chipColor='secondary' chipText='Open invoices' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Low Stock Products' stats={String(stats.lowStockProducts)} avatarIcon='ri-alert-line' avatarColor='error' avatarSkin='light' chipColor='secondary' chipText='≤ 10 units' />
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <TrendLineChart title='Monthly Sales' data={charts.monthlySales} color='var(--mui-palette-info-main)' formatValue={currency} />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <RecentActivitiesCard activities={charts.recentActivities} />
      </Grid>
    </Grid>
  )
}

export default ManagerDashboardView
