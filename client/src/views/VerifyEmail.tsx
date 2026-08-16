'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'

// Third-party Imports
import type { AxiosError } from 'axios'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Lib Imports
import apiClient from '@/lib/api/client'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type Status = 'verifying' | 'success' | 'error'

const VerifyEmail = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()

  const [status, setStatus] = useState<Status>('verifying')
  const [errorMessage, setErrorMessage] = useState('This verification link is invalid or has expired.')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('This verification link is missing its token.')

      return
    }

    // The route itself needs no auth (a fresh registrant has no session
    // yet) - see server/src/routes/auth.routes.ts, verify-email is public.
    apiClient
      .get('/auth/verify-email', { params: { token } })
      .then(() => {
        setStatus('success')

        const timeout = setTimeout(() => {
          router.replace(getLocalizedUrl('/login', locale as Locale))
        }, 3000)

        return () => clearTimeout(timeout)
      })
      .catch((err: AxiosError<{ message?: string }>) => {
        setStatus('error')
        setErrorMessage(err.response?.data?.message ?? 'This verification link is invalid or has expired.')
      })

    // Only re-run if the token itself changes - router/locale are stable
    // for the lifetime of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className='flex bs-full justify-center items-center p-6'>
      <div className='flex flex-col items-center gap-4 max-is-[440px] text-center'>
        <Logo />

        {status === 'verifying' && (
          <>
            <CircularProgress />
            <Typography variant='h4'>Verifying your email...</Typography>
            <Typography>This will only take a moment.</Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <i className='ri-checkbox-circle-line text-6xl text-success' />
            <Typography variant='h4'>Email verified</Typography>
            <Typography>Your account is active. Redirecting you to sign in...</Typography>
            <Button
              variant='contained'
              component={Link}
              href={getLocalizedUrl('/login', locale as Locale)}
              className='mbs-2'
            >
              Sign in now
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <i className='ri-error-warning-line text-6xl text-error' />
            <Typography variant='h4'>Verification failed</Typography>
            <Typography>{errorMessage}</Typography>
            <Button
              variant='contained'
              component={Link}
              href={getLocalizedUrl('/login', locale as Locale)}
              className='mbs-2'
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
