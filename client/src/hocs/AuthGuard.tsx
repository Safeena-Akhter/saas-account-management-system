// Third-party Imports
import { getServerSession } from 'next-auth'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'
import type { AppRole } from '@/utils/roleRoutes'

// Lib Imports
import { authOptions } from '@/libs/auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'
import NotAuthorized from '@views/NotAuthorized'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  locale: Locale
  // Restricts this route to specific roles on top of "must be logged in".
  // Leave unset for routes any authenticated role can access.
  allowedRoles?: AppRole[]
}

export default async function AuthGuard({ children, locale, allowedRoles }: Props) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <AuthRedirect lang={locale} />
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    const mode = await getServerMode()

    return <NotAuthorized mode={mode} />
  }

  return <>{children}</>
}
