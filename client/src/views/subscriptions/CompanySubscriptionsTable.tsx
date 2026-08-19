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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'

// Feature Imports
import { useAssignSubscription, useAllSubscriptions, useUpdateSubscriptionStatus } from '@/features/subscriptions/useSubscriptions'
import type { SubscriptionStatus } from '@/features/subscriptions/types'
import { useCompaniesDirectory } from '@/features/company/useCompany'
import { useActivePlans } from '@/features/plans/usePlans'

type FormValues = {
  companyId: string
  planId: string
  billingCycle: 'MONTHLY' | 'YEARLY'
  endDate: string
}

const emptyForm: FormValues = { companyId: '', planId: '', billingCycle: 'MONTHLY', endDate: '' }

const statusColor: Record<SubscriptionStatus, 'success' | 'warning' | 'default' | 'info' | 'error'> = {
  ACTIVE: 'success',
  TRIAL: 'info',
  EXPIRED: 'warning',
  CANCELLED: 'default'
}

const statusFilterOptions: { value: SubscriptionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

const CompanySubscriptionsTable = () => {
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')

  const { data: subscriptions, isLoading, isError } = useAllSubscriptions(
    statusFilter === 'all' ? undefined : statusFilter
  )

  const { data: companies } = useCompaniesDirectory()
  const { data: plans } = useActivePlans()

  const assignSubscription = useAssignSubscription()
  const updateStatus = useUpdateSubscriptionStatus()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues: emptyForm })

  const openAssign = () => {
    reset(emptyForm)
    setDialogOpen(true)
  }

  const onSubmit = (values: FormValues) => {
    setActionError(null)

    assignSubscription.mutate(
      {
        companyId: values.companyId,
        planId: values.planId,
        billingCycle: values.billingCycle,
        endDate: values.endDate
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setActionSuccess('Subscription assigned.')
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not assign subscription.')
      }
    )
  }

  const handleStatusChange = (id: string, status: SubscriptionStatus) => {
    setActionError(null)

    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => setActionSuccess('Subscription status updated.'),
        onError: err => setActionError(err.response?.data?.message ?? 'Could not update status.')
      }
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Company Subscriptions' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !subscriptions) {
    return <Alert severity='error'>Couldn&apos;t load subscriptions. Please refresh and try again.</Alert>
  }

  return (
    <Card>
      <CardHeader
        title='Company Subscriptions'
        subheader='Every company currently on the platform and the plan they are assigned to'
        action={
          <div className='flex items-center gap-4'>
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as SubscriptionStatus | 'all')}
              sx={{ minWidth: 160 }}
            >
              {statusFilterOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openAssign}>
              Assign Plan
            </Button>
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

      {subscriptions.length === 0 ? (
        <div className='text-center p-12'>
          <i className='ri-vip-crown-line text-[48px] text-textSecondary mbe-2' />
          <Typography variant='h6'>{statusFilter === 'all' ? 'No subscriptions yet' : 'No subscriptions match this filter'}</Typography>
          <Typography color='text.secondary'>
            {statusFilter === 'all' ? 'Assign a plan to a company to get started.' : 'Try a different status filter.'}
          </Typography>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Billing Cycle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.company.name}</TableCell>
                  <TableCell>{sub.plan.name}</TableCell>
                  <TableCell className='capitalize'>{sub.billingCycle.toLowerCase()}</TableCell>
                  <TableCell>
                    <Chip size='small' label={sub.status} color={statusColor[sub.status]} variant='tonal' />
                  </TableCell>
                  <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                  <TableCell align='right'>
                    {sub.status === 'ACTIVE' && (
                      <Button size='small' color='error' onClick={() => handleStatusChange(sub.id, 'CANCELLED')}>
                        Cancel
                      </Button>
                    )}
                    {sub.status !== 'ACTIVE' && (
                      <Button size='small' onClick={() => handleStatusChange(sub.id, 'ACTIVE')}>
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='xs' fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Assign Plan</DialogTitle>
          <DialogContent className='flex flex-col gap-4 pbs-4'>
            <Controller
              name='companyId'
              control={control}
              rules={{ required: 'Company is required' }}
              render={({ field }) => (
                <TextField {...field} select fullWidth label='Company' error={!!errors.companyId} helperText={errors.companyId?.message}>
                  {(companies ?? []).map(company => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name='planId'
              control={control}
              rules={{ required: 'Plan is required' }}
              render={({ field }) => (
                <TextField {...field} select fullWidth label='Plan' error={!!errors.planId} helperText={errors.planId?.message}>
                  {(plans ?? []).map(plan => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name='billingCycle'
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label='Billing Cycle'>
                  <MenuItem value='MONTHLY'>Monthly</MenuItem>
                  <MenuItem value='YEARLY'>Yearly</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name='endDate'
              control={control}
              rules={{ required: 'Expiry date is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type='date'
                  label='Expiry Date'
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={assignSubscription.isPending}>
              {assignSubscription.isPending ? <CircularProgress size={20} color='inherit' /> : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  )
}

export default CompanySubscriptionsTable
