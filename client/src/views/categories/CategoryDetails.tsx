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
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Feature Imports
import { useCategoryDetails } from '@/features/categories/useCategories'

type Props = {
  categoryId: string
}

const CategoryDetails = ({ categoryId }: Props) => {
  const { lang } = useParams()
  const { data, isLoading, isError } = useCategoryDetails(categoryId)

  if (isLoading) {
    return (
      <Grid container spacing={6}>
        <Grid size={12}>
          <Skeleton variant='rectangular' height={160} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant='rectangular' height={200} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant='rectangular' height={200} />
        </Grid>
      </Grid>
    )
  }

  if (isError || !data) {
    return <Alert severity='error'>Couldn&apos;t load this category. Please refresh and try again.</Alert>
  }

  const { category, productsCount } = data

  return (
    <Grid container spacing={6}>
      {/* Header / Overview */}
      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color='primary' size={48}>
                <i className='ri-price-tag-3-line text-2xl' />
              </CustomAvatar>
              <div>
                <div className='flex items-center gap-2'>
                  <Typography variant='h5'>{category.name}</Typography>
                  <Chip
                    size='small'
                    label={category.isActive ? 'Active' : 'Inactive'}
                    color={category.isActive ? 'success' : 'default'}
                    variant={category.isActive ? 'filled' : 'outlined'}
                  />
                </div>
                <Typography color='text.secondary'>
                  Created {new Date(category.createdAt).toLocaleDateString()}
                </Typography>
              </div>
            </div>
            <Button
              variant='outlined'
              component={Link}
              href={getLocalizedUrl('/categories', lang as Locale)}
              startIcon={<i className='ri-arrow-left-line' />}
            >
              Back to Categories
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Stat cards */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Products</Typography>
            <Typography variant='h5'>{productsCount}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Created Date</Typography>
            <Typography variant='h5'>{new Date(category.createdAt).toLocaleDateString()}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Last Updated</Typography>
            <Typography variant='h5'>{new Date(category.updatedAt).toLocaleDateString()}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Details */}
      <Grid size={12}>
        <Card>
          <CardHeader title='Details' />
          <CardContent>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText primary='Description' secondary={category.description || 'No description on file.'} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary='Status'
                  secondary={category.isActive ? 'Active - visible when adding or editing products.' : 'Inactive - hidden from the product picker.'}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary='Products Assigned'
                  secondary={
                    productsCount > 0
                      ? `${productsCount} product(s) currently use this category.`
                      : 'No products currently use this category - it can be deleted if no longer needed.'
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CategoryDetails
