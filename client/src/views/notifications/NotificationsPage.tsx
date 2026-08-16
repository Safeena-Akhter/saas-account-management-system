'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import { formatDistanceToNowStrict } from 'date-fns/formatDistanceToNowStrict'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Feature Imports
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications
} from '@/features/notifications/useNotifications'
import type { Notification, NotificationType } from '@/features/notifications/types'
import type { ThemeColor } from '@core/types'

const PAGE_SIZE = 15

// Same event-type -> icon/color mapping as the navbar dropdown (see
// components/layout/shared/NotificationsDropdown.tsx) - kept as its own
// copy here rather than a shared import, since the two components live in
// different parts of the tree (components/ vs views/) and this is a small
// enough lookup table that duplicating it is simpler than introducing a
// new shared-constants module for one object.
const TYPE_META: Record<NotificationType, { icon: string; color: ThemeColor }> = {
  INVOICE_CREATED: { icon: 'ri-file-list-3-line', color: 'info' },
  INVOICE_PAID: { icon: 'ri-checkbox-circle-line', color: 'success' },
  PAYMENT_RECEIVED: { icon: 'ri-money-dollar-circle-line', color: 'success' },
  EXPENSE_ADDED: { icon: 'ri-wallet-3-line', color: 'warning' },
  LOW_STOCK: { icon: 'ri-alert-line', color: 'error' },
  NEW_USER_INVITATION: { icon: 'ri-user-add-line', color: 'primary' },
  COMPANY_UPDATED: { icon: 'ri-building-line', color: 'info' },
  SUBSCRIPTION_EXPIRY: { icon: 'ri-time-line', color: 'error' },
  SYSTEM: { icon: 'ri-notification-3-line', color: 'secondary' }
}

const NotificationsPage = () => {
  const router = useRouter()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useNotifications({
    isRead: filter === 'unread' ? false : undefined,
    page,
    pageSize: PAGE_SIZE
  })

  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = data?.notifications ?? []
  const pagination = data?.pagination

  const handleFilterChange = (_event: SyntheticEvent, value: 'all' | 'unread') => {
    setFilter(value)
    setPage(1)
  }

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Notifications'
        subheader='Everything that has happened across your company'
        action={
          <Button
            size='small'
            variant='outlined'
            startIcon={<i className='ri-mail-open-line' />}
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </Button>
        }
      />
      <Tabs value={filter} onChange={handleFilterChange} className='pli-4'>
        <Tab label='All' value='all' />
        <Tab label='Unread' value='unread' />
      </Tabs>
      <Divider />

      {isLoading ? (
        <div className='p-4 flex flex-col gap-3'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant='rectangular' height={64} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 plb-12'>
          <i className='ri-notification-off-line text-4xl text-textDisabled' />
          <Typography color='text.disabled'>
            {filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}
          </Typography>
        </div>
      ) : (
        <List disablePadding>
          {notifications.map((notification, index) => {
            const { icon, color } = TYPE_META[notification.type] ?? TYPE_META.SYSTEM

            return (
              <div key={notification.id}>
                <ListItemButton
                  onClick={() => handleClick(notification)}
                  className='items-start gap-3 pli-4 plb-3'
                  sx={{ backgroundColor: notification.isRead ? 'transparent' : 'action.hover' }}
                >
                  <CustomAvatar color={color} skin='light-static' className='mbs-1'>
                    <i className={icon} />
                  </CustomAvatar>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        {notification.message}
                        <br />
                        <Typography component='span' variant='caption' color='text.disabled'>
                          {formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                  <Tooltip title='Delete'>
                    <IconButton
                      edge='end'
                      size='small'
                      onClick={e => {
                        e.stopPropagation()
                        deleteNotification.mutate(notification.id)
                      }}
                    >
                      <i className='ri-delete-bin-line' />
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
                {index !== notifications.length - 1 && <Divider />}
              </div>
            )
          })}
        </List>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className='flex justify-center p-4'>
          <Pagination count={pagination.totalPages} page={page} onChange={(_e, value) => setPage(value)} color='primary' />
        </div>
      )}
    </Card>
  )
}

export default NotificationsPage
