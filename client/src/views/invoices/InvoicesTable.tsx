'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import {
  useCreateInvoice,
  useDeleteInvoice,
  useInvoicesDirectory,
  useUpdateInvoice,
  useUpdateInvoiceStatus
} from '@/features/invoices/useInvoices'
import { useCustomers } from '@/features/customers/useCustomers'
import { useProducts } from '@/features/products/useProducts'
import { useRecordPayment } from '@/features/payments/usePayments'
import type { Invoice, InvoiceStatus, ListInvoicesParams } from '@/features/invoices/types'
import type { PaymentMethod } from '@/features/payments/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

type ItemFormValues = { productId: string; description: string; quantity: string; unitPrice: string }

type FormValues = {
  customerId: string
  dueDate: string
  taxAmount: string
  discountAmount: string
  notes: string
  items: ItemFormValues[]
}

const emptyItem: ItemFormValues = { productId: '', description: '', quantity: '1', unitPrice: '' }

const emptyForm: FormValues = {
  customerId: '',
  dueDate: '',
  taxAmount: '0',
  discountAmount: '0',
  notes: '',
  items: [emptyItem]
}

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'default'
}

const STATUS_OPTIONS: InvoiceStatus[] = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']
const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER']

// RBAC per module spec: Business Owner, Manager, and Accountant all get
// full CRUD; Employee is view-only. Matches
// INVOICE_MODULE_WRITE_ROLES/INVOICE_MODULE_DELETE_ROLES in the backend's
// constants/roles.ts (both the same set - no Owner-only "Full Access" vs
// "CRUD" split for this module, unlike Customer/Supplier). Recording a
// payment is deliberately NOT gated by these - that's the Payments
// module's own RBAC (which does include Employee), matching
// payment.routes.ts.
const WRITE_ROLES = ['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']
const DELETE_ROLES = ['BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT']

// A Draft/Sent invoice with no payments recorded yet is freely editable or
// deletable - once money has moved against it (or it's cancelled), it's a
// financial record and the server rejects PATCH/DELETE. Mirrored here so
// the UI can grey out the action instead of letting the user hit a 422.
const isMutable = (invoice: Invoice) => invoice.status !== 'CANCELLED' && Number(invoice.amountPaid) === 0

const itemsToFormValues = (invoice: Invoice): ItemFormValues[] =>
  invoice.items.map(item => ({
    productId: item.productId ?? '',
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: item.unitPrice
  }))

