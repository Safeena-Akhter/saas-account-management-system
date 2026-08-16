// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'

type Props = {
  userName: string
  roleLabel: string
  companyName?: string | null
  subtitle: string
}

const WelcomeHeaderCard = ({ userName, roleLabel, companyName, subtitle }: Props) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Card>
        <CardContent className='flex items-center justify-between flex-wrap gap-4'>
          <div>
            <Typography variant='h4'>Welcome back, {userName} 👋🏻</Typography>
            <Typography color='text.secondary'>{subtitle}</Typography>
          </div>
          <div className='flex items-center gap-2'>
            {companyName && <Chip label={companyName} color='secondary' variant='tonal' />}
            <Chip label={roleLabel} color='primary' variant='tonal' />
          </div>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default WelcomeHeaderCard
