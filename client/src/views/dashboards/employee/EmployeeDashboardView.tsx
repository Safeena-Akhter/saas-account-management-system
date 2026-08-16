'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

// Components Imports
import CardStatVertical from '@components/card-statistics/Vertical'
import WelcomeHeaderCard from '@views/dashboards/shared/WelcomeHeaderCard'
import DashboardSkeleton from '@views/dashboards/shared/DashboardSkeleton'
import RecentActivitiesCard from '@views/dashboards/shared/RecentActivitiesCard'

// Hooks Imports
import { useEmployeeDashboard } from '@/features/dashboard/useDashboardStats'

type Props = {
  userName: string
  companyName?: string | null
}

// Read-only dashboard: counts and a recent activity feed only - no
// revenue/expense figures and no create/edit actions, matching the
// Employee role's permissions everywhere else in the app.
const EmployeeDashboardView = ({ userName, companyName }: Props) => {
  const { data, isLoading, isError } = useEmployeeDashboard()

  if (isLoading) {
    return <DashboardSkeleton statCount={2} chartCount={0} />
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load your dashboard right now. Please refresh to try again.</Alert>
  }

  const { stats, charts } = data

  return (
    <Grid container spacing={6}>
      <WelcomeHeaderCard userName={userName} roleLabel='Employee' companyName={companyName} subtitle="Here's a quick overview." />

      <Grid size={{ xs: 12, sm: 6 }}>
        <CardStatVertical title='Customers' stats={String(stats.customers)} avatarIcon='ri-group-line' avatarColor='primary' avatarSkin='light' chipColor='secondary' chipText='Active' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CardStatVertical title='Invoices' stats={String(stats.invoices)} avatarIcon='ri-file-list-3-line' avatarColor='info' avatarSkin='light' chipColor='secondary' chipText='All time' />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <RecentActivitiesCard activities={charts.recentActivities} />
      </Grid>
    </Grid>
  )
}

export default EmployeeDashboardView
