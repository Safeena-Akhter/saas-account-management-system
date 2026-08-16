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
    return <DashboardSkeleton statCount={5} chartCount={0} />
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load the platform dashboard right now. Please refresh to try again.</Alert>
  }

  const { stats } = data

  return (
    <Grid container spacing={6}>
      <WelcomeHeaderCard userName={userName} roleLabel='Super Admin' subtitle="Here's how the platform is doing across every company." />

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Companies' stats={String(stats.companies)} avatarIcon='ri-building-line' avatarColor='primary' avatarSkin='light' chipColor='secondary' chipText={`${stats.suspendedCompanies} suspended`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Users' stats={String(stats.platformUsers)} avatarIcon='ri-group-line' avatarColor='secondary' avatarSkin='light' chipColor='secondary' chipText='Across all companies' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Active Plans' stats={String(stats.activePlans)} avatarIcon='ri-checkbox-circle-line' avatarColor='success' avatarSkin='light' chipColor='secondary' chipText='Subscriptions' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CardStatVertical title='Expired Plans' stats={String(stats.expiredPlans)} avatarIcon='ri-close-circle-line' avatarColor='error' avatarSkin='light' chipColor='secondary' chipText='Subscriptions' />
      </Grid>
    </Grid>
  )
}

export default SuperAdminDashboardView
