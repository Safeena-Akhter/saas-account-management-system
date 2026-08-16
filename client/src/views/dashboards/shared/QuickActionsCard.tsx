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

const ACTIONS = [
  { label: 'Add Customer', icon: 'ri-user-add-line', href: '/customers', color: 'primary' as const },
  { label: 'Create Invoice', icon: 'ri-file-add-line', href: '/invoices?new=1', color: 'info' as const },
  { label: 'Add Product', icon: 'ri-shopping-bag-3-line', href: '/products', color: 'secondary' as const },
  { label: 'Receive Payment', icon: 'ri-bank-card-line', href: '/payments?new=1', color: 'success' as const },
  { label: 'Add Expense', icon: 'ri-wallet-3-line', href: '/expenses?new=1', color: 'warning' as const }
]

const QuickActionsCard = () => {
  const { lang } = useParams()

  return (
    <Card>
      <CardHeader title='Quick Actions' />
      <CardContent>
        <Grid container spacing={4}>
          {ACTIONS.map(action => (
            <Grid key={action.label} size={{ xs: 12, sm: 6, md: 'auto' }}>
              <Button
                fullWidth
                variant='outlined'
                color={action.color}
                startIcon={<i className={action.icon} />}
                component={Link}
                href={getLocalizedUrl(action.href, lang as Locale)}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default QuickActionsCard
