'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Props = {
  labels: string[]
  values: number[]
  seriesName?: string
  height?: number
  color?: string
}

// Generic single-series horizontal bar chart - used for Top Customers, Top
// Products, Expenses by Category, Income by Category, and Outstanding
// Receivables. Horizontal (rather than vertical) so long
// customer/product/category names don't get clipped on narrow cards.
const CategoryBarChart = ({ labels, values, seriesName = 'Total', height = 320, color }: Props) => {
  const theme = useTheme()

  const options: ApexOptions = {
    chart: { toolbar: { show: false }, parentHeightOffset: 0 },
    colors: [color ?? theme.palette.primary.main],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } }
    },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      labels: { style: { colors: 'var(--mui-palette-text-disabled)' } }
    },
    yaxis: { labels: { style: { colors: 'var(--mui-palette-text-primary)' } } },
    tooltip: { theme: theme.palette.mode }
  }

  return (
    <AppReactApexCharts
      type='bar'
      height={height}
      width='100%'
      series={[{ name: seriesName, data: values }]}
      options={options}
    />
  )
}

export default CategoryBarChart
