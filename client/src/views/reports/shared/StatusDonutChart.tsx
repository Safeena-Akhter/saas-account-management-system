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
  height?: number
}

// Generic donut chart - used for the Invoice Status breakdown. Colors cycle
// through the theme's semantic palette so status-like data (paid/overdue/
// draft/...) reads consistently with the rest of the app's status chips.
const StatusDonutChart = ({ labels, values, height = 320 }: Props) => {
  const theme = useTheme()

  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.secondary.main
  ]

  const options: ApexOptions = {
    chart: { parentHeightOffset: 0 },
    labels,
    colors: labels.map((_, i) => palette[i % palette.length]),
    stroke: { width: 0 },
    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
    legend: { position: 'bottom', labels: { colors: 'var(--mui-palette-text-primary)' } },
    tooltip: { theme: theme.palette.mode }
  }

  return <AppReactApexCharts type='donut' height={height} width='100%' series={values} options={options} />
}

export default StatusDonutChart
