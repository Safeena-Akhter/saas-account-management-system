'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useMonthlySummaryReport } from '@/features/reports/useReports'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import LineTrendChart from './shared/LineTrendChart'

// Defaults to This Year (not This Month, unlike every other report) - a
// one-month window would defeat the point of a monthly trend. Matches
// report.service.ts's getMonthlySummaryReport default.
const MonthlySummaryReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_YEAR', from: '', to: '' })

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined
  }

  const { data, isLoading, isFetching, isError } = useMonthlySummaryReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Monthly Summary Report'
            subheader='One-page monthly business overview: revenue, expenses, and profit'
            action={
              <ReportExportBar path='/reports/monthly-summary' params={params} filenameBase='monthly-summary-report' />
            }
          />
          <CardContent>
            <DateRangeFilter value={range} onChange={setRange} />
          </CardContent>
        </Card>
      </Grid>

      {isLoading ? (
        <Grid size={12}>
          <Skeleton variant='rectangular' height={280} />
        </Grid>
      ) : isError || !data ? (
        <Grid size={12}>
          <Alert severity='error'>Couldn&apos;t load the monthly summary. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Revenue</Typography>
                <Typography variant='h6'>{currency(data.totals.revenue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Expenses</Typography>
                <Typography variant='h6'>{currency(data.totals.expenses)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Net Profit</Typography>
                <Typography variant='h6' color={data.totals.profit >= 0 ? 'success.main' : 'error.main'}>
                  {currency(data.totals.profit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Invoices Issued</Typography>
                <Typography variant='h6'>{data.totals.invoiceCount}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {data.months.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Revenue vs Expenses vs Profit' />
                <CardContent>
                  <LineTrendChart
                    categories={data.months.map(m => m.label)}
                    series={[
                      { name: 'Revenue', data: data.months.map(m => m.revenue) },
                      { name: 'Expenses', data: data.months.map(m => m.expenses) },
                      { name: 'Profit', data: data.months.map(m => m.profit) }
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Monthly Breakdown' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align='right'>Revenue</TableCell>
                      <TableCell align='right'>Expenses</TableCell>
                      <TableCell align='right'>Profit</TableCell>
                      <TableCell align='right'>Invoiced Sales</TableCell>
                      <TableCell align='right'>Invoices</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.months.map(month => (
                      <TableRow key={month.month}>
                        <TableCell>{month.label}</TableCell>
                        <TableCell align='right'>{currency(month.revenue)}</TableCell>
                        <TableCell align='right'>{currency(month.expenses)}</TableCell>
                        <TableCell align='right' style={{ color: month.profit >= 0 ? undefined : 'var(--mui-palette-error-main)' }}>
                          {currency(month.profit)}
                        </TableCell>
                        <TableCell align='right'>{currency(month.sales)}</TableCell>
                        <TableCell align='right'>{month.invoiceCount}</TableCell>
                      </TableRow>
                    ))}
                    {data.months.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No activity in this period.
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

export default MonthlySummaryReport
