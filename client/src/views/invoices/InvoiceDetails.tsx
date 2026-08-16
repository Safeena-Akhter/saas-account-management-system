'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useParams } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import './print.css'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useInvoice } from '@/features/invoices/useInvoices'
import { useMyCompany } from '@/features/company/useCompany'
import { useRecordPayment } from '@/features/payments/usePayments'
import type { InvoiceStatus } from '@/features/invoices/types'
import type { PaymentMethod } from '@/features/payments/types'

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'default'
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER']

const InvoiceDetails = ({ invoiceId }: { invoiceId: string }) => {
  const currency = useCurrencyFormatter()
  const { data: session } = useSession()
  const { lang } = useParams()

  const { data: invoice, isLoading, isError } = useInvoice(invoiceId)
  const { data: company } = useMyCompany()
  const recordPayment = useRecordPayment()

  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH')
  const [payError, setPayError] = useState<string | null>(null)

  const canRecordPayment = Boolean(
    session?.user.role && ['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE'].includes(session.user.role)
  )

  const handlePrint = () => window.print()

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant='rectangular' height={480} />
        </CardContent>
      </Card>
    )
  }

  if (isError || !invoice) {
    return <Alert severity='error'>Couldn&apos;t load this invoice. It may have been deleted.</Alert>
  }

  const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid)

  const openPayDialog = () => {
    setPayAmount(balance > 0 ? balance.toFixed(2) : '')
    setPayMethod('CASH')
    setPayError(null)
    setPayOpen(true)
  }

  const handleRecordPayment = () => {
    setPayError(null)
    recordPayment.mutate(
      { invoiceId: invoice.id, amount: Number(payAmount), method: payMethod },
      {
        onSuccess: () => setPayOpen(false),
        onError: err => setPayError(err.response?.data?.message ?? 'Could not record payment.')
      }
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 9 }}>
        <Card className='invoicePrintCard'>
          <CardContent className='sm:!p-12'>
            <Grid container spacing={6}>
              {/* Header: company info + invoice number/dates */}
              <Grid size={{ xs: 12 }}>
                <div className='p-6 bg-actionHover rounded'>
                  <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                    <div className='flex flex-col gap-3'>
                      {company?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={company.logoUrl} alt={company.name} style={{ maxHeight: 48, maxWidth: 200 }} />
                      ) : (
                        <Typography variant='h5' color='text.primary'>
                          {company?.name ?? 'Your Company'}
                        </Typography>
                      )}
                      <div>
                        {company?.address && <Typography color='text.primary'>{company.address}</Typography>}
                        {company?.phone && <Typography color='text.primary'>{company.phone}</Typography>}
                        {company?.contactEmail && <Typography color='text.primary'>{company.contactEmail}</Typography>}
                        {company?.taxNumber && <Typography color='text.primary'>Tax No: {company.taxNumber}</Typography>}
                      </div>
                    </div>
                    <div className='flex flex-col gap-3 sm:items-end'>
                      <Typography variant='h5'>{`Invoice ${invoice.invoiceNumber}`}</Typography>
                      <Chip
                        size='small'
                        label={invoice.status.replace('_', ' ')}
                        color={STATUS_COLORS[invoice.status]}
                        variant='tonal'
                      />
                      <div className='flex flex-col gap-1 sm:items-end'>
                        <Typography color='text.primary'>{`Date Issued: ${new Date(invoice.issueDate).toLocaleDateString()}`}</Typography>
                        <Typography color='text.primary'>{`Date Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}</Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </Grid>

              {/* Bill To / Payment status */}
              <Grid size={{ xs: 12 }}>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <Typography className='font-medium' color='text.primary'>
                        Invoice To:
                      </Typography>
                      <div>
                        <Typography>{invoice.customer.name}</Typography>
                        {invoice.customer.email && <Typography>{invoice.customer.email}</Typography>}
                      </div>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <Typography className='font-medium' color='text.primary'>
                        Payment Status:
                      </Typography>
                      <div>
                        <div className='flex items-center gap-4'>
                          <Typography className='min-is-[110px]'>Total Due:</Typography>
                          <Typography className='font-medium'>{currency(invoice.totalAmount)}</Typography>
                        </div>
                        <div className='flex items-center gap-4'>
                          <Typography className='min-is-[110px]'>Amount Paid:</Typography>
                          <Typography className='font-medium'>{currency(invoice.amountPaid)}</Typography>
                        </div>
                        <div className='flex items-center gap-4'>
                          <Typography className='min-is-[110px]'>Balance:</Typography>
                          <Typography className='font-medium' color={balance > 0 ? 'error.main' : 'success.main'}>
                            {currency(balance)}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </Grid>

              {/* Line items */}
              <Grid size={{ xs: 12 }}>
                <div className='overflow-x-auto border rounded'>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr className='border-be'>
                        <th className='!bg-transparent'>Description</th>
                        <th className='!bg-transparent'>Qty</th>
                        <th className='!bg-transparent'>Unit Price</th>
                        <th className='!bg-transparent'>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map(item => (
                        <tr key={item.id}>
                          <td>
                            <Typography color='text.primary'>{item.description}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>{item.quantity}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>{currency(item.unitPrice)}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>{currency(item.total)}</Typography>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Grid>

              {/* Totals */}
              <Grid size={{ xs: 12 }}>
                <div className='flex justify-end'>
                  <div className='min-is-[240px]'>
                    <div className='flex items-center justify-between'>
                      <Typography>Subtotal:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {currency(invoice.subtotal)}
                      </Typography>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Typography>Discount:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        -{currency(invoice.discountAmount)}
                      </Typography>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Typography>Tax:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        +{currency(invoice.taxAmount)}
                      </Typography>
                    </div>
                    <Divider className='mlb-2' />
                    <div className='flex items-center justify-between'>
                      <Typography variant='h6'>Total:</Typography>
                      <Typography variant='h6' color='text.primary'>
                        {currency(invoice.totalAmount)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </Grid>

              {invoice.notes && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider className='border-dashed' />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography>
                      <Typography component='span' className='font-medium' color='text.primary'>
                        Note:
                      </Typography>{' '}
                      {invoice.notes}
                    </Typography>
                  </Grid>
                </>
              )}

              {/* Payment timeline */}
              {invoice.payments.length > 0 && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider className='border-dashed' />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography className='font-medium mbe-3' color='text.primary'>
                      Payment History:
                    </Typography>
                    <div className='flex flex-col gap-2'>
                      {invoice.payments.map(payment => (
                        <div key={payment.id} className='flex items-center justify-between'>
                          <Typography color='text.secondary'>
                            {new Date(payment.paymentDate).toLocaleDateString()} - {payment.method.replace('_', ' ')}
                            {payment.reference ? ` (${payment.reference})` : ''}
                          </Typography>
                          <Typography className='font-medium' color='text.primary'>
                            {currency(payment.amount)}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Actions sidebar - hidden when printing */}
      <Grid size={{ xs: 12, md: 3 }} className='invoicePrintHide'>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Button
              fullWidth
              variant='contained'
              startIcon={<i className='ri-printer-line' />}
              onClick={handlePrint}
            >
              Print / Download PDF
            </Button>
            {canRecordPayment && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
              <Button fullWidth variant='outlined' startIcon={<i className='ri-money-dollar-circle-line' />} onClick={openPayDialog}>
                Record Payment
              </Button>
            )}
            <Button
              fullWidth
              variant='outlined'
              component={Link}
              href={getLocalizedUrl('/invoices', lang as Locale)}
              startIcon={<i className='ri-arrow-left-line' />}
            >
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Record Payment dialog */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {payError && (
            <Alert severity='error' className='mbe-4'>
              {payError}
            </Alert>
          )}
          <Typography color='text.secondary' className='mbe-4'>
            Invoice {invoice.invoiceNumber} - Balance {currency(balance)}
          </Typography>
          <Grid container spacing={4}>
            <Grid size={12}>
              <TextField
                fullWidth
                type='number'
                inputProps={{ step: '0.01', min: 0 }}
                label='Amount'
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField select fullWidth label='Method' value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map(method => (
                  <MenuItem key={method} value={method}>
                    {method.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleRecordPayment} disabled={recordPayment.isPending || !payAmount}>
            {recordPayment.isPending ? <CircularProgress size={20} color='inherit' /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default InvoiceDetails