const InvoicesTable = () => {
  const currency = useCurrencyFormatter()
  const { data: session } = useSession()
  const { lang } = useParams()
  const canWrite = Boolean(session?.user.role && WRITE_ROLES.includes(session.user.role))
  const canDelete = Boolean(session?.user.role && DELETE_ROLES.includes(session.user.role))

  const searchParams = useSearchParams()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all')
  const [sortBy, setSortBy] = useState<NonNullable<ListInvoicesParams['sortBy']>>('issueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0) // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = useInvoicesDirectory({
    search,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const { data: customers } = useCustomers()
  const { data: products } = useProducts()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const updateStatus = useUpdateInvoiceStatus()
  const deleteInvoice = useDeleteInvoice()
  const recordPayment = useRecordPayment()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; invoice: Invoice } | null>(null)
  const [payTarget, setPayTarget] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH')
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues: emptyForm })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0) // a new search always starts back on page 1
  }

  const handleSort = (column: NonNullable<ListInvoicesParams['sortBy']>) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }

    setPage(0)
  }

  const openCreate = () => {
    reset(emptyForm)
    setDialogMode('create')
  }

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice)
    reset({
      customerId: invoice.customerId,
      dueDate: invoice.dueDate.slice(0, 10),
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      notes: invoice.notes ?? '',
      items: itemsToFormValues(invoice)
    })
    setDialogMode('edit')
    setMenuAnchor(null)
  }

  // Deep-linked from the Business Owner dashboard's "Create Invoice" quick
  // action (?new=1).
  useEffect(() => {
    if (searchParams.get('new') === '1' && canWrite) {
      openCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canWrite])

  const closeDialog = () => {
    setDialogMode(null)
    setEditing(null)
  }

  const subtotal = (watchedItems ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  const onSubmit = (values: FormValues) => {
    setActionError(null)

    const payload = {
      customerId: values.customerId,
      dueDate: new Date(values.dueDate).toISOString(),
      taxAmount: Number(values.taxAmount) || 0,
      discountAmount: Number(values.discountAmount) || 0,
      notes: values.notes || null,
      items: values.items.map(item => ({
        productId: item.productId || null,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      }))
    }

    if (dialogMode === 'edit' && editing) {
      updateInvoice.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            closeDialog()
            setActionSuccess('Invoice updated.')
          },
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update invoice.')
        }
      )

      return
    }

    createInvoice.mutate(payload, {
      onSuccess: () => {
        closeDialog()
        setActionSuccess('Invoice created.')
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not create invoice.')
    })
  }

  const handleStatusChange = (invoice: Invoice, status: InvoiceStatus) => {
    setActionError(null)
    updateStatus.mutate(
      { id: invoice.id, status },
      { onError: err => setActionError(err.response?.data?.message ?? 'Could not update invoice.') }
    )
    setMenuAnchor(null)
  }

  const openPayDialog = (invoice: Invoice) => {
    const outstanding = Number(invoice.totalAmount) - Number(invoice.amountPaid)

    setPayTarget(invoice)
    setPayAmount(outstanding > 0 ? outstanding.toFixed(2) : '')
    setPayMethod('CASH')
    setMenuAnchor(null)
  }

  const handleRecordPayment = () => {
    if (!payTarget) return

    setActionError(null)
    recordPayment.mutate(
      { invoiceId: payTarget.id, amount: Number(payAmount), method: payMethod },
      {
        onSuccess: () => {
          setPayTarget(null)
          setActionSuccess('Payment recorded.')
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not record payment.')
      }
    )
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)

    const deletedNumber = confirmDelete.invoiceNumber

    deleteInvoice.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess(`Invoice ${deletedNumber} deleted.`)
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete invoice.')
        setConfirmDelete(null)
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Invoices' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load invoices. Please refresh and try again.</Alert>
  }

  const { invoices, pagination } = data
  const isSaving = createInvoice.isPending || updateInvoice.isPending

  return (
    <Card>
      <CardHeader
        title='Invoices'
        subheader='Bills sent to your customers'
        action={
          canWrite && (
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
              Create Invoice
            </Button>
          )
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

      <Grid container spacing={4} className='px-6 pbe-4'>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Search by invoice # or customer'
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
            <InputLabel id='invoice-status-filter'>Status</InputLabel>
            <Select
              labelId='invoice-status-filter'
              label='Status'
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(0)
              }}
            >
              <MenuItem value='all'>All</MenuItem>
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'invoiceNumber' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'invoiceNumber'}
                  direction={sortBy === 'invoiceNumber' ? sortOrder : 'asc'}
                  onClick={() => handleSort('invoiceNumber')}
                >
                  Invoice #
                </TableSortLabel>
              </TableCell>
              <TableCell>Customer</TableCell>
              <TableCell sortDirection={sortBy === 'dueDate' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'dueDate'}
                  direction={sortBy === 'dueDate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('dueDate')}
                >
                  Due Date
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'status' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'status'}
                  direction={sortBy === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align='right' sortDirection={sortBy === 'totalAmount' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'totalAmount'}
                  direction={sortBy === 'totalAmount' ? sortOrder : 'asc'}
                  onClick={() => handleSort('totalAmount')}
                >
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>Balance</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map(invoice => {
              const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid)

              return (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Link
                      href={getLocalizedUrl(`/invoices/${invoice.id}`, lang as Locale)}
                      className='font-medium text-primary hover:underline'
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.customer.name}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip size='small' label={invoice.status.replace('_', ' ')} color={STATUS_COLORS[invoice.status]} variant='tonal' />
                  </TableCell>
                  <TableCell align='right'>{currency(invoice.totalAmount)}</TableCell>
                  <TableCell align='right'>{currency(balance)}</TableCell>
                  <TableCell align='right'>
                    <IconButton
                      size='small'
                      component={Link}
                      href={getLocalizedUrl(`/invoices/${invoice.id}`, lang as Locale)}
                    >
                      <i className='ri-eye-line' />
                    </IconButton>
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, invoice })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search || statusFilter !== 'all' ? 'No invoices match your filters.' : 'No invoices yet.'}
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

      <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {menuAnchor && (
          <MenuItem
            component={Link}
            href={getLocalizedUrl(`/invoices/${menuAnchor.invoice.id}`, lang as Locale)}
            onClick={() => setMenuAnchor(null)}
          >
            View / Print
          </MenuItem>
        )}
        {menuAnchor && menuAnchor.invoice.status !== 'CANCELLED' && menuAnchor.invoice.status !== 'PAID' && (
          <MenuItem onClick={() => openPayDialog(menuAnchor.invoice)}>Record Payment</MenuItem>
        )}
        {menuAnchor && canWrite && isMutable(menuAnchor.invoice) && (
          <MenuItem onClick={() => openEdit(menuAnchor.invoice)}>Edit</MenuItem>
        )}
        {menuAnchor && canWrite && menuAnchor.invoice.status !== 'CANCELLED' && [
          <MenuItem key='sent' onClick={() => handleStatusChange(menuAnchor.invoice, 'SENT')}>
            Mark as Sent
          </MenuItem>,
          <MenuItem key='cancel' sx={{ color: 'error.main' }} onClick={() => handleStatusChange(menuAnchor.invoice, 'CANCELLED')}>
            Cancel Invoice
          </MenuItem>
        ]}
        {menuAnchor && canDelete && isMutable(menuAnchor.invoice) && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.invoice)
              setMenuAnchor(null)
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Create / Edit Invoice dialog */}
      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth='md'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{dialogMode === 'edit' ? `Edit Invoice ${editing?.invoiceNumber ?? ''}` : 'Create Invoice'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={4} className='pbs-2'>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='customerId'
                  control={control}
                  rules={{ required: 'Customer is required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Customer' error={Boolean(errors.customerId)} helperText={errors.customerId?.message}>
                      {customers?.map(customer => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='dueDate'
                  control={control}
                  rules={{ required: 'Due date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='date'
                      label='Due Date'
                      InputLabelProps={{ shrink: true }}
                      error={Boolean(errors.dueDate)}
                      helperText={errors.dueDate?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={12}>
                <Divider textAlign='left'>Line Items</Divider>
              </Grid>

              {fields.map((field, index) => (
                <Grid key={field.id} size={12} container spacing={2} alignItems='center'>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name={`items.${index}.productId`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          select
                          fullWidth
                          size='small'
                          label='Product (optional)'
                          onChange={e => {
                            f.onChange(e)
                            const product = products?.find(p => p.id === e.target.value)

                            if (product) {
                              setValue(`items.${index}.unitPrice`, product.price)
                              setValue(`items.${index}.description`, product.name)
                            }
                          }}
                        >
                          <MenuItem value=''>Custom item</MenuItem>
                          {products?.map(product => (
                            <MenuItem key={product.id} value={product.id}>
                              {product.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name={`items.${index}.description`}
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field: f }) => <TextField {...f} fullWidth size='small' label='Description' />}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      rules={{ required: true, min: 1 }}
                      render={({ field: f }) => (
                        <TextField {...f} fullWidth size='small' type='number' inputProps={{ min: 1 }} label='Qty' />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 5, sm: 2 }}>
                    <Controller
                      name={`items.${index}.unitPrice`}
                      control={control}
                      rules={{ required: true, min: 0 }}
                      render={({ field: f }) => (
                        <TextField {...f} fullWidth size='small' type='number' inputProps={{ step: '0.01', min: 0 }} label='Unit Price' />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1 }}>
                    <IconButton onClick={() => remove(index)} disabled={fields.length === 1}>
                      <i className='ri-delete-bin-6-line' />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}

              <Grid size={12}>
                <Button size='small' startIcon={<i className='ri-add-line' />} onClick={() => append(emptyItem)}>
                  Add line item
                </Button>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='taxAmount'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type='number' inputProps={{ step: '0.01', min: 0 }} label='Tax Amount' />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='discountAmount'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type='number' inputProps={{ step: '0.01', min: 0 }} label='Discount Amount' />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth multiline minRows={2} label='Notes (optional)' />}
                />
              </Grid>
              <Grid size={12}>
                <Typography variant='h6' className='text-end'>
                  Subtotal: {currency(subtotal)}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color='inherit' /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Payment dialog */}
      <Dialog open={Boolean(payTarget)} onClose={() => setPayTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Typography color='text.secondary' className='mbe-4'>
            Invoice {payTarget?.invoiceNumber} - Balance {payTarget && currency(Number(payTarget.totalAmount) - Number(payTarget.amountPaid))}
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
          <Button onClick={() => setPayTarget(null)}>Cancel</Button>
          <Button variant='contained' onClick={handleRecordPayment} disabled={recordPayment.isPending || !payAmount}>
            {recordPayment.isPending ? <CircularProgress size={20} color='inherit' /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Soft-delete confirmation */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete invoice?</DialogTitle>
        <DialogContent>
          <Typography>
            Invoice &quot;{confirmDelete?.invoiceNumber}&quot; will be removed from your invoices list.
          </Typography>
          <Typography variant='body2' color='text.secondary' className='mbs-2'>
            This is a soft delete - the record is kept for your accounting history and can be restored if needed.
            Invoices with recorded payments can&apos;t be deleted - cancel them instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteInvoice.isPending}>
            {deleteInvoice.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default InvoicesTable
