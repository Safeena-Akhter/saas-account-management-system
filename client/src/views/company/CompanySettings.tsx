'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Feature Imports
import { useMyCompany, useUpdateMyCompany, useUploadCompanyLogo } from '@/features/company/useCompany'
import type { UpdateCompanyProfileInput } from '@/features/company/types'

// Common currencies for a small/medium business SaaS - not exhaustive, the
// field itself accepts any 3-letter ISO code (see company.validator.ts).
// PKR listed first since it's this deployment's default company currency.
const CURRENCY_OPTIONS = ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD']

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB, matches server upload.middleware.ts

const CompanySettings = () => {
  const { data: session, update } = useSession()
  const isOwner = session?.user.role === 'BUSINESS_OWNER'

  const { data: company, isLoading, isError } = useMyCompany()
  const updateCompany = useUpdateMyCompany()
  const uploadLogo = useUploadCompanyLogo()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<UpdateCompanyProfileInput>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  // Seed the editable form once the company profile has loaded, so
  // untouched fields still submit their current values rather than blanks.
  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        address: company.address,
        phone: company.phone,
        contactEmail: company.contactEmail,
        taxNumber: company.taxNumber,
        currency: company.currency
      })
    }
  }, [company])

  const handleChange =
    (field: keyof UpdateCompanyProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setSuccessMessage(null)
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    updateCompany.mutate(form, {
      onSuccess: updatedCompany => {
        setSuccessMessage('Company profile updated.')

        // The session (see types/next-auth.d.ts) carries its own cached
        // copy of { id, name, logoUrl, currency } for every page that
        // displays money to read without an extra fetch (see
        // hooks/useCurrencyFormatter.ts). That cache is only ever
        // populated at login/token-refresh time, so without this it would
        // keep showing the *old* currency everywhere else in the app until
        // the user's session token naturally rotated - exactly what was
        // happening before this fix.
        void update({
          company: {
            id: updatedCompany.id,
            name: updatedCompany.name,
            logoUrl: updatedCompany.logoUrl,
            currency: updatedCompany.currency
          }
        })
      }
    })
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    // Always clear the input value so re-selecting the same file still fires
    // onChange, and so a rejected file doesn't linger as a "chosen" file.
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (!file) return

    setLogoError(null)
    setSuccessMessage(null)

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError('Logo must be smaller than 5MB.')

      return
    }

    uploadLogo.mutate(file, {
      onSuccess: updatedCompany => {
        setSuccessMessage('Company logo updated.')

        // Same session-sync reasoning as handleSubmit above - the navbar
        // logo, sidebar, and anywhere else session.user.company.logoUrl is
        // read would otherwise keep showing the old logo.
        void update({
          company: {
            id: updatedCompany.id,
            name: updatedCompany.name,
            logoUrl: updatedCompany.logoUrl,
            currency: updatedCompany.currency
          }
        })
      },
      onError: err => setLogoError(err.response?.data?.message ?? 'Could not upload logo, please try again.')
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant='text' width='40%' height={32} />
          <Skeleton variant='rectangular' height={200} className='mbs-4' />
        </CardContent>
      </Card>
    )
  }

  if (isError || !company) {
    return <Alert severity='error'>Couldn&apos;t load your company profile. Please refresh and try again.</Alert>
  }

  return (
    <Card>
      <CardHeader
        title='Company Profile'
        subheader={isOwner ? 'Update your company profile' : 'Company profile (read-only for your role)'}
      />
      <CardContent className='mbe-5'>
        <div className='flex max-sm:flex-col items-center gap-6'>
          {company.logoUrl ? (
            <img
              height={100}
              width={100}
              className='rounded object-cover'
              src={company.logoUrl}
              alt={`${company.name} logo`}
            />
          ) : (
            <CustomAvatar variant='rounded' skin='light' color='primary' size={100}>
              <i className='ri-building-line text-5xl' />
            </CustomAvatar>
          )}
          {isOwner && (
            <div className='flex grow flex-col gap-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button component='label' variant='contained' htmlFor='company-logo-upload' disabled={uploadLogo.isPending}>
                  {uploadLogo.isPending ? <CircularProgress size={20} color='inherit' className='mie-2' /> : null}
                  Upload Logo
                  <input
                    hidden
                    type='file'
                    accept='image/png, image/jpeg, image/webp, image/svg+xml'
                    onChange={handleLogoChange}
                    id='company-logo-upload'
                    ref={fileInputRef}
                  />
                </Button>
              </div>
              <Typography color='text.disabled'>Allowed PNG, JPEG, WEBP or SVG. Max size of 5MB.</Typography>
              {logoError && <Alert severity='error'>{logoError}</Alert>}
            </div>
          )}
        </div>
      </CardContent>
      <CardContent>
        {updateCompany.isError && (
          <Alert severity='error' className='mbe-4'>
            {updateCompany.error.response?.data?.message ?? 'Something went wrong. Please try again.'}
          </Alert>
        )}
        {successMessage && (
          <Alert severity='success' className='mbe-4' onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Business name'
                value={form.name ?? ''}
                onChange={handleChange('name')}
                disabled={!isOwner}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label='Currency'
                value={form.currency ?? company.currency}
                onChange={handleChange('currency')}
                disabled={!isOwner}
              >
                {CURRENCY_OPTIONS.map(code => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Contact email'
                type='email'
                value={form.contactEmail ?? ''}
                onChange={handleChange('contactEmail')}
                disabled={!isOwner}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Phone'
                value={form.phone ?? ''}
                onChange={handleChange('phone')}
                disabled={!isOwner}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Tax number'
                value={form.taxNumber ?? ''}
                onChange={handleChange('taxNumber')}
                disabled={!isOwner}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Business address'
                value={form.address ?? ''}
                onChange={handleChange('address')}
                disabled={!isOwner}
              />
            </Grid>
            {isOwner && (
              <Grid size={12}>
                <Button type='submit' variant='contained' disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? <CircularProgress size={22} color='inherit' /> : 'Save changes'}
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default CompanySettings
