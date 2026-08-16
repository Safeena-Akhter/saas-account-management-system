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
import { useProfitLossReport } from '@/features/reports/useReports'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import CategoryBarChart from './shared/CategoryBarChart'

const ProfitLossReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined
  }

  const { data, isLoading, isFetching, isError } = useProfitLossReport(params)

  const isProfit = (data?.netProfit ?? 0) >= 0

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Profit & Loss Report'
            subheader='Revenue collected minus expenses for the selected period'
            action={<ReportExportBar path='/reports/profit-loss' params={params} filenameBase='profit-loss-report' />}
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
          <Alert severity='error'>Couldn&apos;t load the profit &amp; loss report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          {/* Summary cards */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Revenue</Typography>
                <Typography variant='h4' color='success.main'>
                  {currency(data.revenue.total)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Expenses</Typography>
                <Typography variant='h4' color='error.main'>
                  {currency(data.expenses.total)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Net Profit</Typography>
                <Typography variant='h4' color={isProfit ? 'success.main' : 'error.main'}>
                  {currency(data.netProfit)}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {data.profitMargin.toFixed(1)}% margin
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue breakdown */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Revenue Breakdown' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableBody>
                    <TableRow>
                      <TableCell>Payments Received (Customers)</TableCell>
                      <TableCell align='right'>{currency(data.revenue.paymentsReceived)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other Income</TableCell>
                      <TableCell align='right'>{currency(data.revenue.otherIncome)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={600}>Total Revenue</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight={600}>{currency(data.revenue.total)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Expense breakdown */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Expenses by Category' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expenses.byCategory.map(row => (
                      <TableRow key={row.category}>
                        <TableCell>{row.category}</TableCell>
                        <TableCell align='right'>{currency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    {data.expenses.byCategory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No expenses in this period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Expenses by Category chart - only worth rendering once there's
              more than one category, otherwise it's a single flat bar. */}
          {data.expenses.byCategory.length > 1 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Expenses by Category' />
                <CardContent>
                  <CategoryBarChart
                    labels={data.expenses.byCategory.map(c => c.category)}
                    values={data.expenses.byCategory.map(c => c.total)}
                    color='var(--mui-palette-error-main)'
                  />
                </CardContent>
              </Card>
            </Grid>
          )}
        </>
      )}
    </Grid>
  )
}

export default ProfitLossReport
