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
import type { TopCustomer } from '@/features/dashboard/types'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

type Props = {
  customers: TopCustomer[]
}

const initials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const TopCustomersCard = ({ customers }: Props) => {
  const currency = useCurrencyFormatter()

  return (
    <Card className='h-full'>
      <CardHeader title='Top Customers' />
      <CardContent className='pbs-0'>
        {customers.length === 0 ? (
          <Typography color='text.disabled'>No invoiced customers yet</Typography>
        ) : (
          <List disablePadding>
            {customers.map(customer => (
              <ListItem key={customer.customerId} className='flex items-center justify-between gap-4 px-0'>
                <div className='flex items-center gap-3'>
                  <CustomAvatar skin='light' color='primary' size={34}>
                    {initials(customer.customerName)}
                  </CustomAvatar>
                  <Typography color='text.primary'>{customer.customerName}</Typography>
                </div>
                <Typography className='font-medium'>{currency(customer.total)}</Typography>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default TopCustomersCard
