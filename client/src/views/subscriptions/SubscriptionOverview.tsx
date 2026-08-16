'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Feature Imports
import { useActivePlans } from '@/features/plans/usePlans'
import {
  useCancelMySubscription,
  useChangeMySubscription,
  useMySubscription,
  useMySubscriptionHistory,
  useMyUsage,
  useRenewMySubscription
} from '@/features/subscriptions/useSubscriptions'
import type { BillingCycle } from '@/features/subscriptions/types'
import type { Plan } from '@/features/plans/types'
import { formatCurrency } from '@/utils/currency'

// Per SUBSCRIPTION_MODULE_WRITE_ROLES in server/src/constants/roles.ts -
// only Business Owner can upgrade/downgrade/renew/cancel. Manager (also
// SUBSCRIPTION_MODULE_VIEW_ROLES) sees everything on this page read-only.
const WRITE_ROLES = ['BUSINESS_OWNER']

const statusColor: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'default'
}

const SubscriptionOverview = () => {
  const { data: session } = useSession()
  const canWrite = Boolean(session?.user.role && WRITE_ROLES.includes(session.user.role))

  const { data: subscription, isLoading: loadingSub, isError: subError } = useMySubscription()
  const { data: usage, isLoading: loadingUsage } = useMyUsage()
  const { data: history, isLoading: loadingHistory } = useMySubscriptionHistory()
  const { data: activePlans, isLoading: loadingPlans } = useActivePlans()

  const changeSubscription = useChangeMySubscription()
  const renewSubscription = useRenewMySubscription()
  const cancelSubscription = useCancelMySubscription()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerCycle, setPickerCycle] = useState<BillingCycle>('MONTHLY')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleChoosePlan = (plan: Plan) => {
    setActionError(null)

    changeSubscription.mutate(
      { planId: plan.id, billingCycle: pickerCycle },
      {
        onSuccess: () => {
          setPickerOpen(false)
          setActionSuccess(`Switched to the ${plan.name} plan.`)
        },
        onError: err => setActionError(err.response?.data?.message ?? 'Could not switch plans.')
      }
    )
  }

  const handleRenew = () => {
    setActionError(null)

    renewSubscription.mutate(undefined, {
      onSuccess: () => setActionSuccess('Subscription renewed.'),
      onError: err => setActionError(err.response?.data?.message ?? 'Could not renew subscription.')
    })
  }

  const handleCancel = () => {
    setActionError(null)

    cancelSubscription.mutate(undefined, {
      onSuccess: () => {
        setConfirmCancel(false)
        setActionSuccess('Subscription cancelled. You keep access until it expires.')
      },
      onError: err => {
        setActionError(err.response?.data?.message ?? 'Could not cancel subscription.')
        setConfirmCancel(false)
      }
    })
  }

  if (loadingSub) {
    return <Skeleton variant='rectangular' height={400} className='rounded' />
  }

  if (subError) {
    return <Alert severity='error'>Couldn&apos;t load your subscription. Please refresh and try again.</Alert>
  }

  return (
    <Grid container spacing={6}>
      {actionError && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error' onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        </Grid>
      )}
      {actionSuccess && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success' onClose={() => setActionSuccess(null)}>
            {actionSuccess}
          </Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          {subscription ? (
            <>
              <CardHeader
                title={
                  <div className='flex items-center gap-2'>
                    <Typography variant='h5'>{subscription.plan.name} Plan</Typography>
                    <Chip size='small' label={subscription.status} color={statusColor[subscription.status] ?? 'default'} variant='tonal' />
                  </div>
                }
                subheader={`${subscription.billingCycle === 'YEARLY' ? 'Billed yearly' : 'Billed monthly'} · Expires ${new Date(
                  subscription.endDate
                ).toLocaleDateString()} · ${subscription.remainingDays} day${subscription.remainingDays === 1 ? '' : 's'} remaining`}
                action={
                  canWrite && (
                    <div className='flex gap-2'>
                      <Button variant='outlined' onClick={handleRenew} disabled={renewSubscription.isPending}>
                        {renewSubscription.isPending ? <CircularProgress size={18} /> : 'Renew'}
                      </Button>
                      <Button variant='contained' onClick={() => setPickerOpen(true)}>
                        Change Plan
                      </Button>
                    </div>
                  )
                }
              />

              {subscription.remainingDays <= 3 && subscription.status === 'ACTIVE' && (
                <Alert severity='warning' className='mx-6 mbe-4'>
                  Your subscription expires in {subscription.remainingDays} day
                  {subscription.remainingDays === 1 ? '' : 's'}. Renew to avoid losing access.
                </Alert>
              )}
              {subscription.status !== 'ACTIVE' && (
                <Alert severity={subscription.status === 'EXPIRED' ? 'error' : 'info'} className='mx-6 mbe-4'>
                  {subscription.status === 'EXPIRED'
                    ? 'Your subscription has expired. Renew to restore full access.'
                    : 'Your subscription was cancelled and will not auto-renew.'}
                </Alert>
              )}

              <CardContent>
                <Typography variant='subtitle1' className='mbe-3'>
                  Feature Usage
                </Typography>

                {loadingUsage || !usage ? (
                  <Skeleton variant='rectangular' height={120} />
                ) : (
                  <Grid container spacing={4}>
                    {Object.entries(usage.usage).map(([resource, entry]) => (
                      <Grid key={resource} size={{ xs: 12, sm: 6, md: 4 }}>
                        <div className='flex justify-between mbe-1'>
                          <Typography variant='body2' className='capitalize'>
                            {resource}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {entry.used} / {entry.limit ?? 'Unlimited'}
                          </Typography>
                        </div>
                        <LinearProgress
                          variant='determinate'
                          value={entry.percentUsed}
                          color={entry.percentUsed >= 90 ? 'error' : entry.percentUsed >= 70 ? 'warning' : 'primary'}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}

                {canWrite && subscription.status === 'ACTIVE' && (
                  <div className='mbs-6'>
                    <Button color='error' variant='text' onClick={() => setConfirmCancel(true)}>
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className='text-center p-12'>
              <i className='ri-vip-crown-line text-[48px] text-textSecondary mbe-2' />
              <Typography variant='h6'>No active subscription</Typography>
              <Typography color='text.secondary' className='mbe-4'>
                Choose a plan to unlock full access to your account.
              </Typography>
              {canWrite && (
                <Button variant='contained' onClick={() => setPickerOpen(true)}>
                  Choose a Plan
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Subscription History' />
          {loadingHistory ? (
            <div className='p-6'>
              <Skeleton variant='rectangular' height={160} />
            </div>
          ) : !history || history.length === 0 ? (
            <CardContent>
              <Typography color='text.secondary'>No subscription history yet.</Typography>
            </CardContent>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Plan</TableCell>
                    <TableCell>Billing Cycle</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>{row.plan.name}</TableCell>
                      <TableCell className='capitalize'>{row.billingCycle.toLowerCase()}</TableCell>
                      <TableCell>{new Date(row.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(row.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip size='small' label={row.status} color={statusColor[row.status] ?? 'default'} variant='tonal' />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Grid>

      {/* Upgrade / Downgrade plan picker */}
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          Choose a Plan
          <ToggleButtonGroup
            size='small'
            exclusive
            value={pickerCycle}
            onChange={(_, value) => value && setPickerCycle(value)}
          >
            <ToggleButton value='MONTHLY'>Monthly</ToggleButton>
            <ToggleButton value='YEARLY'>Yearly</ToggleButton>
          </ToggleButtonGroup>
        </DialogTitle>
        <DialogContent>
          {loadingPlans || !activePlans ? (
            <Skeleton variant='rectangular' height={240} />
          ) : (
            <Grid container spacing={4} className='pbs-2'>
              {activePlans.map(plan => {
                const isCurrent = subscription?.planId === plan.id
                const price = pickerCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice

                return (
                  <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant='outlined' className={isCurrent ? 'border-primary' : ''}>
                      <CardContent>
                        <Typography variant='h6'>{plan.name}</Typography>
                        <Typography variant='h4' className='mbe-1'>
                          {formatCurrency(price, 'USD', 'symbol')}
                          <Typography component='span' variant='body2' color='text.secondary'>
                            {pickerCycle === 'YEARLY' ? '/yr' : '/mo'}
                          </Typography>
                        </Typography>
                        <Divider className='mbs-2 mbe-2' />
                        <div className='flex flex-col gap-1 mbe-4'>
                          {(plan.features ?? []).slice(0, 4).map((feature, idx) => (
                            <div key={idx} className='flex items-center gap-2'>
                              <i className='ri-checkbox-circle-line text-success' />
                              <Typography variant='body2'>{feature}</Typography>
                            </div>
                          ))}
                        </div>
                        <Button
                          fullWidth
                          variant={isCurrent ? 'outlined' : 'contained'}
                          disabled={isCurrent || changeSubscription.isPending}
                          onClick={() => handleChoosePlan(plan)}
                        >
                          {isCurrent ? 'Current Plan' : changeSubscription.isPending ? <CircularProgress size={18} /> : 'Select'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Cancel subscription?</DialogTitle>
        <DialogContent>
          <Typography>
            You&apos;ll keep access until {subscription ? new Date(subscription.endDate).toLocaleDateString() : 'it expires'}, but it
            won&apos;t auto-renew after that.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>Keep Subscription</Button>
          <Button color='error' variant='contained' onClick={handleCancel} disabled={cancelSubscription.isPending}>
            {cancelSubscription.isPending ? <CircularProgress size={20} color='inherit' /> : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default SubscriptionOverview
