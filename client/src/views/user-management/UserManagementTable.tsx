'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

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
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// Feature Imports
import {
  useActivateCompanyUser,
  useCompanyUsers,
  useCreateCompanyUser,
  useDeactivateCompanyUser,
  useDeleteCompanyUser,
  useResendInvitation,
  useUpdateCompanyUser
} from '@/features/users/useUsers'
import {
  INVITABLE_ROLES,
  MANAGEABLE_ROLES,
  canManageRole,
  type AppRole,
  type AssignableRole,
  type CompanyUser
} from '@/features/users/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const ROLE_COLOR: Record<AppRole, 'primary' | 'info' | 'success' | 'warning' | 'default'> = {
  SUPER_ADMIN: 'default',
  BUSINESS_OWNER: 'primary',
  MANAGER: 'info',
  ACCOUNTANT: 'success',
  EMPLOYEE: 'warning'
}

const ROLE_LABEL: Record<AppRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  BUSINESS_OWNER: 'Business Owner',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
  EMPLOYEE: 'Employee'
}

type CreateFormValues = {
  name: string
  email: string
  role: AssignableRole | ''
}

type EditFormValues = {
  name: string
  role: AssignableRole
}

const UserManagementTable = () => {
  const { data: session } = useSession()
  const actorRole = session?.user.role as AppRole | undefined
  const actorId = session?.user.id

  // Only the Business Owner gets write access (create/edit/activate/
  // deactivate/delete/assign role) - Managers reach this page (RoleGuard
  // allows BUSINESS_OWNER and MANAGER) but see a read-only table, matching
  // the RBAC spec: "Manager: View Users" only.
  const assignableRoles = actorRole ? MANAGEABLE_ROLES[actorRole] : []
  const canWrite = assignableRoles.length > 0

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [page, setPage] = useState(0) // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, isError } = useCompanyUsers({
    search,
    page: page + 1,
    pageSize
  })

  const createUser = useCreateCompanyUser()
  const updateUser = useUpdateCompanyUser()
  const activateUser = useActivateCompanyUser()
  const deactivateUser = useDeactivateCompanyUser()
  const deleteUser = useDeleteCompanyUser()
  const resendInvitation = useResendInvitation()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CompanyUser | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; user: CompanyUser } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CompanyUser | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPage(0) // a new search always starts back on page 1
  }

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors }
  } = useForm<CreateFormValues>({
    defaultValues: { name: '', email: '', role: '' }
  })

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors }
  } = useForm<EditFormValues>({ defaultValues: { name: '', role: 'EMPLOYEE' } })

  const closeCreateDialog = () => {
    setCreateOpen(false)
    resetCreateForm()
  }

  const openEditDialog = (user: CompanyUser) => {
    setActionError(null)
    resetEditForm({ name: user.name, role: user.role as AssignableRole })
    setEditTarget(user)
    setMenuAnchor(null)
  }

  const closeEditDialog = () => {
    setEditTarget(null)
    resetEditForm()
  }

  const onCreateSubmit = (values: CreateFormValues) => {
    if (!values.role) return

    setActionError(null)
    createUser.mutate(
      { name: values.name, email: values.email, role: values.role },
      {
        onSuccess: () => {
          closeCreateDialog()
          setActionSuccess(`Invitation sent to ${values.email}.`)
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not create user.')
      }
    )
  }

  const onEditSubmit = (values: EditFormValues) => {
    if (!editTarget) return

    setActionError(null)
    updateUser.mutate(
      { id: editTarget.id, input: { name: values.name, role: values.role } },
      {
        onSuccess: closeEditDialog,
        onError: err => setActionError(err.response?.data?.message ?? 'Could not update user.')
      }
    )
  }

  const handleToggleActive = (user: CompanyUser) => {
    setActionError(null)
    setMenuAnchor(null)

    const mutation = user.isActive ? deactivateUser : activateUser

    mutation.mutate(user.id, {
      onError: err =>
        setActionError(err.response?.data?.message ?? `Could not ${user.isActive ? 'deactivate' : 'activate'} user.`)
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) return

    setActionError(null)
    deleteUser.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not delete user.')
        setConfirmDelete(null)
      }
    })
  }

  const handleResendInvitation = (user: CompanyUser) => {
    setActionError(null)
    setActionSuccess(null)
    setMenuAnchor(null)

    resendInvitation.mutate(user.id, {
      onSuccess: () => setActionSuccess(`Invitation resent to ${user.email}.`),
      onError: err => setActionError(err.response?.data?.message ?? 'Could not resend invitation.')
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Users' />
        <div className='p-6'>
          <Skeleton variant='rectangular' height={280} />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load users. Please refresh and try again.</Alert>
  }

  const { users, pagination } = data

  return (
    <Card>
      <CardHeader
        title='Users'
        subheader='Manage who has access to your company account'
        action={
          canWrite && (
            <Button variant='contained' startIcon={<i className='ri-user-add-line' />} onClick={() => setCreateOpen(true)}>
              Add User
            </Button>
          )
        }
      />

      {actionSuccess && (
        <Alert severity='success' className='mx-6 mbe-4' onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert severity='error' className='mx-6 mbe-4' onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <div className='px-6 pbe-4'>
        <TextField
          size='small'
          fullWidth
          placeholder='Search by name or email'
          value={searchInput}
          onChange={handleSearchChange}
          sx={{ maxInlineSize: 360 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line' />
                </InputAdornment>
              ),
              endAdornment: isFetching ? (
                <InputAdornment position='end'>
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined
            }
          }}
        />
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              {canWrite && <TableCell align='right'>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => {
              const canManage = canWrite && canManageRole(actorRole, user.role) && user.id !== actorId

              return (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip size='small' label={ROLE_LABEL[user.role]} color={ROLE_COLOR[user.role]} />
                  </TableCell>
                  <TableCell>
                    {!user.emailVerifiedAt ? (
                      <Chip size='small' label='Pending' color='warning' variant='outlined' />
                    ) : (
                      <Chip
                        size='small'
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        variant={user.isActive ? 'filled' : 'outlined'}
                      />
                    )}
                  </TableCell>
                  {canWrite && (
                    <TableCell align='right'>
                      {canManage ? (
                        <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, user })}>
                          <i className='ri-more-2-line' />
                        </IconButton>
                      ) : (
                        <Typography variant='caption' color='text.disabled'>
                          —
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} align='center'>
                  <Typography color='text.secondary' className='p-6'>
                    {search ? 'No users match your search.' : 'No users yet.'}
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

      {/* Row action menu: Edit, Resend Invitation (if pending), Activate/Deactivate, Delete */}
      <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {menuAnchor && <MenuItem onClick={() => openEditDialog(menuAnchor.user)}>Edit</MenuItem>}
        {menuAnchor && !menuAnchor.user.emailVerifiedAt && (
          <MenuItem onClick={() => handleResendInvitation(menuAnchor.user)} disabled={resendInvitation.isPending}>
            Resend Invitation
          </MenuItem>
        )}
        {menuAnchor && (
          <MenuItem onClick={() => handleToggleActive(menuAnchor.user)}>
            {menuAnchor.user.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {menuAnchor && (
          <MenuItem
            onClick={() => {
              setConfirmDelete(menuAnchor.user)
              setMenuAnchor(null)
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Create user dialog */}
      <Dialog open={createOpen} onClose={closeCreateDialog} fullWidth maxWidth='xs'>
        <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
          <DialogTitle>Add a user</DialogTitle>
          <DialogContent className='flex flex-col gap-4 pbs-2'>
            <Controller
              name='name'
              control={createControl}
              rules={{ required: 'Name is required', minLength: { value: 2, message: 'Too short' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Name'
                  error={Boolean(createErrors.name)}
                  helperText={createErrors.name?.message}
                />
              )}
            />
            <Controller
              name='email'
              control={createControl}
              rules={{ required: 'Email is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type='email'
                  label='Email'
                  error={Boolean(createErrors.email)}
                  helperText={createErrors.email?.message}
                />
              )}
            />
            <Typography variant='body2' color='text.secondary'>
              We&apos;ll email them an invitation link to set up their own password - you don&apos;t need to set one.
            </Typography>
            <Controller
              name='role'
              control={createControl}
              rules={{ required: 'Role is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={Boolean(createErrors.role)}>
                  <InputLabel id='create-user-role'>Role</InputLabel>
                  <Select {...field} labelId='create-user-role' label='Role'>
                    {INVITABLE_ROLES.map(role => (
                      <MenuItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateDialog}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={createUser.isPending}>
              {createUser.isPending ? <CircularProgress size={20} color='inherit' /> : 'Send Invitation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit user dialog: name + role assignment */}
      <Dialog open={Boolean(editTarget)} onClose={closeEditDialog} fullWidth maxWidth='xs'>
        <form onSubmit={handleEditSubmit(onEditSubmit)}>
          <DialogTitle>Edit {editTarget?.name}</DialogTitle>
          <DialogContent className='flex flex-col gap-4 pbs-2'>
            <Controller
              name='name'
              control={editControl}
              rules={{ required: 'Name is required', minLength: { value: 2, message: 'Too short' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Name'
                  error={Boolean(editErrors.name)}
                  helperText={editErrors.name?.message}
                />
              )}
            />
            <Controller
              name='role'
              control={editControl}
              rules={{ required: 'Role is required' }}
              render={({ field }) => {
                // Normally just INVITABLE_ROLES (Manager/Accountant/
                // Employee - see types.ts). If the user being edited is
                // already a Business Owner (multi-owner companies are
                // supported - see MANAGEABLE_ROLES), their current role is
                // appended so the field has a valid value to display; it's
                // still not a role this dropdown lets you *assign* to
                // someone else; owner-to-owner changes aren't made here.
                const options = INVITABLE_ROLES.includes(editTarget?.role as AssignableRole)
                  ? INVITABLE_ROLES
                  : [...INVITABLE_ROLES, editTarget?.role as AssignableRole]

                return (
                  <FormControl fullWidth error={Boolean(editErrors.role)}>
                    <InputLabel id='edit-user-role'>Role</InputLabel>
                    <Select {...field} labelId='edit-user-role' label='Role'>
                      {options.map(role => (
                        <MenuItem key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={updateUser.isPending}>
              {updateUser.isPending ? <CircularProgress size={20} color='inherit' /> : 'Save changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Remove user?</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDelete?.name} will lose access to this company immediately. This can&apos;t be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete} disabled={deleteUser.isPending}>
            {deleteUser.isPending ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default UserManagementTable
