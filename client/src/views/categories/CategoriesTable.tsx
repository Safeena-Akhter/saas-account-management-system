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

// Feature Imports
import {
  useActivateCategory,
  useCategoriesDirectory,
  useCreateCategory,
  useDeactivateCategory,
  useDeleteCategory,
  useUpdateCategory
} from '@/features/categories/useCategories'
import type { Category, ListCategoriesParams } from '@/features/categories/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

type FormValues = { name: string; description: string }

const emptyForm: FormValues = { name: '', description: '' }

// RBAC per module spec: Business Owner (full access), Manager (CRUD -
// including delete, unlike Customer/Supplier's narrower "Manager can't
// delete" split), Accountant (view only), Employee (no access - RoleGuard
// on the page itself already keeps them out entirely).
const WRITE_ROLES = ['BUSINESS_OWNER', 'MANAGER']

const CategoriesTable = () => {
  const { data: session } = useSession()
  const { lang } = useParams()
  const canWrite = Boolean(session?.user.role && WRITE_ROLES.includes(session.user.role))

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<ListCategoriesParams['sortBy']>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0) // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = useCategoriesDirectory({
    search,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const activateCategory = useActivateCategory()
  const deactivateCategory = useDeactivateCategory()
  const deleteCategory = useDeleteCategory()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; category: Category } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

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

  const handleSort = (column: NonNullable<ListCategoriesParams['sortBy']>) => {
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

  const openEdit = (category: Category) => {
    setEditing(category)
    reset({ name: category.name, description: category.description ?? '' })
    setDialogMode('edit')
    setMenuAnchor(null)
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditing(null)
  }

  const onSubmit = (values: FormValues) => {
    setActionError(null)

    const payload = { name: values.name, description: values.description || null }

    if (dialogMode === 'edit' && editing) {
      updateCategory.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            closeDialog()
            setActionSuccess('Category updated.')
          },
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update category.')
        }
      )

      return
    }

    createCategory.mutate(payload, {
      onSuccess: () => {
        closeDialog()
        setActionSuccess('Category added.')
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not create category.')
    })
  }

  const handleToggleActive = (category: Category) => {
    setActionError(null)
    setMenuAnchor(null)

    const mutation = category.isActive ? deactivateCategory : activateCategory

    mutation.mutate(category.id, {
      onSuccess: () => setActionSuccess(`${category.name} ${category.isActive ? 'deactivated' : 'activated'}.`),
      onError: err =>
        setActionError(err.response?.data?.message ?? `Could not ${category.isActive ? 'deactivate' : 'activate'} category.`)
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)

    const deletedName = confirmDelete.name

    deleteCategory.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess(`${deletedName} deleted.`)
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete category.')
        setConfirmDelete(null)
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Categories' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load categories. Please refresh and try again.</Alert>
  }

  const { categories, pagination } = data
  const isSaving = createCategory.isPending || updateCategory.isPending

  return (
    <Card>
      <CardHeader
        title='Categories'
        subheader='Organize your products into categories'
        action={
          canWrite && (
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
              Add Category
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
            placeholder='Search by name or description'
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
            <InputLabel id='category-status-filter'>Status</InputLabel>
            <Select
              labelId='category-status-filter'
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
              <TableCell>Description</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sortDirection={sortBy === 'createdAt' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'createdAt'}
                  direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map(category => (
              <TableRow key={category.id} hover>
                <TableCell>
                  <Link
                    href={getLocalizedUrl(`/categories/${category.id}`, lang as Locale)}
                    className='font-medium text-primary hover:underline'
                  >
                    {category.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Typography color='text.secondary'>{category.description || '—'}</Typography>
                </TableCell>
                <TableCell>{category._count?.products ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    size='small'
                    label={category.isActive ? 'Active' : 'Inactive'}
                    color={category.isActive ? 'success' : 'default'}
                    variant={category.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align='right'>
                  <IconButton
                    size='small'
                    component={Link}
                    href={getLocalizedUrl(`/categories/${category.id}`, lang as Locale)}
                  >
                    <i className='ri-eye-line' />
                  </IconButton>
                  {canWrite && (
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, category })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search || statusFilter !== 'all' ? 'No categories match your filters.' : 'No categories yet.'}
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
            href={getLocalizedUrl(`/categories/${menuAnchor.category.id}`, lang as Locale)}
            onClick={() => setMenuAnchor(null)}
          >
            View Details
          </MenuItem>
        )}
        {menuAnchor && <MenuItem onClick={() => openEdit(menuAnchor.category)}>Edit</MenuItem>}
        {menuAnchor && (
          <MenuItem onClick={() => handleToggleActive(menuAnchor.category)}>
            {menuAnchor.category.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {menuAnchor && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.category)
              setMenuAnchor(null)
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth='xs'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{dialogMode === 'edit' ? 'Edit category' : 'Add a category'}</DialogTitle>
          <DialogContent className='flex flex-col gap-4 pbs-2'>
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
            <Controller
              name='description'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth multiline minRows={2} label='Description' />}
            />
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
        <DialogTitle>Delete category?</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{confirmDelete?.name}&quot; will be permanently removed. This can&apos;t be undone.
          </Typography>
          <Typography variant='body2' color='text.secondary' className='mbs-2'>
            Categories with products assigned to them can&apos;t be deleted - deactivate them instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteCategory.isPending}>
            {deleteCategory.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default CategoriesTable
