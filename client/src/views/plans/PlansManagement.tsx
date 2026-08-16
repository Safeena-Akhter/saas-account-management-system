'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CardActions from '@mui/material/CardActions'
import MuiCard from '@mui/material/Card'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'

// Feature Imports
import {
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useSetPlanActive,
  useUpdatePlan
} from '@/features/plans/usePlans'
import type { Plan } from '@/features/plans/types'
import { formatCurrency } from '@/utils/currency'

// Feature Limits fields, in the order the spec lists them - shown as plain
// number inputs on the create/edit form, empty = unlimited (null).
const LIMIT_FIELDS: { key: keyof FormValues; label: string }[] = [
  { key: 'maxUsers', label: 'Max Users' },
  { key: 'maxCustomers', label: 'Max Customers' },
  { key: 'maxSuppliers', label: 'Max Suppliers' },
  { key: 'maxProducts', label: 'Max Products' },
  { key: 'maxCategories', label: 'Max Categories' },
  { key: 'maxInvoices', label: 'Max Invoices' },
  { key: 'maxMonthlyReports', label: 'Max Monthly Reports' },
  { key: 'storageLimitMb', label: 'Cloud Storage (MB)' },
  { key: 'uploadLimitMb', label: 'File Upload Limit (MB)' },
  { key: 'apiRequestLimit', label: 'API Request Limit' }
]

type FormValues = {
  name: string
  description: string
  monthlyPrice: string
  yearlyPrice: string
  features: string
  maxUsers: string
  maxCustomers: string
  maxSuppliers: string
  maxProducts: string
  maxCategories: string
  maxInvoices: string
  maxMonthlyReports: string
  storageLimitMb: string
  uploadLimitMb: string
  apiRequestLimit: string
}

const emptyForm: FormValues = {
  name: '',
  description: '',
  monthlyPrice: '',
  yearlyPrice: '',
  features: '',
  maxUsers: '',
  maxCustomers: '',
  maxSuppliers: '',
  maxProducts: '',
  maxCategories: '',
  maxInvoices: '',
  maxMonthlyReports: '',
  storageLimitMb: '',
  uploadLimitMb: '',
  apiRequestLimit: ''
}

function planToForm(plan: Plan): FormValues {
  const numberField = (v: number | null) => (v === null || v === undefined ? '' : String(v))

  return {
    name: plan.name,
    description: plan.description ?? '',
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    features: (plan.features ?? []).join('\n'),
    maxUsers: numberField(plan.maxUsers),
    maxCustomers: numberField(plan.maxCustomers),
    maxSuppliers: numberField(plan.maxSuppliers),
    maxProducts: numberField(plan.maxProducts),
    maxCategories: numberField(plan.maxCategories),
    maxInvoices: numberField(plan.maxInvoices),
    maxMonthlyReports: numberField(plan.maxMonthlyReports),
    storageLimitMb: numberField(plan.storageLimitMb),
    uploadLimitMb: numberField(plan.uploadLimitMb),
    apiRequestLimit: numberField(plan.apiRequestLimit)
  }
}

// Blank string -> null (unlimited); anything else -> a non-negative int.
// Matches createPlanSchema/updatePlanSchema's limitsShape on the server
// (nullable, not coerced from a numeric string) - the conversion has to
// happen here, before the request goes out, not on the server.
function toLimitPayload(value: string): number | null {
  const trimmed = value.trim()

  if (trimmed === '') return null

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null
}

