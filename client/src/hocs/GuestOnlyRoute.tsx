// Next Imports
import { redirect } from 'next/navigation'

// Third-party Imports
import { getServerSession } from 'next-auth'

// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// Lib Imports
import { authOptions } from '@/libs/auth'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { getHomeRouteForRole } from '@/utils/roleRoutes'

const GuestOnlyRoute = async ({ children, lang }: ChildrenType & { lang: Locale }) => {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect(getLocalizedUrl(getHomeRouteForRole(session.user.role), lang))
  }

  return <>{children}</>
}

export default GuestOnlyRoute
