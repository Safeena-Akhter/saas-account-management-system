'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { forward, object, minLength, string, pipe, regex, check } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import type { AxiosError } from 'axios'

// Hook Imports
import { useChangePassword } from '@/features/auth/useAuth'

type FormData = InferInput<typeof schema>

// Mirrors the backend's changePasswordSchema (server/src/validators/auth.validator.ts):
// same password-strength rule as register/reset, plus "new must differ from
// current" and a confirm-password match, both checked client-side too so the
// user doesn't have to round-trip to the API to find out.
const schema = pipe(
  object({
    currentPassword: pipe(string(), minLength(1, 'Current password is required')),
    newPassword: pipe(
      string(),
      minLength(8, 'Password must be at least 8 characters'),
      regex(/[a-z]/, 'Password must contain a lowercase letter'),
      regex(/[A-Z]/, 'Password must contain an uppercase letter'),
      regex(/[0-9]/, 'Password must contain a number'),
      regex(/[^A-Za-z0-9]/, 'Password must contain a special character')
    ),
    confirmPassword: string()
  }),
  forward(
    check(input => input.newPassword === input.confirmPassword, 'Passwords do not match'),
    ['confirmPassword']
  ),
  forward(
    check(input => input.currentPassword !== input.newPassword, 'New password must be different from your current password'),
    ['newPassword']
  )
)

const ChangePasswordCard = () => {
  // States
  const [isCurrentPasswordShown, setIsCurrentPasswordShown] = useState(false)
  const [isNewPasswordShown, setIsNewPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const changePassword = useChangePassword()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  })

  const onSubmit: SubmitHandler<FormData> = data => {
    setSuccessMessage(null)
    setErrorMessage(null)

    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setSuccessMessage('Password changed successfully.')
          reset()
        },
        onError: err => {
          const axiosError = err as AxiosError<{ message?: string }>

          setErrorMessage(axiosError.response?.data?.message ?? 'Something went wrong. Please try again.')
        }
      }
    )
  }

  return (
    <Card>
      <CardHeader title='Change Password' className='pbe-6' />
      <CardContent>
        {successMessage && (
          <Alert severity='success' className='mbe-6' onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity='error' className='mbe-6' onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='currentPassword'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Current Password'
                    type={isCurrentPasswordShown ? 'text' : 'password'}
                    onChange={e => {
                      field.onChange(e.target.value)
                      errorMessage !== null && setErrorMessage(null)
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              edge='end'
                              onClick={() => setIsCurrentPasswordShown(show => !show)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isCurrentPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    {...(errors.currentPassword && { error: true, helperText: errors.currentPassword.message })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container className='mbs-5' spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='newPassword'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='New Password'
                    type={isNewPasswordShown ? 'text' : 'password'}
                    onChange={e => {
                      field.onChange(e.target.value)
                      errorMessage !== null && setErrorMessage(null)
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              edge='end'
                              onClick={() => setIsNewPasswordShown(show => !show)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isNewPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    {...(errors.newPassword && { error: true, helperText: errors.newPassword.message })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='confirmPassword'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Confirm New Password'
                    type={isConfirmPasswordShown ? 'text' : 'password'}
                    onChange={e => {
                      field.onChange(e.target.value)
                      errorMessage !== null && setErrorMessage(null)
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              edge='end'
                              onClick={() => setIsConfirmPasswordShown(show => !show)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isConfirmPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    {...(errors.confirmPassword && { error: true, helperText: errors.confirmPassword.message })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className='flex flex-col gap-4 pbs-6'>
              <Typography variant='h6' color='text.secondary'>
                Password Requirements:
              </Typography>
              <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-2.5'>
                  <i className='ri-checkbox-blank-circle-fill text-[8px]' />
                  Minimum 8 characters long - the more, the better
                </div>
                <div className='flex items-center gap-2.5'>
                  <i className='ri-checkbox-blank-circle-fill text-[8px]' />
                  At least one lowercase &amp; one uppercase character
                </div>
                <div className='flex items-center gap-2.5'>
                  <i className='ri-checkbox-blank-circle-fill text-[8px]' />
                  At least one number and one symbol
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4 pbs-6'>
              <Button variant='contained' type='submit' disabled={changePassword.isPending}>
                {changePassword.isPending ? <CircularProgress size={24} color='inherit' /> : 'Save Changes'}
              </Button>
              <Button variant='outlined' type='button' color='secondary' onClick={() => reset()}>
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePasswordCard
