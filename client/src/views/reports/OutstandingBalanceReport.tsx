'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

// Type Imports
import type { Locale } from '@configs/i18n'
import type { InvoiceStatus } from '@/features/invoices/types'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useOutstandingBalanceReport } from '@/features/reports/useReports'
import { useCustomers } from '@/features/customers/useCustomers'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import CategoryBarChart from './shared/CategoryBarChart'

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'default'
}

const OutstandingBalanceReport = () => {
  const currency = useCurrencyFormatter()
  const { lang } = useParams()

  // Defaults to This Year rather than This Month - unlike Sales/P&L,
  // receivables are usually reviewed over a longer horizon, and a
  // month-scoped default would hide older overdue invoices that were
  // issued outside the current month but are still unpaid.
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_YEAR', from: '', to: '' })
  const [customerId, setCustomerId] = useState('')

  const { data: customers } = useCustomers()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    customerId: customerId || undefined
  }

  const { data, isLoading, isFetching, isError } = useOutstandingBalanceReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Outstanding Balance Report'
            subheader='Unpaid invoices (Sent, Partially Paid, Overdue) issued in the selected period'
            action={
              <ReportExportBar
                path='/reports/outstanding-balance'
                params={params}
                filenameBase='outstanding-balance-report'
              />
            }
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
          <Alert severity='error'>Couldn&apos;t load the outstanding balance report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          {/* Summary cards */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Outstanding</Typography>
                <Typography variant='h4' color='warning.main'>
                  {currency(data.summary.totalOutstanding)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Customers Owing</Typography>
                <Typography variant='h4'>{data.summary.customerCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Unpaid Invoices</Typography>
                <Typography variant='h4'>{data.summary.invoiceCount}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* By customer */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Outstanding by Customer' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align='right'>Invoices</TableCell>
                      <TableCell align='right'>Outstanding</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.byCustomer.map(row => (
                      <TableRow key={row.customerId}>
                        <TableCell>
                          <Link
                            href={getLocalizedUrl(`/customers/${row.customerId}`, lang as Locale)}
                            className='text-primary'
                          >
                            {row.customerName}
                          </Link>
                        </TableCell>
                        <TableCell align='right'>{row.invoiceCount}</TableCell>
                        <TableCell align='right'>{currency(row.outstanding)}</TableCell>
                      </TableRow>
                    ))}
                    {data.byCustomer.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No outstanding balances in this period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Outstanding Receivables chart */}
          {data.byCustomer.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Outstanding Receivables by Customer' />
                <CardContent>
                  <CategoryBarChart
                    labels={data.byCustomer.map(c => c.customerName)}
                    values={data.byCustomer.map(c => c.outstanding)}
                    color='var(--mui-palette-warning-main)'
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Oldest unpaid invoices */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Oldest Unpaid Invoices' subheader='By due date, earliest first' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='right'>Owed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.oldestInvoices.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.invoiceNumber}</TableCell>
                        <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip size='small' label={row.status} color={STATUS_COLORS[row.status as InvoiceStatus]} />
                        </TableCell>
                        <TableCell align='right'>{currency(row.outstanding)}</TableCell>
                      </TableRow>
                    ))}
                    {data.oldestInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            Nothing outstanding.
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

export default OutstandingBalanceReport