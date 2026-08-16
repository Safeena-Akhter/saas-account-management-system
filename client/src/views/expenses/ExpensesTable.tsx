'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import { useSearchParams } from 'next/navigation'

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
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import {
  useCreateExpense,
  useDeleteExpense,
  useExpensesDirectory,
  useUpdateExpense,
  useUploadExpenseReceipt
} from '@/features/expenses/useExpenses'
import { useSuppliers } from '@/features/suppliers/useSuppliers'
import {
  useActivateExpenseCategory,
  useCreateExpenseCategory,
  useDeactivateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory
} from '@/features/expenseCategories/useExpenseCategories'
import type { Expense, ListExpensesParams } from '@/features/expenses/types'
import type { PaymentMethod } from '@/features/payments/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import CategoryManagerDialog from '@views/shared/CategoryManagerDialog'

type FormValues = {
  title: string
  category: string
  expenseCategoryId: string
  amount: string
  expenseDate: string
  paymentMethod: PaymentMethod
  supplierId: string
  notes: string
}

const emptyForm: FormValues = {
  title: '',
  category: '',
  expenseCategoryId: '',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'CASH',
  supplierId: '',
  notes: ''
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER']

// Matches EXPENSE_MODULE_WRITE_ROLES on the server - the page itself is
// already gated to EXPENSE_MODULE_VIEW_ROLES (Owner/Manager/Accountant) by
// RoleGuard, so Manager reaching this component can view but these actions
// stay hidden for them.
const MANAGE_ROLES = ['BUSINESS_OWNER', 'ACCOUNTANT']

const ExpensesTable = () => {
  const currency = useCurrencyFormatter()
  const { data: session } = useSession()
  const canManage = Boolean(session?.user.role && MANAGE_ROLES.includes(session.user.role))

  const searchParams = useSearchParams()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [sortBy, setSortBy] = useState<NonNullable<ListExpensesParams['sortBy']>>('expenseDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = useExpensesDirectory({
    search,
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const { data: suppliers } = useSuppliers()
  const { data: categories, isLoading: categoriesLoading } = useExpenseCategories({ enabled: canManage })
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const uploadReceipt = useUploadExpenseReceipt()

  const createCategory = useCreateExpenseCategory()
  const updateCategory = useUpdateExpenseCategory()
  const activateCategory = useActivateExpenseCategory()
  const deactivateCategory = useDeactivateExpenseCategory()
  const deleteCategory = useDeleteExpenseCategory()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; expense: Expense } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null)
  const [viewing, setViewing] = useState<Expense | null>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [receiptTargetId, setReceiptTargetId] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues: emptyForm })

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0)
  }

  const handleSort = (column: NonNullable<ListExpensesParams['sortBy']>) => {
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

  // Deep-linked from the Business Owner dashboard's "Add Expense" quick
  // action (?new=1) - opens the create dialog immediately on arrival.
  useEffect(() => {
    if (searchParams.get('new') === '1' && canManage) {
      openCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canManage])

  const openEdit = (expense: Expense) => {
    setEditing(expense)
    reset({
      title: expense.title,
      category: expense.category,
      expenseCategoryId: expense.expenseCategoryId ?? '',
      amount: expense.amount,
      expenseDate: expense.expenseDate.slice(0, 10),
      paymentMethod: expense.paymentMethod,
      supplierId: expense.supplierId ?? '',
      notes: expense.notes ?? ''
    })
    setDialogMode('edit')
    setMenuAnchor(null)
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditing(null)
  }

  const onSubmit = (values: FormValues) => {
    setActionError(null)

    const payload = {
      title: values.title,
      category: values.category,
      expenseCategoryId: values.expenseCategoryId || null,
      amount: Number(values.amount),
      expenseDate: new Date(values.expenseDate).toISOString(),
      paymentMethod: values.paymentMethod,
      supplierId: values.supplierId || null,
      notes: values.notes || null
    }

    if (dialogMode === 'edit' && editing) {
      updateExpense.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            closeDialog()
            setActionSuccess('Expense updated.')
          },
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update expense.')
        }
      )

      return
    }

    createExpense.mutate(payload, {
      onSuccess: () => {
        closeDialog()
        setActionSuccess('Expense recorded.')
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not create expense.')
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)
    deleteExpense.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess('Expense deleted.')
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete expense.')
        setConfirmDelete(null)
      }
    })
  }

  const handleReceiptFileChosen = (expense: Expense, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    e.target.value = '' // lets the same file be re-selected later (e.g. re-upload after a failure)
    if (!file) return

    setActionError(null)
    setReceiptTargetId(expense.id)

    uploadReceipt.mutate(
      { id: expense.id, file },
      {
        onSuccess: () => {
          setReceiptTargetId(null)
          setActionSuccess('Receipt uploaded.')
        },
        onError: err => {
          setReceiptTargetId(null)
          setActionError(err.response?.data?.message ?? 'Could not upload receipt.')
        }
      }
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Expenses' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load expenses. Please refresh and try again.</Alert>
  }

  const { expenses, pagination } = data
  const isSaving = createExpense.isPending || updateExpense.isPending

  return (
    <Card>
      <CardHeader
        title='Expenses'
        subheader='Money spent running the business'
        action={
          canManage && (
            <div className='flex gap-2'>
              <Button variant='outlined' startIcon={<i className='ri-price-tag-3-line' />} onClick={() => setCategoryManagerOpen(true)}>
                Categories
              </Button>
              <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
                Add Expense
              </Button>
            </div>
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

      <div className='px-6 pbe-4'>
        <TextField
          size='small'
          placeholder='Search by title, category, or notes'
          value={searchInput}
          onChange={handleSearchChange}
          className='w-full sm:max-is-[360px]'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' />
              </InputAdornment>
            )
          }}
        />
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'title' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'title'} direction={sortBy === 'title' ? sortOrder : 'asc'} onClick={() => handleSort('title')}>
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Receipt</TableCell>
              <TableCell sortDirection={sortBy === 'expenseDate' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'expenseDate'}
                  direction={sortBy === 'expenseDate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('expenseDate')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell align='right' sortDirection={sortBy === 'amount' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'amount'} direction={sortBy === 'amount' ? sortOrder : 'asc'} onClick={() => handleSort('amount')}>
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map(expense => (
              <TableRow key={expense.id} hover>
                <TableCell>{expense.title}</TableCell>
                <TableCell>
                  <Chip size='small' label={expense.category} variant='tonal' />
                </TableCell>
                <TableCell>{expense.supplier?.name ?? '—'}</TableCell>
                <TableCell>{expense.paymentMethod.replace('_', ' ')}</TableCell>
                <TableCell>
                  {receiptTargetId === expense.id ? (
                    <CircularProgress size={16} />
                  ) : expense.receiptUrl ? (
                    <a href={expense.receiptUrl} target='_blank' rel='noreferrer' className='text-primary'>
                      <i className='ri-file-text-line text-[20px]' />
                    </a>
                  ) : (
                    <Typography color='text.disabled'>—</Typography>
                  )}
                </TableCell>
                <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                <TableCell align='right'>{currency(expense.amount)}</TableCell>
                <TableCell align='right'>
                  <IconButton size='small' onClick={() => setViewing(expense)}>
                    <i className='ri-eye-line' />
                  </IconButton>
                  {canManage && (
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, expense })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search ? 'No expenses match your search.' : 'No expenses recorded yet.'}
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
        {menuAnchor && <MenuItem onClick={() => openEdit(menuAnchor.expense)}>Edit</MenuItem>}
        {menuAnchor && (
          <MenuItem component='label'>
            {menuAnchor.expense.receiptUrl ? 'Replace Receipt' : 'Upload Receipt'}
            <input
              type='file'
              hidden
              accept='image/png,image/jpeg,image/webp,application/pdf'
              onChange={e => {
                const expense = menuAnchor.expense

                setMenuAnchor(null)
                handleReceiptFileChosen(expense, e)
              }}
            />
          </MenuItem>
        )}
        {menuAnchor && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.expense)
              setMenuAnchor(null)
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Create / Edit dialog */}
      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth='sm'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{dialogMode === 'edit' ? 'Edit expense' : 'Add an expense'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={4} className='pbs-2'>
              <Grid size={12}>
                <Controller
                  name='title'
                  control={control}
                  rules={{ required: 'Title is required', minLength: { value: 2, message: 'Too short' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      autoFocus
                      fullWidth
                      label='Title'
                      error={Boolean(errors.title)}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='expenseCategoryId'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label='Category'
                      onChange={e => {
                        field.onChange(e)
                        const picked = categories?.find(c => c.id === e.target.value)

                        if (picked) {
                          // keep the free-text `category` field (still the
                          // source of truth server-side) in sync with the
                          // picked category's name
                          setValue('category', picked.name)
                        }
                      }}
                    >
                      <MenuItem value=''>
                        <em>Custom (type below)</em>
                      </MenuItem>
                      {categories
                        ?.filter(c => c.isActive)
                        .map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='category'
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Category label'
                      placeholder='Rent, Utilities, Payroll...'
                      error={Boolean(errors.category)}
                      helperText={errors.category?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='amount'
                  control={control}
                  rules={{ required: 'Amount is required', min: { value: 0.01, message: 'Must be greater than 0' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='number'
                      inputProps={{ step: '0.01', min: 0 }}
                      label='Amount'
                      error={Boolean(errors.amount)}
                      helperText={errors.amount?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='expenseDate'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth type='date' label='Date' InputLabelProps={{ shrink: true }} />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='paymentMethod'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Payment Method'>
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
                  name='supplierId'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label='Supplier (optional)'>
                      <MenuItem value=''>None</MenuItem>
                      {suppliers?.map(supplier => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth multiline minRows={2} label='Notes (optional)' />
                  )}
                />
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

      {/* Expense Details (read-only view) */}
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent>
          {viewing && (
            <div className='flex flex-col gap-3'>
              <div>
                <Typography variant='caption' color='text.secondary'>
                  Title
                </Typography>
                <Typography>{viewing.title}</Typography>
              </div>
              <div className='flex gap-6'>
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Category
                  </Typography>
                  <Typography>{viewing.category}</Typography>
                </div>
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Amount
                  </Typography>
                  <Typography>{currency(viewing.amount)}</Typography>
                </div>
              </div>
              <div className='flex gap-6'>
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Date
                  </Typography>
                  <Typography>{new Date(viewing.expenseDate).toLocaleDateString()}</Typography>
                </div>
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Method
                  </Typography>
                  <Typography>{viewing.paymentMethod.replace('_', ' ')}</Typography>
                </div>
              </div>
              {viewing.supplier && (
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Supplier
                  </Typography>
                  <Typography>{viewing.supplier.name}</Typography>
                </div>
              )}
              {viewing.notes && (
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Notes
                  </Typography>
                  <Typography>{viewing.notes}</Typography>
                </div>
              )}
              <Divider />
              {viewing.receiptUrl ? (
                <Button
                  variant='outlined'
                  startIcon={<i className='ri-file-text-line' />}
                  href={viewing.receiptUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  View Receipt
                </Button>
              ) : (
                <Typography color='text.secondary'>No receipt uploaded.</Typography>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewing(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete expense?</DialogTitle>
        <DialogContent>
          <Typography>&quot;{confirmDelete?.title}&quot; will be permanently removed. This can&apos;t be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteExpense.isPending}>
            {deleteExpense.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        title='Expense Categories'
        usageLabel='expenses'
        canWrite={canManage}
        isLoading={categoriesLoading}
        categories={(categories ?? []).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isActive: c.isActive,
          usageCount: c._count?.expenses
        }))}
        onCreate={input => createCategory.mutateAsync(input)}
        onUpdate={(id, input) => updateCategory.mutateAsync({ id, input })}
        onToggleActive={(id, isActive) =>
          isActive ? activateCategory.mutateAsync(id) : deactivateCategory.mutateAsync(id)
        }
        onDelete={id => deleteCategory.mutateAsync(id)}
      />
    </Card>
  )
}

export default ExpensesTable
