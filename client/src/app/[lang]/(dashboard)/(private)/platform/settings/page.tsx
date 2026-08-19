import type { Metadata } from 'next'

import RoleGuard from '@/hocs/RoleGuard'
import PlatformSettingsView from '@views/platform-settings/PlatformSettingsView'

export const metadata: Metadata = {
  title: 'Platform Settings'
}

// SUPER_ADMIN only - server-side enforcement lives on /api/v1/platform/settings
// (requireRole("SUPER_ADMIN") in server/src/routes/platformSettings.routes.ts);
// this RoleGuard is the matching client-side page gate, same pattern as
// platform/users/page.tsx.
const PlatformSettingsPage = () => {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <PlatformSettingsView />
    </RoleGuard>
  )
}

export default PlatformSettingsPage
