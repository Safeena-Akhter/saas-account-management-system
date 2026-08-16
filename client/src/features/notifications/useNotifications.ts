import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type { ListNotificationsParams, Notification, NotificationsPagination } from './types'

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (params: ListNotificationsParams = {}) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const
}

type NotificationsPage = {
  notifications: Notification[]
  pagination: NotificationsPagination
}

// Polling interval for the unread badge and the dropdown's recent list -
// this app has no websocket/SSE layer yet (see notification.service.ts's
// "real-time-ready" comment on the backend), so a lightweight poll is the
// pragmatic stand-in until that's added. 30s keeps the badge reasonably
// fresh without hammering the API.
const POLL_INTERVAL_MS = 30_000

// Paginated, filterable list - powers both the bell dropdown's recent
// notifications (small pageSize, no filters) and any future full
// Notification Center page (larger pageSize, isRead/type filters).
export function useNotifications(params: ListNotificationsParams = {}) {
  const { isRead, type, page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: notificationQueryKeys.list({ isRead, type, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationsPage>('/notifications', {
        params: { isRead, type, page, pageSize }
      })

      return data
    },
    refetchInterval: POLL_INTERVAL_MS
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: async () => {
      const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')

      return data.count
    },
    refetchInterval: POLL_INTERVAL_MS
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation<Notification, AxiosError<{ message?: string }>, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ notification: Notification }>(`/notifications/${id}/read`)

      return data.notification
    },
    onSuccess: () => {
      // Invalidate rather than hand-patch the cache - the dropdown, any
      // future full history page, and the unread badge all read from
      // different query keys that would otherwise drift out of sync.
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    }
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation<void, AxiosError<{ message?: string }>, void>({
    mutationFn: async () => {
      await apiClient.patch('/notifications/mark-all-read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    }
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation<void, AxiosError<{ message?: string }>, string>({
    mutationFn: async id => {
      await apiClient.delete(`/notifications/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    }
  })
}
