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
import { useTaxReport } from '@/features/reports/useReports'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'

const TaxReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined
  }

  const { data, isLoading, isFetching, isError } = useTaxReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Tax Report'
            subheader='Tax collected across invoices for the selected period'
            action={<ReportExportBar path='/reports/tax' params={params} filenameBase='tax-report' />}
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
          <Alert severity='error'>Couldn&apos;t load the tax report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Taxable Amount</Typography>
                <Typography variant='h6'>{currency(data.summary.totalTaxableAmount)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Tax Collected</Typography>
                <Typography variant='h6'>{currency(data.summary.totalTaxCollected)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Effective Tax Rate</Typography>
                <Typography variant='h6'>{data.summary.effectiveTaxRate.toFixed(2)}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Total Billed</Typography>
                <Typography variant='h6'>{currency(data.summary.totalBilled)}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Invoice Tax Detail' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align='right'>Subtotal</TableCell>
                      <TableCell align='right'>Tax</TableCell>
                      <TableCell align='right'>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.invoiceNumber}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{new Date(row.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell align='right'>{currency(row.subtotal)}</TableCell>
                        <TableCell align='right'>{currency(row.taxAmount)}</TableCell>
                        <TableCell align='right'>{currency(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No taxable invoices in this period.
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

export default TaxReport
