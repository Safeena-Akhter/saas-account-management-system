'use client'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'

// Third-party Imports
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { forward, object, minLength, string, pipe, regex, check } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { useAcceptInvitation, useInvitation } from '@/features/invitations/useInvitation'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type FormData = InferInput<typeof schema>

const ROLE_LABEL: Record<string, string> = {
  BUSINESS_OWNER: 'Business Owner',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
  EMPLOYEE: 'Employee'
}

// Mirrors the backend's acceptInvitationSchema
// (server/src/validators/invitation.validator.ts).
const schema = pipe(
  object({
    password: pipe(
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
    check(input => input.password === input.confirmPassword, 'Passwords do not match'),
    ['confirmPassword']
  )
)

const Invitation = ({ mode, token }: { mode: Mode; token: string }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-3-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-3-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const { settings } = useSettings()
  const { lang: locale } = useParams()
  const router = useRouter()
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const { data: invitation, isLoading, isError, error: invitationError } = useInvitation(token)
  const acceptInvitation = useAcceptInvitation(token)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  })

  const onSubmit: SubmitHandler<FormData> = data => {
    setErrorMessage(null)

    acceptInvitation.mutate(
      { password: data.password, confirmPassword: data.confirmPassword },
      {
        onSuccess: () => setIsDone(true),
        onError: err => setErrorMessage(err.response?.data?.message ?? 'Something went wrong. Please try again.')
      }
    )
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': settings.skin === 'bordered' }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img
            src={characterIllustration}
            alt='character-illustration'
            className='max-bs-[650px] max-is-full bs-auto'
          />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href={getLocalizedUrl('/', locale as Locale)}
          className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          {children}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <Shell>
        <Skeleton variant='text' width={220} height={40} />
        <Skeleton variant='rectangular' height={56} />
        <Skeleton variant='rectangular' height={56} />
        <Skeleton variant='rectangular' height={40} />
      </Shell>
    )
  }

  if (isError || !invitation) {
    return (
      <Shell>
        <Typography variant='h4'>Invitation link invalid</Typography>
        <Alert severity='error'>
          {invitationError?.response?.data?.message ?? 'This invitation link is invalid or has expired.'}
        </Alert>
        <Typography>
          Ask your Business Owner to resend the invitation, or{' '}
          <Link href={getLocalizedUrl('/login', locale as Locale)} className='text-primary'>
            go to login
          </Link>
          .
        </Typography>
      </Shell>
    )
  }

  if (isDone) {
    return (
      <Shell>
        <i className='ri-shield-check-line text-6xl text-primary' />
        <Typography variant='h4'>You&#39;re all set</Typography>
        <Typography>Your password has been created. You can now log in to {invitation.companyName}.</Typography>
        <Button
          variant='contained'
          component={Link}
          href={getLocalizedUrl('/login', locale as Locale)}
          onClick={() => router.replace(getLocalizedUrl('/login', locale as Locale))}
        >
          Go to login
        </Button>
      </Shell>
    )
  }

  return (
    <Shell>
      <div>
        <Typography variant='h4'>Welcome, {invitation.name} 👋</Typography>
        <Typography className='mbs-1'>
          You&#39;ve been invited to join <b>{invitation.companyName}</b> as a{' '}
          <Chip size='small' label={ROLE_LABEL[invitation.role] ?? invitation.role} color='primary' />
        </Typography>
        <Typography className='mbs-2'>Create a password to activate your account.</Typography>
      </div>

      {errorMessage && (
        <Alert severity='error' onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
        <TextField fullWidth label='Email' value={invitation.email} disabled />
        <Controller
          name='password'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              autoFocus
              fullWidth
              label='Password'
              type={isPasswordShown ? 'text' : 'password'}
              onChange={e => {
                field.onChange(e.target.value)
                errorMessage !== null && setErrorMessage(null)
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={() => setIsPasswordShown(show => !show)}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              {...(errors.password
                ? { error: true, helperText: errors.password.message }
                : { helperText: 'At least 8 characters, upper & lowercase, a number, and a symbol.' })}
            />
          )}
        />
        <Controller
          name='confirmPassword'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label='Confirm Password'
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
                        edge='end'
                        onClick={() => setIsConfirmPasswordShown(show => !show)}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
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
        <Button fullWidth variant='contained' type='submit' disabled={acceptInvitation.isPending}>
          {acceptInvitation.isPending ? <CircularProgress size={24} color='inherit' /> : 'Activate account'}
        </Button>
      </form>
    </Shell>
  )
}

export default Invitation
