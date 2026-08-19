import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import CustomAvatar from '@core/components/mui/Avatar'

type MockStat = {
  title: string
  value: string
  trend: string
  trendUp: boolean
  icon: string
  color: 'primary' | 'success' | 'warning' | 'info'
}

const stats: MockStat[] = [
  {
    title: 'Income',
    value: '$48,290',
    trend: '+12.4%',
    trendUp: true,
    icon: 'ri-money-dollar-circle-line',
    color: 'success'
  },
  {
    title: 'Expenses',
    value: '$16,120',
    trend: '-3.1%',
    trendUp: false,
    icon: 'ri-wallet-3-line',
    color: 'warning'
  },
  {
    title: 'Customers',
    value: '1,284',
    trend: '+8.6%',
    trendUp: true,
    icon: 'ri-group-line',
    color: 'primary'
  },
  {
    title: 'Invoices',
    value: '342',
    trend: '+5.2%',
    trendUp: true,
    icon: 'ri-file-list-3-line',
    color: 'info'
  }
]

const barHeights = [38, 62, 48, 74, 56, 82, 65, 90, 70, 58, 84, 96]

const recentActivity = [
  {
    label: 'Invoice #INV-2041 paid',
    time: '2m ago',
    icon: 'ri-checkbox-circle-line',
    color: 'success' as const
  },
  {
    label: 'New customer added',
    time: '18m ago',
    icon: 'ri-user-add-line',
    color: 'primary' as const
  },
  {
    label: 'Expense recorded',
    time: '1h ago',
    icon: 'ri-receipt-line',
    color: 'warning' as const
  }
]

const DashboardMockup = () => {
  return (
    <Card
      elevation={8}
      className='overflow-hidden'
      sx={{ borderRadius: 4, border: theme => `1px solid ${theme.palette.divider}` }}
    >
      <div className='flex items-center gap-2 pli-4 plb-3 bg-backgroundDefault border-be'>
        <span className='is-3 bs-3 rounded-full bg-error' />
        <span className='is-3 bs-3 rounded-full bg-warning' />
        <span className='is-3 bs-3 rounded-full bg-success' />

        <Typography variant='caption' color='text.disabled' className='mis-2'>
          AccounTrack Dashboard
        </Typography>
      </div>

      <CardContent className='flex flex-col gap-5 !p-5'>
        <div className='flex items-center justify-between'>
          <div>
            <Typography variant='subtitle1' className='font-semibold'>
              Business Overview
            </Typography>

            <Typography variant='caption' color='text.secondary'>
              This month
            </Typography>
          </div>

          <div className='flex items-center gap-2'>
            <Chip
              label='USD'
              size='small'
              variant='tonal'
              color='primary'
            />

            <Chip
              label='Live Overview'
              size='small'
              variant='tonal'
              color='success'
            />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          {stats.map(stat => (
            <div
              key={stat.title}
              className='flex items-center justify-between gap-2 p-3 rounded-xl bg-backgroundDefault'
            >
              <div className='flex flex-col gap-0.5'>
                <Typography variant='caption' color='text.secondary'>
                  {stat.title}
                </Typography>

                <Typography variant='subtitle2' className='font-semibold'>
                  {stat.value}
                </Typography>

                <Typography
                  variant='caption'
                  color={stat.trendUp ? 'success.main' : 'error.main'}
                >
                  {stat.trend}
                </Typography>
              </div>

              <CustomAvatar color={stat.color} skin='light' size={34}>
                <i className={stat.icon} style={{ fontSize: 18 }} />
              </CustomAvatar>
            </div>
          ))}
        </div>

        <div className='p-4 rounded-xl bg-backgroundDefault'>
          <div className='flex items-center justify-between mbe-3'>
            <Typography
              variant='caption'
              color='text.secondary'
              className='font-medium'
            >
              Income & Expenses
            </Typography>

            <Typography variant='caption' color='text.disabled'>
              Last 12 weeks
            </Typography>
          </div>

          <div className='flex items-end gap-[6px] bs-[72px]'>
            {barHeights.map((h, idx) => (
              <div
                key={idx}
                className='flex-1 rounded-full bg-primary'
                style={{
                  blockSize: `${h}%`,
                  opacity: 0.35 + (idx % 4) * 0.15
                }}
              />
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <Typography
            variant='caption'
            color='text.secondary'
            className='font-medium'
          >
            Recent Activity
          </Typography>

          {recentActivity.map(item => (
            <div key={item.label} className='flex items-center gap-3'>
              <CustomAvatar color={item.color} skin='light' size={28}>
                <i className={item.icon} style={{ fontSize: 14 }} />
              </CustomAvatar>

              <Typography variant='body2' className='flex-1'>
                {item.label}
              </Typography>

              <Typography variant='caption' color='text.disabled'>
                {item.time}
              </Typography>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardMockup