'use client'

// Next Imports
import { useParams } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { SupplierActivityItem, SupplierExpenseSummary } from '@/features/suppliers/types'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useSupplierDetails } from '@/features/suppliers/useSuppliers'

type Props = {
  supplierId: string
}

const ACTIVITY_ICON: Record<SupplierActivityItem['type'], string> = {
  supplier: 'ri-truck-line',
  purchase: 'ri-shopping-bag-3-line',
  payment: 'ri-bank-card-line'
}

const SupplierDetails = ({ supplierId }: Props) => {
  const currency = useCurrencyFormatter()
  const { lang } = useParams()
  const { data, isLoading, isError } = useSupplierDetails(supplierId)

  if (isLoading) {
    return (
      <Grid container spacing={6}>
        <Grid size={12}>
          <Skeleton variant='rectangular' height={160} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant='rectangular' height={280} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant='rectangular' height={280} />
        </Grid>
      </Grid>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load this supplier. Please refresh and try again.</Alert>
  }

  const { supplier, stats, recentPurchases, recentPayments, activity } = data

  return (
    <Grid container spacing={6}>
      {/* Header / Overview */}
      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color='primary' size={48}>
                <i className='ri-truck-line text-2xl' />
              </CustomAvatar>
              <div>
                <div className='flex items-center gap-2'>
                  <Typography variant='h5'>{supplier.name}</Typography>
                  <Chip
                    size='small'
                    label={supplier.isActive ? 'Active' : 'Inactive'}
                    color={supplier.isActive ? 'success' : 'default'}
                    variant={supplier.isActive ? 'filled' : 'outlined'}
                  />
                </div>
                <Typography color='text.secondary'>Supplier since {new Date(supplier.createdAt).toLocaleDateString()}</Typography>
              </div>
            </div>
            <Button
              variant='outlined'
              component={Link}
              href={getLocalizedUrl('/suppliers', lang as Locale)}
              startIcon={<i className='ri-arrow-left-line' />}
            >
              Back to Suppliers
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Stat cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Outstanding Payable</Typography>
            <Typography variant='h5'>{currency(stats.outstandingPayable)}</Typography>
            <Typography variant='caption' color='text.disabled'>
              Based on opening balance - expenses are recorded as already paid
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Opening Balance</Typography>
            <Typography variant='h5'>{currency(stats.openingBalance)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Purchases</Typography>
            <Typography variant='h5'>{stats.purchaseCount}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Payments</Typography>
            <Typography variant='h5'>{stats.paymentCount}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Left column: contact info + notes */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card className='mbe-6'>
          <CardHeader title='Contact Information' />
          <CardContent>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText primary='Email' secondary={supplier.email || '—'} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary='Phone' secondary={supplier.phone || '—'} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary='Address' secondary={supplier.address || '—'} />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Notes' />
          <CardContent>
            <Typography color={supplier.notes ? 'text.primary' : 'text.disabled'}>
              {supplier.notes || 'No notes on file.'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Right column: recent purchases/payments + activity timeline */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card className='mbe-6'>
          <CardHeader title='Recent Purchases' />
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPurchases.map((expense: SupplierExpenseSummary) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell align='right'>{currency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                {recentPurchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      <Typography color='text.secondary' className='p-4'>
                        No purchases yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card className='mbe-6'>
          <CardHeader title='Recent Payments' />
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>For</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPayments.map((expense: SupplierExpenseSummary) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{expense.paymentMethod.replace('_', ' ')}</TableCell>
                    <TableCell align='right'>{currency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                {recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      <Typography color='text.secondary' className='p-4'>
                        No payments yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card>
          <CardHeader title='Activity Timeline' />
          <CardContent className='pbs-0'>
            {activity.length === 0 ? (
              <Typography color='text.disabled'>No activity yet.</Typography>
            ) : (
              <List disablePadding>
                {activity.map((item: SupplierActivityItem, index: number) => (
                  <div key={item.id}>
                    <ListItem disableGutters className='gap-3'>
                      <CustomAvatar skin='light' color='primary' size={34}>
                        <i className={ACTIVITY_ICON[item.type]} />
                      </CustomAvatar>
                      <ListItemText
                        primary={item.label}
                        secondary={new Date(item.createdAt).toLocaleString()}
                      />
                      {item.amount !== null && (
                        <Typography color='text.secondary'>{currency(item.amount)}</Typography>
                      )}
                    </ListItem>
                    {index < activity.length - 1 && <Divider component='li' />}
                  </div>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SupplierDetails
