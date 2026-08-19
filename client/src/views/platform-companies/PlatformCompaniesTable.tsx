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
import Avatar from '@mui/material/Avatar'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Hook Imports
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

// Feature Imports
import {
  useActivateCompany,
  useDeletePlatformCompany,
  usePlatformCompanies,
  useSuspendCompany
} from '@/features/platformCompanies/usePlatformCompanies'
import type { CompanyListItem, ListCompaniesParams } from '@/features/platformCompanies/types'
import { useActivePlans } from '@/features/plans/usePlans'

const subscriptionStatusColor: Record<string, 'success' | 'warning' | 'default' | 'info'> = {
  ACTIVE: 'success',
  TRIAL: 'info',
  EXPIRED: 'warning',
  CANCELLED: 'default'
}

const PlatformCompaniesTable = () => {
  const { lang } = useParams()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortBy, setSortBy] = useState<NonNullable<ListCompaniesParams['sortBy']>>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0) // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = usePlatformCompanies({
    search,
    status: statusFilter,
    planId: planFilter === 'all' ? undefined : planFilter,
    sortBy,
    sortOrder,
    page: page + 1,
    pageSize
  })

  const { data: plans } = useActivePlans()

  const suspendCompany = useSuspendCompany()
  const activateCompany = useActivateCompany()
  const deleteCompany = useDeletePlatformCompany()

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; company: CompanyListItem } | null>(null)
  const [confirmSuspend, setConfirmSuspend] = useState<CompanyListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CompanyListItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0)
  }

  const handleSort = (column: NonNullable<ListCompaniesParams['sortBy']>) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }

    setPage(0)
  }

  const handleActivate = (company: CompanyListItem) => {
    setMenuAnchor(null)
    setActionError(null)

    activateCompany.mutate(company.id, {
      onSuccess: () => setActionSuccess(`${company.name} reactivated.`),
      onError: err => setActionError(err.response?.data?.message ?? 'Could not reactivate company.')
    })
  }

  const handleConfirmSuspend = () => {
    if (!confirmSuspend) return

    setActionError(null)

    const name = confirmSuspend.name

    suspendCompany.mutate(confirmSuspend.id, {
      onSuccess: () => {
        setConfirmSuspend(null)
        setActionSuccess(`${name} suspended.`)
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not suspend company.')
    })
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete) return

    setActionError(null)

    const name = confirmDelete.name

    deleteCompany.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null)
        setActionSuccess(`${name} deleted.`)
      },
      onError: err => setActionError(err.response?.data?.message ?? 'Could not delete company.')
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Companies' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={400} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load companies. Please refresh and try again.</Alert>
  }

  const { companies, pagination } = data

  return (
    <Card>
      <CardHeader title='Companies' subheader='Every company on the platform' />

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
            placeholder='Search by name or email'
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
            <InputLabel id='company-status-filter'>Status</InputLabel>
            <Select
              labelId='company-status-filter'
              label='Status'
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(0)
              }}
            >
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='suspended'>Suspended</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel id='company-plan-filter'>Plan</InputLabel>
            <Select
              labelId='company-plan-filter'
              label='Plan'
              value={planFilter}
              onChange={e => {
                setPlanFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value='all'>All plans</MenuItem>
              {(plans ?? []).map(plan => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name}
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
              <TableCell sortDirection={sortBy === 'name' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>
                  Company
                </TableSortLabel>
              </TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Subscription</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell sortDirection={sortBy === 'users' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'users'} direction={sortBy === 'users' ? sortOrder : 'asc'} onClick={() => handleSort('users')}>
                  Users
                </TableSortLabel>
              </TableCell>
              <TableCell>Customers</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Invoices</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sortDirection={sortBy === 'createdAt' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'createdAt'}
                  direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Joined
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map(company => {
              const subscription = company.subscriptions[0] ?? null

              return (
                <TableRow key={company.id} hover>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar src={company.logoUrl ?? undefined} variant='rounded' sx={{ width: 34, height: 34 }}>
                        {company.name[0]}
                      </Avatar>
                      <div>
                        <Link
                          href={getLocalizedUrl(`/platform/companies/${company.id}`, lang as Locale)}
                          className='font-medium text-primary hover:underline'
                        >
                          {company.name}
                        </Link>
                        {company.contactEmail && (
                          <Typography variant='caption' color='text.secondary' className='block'>
                            {company.contactEmail}
                          </Typography>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{subscription?.plan.name ?? '—'}</TableCell>
                  <TableCell>
                    {subscription ? (
                      <Chip
                        size='small'
                        label={subscription.status}
                        color={subscriptionStatusColor[subscription.status] ?? 'default'}
                        variant='tonal'
                      />
                    ) : (
                      <Chip size='small' label='None' variant='outlined' />
                    )}
                  </TableCell>
                  <TableCell>
                    {company.owner ? (
                      <div>
                        <Typography variant='body2' className='font-medium'>
                          {company.owner.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' className='block'>
                          {company.owner.email}
                        </Typography>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{company._count.users}</TableCell>
                  <TableCell>{company._count.customers}</TableCell>
                  <TableCell>{company._count.products}</TableCell>
                  <TableCell>{company._count.invoices}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={company.isActive ? 'Active' : 'Suspended'}
                      color={company.isActive ? 'success' : 'error'}
                      variant={company.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' component={Link} href={getLocalizedUrl(`/platform/companies/${company.id}`, lang as Locale)}>
                      <i className='ri-eye-line' />
                    </IconButton>
                    <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, company })}>
                      <i className='ri-more-2-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search || statusFilter !== 'all' || planFilter !== 'all'
                      ? 'No companies match your filters.'
                      : 'No companies yet.'}
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
        <MenuItem
          component={Link}
          href={menuAnchor ? getLocalizedUrl(`/platform/companies/${menuAnchor.company.id}`, lang as Locale) : '#'}
          onClick={() => setMenuAnchor(null)}
        >
          View details
        </MenuItem>
        {menuAnchor?.company.isActive ? (
          <MenuItem
            onClick={() => {
              setConfirmSuspend(menuAnchor.company)
              setMenuAnchor(null)
            }}
          >
            Suspend
          </MenuItem>
        ) : (
          menuAnchor && <MenuItem onClick={() => handleActivate(menuAnchor.company)}>Activate</MenuItem>
        )}
        <MenuItem
          className='text-error'
          onClick={() => {
            if (menuAnchor) setConfirmDelete(menuAnchor.company)
            setMenuAnchor(null)
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={Boolean(confirmSuspend)} onClose={() => setConfirmSuspend(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Suspend company?</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{confirmSuspend?.name}&quot; and everyone in it will immediately lose the ability to log in. You can
            reactivate it at any time.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSuspend(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleConfirmSuspend} disabled={suspendCompany.isPending}>
            {suspendCompany.isPending ? <CircularProgress size={20} color='inherit' /> : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete company?</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{confirmDelete?.name}&quot; will be deleted and removed from every list. Its data is kept for
            records but is no longer accessible to anyone in the company. This can&apos;t be undone from the UI.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleConfirmDelete} disabled={deleteCompany.isPending}>
            {deleteCompany.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PlatformCompaniesTable
