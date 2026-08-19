'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Feature Imports
import { useActivatePlatformUser, useDeactivatePlatformUser, usePlatformUsers } from '@/features/platformUsers/usePlatformUsers'
import type { PlatformUserListItem } from '@/features/platformUsers/types'
import { useCompaniesDirectory } from '@/features/company/useCompany'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const ROLE_COLOR: Record<PlatformUserListItem['role'], 'primary' | 'info' | 'success' | 'warning'> = {
  BUSINESS_OWNER: 'primary',
  MANAGER: 'info',
  ACCOUNTANT: 'success',
  EMPLOYEE: 'warning'
}

const ROLE_LABEL: Record<PlatformUserListItem['role'], string> = {
  BUSINESS_OWNER: 'Business Owner',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
  EMPLOYEE: 'Employee'
}

const PlatformUsersTable = () => {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState<PlatformUserListItem['role'] | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all')
  const [page, setPage] = useState(0) // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = usePlatformUsers({
    search,
    companyId: companyFilter === 'all' ? undefined : companyFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
    status: statusFilter,
    page: page + 1,
    pageSize
  })

  const { data: companies } = useCompaniesDirectory()

  const activateUser = useActivatePlatformUser()
  const deactivateUser = useDeactivatePlatformUser()

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; user: PlatformUserListItem } | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<PlatformUserListItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0) // a new search always starts back on page 1
  }

  const handleToggleActive = () => {
    if (!confirmTarget) return

    setActionError(null)

    const user = confirmTarget
    const mutation = user.isActive ? deactivateUser : activateUser

    mutation.mutate(user.id, {
      onSuccess: () => {
        setActionSuccess(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}.`)
        setConfirmTarget(null)
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? `Could not ${user.isActive ? 'deactivate' : 'activate'} user.`)
        setConfirmTarget(null)
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Platform Users' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={360} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load platform users. Please refresh and try again.</Alert>
  }

  const { users, pagination } = data

  return (
    <Card>
      <CardHeader title='Platform Users' subheader='Every user across every company on the platform' />

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

      <Grid container spacing={4} className='p-6 pbs-0'>
        <Grid size={{ xs: 12, sm: 4 }}>
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
        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel id='user-company-filter'>Company</InputLabel>
            <Select
              labelId='user-company-filter'
              label='Company'
              value={companyFilter}
              onChange={e => {
                setCompanyFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value='all'>All companies</MenuItem>
              {(companies ?? []).map(company => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 2.5 }}>
          <FormControl fullWidth size='small'>
            <InputLabel id='user-role-filter'>Role</InputLabel>
            <Select
              labelId='user-role-filter'
              label='Role'
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value as PlatformUserListItem['role'] | 'all')
                setPage(0)
              }}
            >
              <MenuItem value='all'>All roles</MenuItem>
              {(Object.keys(ROLE_LABEL) as PlatformUserListItem['role'][]).map(role => (
                <MenuItem key={role} value={role}>
                  {ROLE_LABEL[role]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 2.5 }}>
          <FormControl fullWidth size='small'>
            <InputLabel id='user-status-filter'>Status</InputLabel>
            <Select
              labelId='user-status-filter'
              label='Status'
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as 'active' | 'inactive' | 'all')
                setPage(0)
              }}
            >
              <MenuItem value='all'>All statuses</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Suspended</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {users.length === 0 ? (
        <div className='text-center p-12'>
          <i className='ri-group-line text-[48px] text-textSecondary mbe-2' />
          <Typography variant='h6'>No users found</Typography>
          <Typography color='text.secondary'>Try a different search or filter.</Typography>
        </div>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.company ? (
                        <div className='flex items-center gap-2'>
                          {user.company.name}
                          {!user.company.isActive && <Chip size='small' label='Suspended' color='error' variant='outlined' />}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size='small' label={ROLE_LABEL[user.role]} color={ROLE_COLOR[user.role]} variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={user.isActive ? 'Active' : 'Suspended'}
                        color={user.isActive ? 'success' : 'error'}
                        variant={user.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align='right'>
                      <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, user })}>
                        <i className='ri-more-2-line' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div'
            count={pagination.total}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={e => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </>
      )}

      {isFetching && !isLoading && (
        <div className='flex justify-center p-2'>
          <CircularProgress size={20} />
        </div>
      )}

      <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            if (menuAnchor) setConfirmTarget(menuAnchor.user)
            setMenuAnchor(null)
          }}
        >
          {menuAnchor?.user.isActive ? 'Suspend user' : 'Activate user'}
        </MenuItem>
      </Menu>

      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)}>
        <DialogTitle>{confirmTarget?.isActive ? 'Suspend user?' : 'Activate user?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmTarget?.isActive
              ? `${confirmTarget?.name} will lose access to their account immediately.`
              : `${confirmTarget?.name} will regain access to their account.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button
            variant='contained'
            color={confirmTarget?.isActive ? 'error' : 'success'}
            onClick={handleToggleActive}
            disabled={activateUser.isPending || deactivateUser.isPending}
          >
            {activateUser.isPending || deactivateUser.isPending ? (
              <CircularProgress size={20} color='inherit' />
            ) : confirmTarget?.isActive ? (
              'Suspend'
            ) : (
              'Activate'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PlatformUsersTable
