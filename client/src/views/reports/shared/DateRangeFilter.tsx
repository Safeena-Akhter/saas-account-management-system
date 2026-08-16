'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { DateRangePreset } from '@/features/reports/types'

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'THIS_QUARTER', label: 'This Quarter' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'CUSTOM', label: 'Custom Range' }
]

export type DateRangeFilterValue = {
  preset: DateRangePreset
  from: string
  to: string
}

type Props = {
  value: DateRangeFilterValue
  onChange: (value: DateRangeFilterValue) => void

  /**
   * Extra filter controls (e.g. a Customer picker) rendered alongside the
   * date range, so each report view doesn't need its own separate Grid row
   * just to add one more dropdown.
   */
  extraFilters?: ReactNode
}

// Controlled filter bar shared by every report view (Sales, Profit & Loss,
// Outstanding Balance, Customer). Deliberately dumb/presentational - each
// report view owns the actual `preset`/`from`/`to` state and passes it down,
// since the "what does changing this filter do" behavior (refetch via
// useQuery, which params to keep) differs slightly per report.
const DateRangeFilter = ({ value, onChange, extraFilters }: Props) => {
  const { preset, from, to } = value

  return (
    <Grid container spacing={4} alignItems='center'>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          select
          fullWidth
          size='small'
          label='Date Range'
          value={preset}
          onChange={e => onChange({ ...value, preset: e.target.value as DateRangePreset })}
        >
          {PRESET_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {preset === 'CUSTOM' && (
        <>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='From'
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={e => onChange({ ...value, from: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='To'
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={e => onChange({ ...value, to: e.target.value })}
            />
          </Grid>
        </>
      )}

      {extraFilters}
    </Grid>
  )
}

export default DateRangeFilter
