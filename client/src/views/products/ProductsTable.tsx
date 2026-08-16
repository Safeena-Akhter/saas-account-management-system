'use client'

// React Imports
import { useState } from 'react'

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
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// Feature Imports
import { useCategories } from '@/features/categories/useCategories'
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from '@/features/products/useProducts'
import type { Product } from '@/features/products/types'

type FormValues = {
  name: string
  sku: string
  description: string
  imageUrl: string
  price: string
  costPrice: string
  stockQuantity: string
  categoryId: string
}

const emptyForm: FormValues = {
  name: '',
  sku: '',
  description: '',
  imageUrl: '',
  price: '',
  costPrice: '',
  stockQuantity: '0',
  categoryId: ''
}

const ProductsTable = () => {
  const { data: session } = useSession()
  const canManage = session?.user.role === 'BUSINESS_OWNER' || session?.user.role === 'MANAGER'

  const { data: products, isLoading, isError } = useProducts()

  // Only fetched for Owner/Manager: the returned data only feeds the
  // create/edit dialog's category picker below, which is itself gated by
  // canManage - and GET /categories now requires Owner/Manager/Accountant
  // per the Category Management RBAC spec, so an Employee's request here
  // would just 403 unused.
  const { data: categories } = useCategories({ enabled: canManage })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; product: Product } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues: emptyForm })

  const activeCategories = (categories ?? []).filter(c => c.isActive)

  const openCreate = () => {
    reset(emptyForm)
    setDialogMode('create')
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    reset({
      name: product.name,
      sku: product.sku ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      price: product.price,
      costPrice: product.costPrice ?? '',
      stockQuantity: String(product.stockQuantity),
      categoryId: product.categoryId
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
      sku: values.sku || null,
      description: values.description || null,
      imageUrl: values.imageUrl || null,
      price: Number(values.price),
      costPrice: values.costPrice ? Number(values.costPrice) : null,
      stockQuantity: Number(values.stockQuantity),
      categoryId: values.categoryId
    }

    if (dialogMode === 'edit' && editing) {
      updateProduct.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: closeDialog,
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update product.')
        }
      )

      return
    }

    createProduct.mutate(payload, {
      onSuccess: closeDialog,
      onError: err => setActionError(err.response?.data?.message ?? 'Could not create product.')
    })
  }

  const handleToggleActive = (product: Product) => {
    setActionError(null)
    updateProduct.mutate(
      { id: product.id, input: { isActive: !product.isActive } },
      { onError: err => setActionError(err.response?.data?.message ?? 'Could not update product.') }
    )
    setMenuAnchor(null)
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)
    deleteProduct.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete product.')
        setConfirmDelete(null)
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Products' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={320} />
        </div>
      </Card>
    )
  }

  if (isError || !products) {
    return <Alert severity='error'>Couldn&apos;t load products. Please refresh and try again.</Alert>
  }

  const isSaving = createProduct.isPending || updateProduct.isPending

  return (
    <Card>
      <CardHeader
        title='Products'
        subheader='Manage what you sell'
        action={
          canManage && (
            <Button
              variant='contained'
              startIcon={<i className='ri-add-line' />}
              onClick={openCreate}
              disabled={activeCategories.length === 0}
            >
              Add Product
            </Button>
          )
        }
      />

      {canManage && activeCategories.length === 0 && (
        <Alert severity='info' className='mx-6 mbe-4'>
          Create a category first before adding products.
        </Alert>
      )}

      {actionError && (
        <Alert severity='error' className='mx-6 mbe-4' onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              {canManage && <TableCell align='right'>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id} hover>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar variant='rounded' src={product.imageUrl ?? undefined} alt={product.name}>
                      {product.name.charAt(0)}
                    </Avatar>
                    <Typography>{product.name}</Typography>
                  </div>
                </TableCell>
                <TableCell>{product.sku || '—'}</TableCell>
                <TableCell>{product.category.name}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.stockQuantity}</TableCell>
                <TableCell>
                  <Chip
                    size='small'
                    label={product.isActive ? 'Active' : 'Inactive'}
                    color={product.isActive ? 'success' : 'default'}
                    variant={product.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
                {canManage && (
                  <TableCell align='right'>
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, product })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    No products yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {menuAnchor && <MenuItem onClick={() => openEdit(menuAnchor.product)}>Edit</MenuItem>}
        {menuAnchor && (
          <MenuItem onClick={() => handleToggleActive(menuAnchor.product)}>
            {menuAnchor.product.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {menuAnchor && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.product)
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
          <DialogTitle>{dialogMode === 'edit' ? 'Edit product' : 'Add a product'}</DialogTitle>
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
                  name='sku'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label='SKU (optional)' />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='categoryId'
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.categoryId)}>
                      <InputLabel id='product-category'>Category</InputLabel>
                      <Select {...field} labelId='product-category' label='Category'>
                        {activeCategories.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name='price'
                  control={control}
                  rules={{ required: 'Price is required', min: { value: 0, message: 'Must be 0 or more' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='number'
                      label='Price'
                      inputProps={{ step: '0.01', min: 0 }}
                      error={Boolean(errors.price)}
                      helperText={errors.price?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name='costPrice'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='number'
                      label='Cost price (optional)'
                      inputProps={{ step: '0.01', min: 0 }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name='stockQuantity'
                  control={control}
                  rules={{ required: 'Stock is required', min: { value: 0, message: 'Must be 0 or more' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type='number'
                      label='Stock quantity'
                      inputProps={{ step: '1', min: 0 }}
                      error={Boolean(errors.stockQuantity)}
                      helperText={errors.stockQuantity?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='imageUrl'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label='Image URL (optional)' />}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth multiline minRows={2} label='Description (optional)' />
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
        <DialogTitle>Delete product?</DialogTitle>
        <DialogContent>
          <Typography>&quot;{confirmDelete?.name}&quot; will be permanently removed. This can&apos;t be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteProduct.isPending}>
            {deleteProduct.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ProductsTable
