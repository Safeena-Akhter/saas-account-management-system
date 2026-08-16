'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { forward, object, minLength, string, pipe, regex, check } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import classnames from 'classnames'
import type { AxiosError } from 'axios'

// Type Imports
import type { Mode } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Lib Imports
import apiClient from '@/lib/api/client'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type FormData = InferInput<typeof schema>

// Mirrors the backend's resetPasswordSchema / shared passwordSchema
// (server/src/validators/auth.validator.ts) - same rules as Register.tsx's
// password field, plus a confirm-password match check.
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

const ResetPassword = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-3-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-3-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-reset-password-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-reset-password-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-reset-password-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-reset-password-light-border.png'

  // Hooks
  const { settings } = useSettings()
  const { lang: locale } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  })

  const onSubmit: SubmitHandler<FormData> = async data => {
    if (!token) {
      setErrorMessage('This reset link is missing its token. Please request a new one.')

      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await apiClient.post('/auth/reset-password', { token, password: data.password })

      // Backend also revokes every existing session on a successful reset
      // (see auth.service.ts's resetPassword) - there is no session left to
      // sign the user into here, so send them to log in with the new
      // password rather than trying to auto-sign-in.
      setIsDone(true)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>

      setErrorMessage(axiosError.response?.data?.message ?? 'This reset link is invalid or has expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <div className='flex bs-full justify-center items-center p-6'>
        <div className='flex flex-col items-center gap-4 max-is-[440px] text-center'>
          <Logo />
          <i className='ri-shield-check-line text-6xl text-primary' />
          <Typography variant='h4'>Password reset</Typography>
          <Typography>
            Your password has been changed successfully. For your security, you&#39;ve been logged out everywhere -
            please sign in again with your new password.
          </Typography>
          <Button
            variant='contained'
            component={Link}
            href={getLocalizedUrl('/login', locale as Locale)}
            onClick={() => router.replace(getLocalizedUrl('/login', locale as Locale))}
          >
            Go to login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
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
          <div>
            <Typography variant='h4'>Set a new password 🔑</Typography>
            <Typography className='mbs-1'>Your new password must be different from previously used passwords.</Typography>
          </div>

          {!token && (
            <Alert severity='warning'>
              This link is missing a reset token - open the link from your email again, or request a new one.
            </Alert>
          )}

          {errorMessage && (
            <Alert severity='error' onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='New Password'
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
            <Button fullWidth variant='contained' type='submit' disabled={isSubmitting || !token}>
              {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Set new password'}
            </Button>
            <Typography className='flex justify-center items-center' color='primary.main'>
              <Link href={getLocalizedUrl('/login', locale as Locale)}>Back to Login</Link>
            </Typography>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
