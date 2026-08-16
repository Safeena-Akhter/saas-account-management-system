// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Types Imports
import type { Activity } from '@/features/dashboard/types'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

type Props = {
  activities: Activity[]
}

const iconFor = (type: Activity['type']) => {
  switch (type) {
    case 'invoice':
      return 'ri-file-list-3-line'
    case 'payment':
      return 'ri-bank-card-line'
    case 'supplier_payment':
      return 'ri-truck-line'
    case 'expense':
      return 'ri-wallet-3-line'
    case 'income':
      return 'ri-hand-coin-line'
    case 'customer':
      return 'ri-user-add-line'
  }
}

const colorFor = (type: Activity['type']) => {
  switch (type) {
    case 'invoice':
      return 'info' as const
    case 'payment':
      return 'success' as const
    case 'supplier_payment':
      return 'error' as const
    case 'expense':
      return 'warning' as const
    case 'income':
      return 'success' as const
    case 'customer':
      return 'primary' as const
  }
}

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)

  return `${days}d ago`
}

const RecentActivitiesCard = ({ activities }: Props) => {
  const currency = useCurrencyFormatter()

  return (
    <Card className='h-full'>
      <CardHeader title='Recent Activities' />
      <CardContent className='pbs-0'>
        {activities.length === 0 ? (
          <Typography color='text.disabled'>No activity yet</Typography>
        ) : (
          <List disablePadding>
            {activities.map(activity => (
              <ListItem key={activity.id} className='flex items-center justify-between gap-4 px-0'>
                <div className='flex items-center gap-3'>
                  <CustomAvatar skin='light' color={colorFor(activity.type)} size={34}>
                    <i className={iconFor(activity.type)} />
                  </CustomAvatar>
                  <div className='flex flex-col'>
                    <Typography color='text.primary'>{activity.label}</Typography>
                    <Typography variant='body2' color='text.disabled'>
                      {timeAgo(activity.createdAt)}
                    </Typography>
                  </div>
                </div>
                {activity.amount !== null && (
                  <Typography className='font-medium'>{currency(activity.amount)}</Typography>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivitiesCard
