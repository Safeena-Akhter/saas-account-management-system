import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import type { Locale } from '@configs/i18n'

import { authOptions } from '@/libs/auth'
import { getHomeRouteForRole } from '@/utils/roleRoutes'
import { getLocalizedUrl } from '@/utils/i18n'

// Landing spot for the "Dashboard" sidebar link and for themeConfig's
// homePageUrl fallback. AuthGuard (in the parent layout) already guarantees
// there's a session by the time this renders, so this just routes onward to
// the correct role-specific dashboard.
const DashboardsIndexPage = async (props: { params: Promise<{ lang: string }> }) => {
  const { lang } = await props.params
  const session = await getServerSession(authOptions)

  redirect(getLocalizedUrl(getHomeRouteForRole(session?.user.role), lang as Locale))
}

export default DashboardsIndexPage
