'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { usePaymentReport } from '@/features/reports/useReports'
import { useCustomers } from '@/features/customers/useCustomers'
import { useSuppliers } from '@/features/suppliers/useSuppliers'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const

const STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default'
}

const PaymentReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [supplierId, setSupplierId] = useState('')

  const { data: customers } = useCustomers()
  const { data: suppliers } = useSuppliers()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    type: (type || undefined) as 'RECEIVED' | 'PAID' | undefined,
    status: status || undefined,
    customerId: customerId || undefined,
    supplierId: supplierId || undefined
  }

  const { data, isLoading, isFetching, isError } = usePaymentReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Payment Report'
            subheader='Payments received and paid out for the selected period'
            action={<ReportExportBar path='/reports/payments' params={params} filenameBase='payment-report' />}
          />
          <CardContent>
            <DateRangeFilter
              value={range}
              onChange={setRange}
              extraFilters={
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField select fullWidth size='small' label='Type' value={type} onChange={e => setType(e.target.value)}>
                      <MenuItem value=''>All Types</MenuItem>
                      <MenuItem value='RECEIVED'>Received</MenuItem>
                      <MenuItem value='PAID'>Paid</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      label='Status'
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <MenuItem value=''>All Statuses</MenuItem>
                      {STATUS_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      label='Customer'
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                    >
                      <MenuItem value=''>All Customers</MenuItem>
                      {customers?.map(customer => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      label='Supplier'
                      value={supplierId}
                      onChange={e => setSupplierId(e.target.value)}
                    >
                      <MenuItem value=''>All Suppliers</MenuItem>
                      {suppliers?.map(supplier => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              }
            />
          </CardContent>
        </Card>
      </Grid>

      {isLoading ? (
        <Grid size={12}>
          <Skeleton variant='rectangular' height={280} />
        </Grid>
      ) : isError || !data ? (
        <Grid size={12}>
          <Alert severity='error'>Couldn&apos;t load the payment report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Received</Typography>
                <Typography variant='h5' color='success.main'>
                  {currency(data.summary.totalReceived)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {data.summary.receivedCount} payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Paid Out</Typography>
                <Typography variant='h5' color='error.main'>
                  {currency(data.summary.totalPaid)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {data.summary.paidCount} payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Payment Register' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Party</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{new Date(row.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={row.type}
                            color={row.type === 'RECEIVED' ? 'success' : 'error'}
                            variant='tonal'
                          />
                        </TableCell>
                        <TableCell>{row.customerName ?? row.supplierName ?? '—'}</TableCell>
                        <TableCell>{row.method.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Chip size='small' label={row.status} color={STATUS_COLORS[row.status]} variant='tonal' />
                        </TableCell>
                        <TableCell>{row.reference ?? '—'}</TableCell>
                        <TableCell align='right'>{currency(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No payments in this period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default PaymentReport
