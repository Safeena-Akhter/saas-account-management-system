'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'
import type { MouseEvent, ReactNode } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'
import CircularProgress from '@mui/material/CircularProgress'
import type { Theme } from '@mui/material/styles'

// Third Party Components
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { formatDistanceToNowStrict } from 'date-fns/formatDistanceToNowStrict'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount
} from '@/features/notifications/useNotifications'
import type { Notification, NotificationType } from '@/features/notifications/types'

// How many recent notifications the dropdown shows - this is a quick-glance
// panel, not the full history, so it deliberately doesn't paginate. A
// dedicated Notification Center page (full history, filters) is a natural
// next addition on top of the same useNotifications hook with a larger
// pageSize.
const DROPDOWN_PAGE_SIZE = 8

// Icon + color per event type, per the Notification Types listed in the
// module spec. SYSTEM is the catch-all fallback.
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

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) {
    return <div className='overflow-x-hidden bs-full'>{children}</div>
  } else {
    return (
      <PerfectScrollbar className='bs-full' options={{ wheelPropagation: false, suppressScrollX: true }}>
        {children}
      </PerfectScrollbar>
    )
  }
}

const NotificationsDropdown = () => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  // Hooks
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { settings } = useSettings()
  const router = useRouter()

  const { data, isLoading } = useNotifications({ page: 1, pageSize: DROPDOWN_PAGE_SIZE })
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = data?.notifications ?? []

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id)
    }

    if (notification.link) {
      handleClose()
      router.push(notification.link)
    }
  }

  const handleToggleRead = (event: MouseEvent<HTMLElement>, notification: Notification) => {
    event.stopPropagation()

    // The read side is the only mutation exposed per-notification by the
    // backend (see notification.routes.ts) - there's no "mark as unread"
    // endpoint, so the dot only acts when the notification is still unread.
    if (!notification.isRead) {
      markAsRead.mutate(notification.id)
    }
  }

  const handleRemoveNotification = (event: MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation()
    deleteNotification.mutate(notificationId)
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
  }

  useEffect(() => {
    const adjustPopoverHeight = () => {
      if (ref.current) {
        // Calculate available height, subtracting any fixed UI elements' height as necessary
        const availableHeight = window.innerHeight - 100

        ref.current.style.height = `${Math.min(availableHeight, 550)}px`
      }
    }

    window.addEventListener('resize', adjustPopoverHeight)
  }, [])

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
        <Badge
          color='error'
          className='cursor-pointer'
          variant='dot'
          overlap='circular'
          invisible={unreadCount === 0}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <i className='ri-notification-2-line' />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        ref={ref}
        anchorEl={anchorRef.current}
        {...(isSmallScreen
          ? {
              className: 'is-full !mbs-4 z-[1] max-bs-[550px] bs-[550px]',
              modifiers: [
                {
                  name: 'preventOverflow',
                  options: {
                    padding: themeConfig.layoutPadding
                  }
                }
              ]
            }
          : { className: 'is-96 !mbs-4 z-[1] max-bs-[550px] bs-[550px]' })}
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps} style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper className={classnames('bs-full', settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg')}>
              <ClickAwayListener onClickAway={handleClose}>
                <div className='bs-full flex flex-col'>
                  <div className='flex items-center justify-between plb-3 pli-4 is-full gap-2'>
                    <Typography variant='h6' className='flex-auto'>
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Chip variant='tonal' size='small' color='primary' label={`${unreadCount} New`} />
                    )}
                    {notifications.length > 0 && unreadCount > 0 && (
                      <Tooltip
                        title='Mark all as read'
                        placement={placement === 'bottom-end' ? 'left' : 'right'}
                        slotProps={{
                          popper: {
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                transformOrigin:
                                  placement === 'bottom-end' ? 'right center !important' : 'right center !important'
                              }
                            }
                          }
                        }}
                      >
                        <IconButton size='small' onClick={handleMarkAllRead} className='text-textPrimary'>
                          <i className='ri-mail-open-line text-xl' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                  <Divider />
                  <ScrollWrapper hidden={hidden}>
                    {isLoading ? (
                      <div className='flex items-center justify-center plb-8'>
                        <CircularProgress size={28} />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className='flex flex-col items-center justify-center gap-2 plb-10 pli-4 text-center'>
                        <i className='ri-notification-off-line text-3xl text-textDisabled' />
                        <Typography color='text.disabled'>You&apos;re all caught up.</Typography>
                      </div>
                    ) : (
                      notifications.map((notification, index) => {
                        const { icon, color } = TYPE_META[notification.type] ?? TYPE_META.SYSTEM

                        return (
                          <div
                            key={notification.id}
                            className={classnames('flex plb-3 pli-4 gap-3 cursor-pointer hover:bg-actionHover group', {
                              'border-be': index !== notifications.length - 1
                            })}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CustomAvatar color={color} skin='light-static'>
                              <i className={icon} />
                            </CustomAvatar>
                            <div className='flex flex-col flex-auto'>
                              <Typography variant='body2' className='font-medium mbe-1' color='text.primary'>
                                {notification.title}
                              </Typography>
                              <Typography variant='caption' className='mbe-2' color='text.secondary'>
                                {notification.message}
                              </Typography>
                              <Typography variant='caption' color='text.disabled'>
                                {formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true })}
                              </Typography>
                            </div>
                            <div className='flex flex-col items-end gap-2'>
                              <Badge
                                variant='dot'
                                color={notification.isRead ? 'secondary' : 'primary'}
                                onClick={e => handleToggleRead(e, notification)}
                                className={classnames('mbs-1 mie-1', {
                                  'invisible group-hover:visible': notification.isRead
                                })}
                              />
                              <i
                                className='ri-close-line text-xl invisible group-hover:visible text-textSecondary'
                                onClick={e => handleRemoveNotification(e, notification.id)}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </ScrollWrapper>
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationsDropdown
