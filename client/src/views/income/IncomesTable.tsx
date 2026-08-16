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

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useCreateIncome, useDeleteIncome, useIncomesDirectory, useUpdateIncome } from '@/features/income/useIncomes'
import { useCustomers } from '@/features/customers/useCustomers'
import {
  useActivateIncomeCategory,
  useCreateIncomeCategory,
  useDeactivateIncomeCategory,
  useDeleteIncomeCategory,
  useIncomeCategories,
  useUpdateIncomeCategory
} from '@/features/incomeCategories/useIncomeCategories'
import type { Income, ListIncomesParams } from '@/features/income/types'
import type { PaymentMethod } from '@/features/payments/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import CategoryManagerDialog from '@views/shared/CategoryManagerDialog'

type FormValues = {
  title: string
  category: string
  incomeCategoryId: string
  amount: string
  incomeDate: string
  method: PaymentMethod
  customerId: string
  notes: string
}

const emptyForm: FormValues = {
  title: '',
  category: '',
  incomeCategoryId: '',
  amount: '',
  incomeDate: new Date().toISOString().slice(0, 10),
  method: 'CASH',
  customerId: '',
  notes: ''
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER']

// Matches INCOME_MODULE_WRITE_ROLES on the server - the page is already
// gated to INCOME_MODULE_VIEW_ROLES (Owner/Manager/Accountant) by
// RoleGuard; Manager reaching this component can view but not write.
const MANAGE_ROLES = ['BUSINESS_OWNER', 'ACCOUNTANT']

const IncomesTable = () => {
  const currency = useCurrencyFormatter()
  const { data: session } = useSession()
  const canManage = Boolean(session?.user.role && MANAGE_ROLES.includes(session.user.role))

  const searchParams = useSearchParams()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [sortBy, setSortBy] = useState<NonNullable<ListIncomesParams['sortBy']>>('incomeDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = useIncomesDirectory({
    search,
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const { data: customers } = useCustomers()
  const { data: categories, isLoading: categoriesLoading } = useIncomeCategories({ enabled: canManage })
  const createIncome = useCreateIncome()
  const updateIncome = useUpdateIncome()
  const deleteIncome = useDeleteIncome()

  const createCategory = useCreateIncomeCategory()
  const updateCategory = useUpdateIncomeCategory()
  const activateCategory = useActivateIncomeCategory()
  const deactivateCategory = useDeactivateIncomeCategory()
  const deleteCategory = useDeleteIncomeCategory()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Income | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; income: Income } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Income | null>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

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

  const handleSort = (column: NonNullable<ListIncomesParams['sortBy']>) => {
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

  // Deep-linked from the Business Owner dashboard's "Add Income" quick
  // action (?new=1), same pattern as Expenses/Invoices.
  useEffect(() => {
    if (searchParams.get('new') === '1' && canManage) {
      openCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canManage])

  const openEdit = (income: Income) => {
    setEditing(income)
    reset({
      title: income.title,
      category: income.category,
      incomeCategoryId: income.incomeCategoryId ?? '',
      amount: income.amount,
      incomeDate: income.incomeDate.slice(0, 10),
      method: income.method,
      customerId: income.customerId ?? '',
      notes: income.notes ?? ''
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
      incomeCategoryId: values.incomeCategoryId || null,
      amount: Number(values.amount),
      incomeDate: new Date(values.incomeDate).toISOString(),
      method: values.method,
      customerId: values.customerId || null,
      notes: values.notes || null
    }

    if (dialogMode === 'edit' && editing) {
      updateIncome.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            closeDialog()
            setActionSuccess('Income updated.')
          },
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update income.')
        }
      )

      return
    }

    createIncome.mutate(payload, {
      onSuccess: () => {
        closeDialog()
        setActionSuccess('Income recorded.')
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not record income.')
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)
    deleteIncome.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess('Income deleted.')
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete income.')
        setConfirmDelete(null)
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Income' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load income records. Please refresh and try again.</Alert>
  }

  const { incomes, pagination } = data
  const isSaving = createIncome.isPending || updateIncome.isPending

  return (
    <Card>
      <CardHeader
        title='Income'
        subheader='Other revenue not raised through invoices'
        action={
          canManage && (
            <div className='flex gap-2'>
              <Button variant='outlined' startIcon={<i className='ri-price-tag-3-line' />} onClick={() => setCategoryManagerOpen(true)}>
                Categories
              </Button>
              <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
                Add Income
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
              <TableCell>Customer</TableCell>
              <TableCell>Method</TableCell>
              <TableCell sortDirection={sortBy === 'incomeDate' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'incomeDate'}
                  direction={sortBy === 'incomeDate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('incomeDate')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell align='right' sortDirection={sortBy === 'amount' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'amount'} direction={sortBy === 'amount' ? sortOrder : 'asc'} onClick={() => handleSort('amount')}>
                  Amount
                </TableSortLabel>
              </TableCell>
              {canManage && <TableCell align='right'>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {incomes.map(income => (
              <TableRow key={income.id} hover>
                <TableCell>{income.title}</TableCell>
                <TableCell>
                  <Chip size='small' label={income.category} variant='tonal' color='success' />
                </TableCell>
                <TableCell>{income.customer?.name ?? '—'}</TableCell>
                <TableCell>{income.method.replace('_', ' ')}</TableCell>
                <TableCell>{new Date(income.incomeDate).toLocaleDateString()}</TableCell>
                <TableCell align='right'>{currency(income.amount)}</TableCell>
                {canManage && (
                  <TableCell align='right'>
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, income })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {incomes.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search ? 'No income records match your search.' : 'No income recorded yet.'}
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
        {menuAnchor && <MenuItem onClick={() => openEdit(menuAnchor.income)}>Edit</MenuItem>}
        {menuAnchor && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.income)
              setMenuAnchor(null)
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth='sm'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{dialogMode === 'edit' ? 'Edit income' : 'Record income'}</DialogTitle>
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
                  name='incomeCategoryId'
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
                      placeholder='Interest, Refund, Other...'
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
                  name='incomeDate'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth type='date' label='Date' InputLabelProps={{ shrink: true }} />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='method'
                  control={control}
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
                  name='customerId'
                  control={control}
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

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete income record?</DialogTitle>
        <DialogContent>
          <Typography>&quot;{confirmDelete?.title}&quot; will be permanently removed. This can&apos;t be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteIncome.isPending}>
            {deleteIncome.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        title='Income Categories'
        usageLabel='income records'
        canWrite={canManage}
        isLoading={categoriesLoading}
        categories={(categories ?? []).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isActive: c.isActive,
          usageCount: c._count?.incomes
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

export default IncomesTable
