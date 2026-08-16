'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

// Hook Imports
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

// Feature Imports
import { useProductReport } from '@/features/reports/useReports'
import { useProducts } from '@/features/products/useProducts'
import { useCategories } from '@/features/categories/useCategories'

// Shared Report Imports
import DateRangeFilter, { type DateRangeFilterValue } from './shared/DateRangeFilter'
import ReportExportBar from './shared/ReportExportBar'
import CategoryBarChart from './shared/CategoryBarChart'

const ProductReport = () => {
  const currency = useCurrencyFormatter()
  const [range, setRange] = useState<DateRangeFilterValue>({ preset: 'THIS_MONTH', from: '', to: '' })
  const [productId, setProductId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const { data: products } = useProducts()
  const { data: categories } = useCategories()

  const params = {
    preset: range.preset,
    from: range.preset === 'CUSTOM' ? range.from || undefined : undefined,
    to: range.preset === 'CUSTOM' ? range.to || undefined : undefined,
    productId: productId || undefined,
    categoryId: categoryId || undefined
  }

  const { data, isLoading, isFetching, isError } = useProductReport(params)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardHeader
            title='Product Report'
            subheader='Units sold, revenue, and stock levels for the selected period'
            action={<ReportExportBar path='/reports/products' params={params} filenameBase='product-report' />}
          />
          <CardContent>
            <DateRangeFilter
              value={range}
              onChange={setRange}
              extraFilters={
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      label='Category'
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                    >
                      <MenuItem value=''>All Categories</MenuItem>
                      {categories?.map(category => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      label='Product'
                      value={productId}
                      onChange={e => setProductId(e.target.value)}
                    >
                      <MenuItem value=''>All Products</MenuItem>
                      {products?.map(product => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              }
            />
          </CardContent>
        </Card>
      </Grid>

      {isLoading ? (
        <Grid size={12}>
          <Skeleton variant='rectangular' height={280} />
        </Grid>
      ) : isError || !data ? (
        <Grid size={12}>
          <Alert severity='error'>Couldn&apos;t load the product report. Please refresh and try again.</Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Units Sold</Typography>
                <Typography variant='h5'>{data.summary.totalUnitsSold}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Revenue</Typography>
                <Typography variant='h5'>{currency(data.summary.totalRevenue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>Products</Typography>
                <Typography variant='h5'>{data.summary.productCount}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {data.topProducts.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title='Top Products by Revenue' />
                <CardContent>
                  <CategoryBarChart
                    labels={data.topProducts.map(p => p.productName)}
                    values={data.topProducts.map(p => p.revenue)}
                    seriesName='Revenue'
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={12}>
            <Card style={{ opacity: isFetching ? 0.6 : 1 }}>
              <CardHeader title='Product Summary' />
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align='right'>Units Sold</TableCell>
                      <TableCell align='right'>Revenue</TableCell>
                      <TableCell align='right'>Stock</TableCell>
                      <TableCell align='right'>Price</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map(row => (
                      <TableRow key={row.productId}>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>{row.sku ?? '—'}</TableCell>
                        <TableCell>{row.categoryName ?? '—'}</TableCell>
                        <TableCell align='right'>{row.unitsSold}</TableCell>
                        <TableCell align='right'>{currency(row.revenue)}</TableCell>
                        <TableCell align='right'>{row.stockQuantity}</TableCell>
                        <TableCell align='right'>{currency(row.price)}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={row.isActive ? 'Active' : 'Inactive'}
                            color={row.isActive ? 'success' : 'default'}
                            variant={row.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align='center'>
                          <Typography color='text.secondary' className='p-6'>
                            No product activity in this period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default ProductReport
