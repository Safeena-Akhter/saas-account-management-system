import type { Metadata } from 'next'

import NotificationsPage from '@views/notifications/NotificationsPage'

export const metadata: Metadata = {
  title: 'Notifications'
}

const Page = () => {
  return <NotificationsPage />
}

export default Page
