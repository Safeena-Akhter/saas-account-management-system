'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ChangeEvent, SyntheticEvent } from 'react'

// Next Imports
import { useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

import CustomTabList from '@core/components/mui/TabList'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import {
  usePaymentsDirectory,
  useRecordPayment,
  useRecordSupplierPayment,
  useUpdatePaymentStatus
} from '@/features/payments/usePayments'
import { useInvoices } from '@/features/invoices/useInvoices'
import { useCustomers } from '@/features/customers/useCustomers'
import { useSuppliers } from '@/features/suppliers/useSuppliers'
import type { ListPaymentsParams, Payment, PaymentMethod, PaymentStatus } from '@/features/payments/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

type ReceiveFormValues = {
  invoiceId: string
  customerId: string
  amount: string
  method: PaymentMethod
  status: 'PENDING' | 'COMPLETED'
  reference: string
  notes: string
}

type SupplierFormValues = {
  supplierId: string
  amount: string
  method: PaymentMethod
  status: 'PENDING' | 'COMPLETED'
  reference: string
  notes: string
}

const emptyReceiveForm: ReceiveFormValues = {
  invoiceId: '',
  customerId: '',
  amount: '',
  method: 'CASH',
  status: 'COMPLETED',
  reference: '',
  notes: ''
}

const emptySupplierForm: SupplierFormValues = {
  supplierId: '',
  amount: '',
  method: 'CASH',
  status: 'COMPLETED',
  reference: '',
  notes: ''
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER']

const STATUS_COLORS: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default'
}

// Receive Customer Payment - unchanged grant (front-desk staff too).
const RECEIVE_ROLES = ['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE']

// Supplier Payment - matches PAYMENT_MODULE_SUPPLIER_PAY_ROLES on the
// server, narrower than receiving a customer payment.
const SUPPLIER_PAY_ROLES = ['BUSINESS_OWNER', 'ACCOUNTANT']

type PaymentTab = 'RECEIVED' | 'PAID'

const PaymentsTable = () => {
  const currency = useCurrencyFormatter()
  const { data: session } = useSession()
  const canReceive = Boolean(session?.user.role && RECEIVE_ROLES.includes(session.user.role))
  const canPaySupplier = Boolean(session?.user.role && SUPPLIER_PAY_ROLES.includes(session.user.role))

  const searchParams = useSearchParams()

  const [tab, setTab] = useState<PaymentTab>('RECEIVED')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [sortBy, setSortBy] = useState<NonNullable<ListPaymentsParams['sortBy']>>('paymentDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = usePaymentsDirectory({
    type: tab,
    search,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const { data: invoices } = useInvoices()
  const { data: customers } = useCustomers()
  const { data: suppliers } = useSuppliers()
  const recordPayment = useRecordPayment()
  const recordSupplierPayment = useRecordSupplierPayment()
  const updateStatus = useUpdatePaymentStatus()

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [supplierPayOpen, setSupplierPayOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const receiveForm = useForm<ReceiveFormValues>({ defaultValues: emptyReceiveForm })
  const supplierForm = useForm<SupplierFormValues>({ defaultValues: emptySupplierForm })
  const selectedInvoiceId = receiveForm.watch('invoiceId')

  const handleTabChange = (_: SyntheticEvent, value: PaymentTab) => {
    setTab(value)
    setPage(0)
    setStatusFilter('all')
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0)
  }

  const handleSort = (column: NonNullable<ListPaymentsParams['sortBy']>) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }

    setPage(0)
  }

  const openReceive = () => {
    receiveForm.reset(emptyReceiveForm)
    setReceiveOpen(true)
  }

  const openSupplierPay = () => {
    supplierForm.reset(emptySupplierForm)
    setSupplierPayOpen(true)
  }

  // Deep-linked from the Business Owner dashboard's "Receive Payment" quick
  // action (?new=1).
  useEffect(() => {
    if (searchParams.get('new') === '1' && canReceive) {
      openReceive()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canReceive])

  const onSubmitReceive = (values: ReceiveFormValues) => {
    setActionError(null)

    recordPayment.mutate(
      {
        invoiceId: values.invoiceId || null,
        customerId: values.customerId || null,
        amount: Number(values.amount),
        method: values.method,
        status: values.status,
        reference: values.reference || null,
        notes: values.notes || null
      },
      {
        onSuccess: () => {
          setReceiveOpen(false)
          setActionSuccess('Payment recorded.')
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not record payment.')
      }
    )
  }

  const onSubmitSupplierPay = (values: SupplierFormValues) => {
    setActionError(null)

    recordSupplierPayment.mutate(
      {
        supplierId: values.supplierId,
        amount: Number(values.amount),
        method: values.method,
        status: values.status,
        reference: values.reference || null,
        notes: values.notes || null
      },
      {
        onSuccess: () => {
          setSupplierPayOpen(false)
          setActionSuccess('Supplier payment recorded.')
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not record supplier payment.')
      }
    )
  }

  const handleStatusChange = (payment: Payment, status: PaymentStatus) => {
    setActionError(null)
    updateStatus.mutate({ id: payment.id, status }, { onError: err => setActionError(err.response?.data?.message ?? 'Could not update payment.') })
  }

  const openInvoices = (invoices ?? []).filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Payments' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load payments. Please refresh and try again.</Alert>
  }

  const { payments, pagination } = data

  return (
    <Card>
      <CardHeader
        title='Payments'
        subheader='Money received from customers and paid to suppliers'
        action={
          <div className='flex gap-2'>
            {canPaySupplier && (
              <Button variant='outlined' startIcon={<i className='ri-truck-line' />} onClick={openSupplierPay}>
                Pay Supplier
              </Button>
            )}
            {canReceive && (
              <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openReceive}>
                Receive Payment
              </Button>
            )}
          </div>
        }
      />

      {actionError && (
        <Alert severity='error' className='mx-6 mbe-4' onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert severity='success' className='mx-6 mbe-4' onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      <TabContext value={tab}>
        <CustomTabList onChange={handleTabChange} className='px-6'>
          <Tab label='Received from Customers' value='RECEIVED' />
          <Tab label='Paid to Suppliers' value='PAID' />
        </CustomTabList>

        <Grid container spacing={4} className='px-6 pbs-4 pbe-4'>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size='small'
              placeholder={tab === 'RECEIVED' ? 'Search by customer or invoice #' : 'Search by supplier'}
              value={searchInput}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='payment-status-filter'>Status</InputLabel>
              <Select
                labelId='payment-status-filter'
                label='Status'
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value as typeof statusFilter)
                  setPage(0)
                }}
              >
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='COMPLETED'>Completed</MenuItem>
                <MenuItem value='FAILED'>Failed</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TabPanel value={tab} className='p-0'>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortBy === 'paymentDate' ? sortOrder : false}>
                    <TableSortLabel
                      active={sortBy === 'paymentDate'}
                      direction={sortBy === 'paymentDate' ? sortOrder : 'asc'}
                      onClick={() => handleSort('paymentDate')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{tab === 'RECEIVED' ? 'Customer' : 'Supplier'}</TableCell>
                  {tab === 'RECEIVED' && <TableCell>Invoice</TableCell>}
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right' sortDirection={sortBy === 'amount' ? sortOrder : false}>
                    <TableSortLabel active={sortBy === 'amount'} direction={sortBy === 'amount' ? sortOrder : 'asc'} onClick={() => handleSort('amount')}>
                      Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{tab === 'RECEIVED' ? payment.customer?.name ?? '—' : payment.supplier?.name ?? '—'}</TableCell>
                    {tab === 'RECEIVED' && (
                      <TableCell>
                        {payment.invoice ? <Chip size='small' label={payment.invoice.invoiceNumber} variant='tonal' /> : '—'}
                      </TableCell>
                    )}
                    <TableCell>{payment.method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {(canReceive && tab === 'RECEIVED') || (canPaySupplier && tab === 'PAID') ? (
                        <TextField
                          select
                          size='small'
                          value={payment.status}
                          onChange={e => handleStatusChange(payment, e.target.value as PaymentStatus)}
                          disabled={updateStatus.isPending}
                          className='min-is-[140px]'
                        >
                          <MenuItem value='PENDING'>Pending</MenuItem>
                          <MenuItem value='COMPLETED'>Completed</MenuItem>
                          <MenuItem value='FAILED'>Failed</MenuItem>
                          <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                        </TextField>
                      ) : (
                        <Chip size='small' label={payment.status} color={STATUS_COLORS[payment.status]} variant='tonal' />
                      )}
                    </TableCell>
                    <TableCell align='right'>{currency(payment.amount)}</TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary' noWrap className='max-is-[160px]'>
                        {payment.notes ?? payment.reference ?? ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tab === 'RECEIVED' ? 7 : 6} align='center'>
                      <Typography color='text.secondary' className='p-6'>
                        {search || statusFilter !== 'all'
                          ? 'No payments match your filters.'
                          : tab === 'RECEIVED'
                            ? 'No payments received yet.'
                            : 'No supplier payments recorded yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div'
            count={pagination.total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={e => {
              setPageSize(parseInt(e.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
          {isFetching && !isLoading && (
            <div className='flex justify-center pbe-2'>
              <CircularProgress size={18} />
            </div>
          )}
        </TabPanel>
      </TabContext>

      {/* Receive Customer Payment dialog */}
      <Dialog open={receiveOpen} onClose={() => setReceiveOpen(false)} fullWidth maxWidth='sm'>
        <form onSubmit={receiveForm.handleSubmit(onSubmitReceive)}>
          <DialogTitle>Receive Payment</DialogTitle>
          <DialogContent>
            <Grid container spacing={4} className='pbs-2'>
              <Grid size={12}>
                <Controller
                  name='invoiceId'
                  control={receiveForm.control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Invoice (optional)'>
                      <MenuItem value=''>Not tied to an invoice</MenuItem>
                      {openInvoices.map(inv => (
                        <MenuItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.customer.name} ({currency((Number(inv.totalAmount) - Number(inv.amountPaid)).toFixed(2))})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              {!selectedInvoiceId && (
                <Grid size={12}>
                  <Controller
                    name='customerId'
                    control={receiveForm.control}
                    render={({ field }) => (
                      <TextField {...field} select fullWidth label='Customer (optional)'>
                        <MenuItem value=''>None</MenuItem>
                        {customers?.map(customer => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='amount'
                  control={receiveForm.control}
                  rules={{ required: true, min: 0.01 }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type='number' inputProps={{ step: '0.01', min: 0 }} label='Amount' />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='method'
                  control={receiveForm.control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Method'>
                      {PAYMENT_METHODS.map(method => (
                        <MenuItem key={method} value={method}>
                          {method.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='status'
                  control={receiveForm.control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Status'>
                      <MenuItem value='COMPLETED'>Completed - money already received</MenuItem>
                      <MenuItem value='PENDING'>Pending - not yet cleared</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='reference'
                  control={receiveForm.control}
                  render={({ field }) => <TextField {...field} fullWidth label='Reference (optional)' />}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='notes'
                  control={receiveForm.control}
                  render={({ field }) => <TextField {...field} fullWidth multiline minRows={2} label='Notes (optional)' />}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReceiveOpen(false)}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={recordPayment.isPending}>
              {recordPayment.isPending ? <CircularProgress size={20} color='inherit' /> : 'Record Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Supplier Payment dialog */}
      <Dialog open={supplierPayOpen} onClose={() => setSupplierPayOpen(false)} fullWidth maxWidth='sm'>
        <form onSubmit={supplierForm.handleSubmit(onSubmitSupplierPay)}>
          <DialogTitle>Pay Supplier</DialogTitle>
          <DialogContent>
            <Grid container spacing={4} className='pbs-2'>
              <Grid size={12}>
                <Controller
                  name='supplierId'
                  control={supplierForm.control}
                  rules={{ required: 'Supplier is required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Supplier'>
                      {suppliers?.map(supplier => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='amount'
                  control={supplierForm.control}
                  rules={{ required: true, min: 0.01 }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type='number' inputProps={{ step: '0.01', min: 0 }} label='Amount' />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='method'
                  control={supplierForm.control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Method'>
                      {PAYMENT_METHODS.map(method => (
                        <MenuItem key={method} value={method}>
                          {method.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='status'
                  control={supplierForm.control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Status'>
                      <MenuItem value='COMPLETED'>Completed - money already paid</MenuItem>
                      <MenuItem value='PENDING'>Pending - not yet cleared</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='reference'
                  control={supplierForm.control}
                  render={({ field }) => <TextField {...field} fullWidth label='Reference (optional)' />}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='notes'
                  control={supplierForm.control}
                  render={({ field }) => <TextField {...field} fullWidth multiline minRows={2} label='Notes (optional)' />}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSupplierPayOpen(false)}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={recordSupplierPayment.isPending}>
              {recordSupplierPayment.isPending ? <CircularProgress size={20} color='inherit' /> : 'Pay Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  )
}

export default PaymentsTable
