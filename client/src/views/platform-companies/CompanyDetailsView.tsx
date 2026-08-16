'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'

// Component Imports
import CardStatVertical from '@components/card-statistics/Vertical'

// Feature Imports
import {
  useActivateCompany,
  useDeletePlatformCompany,
  usePlatformCompanyDetails,
  usePlatformCompanyUsers,
  useSuspendCompany,
  useUpdatePlatformCompany
} from '@/features/platformCompanies/usePlatformCompanies'
import type { UpdateCompanyInput } from '@/features/platformCompanies/types'

type Props = {
  companyId: string
}

const subscriptionStatusColor: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'default'
}

const emptyForm: UpdateCompanyInput = { name: '', address: '', phone: '', contactEmail: '', taxNumber: '', currency: '' }

const CompanyDetailsView = ({ companyId }: Props) => {
  const router = useRouter()

  const { data, isLoading, isError } = usePlatformCompanyDetails(companyId)
  const { data: usersData, isLoading: usersLoading } = usePlatformCompanyUsers(companyId, { page: 1, pageSize: 10 })

  const updateCompany = useUpdatePlatformCompany()
  const suspendCompany = useSuspendCompany()
  const activateCompany = useActivateCompany()
  const deleteCompany = useDeletePlatformCompany()

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<UpdateCompanyInput>(emptyForm)
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const openEdit = () => {
    if (!data) return

    setForm({
      name: data.company.name,
      address: data.company.address ?? '',
      phone: data.company.phone ?? '',
      contactEmail: data.company.contactEmail ?? '',
      taxNumber: data.company.taxNumber ?? '',
      currency: data.company.currency
    })
    setEditOpen(true)
  }

  const handleFormChange = (field: keyof UpdateCompanyInput) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault()
    setActionError(null)

    updateCompany.mutate(
      { id: companyId, input: form },
      {
        onSuccess: () => {
          setEditOpen(false)
          setActionSuccess('Company updated.')
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not update company.')
      }
    )
  }

  const handleActivate = () => {
    setActionError(null)

    activateCompany.mutate(companyId, {
      onSuccess: () => setActionSuccess('Company reactivated.'),
      onError: err => setActionError(err.response?.data?.message ?? 'Could not reactivate company.')
    })
  }

  const handleConfirmSuspend = () => {
    setActionError(null)

    suspendCompany.mutate(companyId, {
      onSuccess: () => {
        setConfirmSuspend(false)
        setActionSuccess('Company suspended.')
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not suspend company.')
    })
  }

  const handleConfirmDelete = () => {
    setActionError(null)

    deleteCompany.mutate(companyId, {
      onSuccess: () => router.push('/platform/companies'),
      onError: err => setActionError(err.response?.data?.message ?? 'Could not delete company.')
    })
  }

  if (isLoading) {
    return <Skeleton variant='rectangular' height={500} />
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load this company. Please refresh and try again.</Alert>
  }

  const { company, subscription, stats } = data

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
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
        {company.isDeleted && (
          <Alert severity='warning' className='mbe-4'>
            This company has been deleted.
          </Alert>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent className='flex flex-col items-center text-center gap-3'>
            <Avatar src={company.logoUrl ?? undefined} variant='rounded' sx={{ width: 72, height: 72 }}>
              {company.name[0]}
            </Avatar>
            <Typography variant='h5'>{company.name}</Typography>
            <Chip
              size='small'
              label={company.isActive ? 'Active' : 'Suspended'}
              color={company.isActive ? 'success' : 'error'}
              variant={company.isActive ? 'filled' : 'outlined'}
            />
            <Divider className='is-full' />
            <div className='flex flex-col gap-2 is-full text-start'>
              <Typography variant='body2'>
                <i className='ri-mail-line mie-2' />
                {company.contactEmail ?? '—'}
              </Typography>
              <Typography variant='body2'>
                <i className='ri-phone-line mie-2' />
                {company.phone ?? '—'}
              </Typography>
              <Typography variant='body2'>
                <i className='ri-map-pin-line mie-2' />
                {company.address ?? '—'}
              </Typography>
              <Typography variant='body2'>
                <i className='ri-file-list-3-line mie-2' />
                Tax: {company.taxNumber ?? '—'}
              </Typography>
              <Typography variant='body2'>
                <i className='ri-money-dollar-circle-line mie-2' />
                Currency: {company.currency}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Joined {new Date(company.createdAt).toLocaleDateString()}
              </Typography>
            </div>
            <Divider className='is-full' />
            <div className='flex flex-wrap gap-2 justify-center'>
              <Button size='small' variant='outlined' startIcon={<i className='ri-edit-line' />} onClick={openEdit}>
                Edit
              </Button>
              {company.isActive ? (
                <Button size='small' variant='outlined' color='warning' onClick={() => setConfirmSuspend(true)}>
                  Suspend
                </Button>
              ) : (
                <Button
                  size='small'
                  variant='outlined'
                  color='success'
                  onClick={handleActivate}
                  disabled={activateCompany.isPending}
                >
                  Activate
                </Button>
              )}
              <Button size='small' variant='outlined' color='error' onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='mbs-6'>
          <CardHeader title='Subscription' />
          <CardContent>
            {subscription ? (
              <div className='flex flex-col gap-2'>
                <div className='flex justify-between'>
                  <Typography color='text.secondary'>Plan</Typography>
                  <Typography className='font-medium'>{subscription.planName}</Typography>
                </div>
                <div className='flex justify-between'>
                  <Typography color='text.secondary'>Billing cycle</Typography>
                  <Typography className='font-medium capitalize'>{subscription.billingCycle.toLowerCase()}</Typography>
                </div>
                <div className='flex justify-between items-center'>
                  <Typography color='text.secondary'>Status</Typography>
                  <Chip
                    size='small'
                    label={subscription.status}
                    color={subscriptionStatusColor[subscription.status] ?? 'default'}
                    variant='tonal'
                  />
                </div>
                <div className='flex justify-between'>
                  <Typography color='text.secondary'>Started</Typography>
                  <Typography className='font-medium'>{new Date(subscription.startDate).toLocaleDateString()}</Typography>
                </div>
                <div className='flex justify-between'>
                  <Typography color='text.secondary'>Expires</Typography>
                  <Typography className='font-medium'>{new Date(subscription.endDate).toLocaleDateString()}</Typography>
                </div>
                <div className='flex justify-between'>
                  <Typography color='text.secondary'>Renewal</Typography>
                  <Typography className='font-medium'>{subscription.renewalStatus}</Typography>
                </div>
              </div>
            ) : (
              <Typography color='text.secondary'>No active subscription.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Users'
              stats={String(stats.users)}
              avatarIcon='ri-team-line'
              avatarColor='primary'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Customers'
              stats={String(stats.customers)}
              avatarIcon='ri-user-star-line'
              avatarColor='info'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Suppliers'
              stats={String(stats.suppliers)}
              avatarIcon='ri-truck-line'
              avatarColor='warning'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Products'
              stats={String(stats.products)}
              avatarIcon='ri-box-3-line'
              avatarColor='secondary'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Invoices'
              stats={String(stats.invoices)}
              avatarIcon='ri-file-list-3-line'
              avatarColor='primary'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Expenses'
              stats={String(stats.expenses)}
              avatarIcon='ri-wallet-3-line'
              avatarColor='error'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Income'
              stats={String(stats.incomes)}
              avatarIcon='ri-hand-coin-line'
              avatarColor='success'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <CardStatVertical
              title='Payments'
              stats={String(stats.payments)}
              avatarIcon='ri-bank-card-line'
              avatarColor='info'
              avatarSkin='light'
              chipText='Total'
            />
          </Grid>
        </Grid>

        <Card className='mbs-6'>
          <CardHeader title='Users' subheader={`Everyone who belongs to ${company.name}`} />
          {usersLoading ? (
            <div className='p-6'>
              <Skeleton variant='rectangular' height={200} />
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(usersData?.users ?? []).map(user => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className='capitalize'>{user.role.replace('_', ' ').toLowerCase()}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell>
                        {user.emailVerifiedAt ? (
                          <i className='ri-checkbox-circle-line text-success' />
                        ) : (
                          <i className='ri-close-circle-line text-textDisabled' />
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(usersData?.users.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        <Typography color='text.secondary' className='p-6'>
                          No users in this company yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Grid>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <form onSubmit={handleEditSubmit}>
          <DialogTitle>Edit company</DialogTitle>
          <DialogContent className='flex flex-col gap-4 pbs-4'>
            <TextField fullWidth label='Company name' value={form.name} onChange={handleFormChange('name')} />
            <TextField
              fullWidth
              label='Contact email'
              value={form.contactEmail ?? ''}
              onChange={handleFormChange('contactEmail')}
            />
            <TextField fullWidth label='Phone' value={form.phone ?? ''} onChange={handleFormChange('phone')} />
            <TextField fullWidth label='Address' value={form.address ?? ''} onChange={handleFormChange('address')} />
            <TextField
              fullWidth
              label='Tax number'
              value={form.taxNumber ?? ''}
              onChange={handleFormChange('taxNumber')}
            />
            <TextField
              fullWidth
              label='Currency'
              value={form.currency ?? ''}
              onChange={handleFormChange('currency')}
              helperText='3-letter ISO code, e.g. USD, PKR'
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={updateCompany.isPending}>
              {updateCompany.isPending ? <CircularProgress size={20} color='inherit' /> : 'Save changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={confirmSuspend} onClose={() => setConfirmSuspend(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Suspend company?</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{company.name}&quot; and everyone in it will immediately lose the ability to log in. You can
            reactivate it at any time.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSuspend(false)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleConfirmSuspend} disabled={suspendCompany.isPending}>
            {suspendCompany.isPending ? <CircularProgress size={20} color='inherit' /> : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete company?</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{company.name}&quot; will be deleted and removed from every list. Its data is kept for records but
            is no longer accessible to anyone in the company. This can&apos;t be undone from the UI.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleConfirmDelete} disabled={deleteCompany.isPending}>
            {deleteCompany.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default CompanyDetailsView
