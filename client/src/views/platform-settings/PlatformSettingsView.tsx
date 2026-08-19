'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// Feature Imports
import { usePlatformSettings, useUpdatePlatformSettings } from '@/features/platformSettings/usePlatformSettings'
import type { UpdatePlatformSettingsInput } from '@/features/platformSettings/types'

const PlatformSettingsView = () => {
  const { data: settings, isLoading, isError } = usePlatformSettings()
  const updateSettings = useUpdatePlatformSettings()

  const [form, setForm] = useState<UpdatePlatformSettingsInput>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmMaintenance, setConfirmMaintenance] = useState<boolean | null>(null)

  // Seed the editable form once settings have loaded, so untouched fields
  // still submit their current values rather than blanks - same pattern
  // as CompanySettings.tsx.
  useEffect(() => {
    if (settings) {
      setForm({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone
      })
    }
  }, [settings])

  const handleChange = (field: 'platformName' | 'supportEmail' | 'supportPhone') => (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value || null }))
    setSuccessMessage(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    updateSettings.mutate(form, {
      onSuccess: () => setSuccessMessage('Platform settings updated.'),
      onError: err => setErrorMessage(err.response?.data?.message ?? 'Could not update settings.')
    })
  }

  // Maintenance mode is confirmed separately from the rest of the form -
  // it's a platform-wide, immediately-effective switch (blocks every
  // non-SUPER_ADMIN sign-in the moment it's on, see auth.service.ts's
  // login()), not something that should be flipped by an accidental click
  // and left pending in an unsaved form.
  const handleMaintenanceToggle = () => {
    if (confirmMaintenance === null || !settings) return

    setErrorMessage(null)

    updateSettings.mutate(
      { maintenanceMode: confirmMaintenance },
      {
        onSuccess: () => {
          setSuccessMessage(confirmMaintenance ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.')
          setConfirmMaintenance(null)
        },
        onError: err => {
          setErrorMessage(err.response?.data?.message ?? 'Could not update maintenance mode.')
          setConfirmMaintenance(null)
        }
      }
    )
  }

  if (isLoading) {
    return <Skeleton variant='rectangular' height={420} />
  }

  if (isError || !settings) {
    return <Alert severity='error'>Couldn&apos;t load platform settings right now. Please refresh to try again.</Alert>
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card component='form' onSubmit={handleSubmit}>
          <CardHeader title='Platform Details' subheader='Shown on emails and support pages across the platform' />
          <CardContent className='flex flex-col gap-4'>
            {successMessage && (
              <Alert severity='success' onClose={() => setSuccessMessage(null)}>
                {successMessage}
              </Alert>
            )}
            {errorMessage && (
              <Alert severity='error' onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            <TextField
              fullWidth
              label='Platform Name'
              value={form.platformName ?? ''}
              onChange={handleChange('platformName')}
              required
            />
            <TextField
              fullWidth
              label='Support Email'
              type='email'
              value={form.supportEmail ?? ''}
              onChange={handleChange('supportEmail')}
            />
            <TextField
              fullWidth
              label='Support Phone'
              value={form.supportPhone ?? ''}
              onChange={handleChange('supportPhone')}
            />

            <div>
              <Button type='submit' variant='contained' disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <CircularProgress size={20} color='inherit' /> : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardHeader title='Maintenance Mode' />
          <CardContent className='flex flex-col gap-3'>
            <Typography color='text.secondary'>
              While enabled, only Super Admins can sign in - every other user sees a maintenance message when they try
              to log in. Existing sessions are not affected.
            </Typography>
            <Divider />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceMode}
                  onChange={e => setConfirmMaintenance(e.target.checked)}
                  disabled={updateSettings.isPending}
                />
              }
              label={settings.maintenanceMode ? 'Enabled' : 'Disabled'}
            />
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={confirmMaintenance !== null} onClose={() => setConfirmMaintenance(null)}>
        <DialogTitle>{confirmMaintenance ? 'Enable maintenance mode?' : 'Disable maintenance mode?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmMaintenance
              ? 'Every non-Super Admin user will be blocked from signing in immediately, platform-wide.'
              : 'Users will be able to sign in again as normal.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmMaintenance(null)}>Cancel</Button>
          <Button
            variant='contained'
            color={confirmMaintenance ? 'error' : 'success'}
            onClick={handleMaintenanceToggle}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? <CircularProgress size={20} color='inherit' /> : confirmMaintenance ? 'Enable' : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default PlatformSettingsView
