// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

const API_URL = process.env.API_URL ?? 'http://localhost:5000/api/v1'

// Decodes a JWT's payload without verifying the signature - safe to do here
// because we only read the (non-secret) `exp` claim to know when to refresh;
// the actual signature was already verified by the Express backend that
// issued it, and will be re-verified by Express on every API call.
function decodeAccessTokenExpiry(accessToken: string): number {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'))

    return payload.exp * 1000
  } catch {
    // Fall back to a conservative 5-minute assumption if decoding ever fails
    return Date.now() + 5 * 60 * 1000
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken })
    })

    if (!res.ok) {
      throw new Error('Refresh request failed')
    }

    const data = await res.json()
    const u = data.user

    // This runs automatically every ~15 minutes for every signed-in user
    // (see the "access token expired" branch in the jwt callback below) -
    // it's the mechanism that keeps a long-lived session's company data
    // (name, logo, and critically `currency`) and preferences in sync with
    // the database without the user having to log out and back in.
    //
    // Previously this only refreshed accessToken/refreshToken and left
    // company/preferences/name/etc frozen at whatever they were at login -
    // which is why a Manager/Accountant/Employee who was already signed in
    // kept seeing the company's *old* currency indefinitely after the
    // Owner changed it: the backend was already returning the current
    // currency on every refresh, this function just wasn't reading it.
    return {
      ...token,
      name: u?.name ?? token.name,
      email: u?.email ?? token.email,
      role: u?.role ?? token.role,
      companyId: u?.companyId ?? token.companyId,
      company: u?.company ?? token.company,
      phone: u?.phone ?? token.phone,
      avatarUrl: u?.avatarUrl ?? token.avatarUrl,
      preferences: u?.preferences ?? token.preferences,
      permissions: u?.permissions ?? token.permissions,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? token.refreshToken,
      accessTokenExpires: decodeAccessTokenExpiry(data.accessToken),
      error: undefined
    }
  } catch {
    // Surface the failure on the token so the session callback can flag it;
    // the frontend's axios interceptor / a session-error watcher signs the
    // user out rather than silently looping on a dead refresh token.
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()

        if (!res.ok) {
          // NextAuth only lets `authorize` communicate failure via a thrown
          // Error whose `.message` becomes `res.error` on the client -
          // stringify so Login.tsx can pull out the real backend message.
          throw new Error(JSON.stringify({ message: data.message ?? 'Invalid email or password' }))
        }

        // Whatever is returned here becomes `user` in the jwt() callback below.
        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          companyId: data.user.companyId,
          company: data.user.company,
          phone: data.user.phone ?? null,
          avatarUrl: data.user.avatarUrl ?? null,
          preferences: data.user.preferences,
          permissions: data.user.permissions,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        } as any
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days - bounded by refresh token expiry server-side regardless
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: `user` is only present on the call right after
      // `authorize()` succeeds.
      if (user) {
        const u = user as any

        return {
          ...token,
          id: u.id,
          role: u.role,
          companyId: u.companyId,
          company: u.company,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          preferences: u.preferences,
          permissions: u.permissions,
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          accessTokenExpires: decodeAccessTokenExpiry(u.accessToken)
        }
      }

      // A Settings module mutation (profile/avatar/preferences) just
      // succeeded and called useSession().update(publicUser) - see
      // features/auth/useAuth.ts's PublicUser shape, which is exactly what
      // the backend's toPublicUser() returns from every one of those
      // endpoints. Merge it straight onto the token so the session reflects
      // the change on the very next render, without waiting for the token
      // to naturally expire and refresh.
      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }

      // Subsequent requests: access token still valid (1 min safety buffer).
      if (Date.now() < (token.accessTokenExpires ?? 0) - 60 * 1000) {
        return token
      }

      // Access token expired (or about to) - silently refresh it using the
      // refresh token, without forcing the user to log in again.
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      session.user = {
        id: token.id,
        name: token.name ?? '',
        email: token.email ?? '',
        role: token.role,
        companyId: token.companyId,
        company: token.company,
        phone: token.phone ?? null,
        avatarUrl: token.avatarUrl ?? null,
        preferences: token.preferences ?? {
          theme: 'system',
          language: 'en',
          dateFormat: 'DD/MM/YYYY',
          currencyFormat: 'symbol'
        },
        permissions: token.permissions
      }

      return session
    }
  }
}
