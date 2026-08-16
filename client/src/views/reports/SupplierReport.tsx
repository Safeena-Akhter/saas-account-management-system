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
import { useSupplierReport } from '@/features/reports/useReports'
import { useSuppliers } from '@/features/suppliers/useSuppliers'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'

const SupplierReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })
  const [supplierId, setSupplierId] = useState('')

  const { data: suppliers } = useSuppliers()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    supplierId: supplierId || undefined
  }

  const { data, isLoading, isFetching, isError } = useSupplierReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Supplier Report'
            subheader='Purchases, payments, and payables by supplier for the selected period'
            action={<ReportExportBar path='/reports/suppliers' params={params} filenameBase='supplier-report' />}
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
          <Alert severity='error'>Couldn&apos;t load the supplier report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Expenses</Typography>
                <Typography variant='h5'>{currency(data.summary.totalExpenses)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Paid This Period</Typography>
                <Typography variant='h5'>{currency(data.summary.totalPaid)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Outstanding Payable</Typography>
                <Typography variant='h5' color='error.main'>
                  {currency(data.summary.totalOutstandingPayable)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Supplier Summary' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Supplier</TableCell>
                      <TableCell align='right'>Expenses</TableCell>
                      <TableCell align='right'>Total Expenses</TableCell>
                      <TableCell align='right'>Paid This Period</TableCell>
                      <TableCell align='right'>Outstanding Payable</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.supplierId}>
                        <TableCell>{row.supplierName}</TableCell>
                        <TableCell align='right'>{row.expenseCount}</TableCell>
                        <TableCell align='right'>{currency(row.totalExpenses)}</TableCell>
                        <TableCell align='right'>{currency(row.totalPaid)}</TableCell>
                        <TableCell align='right'>{currency(row.outstandingPayable)}</TableCell>
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
                            No supplier activity in this period.
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

export default SupplierReport
