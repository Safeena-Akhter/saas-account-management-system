// Page-level role restriction. `AuthGuard` (in the (private) layout) already
// guarantees "you must be logged in" for every route under it, but it can't
// know per-page which roles are allowed since layouts are shared across all
// dashboard routes. Wrap the content of a specific page with this instead:
//
//   <RoleGuard allowedRoles={['SUPER_ADMIN']}>
//     <SuperAdminDashboard />
//   </RoleGuard>

import { getServerSession } from 'next-auth'

import type { ChildrenType } from '@core/types'
import type { AppRole } from '@/utils/roleRoutes'
import { authOptions } from '@/libs/auth'
import NotAuthorized from '@views/NotAuthorized'
import { getServerMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  allowedRoles: AppRole[]
}

export default async function RoleGuard({ children, allowedRoles }: Props) {
  const session = await getServerSession(authOptions)
  const mode = await getServerMode()

  if (!session || !allowedRoles.includes(session.user.role)) {
    return <NotAuthorized mode={mode} />
  }

  return <>{children}</>
}
