'use client'

// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import { useUpdatePreferences } from '@/features/auth/useAuth'
import type { UserPreferences } from '@/features/auth/types'
import { formatCurrency } from '@/utils/currency'

// Config Imports
import { i18n } from '@configs/i18n'

const THEME_OPTIONS: { value: UserPreferences['theme']; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

const LANGUAGE_LABELS: Record<string, string> = { en: 'English', fr: 'Français', ar: 'العربية' }

const DATE_FORMAT_OPTIONS: UserPreferences['dateFormat'][] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

// This is a display STYLE choice, not a currency choice - *which* currency
// is always the company's own (Company.currency, set in Business Settings,
// company-wide). Changing it here only changes how that same currency is
// formatted everywhere in the app - see hooks/useCurrencyFormatter.ts and
// utils/currency.ts, which every table/dashboard/report now goes through
// instead of each hardcoding "USD" independently.
const CURRENCY_FORMAT_OPTIONS: { value: UserPreferences['currencyFormat']; label: string }[] = [
  { value: 'symbol', label: 'Symbol' },
  { value: 'code', label: 'Code' }
]

const PreferencesTab = () => {
  const { data: session, update } = useSession()
  const { updateSettings } = useSettings()
  const router = useRouter()
  const params = useParams()

  const updatePreferences = useUpdatePreferences()

  const companyCurrency = session?.user.company?.currency ?? 'USD'

  const [form, setForm] = useState<UserPreferences>(
    session?.user.preferences ?? { theme: 'system', language: 'en', dateFormat: 'DD/MM/YYYY', currencyFormat: 'symbol' }
  )

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleChange = (field: keyof UserPreferences) => (e: { target: { value: string } }) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }) as UserPreferences)
    setSuccessMessage(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    updatePreferences.mutate(form, {
      onSuccess: user => {
        setSuccessMessage('Preferences updated.')
        void update(user)

        // Theme is also this app's global UI setting (see
        // @core/contexts/settingsContext.tsx) - apply it immediately rather
        // than only persisting it server-side.
        updateSettings({ mode: user.preferences.theme })

        // Language drives the URL's [lang] segment, not a stored setting -
        // navigate to the same page under the new locale so the UI actually
        // switches, mirroring how the existing language switcher works.
        if (user.preferences.language !== params.lang) {
          router.replace(`/${user.preferences.language}/settings`)
        }
      }
    })
  }

  return (
    <Card>
      <CardHeader title='Preferences' subheader='Personalize how the app looks and formats data for you' />
      <CardContent>
        <Alert severity='info' className='mbe-4'>
          This only changes how amounts are <em>displayed</em> to you. To change the company&apos;s actual currency,
          go to Company Settings.
        </Alert>
        {updatePreferences.isError && (
          <Alert severity='error' className='mbe-4'>
            {updatePreferences.error.response?.data?.message ?? 'Something went wrong. Please try again.'}
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
              <TextField fullWidth select label='Theme' value={form.theme} onChange={handleChange('theme')}>
                {THEME_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label='Language' value={form.language} onChange={handleChange('language')}>
                {i18n.locales.map(locale => (
                  <MenuItem key={locale} value={locale}>
                    {LANGUAGE_LABELS[locale] ?? locale}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label='Date format'
                value={form.dateFormat}
                onChange={handleChange('dateFormat')}
              >
                {DATE_FORMAT_OPTIONS.map(fmt => (
                  <MenuItem key={fmt} value={fmt}>
                    {fmt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label='Currency format'
                value={form.currencyFormat}
                onChange={handleChange('currencyFormat')}
                helperText={`Your company's currency (${companyCurrency}) will look like: ${formatCurrency(2000, companyCurrency, form.currencyFormat)}`}
              >
                {CURRENCY_FORMAT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label} ({formatCurrency(2000, companyCurrency, opt.value)})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <Button type='submit' variant='contained' disabled={updatePreferences.isPending}>
                {updatePreferences.isPending ? <CircularProgress size={22} color='inherit' /> : 'Save changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default PreferencesTab
