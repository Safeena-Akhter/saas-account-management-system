'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

// Components Imports
import CardStatVertical from '@components/card-statistics/Vertical'
import WelcomeHeaderCard from '@views/dashboards/shared/WelcomeHeaderCard'
import DashboardSkeleton from '@views/dashboards/shared/DashboardSkeleton'

// Hooks Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { useSuperAdminDashboard } from '@/features/dashboard/useDashboardStats'

type Props = {
  userName: string
}

const SuperAdminDashboardView = ({ userName }: Props) => {
  const currency = useCurrencyFormatter()
  const { data, isLoading, isError } = useSuperAdminDashboard()

  if (isLoading) {
    return <DashboardSkeleton statCount={16} chartCount={0} />
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load the platform dashboard right now. Please refresh to try again.</Alert>
  }

  const { stats } = data

  return (
    <Grid container spacing={6}>
      <WelcomeHeaderCard userName={userName} roleLabel='Super Admin' subtitle="Here's how the platform is doing across every company." />

      {/* Companies */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Companies'
          stats={String(stats.companies)}
          avatarIcon='ri-building-line'
          avatarColor='primary'
          avatarSkin='light'
          chipColor='secondary'
          chipText='All companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Active Companies'
          stats={String(stats.activeCompanies)}
          avatarIcon='ri-checkbox-circle-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Currently active'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Suspended Companies'
          stats={String(stats.suspendedCompanies)}
          avatarIcon='ri-forbid-line'
          avatarColor='error'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Currently suspended'
        />
      </Grid>

      {/* Users */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Users'
          stats={String(stats.platformUsers)}
          avatarIcon='ri-group-line'
          avatarColor='secondary'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Across all companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Active Users'
          stats={String(stats.activePlatformUsers)}
          avatarIcon='ri-user-follow-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Currently active'
        />
      </Grid>

      {/* Business data across the platform */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Customers'
          stats={String(stats.totalCustomers)}
          avatarIcon='ri-user-star-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Across all companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Suppliers'
          stats={String(stats.totalSuppliers)}
          avatarIcon='ri-truck-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Across all companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Products'
          stats={String(stats.totalProducts)}
          avatarIcon='ri-shopping-bag-3-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Across all companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Invoices'
          stats={String(stats.totalInvoices)}
          avatarIcon='ri-file-list-3-line'
          avatarColor='info'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Across all companies'
        />
      </Grid>

      {/* Money */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Payments'
          stats={currency(stats.totalPayments)}
          avatarIcon='ri-bank-card-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Completed payments'
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
          chipText='Across all companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Income'
          stats={currency(stats.totalIncome)}
          avatarIcon='ri-hand-coin-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Across all companies'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Platform Revenue'
          stats={currency(stats.platformRevenue)}
          avatarIcon='ri-money-dollar-circle-line'
          avatarColor='success'
          avatarSkin='light'
          chipColor='secondary'
          chipText='Monthly recurring, from active plans'
        />
      </Grid>

      {/* Subscriptions */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical title='Active Subscriptions' stats={String(stats.activePlans)} avatarIcon='ri-vip-crown-line' avatarColor='success' avatarSkin='light' chipColor='secondary' chipText='Subscriptions' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical title='Trial Subscriptions' stats={String(stats.trialSubscriptions)} avatarIcon='ri-time-line' avatarColor='warning' avatarSkin='light' chipColor='secondary' chipText='Subscriptions' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical title='Expired Subscriptions' stats={String(stats.expiredPlans)} avatarIcon='ri-close-circle-line' avatarColor='error' avatarSkin='light' chipColor='secondary' chipText='Subscriptions' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical title='Cancelled Subscriptions' stats={String(stats.cancelledSubscriptions)} avatarIcon='ri-close-line' avatarColor='secondary' avatarSkin='light' chipColor='secondary' chipText='Subscriptions' />
      </Grid>
    </Grid>
  )
}

export default SuperAdminDashboardView
