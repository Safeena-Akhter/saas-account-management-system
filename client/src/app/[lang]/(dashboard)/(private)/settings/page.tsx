import type { Metadata } from 'next'

import SettingsPage from '@views/settings/SettingsPage'

export const metadata: Metadata = {
  title: 'My Settings'
}

// Unlike company/settings, every authenticated role - including
// SUPER_ADMIN, who has no companyId at all - lands here for their own
// Profile/Security/Preferences, so this page is intentionally not wrapped
// in RoleGuard. AuthGuard (in the (private) layout above this route) is
// the only guard it needs.
const Page = () => {
  return <SettingsPage />
}

export default Page