const PlansManagement = () => {
  const { data: plans, isLoading, isError } = usePlans()

  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const setPlanActive = useSetPlanActive()
  const deletePlan = useDeletePlan()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues: emptyForm })

  const openCreate = () => {
    reset(emptyForm)
    setDialogMode('create')
  }

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    reset(planToForm(plan))
    setDialogMode('edit')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditing(null)
  }

  const onSubmit = (values: FormValues) => {
    setActionError(null)

    const payload = {
      name: values.name,
      description: values.description || null,
      monthlyPrice: Number(values.monthlyPrice) || 0,
      yearlyPrice: Number(values.yearlyPrice) || 0,
      features: values.features
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean),
      maxUsers: toLimitPayload(values.maxUsers),
      maxCustomers: toLimitPayload(values.maxCustomers),
      maxSuppliers: toLimitPayload(values.maxSuppliers),
      maxProducts: toLimitPayload(values.maxProducts),
      maxCategories: toLimitPayload(values.maxCategories),
      maxInvoices: toLimitPayload(values.maxInvoices),
      maxMonthlyReports: toLimitPayload(values.maxMonthlyReports),
      storageLimitMb: toLimitPayload(values.storageLimitMb),
      uploadLimitMb: toLimitPayload(values.uploadLimitMb),
      apiRequestLimit: toLimitPayload(values.apiRequestLimit)
    }

    if (dialogMode === 'edit' && editing) {
      updatePlan.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            closeDialog()
            setActionSuccess(`${values.name} updated.`)
          },
          onError: err => setActionError(err.response?.data?.message ?? 'Could not update plan.')
        }
      )

      return
    }

    createPlan.mutate(payload, {
      onSuccess: () => {
        closeDialog()
        setActionSuccess(`${values.name} created.`)
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not create plan.')
    })
  }

  const handleToggleActive = (plan: Plan) => {
    setActionError(null)

    setPlanActive.mutate(
      { id: plan.id, isActive: !plan.isActive },
      {
        onSuccess: () => setActionSuccess(`${plan.name} ${plan.isActive ? 'deactivated' : 'activated'}.`),
        onError: err =>
          setActionError(err.response?.data?.message ?? `Could not ${plan.isActive ? 'deactivate' : 'activate'} plan.`)
      }
    )
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)

    const deletedName = confirmDelete.name

    deletePlan.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess(`${deletedName} deleted.`)
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete plan - it may have active subscriptions.')
        setConfirmDelete(null)
      }
    })
  }

  if (isLoading) {
    return (
      <Grid container spacing={4}>
        {[1, 2, 3, 4].map(i => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Skeleton variant='rectangular' height={340} className='rounded' />
          </Grid>
        ))}
      </Grid>
    )
  }

  if (isError || !plans) {
    return <Alert severity='error'>Couldn&apos;t load plans. Please refresh and try again.</Alert>
  }

  const isSaving = createPlan.isPending || updatePlan.isPending

  return (
    <>
      {actionError && (
        <Alert severity='error' className='mbe-4' onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert severity='success' className='mbe-4' onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      <div className='flex justify-between items-center mbe-4'>
        <Typography variant='h5'>Subscription Plans</Typography>
        <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
          Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <MuiCard>
          <CardContent className='text-center p-12'>
            <i className='ri-stack-line text-[48px] text-textSecondary mbe-2' />
            <Typography variant='h6'>No plans yet</Typography>
            <Typography color='text.secondary' className='mbe-4'>
              Create your first subscription plan to start onboarding companies.
            </Typography>
            <Button variant='contained' onClick={openCreate}>
              Add Plan
            </Button>
          </CardContent>
        </MuiCard>
      ) : (
        <Grid container spacing={4}>
          {plans.map(plan => (
            <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <MuiCard className='h-full flex flex-col'>
                <CardHeader
                  title={plan.name}
                  action={
                    <Chip
                      size='small'
                      label={plan.isActive ? 'Active' : 'Inactive'}
                      color={plan.isActive ? 'success' : 'default'}
                      variant='tonal'
                    />
                  }
                />
                <CardContent className='flex-1'>
                  <Typography variant='h4'>
                    {formatCurrency(plan.monthlyPrice, 'USD', 'symbol')}
                    <Typography component='span' color='text.secondary' variant='body2'>
                      {' '}
                      /mo
                    </Typography>
                  </Typography>
                  <Typography color='text.secondary' className='mbe-3'>
                    {formatCurrency(plan.yearlyPrice, 'USD', 'symbol')} billed yearly
                  </Typography>

                  {plan.description && (
                    <Typography variant='body2' color='text.secondary' className='mbe-3'>
                      {plan.description}
                    </Typography>
                  )}

                  <Divider className='mbe-3' />

                  <div className='flex flex-col gap-1'>
                    {(plan.features ?? []).slice(0, 4).map((feature, idx) => (
                      <div key={idx} className='flex items-center gap-2'>
                        <i className='ri-checkbox-circle-line text-success' />
                        <Typography variant='body2'>{feature}</Typography>
                      </div>
                    ))}
                  </div>

                  <Divider className='mbs-3 mbe-3' />

                  <Typography variant='caption' color='text.secondary' className='block mbe-1'>
                    Max Users: {plan.maxUsers ?? 'Unlimited'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' className='block mbe-1'>
                    Max Customers: {plan.maxCustomers ?? 'Unlimited'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' className='block'>
                    Max Invoices: {plan.maxInvoices ?? 'Unlimited'}
                  </Typography>
                </CardContent>
                <CardActions className='justify-between'>
                  <Button size='small' onClick={() => openEdit(plan)}>
                    Edit
                  </Button>
                  <div>
                    <Tooltip title={plan.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton size='small' onClick={() => handleToggleActive(plan)} disabled={setPlanActive.isPending}>
                        <i className={plan.isActive ? 'ri-toggle-fill text-success' : 'ri-toggle-line'} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete'>
                      <IconButton size='small' color='error' onClick={() => setConfirmDelete(plan)}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                    </Tooltip>
                  </div>
                </CardActions>
              </MuiCard>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogMode !== null} onClose={closeDialog} maxWidth='sm' fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{dialogMode === 'edit' ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          <DialogContent className='flex flex-col gap-4 pbs-4'>
            <Controller
              name='name'
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Plan Name' error={!!errors.name} helperText={errors.name?.message} />
              )}
            />
            <Controller
              name='description'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth multiline minRows={2} label='Description' />}
            />
            <div className='flex gap-4'>
              <Controller
                name='monthlyPrice'
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type='number'
                    label='Monthly Price'
                    error={!!errors.monthlyPrice}
                    helperText={errors.monthlyPrice?.message}
                  />
                )}
              />
              <Controller
                name='yearlyPrice'
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type='number'
                    label='Yearly Price'
                    error={!!errors.yearlyPrice}
                    helperText={errors.yearlyPrice?.message}
                  />
                )}
              />
            </div>
            <Controller
              name='features'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  label='Features (one per line)'
                  placeholder={'Priority support\nCustom branding'}
                />
              )}
            />

            <Divider />
            <Typography variant='subtitle2'>Feature Limits (leave blank for unlimited)</Typography>
            <Grid container spacing={3}>
              {LIMIT_FIELDS.map(({ key, label }) => (
                <Grid key={key} size={{ xs: 6 }}>
                  <Controller
                    name={key}
                    control={control}
                    render={({ field }) => <TextField {...field} fullWidth size='small' type='number' label={label} />}
                  />
                </Grid>
              ))}
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
        <DialogTitle>Delete plan?</DialogTitle>
        <DialogContent>
          <Typography>&quot;{confirmDelete?.name}&quot; will be permanently removed. This can&apos;t be undone.</Typography>
          <Typography variant='body2' color='text.secondary' className='mbs-2'>
            Plans with companies currently subscribed to them can&apos;t be deleted - deactivate instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deletePlan.isPending}>
            {deletePlan.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PlansManagement
