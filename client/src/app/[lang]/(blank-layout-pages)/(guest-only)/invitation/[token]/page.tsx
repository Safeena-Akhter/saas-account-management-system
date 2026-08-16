// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Invitation from '@views/Invitation'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Accept Invitation',
  description: 'Set up your account'
}

const InvitationPage = async ({ params }: { params: Promise<{ token: string }> }) => {
  // Vars
  const mode = await getServerMode()
  const { token } = await params

  return <Invitation mode={mode} token={token} />
}

export default InvitationPage
