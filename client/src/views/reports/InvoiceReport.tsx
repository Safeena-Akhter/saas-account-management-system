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
import { useInvoiceReport } from '@/features/reports/useReports'
import { useCustomers } from '@/features/customers/useCustomers'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import StatusDonutChart from './shared/StatusDonutChart'

const STATUS_OPTIONS = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const

const STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'default'
}

const InvoiceReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState('')

  const { data: customers } = useCustomers()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    customerId: customerId || undefined,
    status: status || undefined
  }

  const { data, isLoading, isFetching, isError } = useInvoiceReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Invoice Report'
            subheader='Full invoice register for the selected period'
            action={<ReportExportBar path='/reports/invoices' params={params} filenameBase='invoice-report' />}
          />
          <CardContent>
            <DateRangeFilter
              value={range}
              onChange={setRange}
              extraFilters={
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                          {option.replace('_', ' ')}
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
          <Alert severity='error'>Couldn&apos;t load the invoice report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Invoices</Typography>
                <Typography variant='h5'>{data.summary.invoiceCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Billed</Typography>
                <Typography variant='h5'>{currency(data.summary.totalAmount)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Collected</Typography>
                <Typography variant='h5'>{currency(data.summary.totalPaid)}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {data.statusBreakdown.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Invoice Status Breakdown' />
                <CardContent>
                  <StatusDonutChart
                    labels={data.statusBreakdown.map(s => s.status.replace('_', ' '))}
                    values={data.statusBreakdown.map(s => s.count)}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Invoice Register' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='right'>Total</TableCell>
                      <TableCell align='right'>Paid</TableCell>
                      <TableCell align='right'>Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.invoiceNumber}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{new Date(row.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip size='small' label={row.status.replace('_', ' ')} color={STATUS_COLORS[row.status]} variant='tonal' />
                        </TableCell>
                        <TableCell align='right'>{currency(row.totalAmount)}</TableCell>
                        <TableCell align='right'>{currency(row.amountPaid)}</TableCell>
                        <TableCell align='right'>{currency(row.balance)}</TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No invoices in this period.
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

export default InvoiceReport
