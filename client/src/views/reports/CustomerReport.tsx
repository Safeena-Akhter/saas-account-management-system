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
import { useCustomerReport } from '@/features/reports/useReports'
import { useCustomers } from '@/features/customers/useCustomers'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import CategoryBarChart from './shared/CategoryBarChart'

const CustomerReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })
  const [customerId, setCustomerId] = useState('')

  const { data: customers } = useCustomers()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    customerId: customerId || undefined
  }

  const { data, isLoading, isFetching, isError } = useCustomerReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Customer Report'
            subheader='Invoiced, collected, and outstanding per customer for the selected period'
            action={<ReportExportBar path='/reports/customers' params={params} filenameBase='customer-report' />}
          />
          <CardContent>
            <DateRangeFilter
              value={range}
              onChange={setRange}
              extraFilters={
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
          <Alert severity='error'>Couldn&apos;t load the customer report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          {/* Per-customer summary - always shown, even in single-customer mode
              (it'll just be one row), so the same table layout works both ways. */}
          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Customer Summary' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align='right'>Invoices</TableCell>
                      <TableCell align='right'>Invoiced</TableCell>
                      <TableCell align='right'>Collected</TableCell>
                      <TableCell align='right'>Outstanding</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.customerId}>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell align='right'>{row.invoiceCount}</TableCell>
                        <TableCell align='right'>{currency(row.totalInvoiced)}</TableCell>
                        <TableCell align='right'>{currency(row.totalCollected)}</TableCell>
                        <TableCell align='right'>{currency(row.outstanding)}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={row.isActive ? 'Active' : 'Inactive'}
                            color={row.isActive ? 'success' : 'default'}
                            variant={row.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No customer activity in this period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Top Customers - all-time, not windowed by the date range (see
              report.service.ts's getCustomerReport comment). */}
          {data.topCustomers.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Top Customers' subheader='All-time, by total invoiced' />
                <CardContent>
                  <CategoryBarChart
                    labels={data.topCustomers.map(c => c.customerName)}
                    values={data.topCustomers.map(c => c.total)}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Drill-down - only present when a single customer is selected
              (see report.service.ts#getCustomerReport). */}
          {data.detail && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader title='Invoices' subheader={`${data.detail.invoices.length} in this period`} />
                  <Divider />
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice #</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align='right'>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.detail.invoices.map(inv => (
                          <TableRow key={inv.id}>
                            <TableCell>{inv.invoiceNumber}</TableCell>
                            <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell align='right'>{currency(inv.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                        {data.detail.invoices.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align='center'>
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

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader title='Payments' subheader={`${data.detail.payments.length} in this period`} />
                  <Divider />
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell align='right'>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.detail.payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell>{payment.reference ?? '—'}</TableCell>
                            <TableCell align='right'>{currency(payment.amount)}</TableCell>
                          </TableRow>
                        ))}
                        {data.detail.payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align='center'>
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
        </>
      )}
    </Grid>
  )
}

export default CustomerReport
