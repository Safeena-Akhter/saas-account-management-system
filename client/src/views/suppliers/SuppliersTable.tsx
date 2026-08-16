'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import { useParams } from 'next/navigation'
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

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import apiClient from '@/lib/api/client'
import {
  useActivateSupplier,
  useCreateSupplier,
  useSuppliersDirectory,
  useDeactivateSupplier,
  useDeleteSupplier,
  useUpdateSupplier
} from '@/features/suppliers/useSuppliers'
import type { Supplier, SuppliersPage, ListSuppliersParams } from '@/features/suppliers/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

type FormValues = { name: string; email: string; phone: string; address: string; notes: string; openingBalance: string }

const emptyForm: FormValues = { name: '', email: '', phone: '', address: '', notes: '', openingBalance: '0' }

// RBAC per module spec: Business Owner (full access), Manager (create/
// update/view), Accountant (view only), Employee (no access - RoleGuard on
// the page itself already keeps them out entirely). Mirrors
// views/customers/CustomersTable.tsx's WRITE_ROLES/DELETE_ROLES exactly.
const WRITE_ROLES = ['BUSINESS_OWNER', 'MANAGER']
const DELETE_ROLES = ['BUSINESS_OWNER']

const csvEscape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

const SuppliersTable = () => {
  const currency = useCurrencyFormatter()
  const { data: session } = useSession()
  const { lang } = useParams()
  const canWrite = Boolean(session?.user.role && WRITE_ROLES.includes(session.user.role))
  const canDelete = Boolean(session?.user.role && DELETE_ROLES.includes(session.user.role))

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<ListSuppliersParams['sortBy']>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0) // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = useSuppliersDirectory({
    search,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const activateSupplier = useActivateSupplier()
  const deactivateSupplier = useDeactivateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; supplier: Supplier } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues: emptyForm })

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0) // a new search always starts back on page 1
  }

  const handleSort = (column: NonNullable<ListSuppliersParams['sortBy']>) => {
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

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier)
    reset({
      name: supplier.name,
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
      openingBalance: supplier.openingBalance
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
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      address: values.address || null,
      notes: values.notes || null,
      openingBalance: Number(values.openingBalance) || 0
    }

    if (dialogMode === 'edit' && editing) {
      updateSupplier.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            closeDialog()
            setActionSuccess('Supplier updated.')
          },
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update supplier.')
        }
      )

      return
    }

    createSupplier.mutate(payload, {
      onSuccess: () => {
        closeDialog()
        setActionSuccess('Supplier added.')
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not create supplier.')
    })
  }

  const handleToggleActive = (supplier: Supplier) => {
    setActionError(null)
    setMenuAnchor(null)

    const mutation = supplier.isActive ? deactivateSupplier : activateSupplier

    mutation.mutate(supplier.id, {
      onSuccess: () => setActionSuccess(`${supplier.name} ${supplier.isActive ? 'deactivated' : 'activated'}.`),
      onError: err =>
        setActionError(err.response?.data?.message ?? `Could not ${supplier.isActive ? 'deactivate' : 'activate'} supplier.`)
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)

    const deletedName = confirmDelete.name

    deleteSupplier.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess(`${deletedName} deleted.`)
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete supplier.')
        setConfirmDelete(null)
      }
    })
  }

  // Exports every supplier matching the current search/status filter (not
  // just the current page) - same approach as
  // views/customers/CustomersTable.tsx's handleExportCsv.
  const handleExportCsv = async () => {
    setActionError(null)
    setExporting(true)

    try {
      const { data: exportData } = await apiClient.get<SuppliersPage>('/suppliers', {
        params: {
          search: search || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
          sortBy,
          sortOrder,
          page: 1,
          pageSize: 500
        }
      })

      const rows: Supplier[] = exportData.suppliers
      const header = ['Name', 'Email', 'Phone', 'Address', 'Opening Balance', 'Status', 'Created At']

      const lines = rows.map(s =>
        [
          s.name,
          s.email ?? '',
          s.phone ?? '',
          s.address ?? '',
          s.openingBalance,
          s.isActive ? 'Active' : 'Inactive',
          s.createdAt
        ]
          .map(v => csvEscape(String(v)))
          .join(',')
      )

      const csv = [header.join(','), ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setActionError('Could not export suppliers.')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Suppliers' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load suppliers. Please refresh and try again.</Alert>
  }

  const { suppliers, pagination } = data
  const isSaving = createSupplier.isPending || updateSupplier.isPending

  return (
    <Card>
      <CardHeader
        title='Suppliers'
        subheader='Vendors and businesses you buy from'
        action={
          <div className='flex items-center gap-2'>
            <Button
              variant='outlined'
              startIcon={exporting ? <CircularProgress size={16} /> : <i className='ri-download-2-line' />}
              onClick={handleExportCsv}
              disabled={exporting}
            >
              Export CSV
            </Button>
            {canWrite && (
              <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
                Add Supplier
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

      <Grid container spacing={4} className='px-6 pbe-4'>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Search by name, email, or phone'
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
            <InputLabel id='supplier-status-filter'>Status</InputLabel>
            <Select
              labelId='supplier-status-filter'
              label='Status'
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(0)
              }}
            >
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'name' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'email' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'email'}
                  direction={sortBy === 'email' ? sortOrder : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Phone</TableCell>
              <TableCell sortDirection={sortBy === 'openingBalance' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'openingBalance'}
                  direction={sortBy === 'openingBalance' ? sortOrder : 'asc'}
                  onClick={() => handleSort('openingBalance')}
                >
                  Opening Balance
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map(supplier => (
              <TableRow key={supplier.id} hover>
                <TableCell>
                  <Link
                    href={getLocalizedUrl(`/suppliers/${supplier.id}`, lang as Locale)}
                    className='font-medium text-primary hover:underline'
                  >
                    {supplier.name}
                  </Link>
                </TableCell>
                <TableCell>{supplier.email || '—'}</TableCell>
                <TableCell>{supplier.phone || '—'}</TableCell>
                <TableCell>{currency(supplier.openingBalance)}</TableCell>
                <TableCell>
                  <Chip
                    size='small'
                    label={supplier.isActive ? 'Active' : 'Inactive'}
                    color={supplier.isActive ? 'success' : 'default'}
                    variant={supplier.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align='right'>
                  <IconButton
                    size='small'
                    component={Link}
                    href={getLocalizedUrl(`/suppliers/${supplier.id}`, lang as Locale)}
                  >
                    <i className='ri-eye-line' />
                  </IconButton>
                  {(canWrite || canDelete) && (
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, supplier })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search || statusFilter !== 'all' ? 'No suppliers match your filters.' : 'No suppliers yet.'}
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
            href={getLocalizedUrl(`/suppliers/${menuAnchor.supplier.id}`, lang as Locale)}
            onClick={() => setMenuAnchor(null)}
          >
            View Details
          </MenuItem>
        )}
        {menuAnchor && canWrite && <MenuItem onClick={() => openEdit(menuAnchor.supplier)}>Edit</MenuItem>}
        {menuAnchor && canWrite && (
          <MenuItem onClick={() => handleToggleActive(menuAnchor.supplier)}>
            {menuAnchor.supplier.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {menuAnchor && canDelete && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.supplier)
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
          <DialogTitle>{dialogMode === 'edit' ? 'Edit supplier' : 'Add a supplier'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={4} className='pbs-2'>
              <Grid size={12}>
                <Controller
                  name='name'
                  control={control}
                  rules={{ required: 'Name is required', minLength: { value: 2, message: 'Too short' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      autoFocus
                      fullWidth
                      label='Name'
                      error={Boolean(errors.name)}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='email'
                  control={control}
                  rules={{
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='email'
                      label='Email (optional)'
                      error={Boolean(errors.email)}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='phone'
                  control={control}
                  rules={{ required: 'Phone is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Phone'
                      error={Boolean(errors.phone)}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='openingBalance'
                  control={control}
                  rules={{
                    min: { value: 0, message: 'Must be zero or greater' },
                    validate: value => !Number.isNaN(Number(value)) || 'Must be a number'
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='number'
                      inputProps={{ step: '0.01', min: 0 }}
                      label='Opening Balance'
                      error={Boolean(errors.openingBalance)}
                      helperText={errors.openingBalance?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label='Address (optional)' />}
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
        <DialogTitle>Delete supplier?</DialogTitle>
        <DialogContent>
          <Typography>&quot;{confirmDelete?.name}&quot; will be permanently removed. This can&apos;t be undone.</Typography>
          <Typography variant='body2' color='text.secondary' className='mbs-2'>
            Suppliers with existing expenses can&apos;t be deleted - deactivate them instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteSupplier.isPending}>
            {deleteSupplier.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SuppliersTable
