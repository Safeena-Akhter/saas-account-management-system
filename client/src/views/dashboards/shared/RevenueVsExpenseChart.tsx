'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Types Imports
import type { RevenueVsExpensePoint } from '@/features/dashboard/types'

type Props = {
  data: RevenueVsExpensePoint[]
}

const formatMonth = (month: string) => {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)

  return date.toLocaleDateString('en-US', { month: 'short' })
}

const RevenueVsExpenseChart = ({ data }: Props) => {
  const hasData = data.some(point => point.revenue > 0 || point.expense > 0)

  return (
    <Card className='h-full'>
      <CardHeader title='Revenue vs Expense' />
      <CardContent>
        {!hasData ? (
          <div className='flex items-center justify-center h-[220px]'>
            <Typography color='text.disabled'>No data yet for this period</Typography>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey='month'
                tickFormatter={formatMonth}
                tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatMonth} formatter={(value: number) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey='revenue' name='Revenue' fill='var(--mui-palette-success-main)' radius={[4, 4, 0, 0]} />
              <Bar dataKey='expense' name='Expense' fill='var(--mui-palette-error-main)' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default RevenueVsExpenseChart
