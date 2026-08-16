'use client'

// Next Imports
import { useParams } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const LINKS = [
  { label: 'Reports Dashboard', icon: 'ri-bar-chart-box-line', href: '/reports' },
  { label: 'Invoices', icon: 'ri-file-list-3-line', href: '/invoices' },
  { label: 'Expenses', icon: 'ri-wallet-3-line', href: '/expenses' },
  { label: 'Payments', icon: 'ri-bank-card-line', href: '/payments' }
]

// The dedicated Reports module (Sales/Profit & Loss/Outstanding Balance/
// Customer reports so far, see views/reports/ReportsDashboard.tsx) now
// exists, so "Reports Dashboard" is a real destination rather than a link
// that leads nowhere. The three record-level links stay too - they're
// still the fastest path to a single record for someone doing daily
// bookkeeping, not something the Reports Dashboard interactive tables
// replace.
const ReportsLinksCard = () => {
  const { lang } = useParams()

  return (
    <Card>
      <CardHeader title='Reports' subheader='Jump into the detailed records behind these numbers' />
      <CardContent>
        <Grid container spacing={4}>
          {LINKS.map(link => (
            <Grid key={link.label} size={{ xs: 12, sm: 4 }}>
              <Button
                fullWidth
                variant='outlined'
                startIcon={<i className={link.icon} />}
                component={Link}
                href={getLocalizedUrl(link.href, lang as Locale)}
              >
                {link.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ReportsLinksCard
