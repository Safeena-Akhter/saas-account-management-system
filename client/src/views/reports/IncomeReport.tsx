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
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useIncomeReport } from '@/features/reports/useReports'
import { useCustomers } from '@/features/customers/useCustomers'
import { useIncomeCategories } from '@/features/incomeCategories/useIncomeCategories'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import CategoryBarChart from './shared/CategoryBarChart'

const IncomeReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })
  const [customerId, setCustomerId] = useState('')
  const [incomeCategoryId, setIncomeCategoryId] = useState('')

  const { data: customers } = useCustomers()
  const { data: categories } = useIncomeCategories()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    customerId: customerId || undefined,
    incomeCategoryId: incomeCategoryId || undefined
  }

  const { data, isLoading, isFetching, isError } = useIncomeReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Income Report'
            subheader='Other income by category, customer, and date for the selected period'
            action={<ReportExportBar path='/reports/incomes' params={params} filenameBase='income-report' />}
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
                      label='Category'
                      value={incomeCategoryId}
                      onChange={e => setIncomeCategoryId(e.target.value)}
                    >
                      <MenuItem value=''>All Categories</MenuItem>
                      {categories?.map(category => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
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
          <Alert severity='error'>Couldn&apos;t load the income report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Income</Typography>
                <Typography variant='h5'>{currency(data.summary.total)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Income Entries</Typography>
                <Typography variant='h5'>{data.summary.count}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {data.byCategory.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Income by Category' />
                <CardContent>
                  <CategoryBarChart
                    labels={data.byCategory.map(c => c.category)}
                    values={data.byCategory.map(c => c.total)}
                    color='var(--mui-palette-success-main)'
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Income Register' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.customerName ?? '—'}</TableCell>
                        <TableCell>{new Date(row.incomeDate).toLocaleDateString()}</TableCell>
                        <TableCell>{row.method.replace('_', ' ')}</TableCell>
                        <TableCell align='right'>{currency(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No income in this period.
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

export default IncomeReport
