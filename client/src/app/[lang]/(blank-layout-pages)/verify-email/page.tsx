import type { Metadata } from 'next'

import VerifyEmail from '@views/VerifyEmail'

export const metadata: Metadata = {
  title: 'Verify Email'
}

// Deliberately NOT under (guest-only): that group redirects away anyone
// with an existing session, but a verification link can legitimately be
// clicked while logged out (the common case, fresh off registration) or
// with a stale session lying around - it should work either way.
const VerifyEmailPage = () => {
  return <VerifyEmail />
}

export default VerifyEmailPage
