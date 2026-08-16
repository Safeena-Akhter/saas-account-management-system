'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Props = {
  categories: string[]
  series: { name: string; data: number[]; color?: string }[]
  height?: number
}

// Generic multi-series line chart - used for Monthly Summary's
// Revenue/Expense/Profit trend and Sales Report's daily trend. Colors fall
// back to the theme's primary/success/error palette in series order so
// callers don't need to hand-pick colors for the common 1-3 series case.
const LineTrendChart = ({ categories, series, height = 320 }: Props) => {
  const theme = useTheme()

  const paletteFallback = [theme.palette.primary.main, theme.palette.success.main, theme.palette.error.main]

  const options: ApexOptions = {
    chart: { toolbar: { show: false }, parentHeightOffset: 0 },
    colors: series.map((s, i) => s.color ?? paletteFallback[i % paletteFallback.length]),
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: false } }
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--mui-palette-text-disabled)' } }
    },
    yaxis: { labels: { style: { colors: 'var(--mui-palette-text-disabled)' } } },
    legend: { position: 'top', labels: { colors: 'var(--mui-palette-text-primary)' } },
    tooltip: { theme: theme.palette.mode }
  }

  return (
    <AppReactApexCharts
      type='line'
      height={height}
      width='100%'
      series={series.map(s => ({ name: s.name, data: s.data }))}
      options={options}
    />
  )
}

export default LineTrendChart
