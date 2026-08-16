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
import type { CustomerActivityItem, CustomerInvoiceSummary, CustomerPaymentSummary } from '@/features/customers/types'
import type { InvoiceStatus } from '@/features/invoices/types'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useCustomerDetails } from '@/features/customers/useCustomers'

type Props = {
  customerId: string
}

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'default'
}

const ACTIVITY_ICON: Record<CustomerActivityItem['type'], string> = {
  customer: 'ri-user-add-line',
  invoice: 'ri-file-list-3-line',
  payment: 'ri-bank-card-line'
}

const CustomerDetails = ({ customerId }: Props) => {
  const currency = useCurrencyFormatter()
  const { lang } = useParams()
  const { data, isLoading, isError } = useCustomerDetails(customerId)

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
    return <Alert severity='error'>Couldn&apos;t load this customer. Please refresh and try again.</Alert>
  }

  const { customer, stats, recentInvoices, recentPayments, activity } = data
  const overLimit = stats.creditLimit > 0 && stats.outstandingBalance > stats.creditLimit

  return (
    <Grid container spacing={6}>
      {/* Header / Overview */}
      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color='primary' size={48}>
                <i className='ri-user-3-line text-2xl' />
              </CustomAvatar>
              <div>
                <div className='flex items-center gap-2'>
                  <Typography variant='h5'>{customer.name}</Typography>
                  <Chip
                    size='small'
                    label={customer.isActive ? 'Active' : 'Inactive'}
                    color={customer.isActive ? 'success' : 'default'}
                    variant={customer.isActive ? 'filled' : 'outlined'}
                  />
                </div>
                <Typography color='text.secondary'>Customer since {new Date(customer.createdAt).toLocaleDateString()}</Typography>
              </div>
            </div>
            <Button
              variant='outlined'
              component={Link}
              href={getLocalizedUrl('/customers', lang as Locale)}
              startIcon={<i className='ri-arrow-left-line' />}
            >
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Stat cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Outstanding Balance</Typography>
            <Typography variant='h5' color={overLimit ? 'error.main' : undefined}>
              {currency(stats.outstandingBalance)}
            </Typography>
            {overLimit && (
              <Typography variant='caption' color='error.main'>
                Over credit limit
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Credit Limit</Typography>
            <Typography variant='h5'>{currency(stats.creditLimit)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Invoices</Typography>
            <Typography variant='h5'>{stats.invoiceCount}</Typography>
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
                <ListItemText primary='Email' secondary={customer.email || '—'} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary='Phone' secondary={customer.phone || '—'} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary='Address' secondary={customer.address || '—'} />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Notes' />
          <CardContent>
            <Typography color={customer.notes ? 'text.primary' : 'text.disabled'}>
              {customer.notes || 'No notes on file.'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Right column: recent invoices/payments + activity timeline */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card className='mbe-6'>
          <CardHeader title='Recent Invoices' />
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align='right'>Total</TableCell>
                  <TableCell align='right'>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInvoices.map((invoice: CustomerInvoiceSummary) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <Chip size='small' label={invoice.status} color={STATUS_COLORS[invoice.status]} />
                    </TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell align='right'>{currency(invoice.totalAmount)}</TableCell>
                    <TableCell align='right'>
                      {currency(Number(invoice.totalAmount) - Number(invoice.amountPaid))}
                    </TableCell>
                  </TableRow>
                ))}
                {recentInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography color='text.secondary' className='p-4'>
                        No invoices yet.
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
                  <TableCell>Invoice</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPayments.map((payment: CustomerPaymentSummary) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.invoice?.invoiceNumber ?? '—'}</TableCell>
                    <TableCell>{payment.method.replace('_', ' ')}</TableCell>
                    <TableCell align='right'>{currency(payment.amount)}</TableCell>
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
                {activity.map((item: CustomerActivityItem, index: number) => (
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

export default CustomerDetails
