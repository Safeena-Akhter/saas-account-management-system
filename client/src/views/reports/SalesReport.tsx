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
import { useSalesReport } from '@/features/reports/useReports'
import { useCustomers } from '@/features/customers/useCustomers'
import type { InvoiceStatus } from '@/features/invoices/types'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import LineTrendChart from './shared/LineTrendChart'
import CategoryBarChart from './shared/CategoryBarChart'

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'default'
}

const SalesReport = () => {
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

  const { data, isLoading, isFetching, isError } = useSalesReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Sales Report'
            subheader='Invoiced totals for the selected period'
            action={<ReportExportBar path='/reports/sales' params={params} filenameBase='sales-report' />}
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
          <Alert severity='error'>Couldn&apos;t load the sales report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          {/* Summary cards */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Sales</Typography>
                <Typography variant='h4'>{currency(data.summary.totalSales)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Invoices</Typography>
                <Typography variant='h4'>{data.summary.invoiceCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Average Invoice Value</Typography>
                <Typography variant='h4'>{currency(data.summary.averageInvoiceValue)}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Daily sales trend */}
          {data.trend.length > 1 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Revenue Trend' subheader='Invoiced totals by day for the selected period' />
                <CardContent>
                  <LineTrendChart
                    categories={data.trend.map(t => new Date(t.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}
                    series={[{ name: 'Sales', data: data.trend.map(t => t.total) }]}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Top products */}
          {data.topProducts.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Top Products' subheader='By revenue in this period' />
                <CardContent>
                  <CategoryBarChart
                    labels={data.topProducts.map(p => p.productName)}
                    values={data.topProducts.map(p => p.revenue)}
                    seriesName='Revenue'
                  />
                </CardContent>
                <Divider />
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align='right'>Units</TableCell>
                        <TableCell align='right'>Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topProducts.map(product => (
                        <TableRow key={product.productId}>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell align='right'>{product.unitsSold}</TableCell>
                          <TableCell align='right'>{currency(product.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          )}

          {/* Invoice rows */}
          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Invoices' subheader={`${data.rows.length} invoice(s) in this period`} />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.invoiceNumber}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{new Date(row.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip size='small' label={row.status} color={STATUS_COLORS[row.status as InvoiceStatus]} />
                        </TableCell>
                        <TableCell align='right'>{currency(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No sales in this period.
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

export default SalesReport
