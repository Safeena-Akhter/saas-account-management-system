'use client'

// Next Imports
import { useParams } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type ReportLink = {
  key: string
  title: string
  description: string
  icon: string
  href?: string
}

// All 12 reports from the SRS are now shipped - each tile below links to a
// live, API-driven, filterable, exportable report.
const AVAILABLE_REPORTS: ReportLink[] = [
  {
    key: 'sales',
    title: 'Sales Report',
    description: 'Invoiced totals, top products, and invoice-level detail.',
    icon: 'ri-line-chart-line',
    href: '/reports/sales'
  },
  {
    key: 'profit-loss',
    title: 'Profit & Loss Report',
    description: 'Revenue collected minus expenses, with a category breakdown.',
    icon: 'ri-scales-3-line',
    href: '/reports/profit-loss'
  },
  {
    key: 'outstanding-balance',
    title: 'Outstanding Balance Report',
    description: 'Who owes what, and the oldest unpaid invoices.',
    icon: 'ri-hourglass-line',
    href: '/reports/outstanding-balance'
  },
  {
    key: 'customer',
    title: 'Customer Report',
    description: 'Per-customer invoiced, collected, and outstanding totals.',
    icon: 'ri-user-star-line',
    href: '/reports/customer'
  },
  {
    key: 'supplier',
    title: 'Supplier Report',
    description: 'Purchases and payables by supplier.',
    icon: 'ri-truck-line',
    href: '/reports/supplier'
  },
  {
    key: 'product',
    title: 'Product Report',
    description: 'Sales and stock performance by product.',
    icon: 'ri-shopping-bag-3-line',
    href: '/reports/product'
  },
  {
    key: 'invoice',
    title: 'Invoice Report',
    description: 'Detailed invoice register with filters.',
    icon: 'ri-file-list-3-line',
    href: '/reports/invoice'
  },
  {
    key: 'expense',
    title: 'Expense Report',
    description: 'Expenses by category, supplier, and date.',
    icon: 'ri-wallet-3-line',
    href: '/reports/expense'
  },
  {
    key: 'income',
    title: 'Income Report',
    description: 'Other income by category and date.',
    icon: 'ri-hand-coin-line',
    href: '/reports/income'
  },
  {
    key: 'payment',
    title: 'Payment Report',
    description: 'Payments received and paid out.',
    icon: 'ri-bank-card-line',
    href: '/reports/payment'
  },
  {
    key: 'tax',
    title: 'Tax Report',
    description: 'Tax collected across invoices.',
    icon: 'ri-file-paper-2-line',
    href: '/reports/tax'
  },
  {
    key: 'monthly-summary',
    title: 'Monthly Summary Report',
    description: 'One-page monthly business overview.',
    icon: 'ri-calendar-2-line',
    href: '/reports/monthly-summary'
  }
]

const ReportTile = ({ report, lang }: { report: ReportLink; lang: string }) => {
  const content = (
    <Card className={report.href ? 'cursor-pointer transition-shadow hover:shadow-lg' : undefined}>
      <CardContent className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <CustomAvatar variant='rounded' skin='light' color='primary'>
            <i className={report.icon} />
          </CustomAvatar>
          {!report.href && <Chip size='small' label='Coming soon' variant='tonal' />}
        </div>
        <div>
          <Typography variant='h6'>{report.title}</Typography>
          <Typography color='text.secondary'>{report.description}</Typography>
        </div>
      </CardContent>
    </Card>
  )

  if (!report.href) return content

  return (
    <Link href={getLocalizedUrl(report.href, lang as Locale)} className='block'>
      {content}
    </Link>
  )
}

const ReportsDashboard = () => {
  const { lang } = useParams()

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant='h4'>Reports & Analytics</Typography>
        <Typography color='text.secondary'>Choose a report to view detailed, filterable, exportable data.</Typography>
      </Grid>

      {AVAILABLE_REPORTS.map(report => (
        <Grid key={report.key} size={{ xs: 12, sm: 6, md: 3 }}>
          <ReportTile report={report} lang={lang as string} />
        </Grid>
      ))}
    </Grid>
  )
}

export default ReportsDashboard
