'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Types Imports
import type { TrendPoint } from '@/features/dashboard/types'

type Props = {
  title: string
  data: TrendPoint[]
  color?: string
  formatValue?: (value: number) => string
}

const formatMonth = (month: string) => {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)

  return date.toLocaleDateString('en-US', { month: 'short' })
}

const TrendLineChart = ({ title, data, color = 'var(--mui-palette-primary-main)', formatValue }: Props) => {
  const hasData = data.some(point => point.total > 0)

  return (
    <Card className='h-full'>
      <CardHeader title={title} />
      <CardContent>
        {!hasData ? (
          <div className='flex items-center justify-center h-[220px]'>
            <Typography color='text.disabled'>No data yet for this period</Typography>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={220}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={color} stopOpacity={0.35} />
                  <stop offset='95%' stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey='month'
                tickFormatter={formatMonth}
                tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => (formatValue ? formatValue(value) : value.toLocaleString())}
                labelFormatter={formatMonth}
              />
              <Area type='monotone' dataKey='total' stroke={color} fill={`url(#gradient-${title.replace(/\s/g, '')})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default TrendLineChart
