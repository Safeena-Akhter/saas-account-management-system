'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, minLength, string, email, pipe, nonEmpty, regex } from 'valibot'
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

// Mirrors the backend's registerSchema (server/src/validators/auth.validator.ts)
// so the user sees the same rules client-side instead of only finding out
// after a round-trip to the API.
const schema = object({
  name: pipe(string(), nonEmpty('This field is required'), minLength(2, 'Name must be at least 2 characters')),
  companyName: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(2, 'Company name must be at least 2 characters')
  ),
  email: pipe(string(), nonEmpty('This field is required'), email('Please enter a valid email address')),
  password: pipe(
    string(),
    minLength(8, 'Password must be at least 8 characters'),
    regex(/[a-z]/, 'Password must contain a lowercase letter'),
    regex(/[A-Z]/, 'Password must contain an uppercase letter'),
    regex(/[0-9]/, 'Password must contain a number')
  )
})

const Register = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-2-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-2-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const { settings } = useSettings()
  const { lang: locale } = useParams()
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
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      password: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    if (!agreedToTerms) {
      setTermsError(true)

      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Registration always creates a brand-new Company and makes this user
      // its BUSINESS_OWNER - see server/src/validators/auth.validator.ts.
      // It deliberately does NOT return a session: the backend refuses to
      // log in an account until its email is verified (auth.service.ts),
      // so there is no working session to sign in to yet. We just confirm
      // the account was created and tell them to check their inbox.
      await apiClient.post('/auth/register', {
        name: data.name,
        companyName: data.companyName,
        email: data.email,
        password: data.password
      })

      setRegisteredEmail(data.email)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>

      setErrorMessage(axiosError.response?.data?.message ?? 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (registeredEmail) {
    return (
      <div className='flex bs-full justify-center items-center p-6'>
        <div className='flex flex-col items-center gap-4 max-is-[440px] text-center'>
          <Logo />
          <i className='ri-mail-check-line text-6xl text-primary' />
          <Typography variant='h4'>Check your email</Typography>
          <Typography>
            We sent a verification link to <strong>{registeredEmail}</strong>. Click it to activate your account -
            the link expires in 24 hours.
          </Typography>
          <Typography component={Link} href={getLocalizedUrl('/login', locale as Locale)} color='primary.main'>
            Back to sign in
          </Typography>
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
            <Typography variant='h4'>Set up your company 🚀</Typography>
            <Typography className='mbs-1'>Create your business account and start managing accounts.</Typography>
          </div>

          {errorMessage && (
            <Alert severity='error' onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Your name'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorMessage !== null && setErrorMessage(null)
                  }}
                  {...(errors.name && { error: true, helperText: errors.name.message })}
                />
              )}
            />
            <Controller
              name='companyName'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Company name'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorMessage !== null && setErrorMessage(null)
                  }}
                  {...(errors.companyName && { error: true, helperText: errors.companyName.message })}
                />
              )}
            />
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type='email'
                  label='Email'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorMessage !== null && setErrorMessage(null)
                  }}
                  {...(errors.email && { error: true, helperText: errors.email.message })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
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
                            onClick={handleClickShowPassword}
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
                    : { helperText: 'At least 8 characters, with an uppercase letter, a lowercase letter, and a number.' })}
                />
              )}
            />
            <div className='flex flex-col gap-1'>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={e => {
                      setAgreedToTerms(e.target.checked)
                      e.target.checked && setTermsError(false)
                    }}
                  />
                }
                label={
                  <>
                    <span>I agree to </span>
                    <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                      privacy policy & terms
                    </Link>
                  </>
                }
              />
              {termsError && (
                <Typography variant='caption' color='error'>
                  You must agree to the privacy policy & terms to create an account.
                </Typography>
              )}
            </div>
            <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Sign Up'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Already have an account?</Typography>
              <Typography component={Link} href={getLocalizedUrl('/login', locale as Locale)} color='primary.main'>
                Sign in instead
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
