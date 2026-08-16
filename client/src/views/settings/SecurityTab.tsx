'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports - ChangePasswordCard already exists and is fully wired
// to the real /auth/change-password endpoint (see
// views/pages/account-settings/security/ChangePasswordCard.tsx). Reused
// as-is here rather than rebuilt.
import ChangePasswordCard from '@/views/pages/account-settings/security/ChangePasswordCard'
import SessionsCard from './SessionsCard'

const SecurityTab = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ChangePasswordCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <SessionsCard />
      </Grid>
    </Grid>
  )
}

export default SecurityTab
