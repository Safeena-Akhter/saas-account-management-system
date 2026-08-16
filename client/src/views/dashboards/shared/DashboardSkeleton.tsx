// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'

type Props = {
  statCount?: number
  chartCount?: number
}

const DashboardSkeleton = ({ statCount = 4, chartCount = 2 }: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Skeleton variant='text' width={260} height={36} />
            <Skeleton variant='text' width={180} />
          </CardContent>
        </Card>
      </Grid>
      {Array.from({ length: statCount }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Skeleton variant='circular' width={40} height={40} className='mbe-4' />
              <Skeleton variant='text' width='60%' height={32} />
              <Skeleton variant='text' width='40%' />
            </CardContent>
          </Card>
        </Grid>
      ))}
      {Array.from({ length: chartCount }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Skeleton variant='text' width={160} height={28} className='mbe-4' />
              <Skeleton variant='rectangular' height={220} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default DashboardSkeleton
