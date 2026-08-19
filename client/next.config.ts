import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        // '/' now serves the public landing page (see
        // src/app/[lang]/(blank-layout-pages)/(guest-only)/page.tsx) instead
        // of forcing every visitor straight into the dashboard. Authenticated
        // visitors are still bounced to their role's dashboard by
        // GuestOnlyRoute, which wraps that page server-side.
        source: '/',
        destination: '/en',
        permanent: true,
        locale: false
      },
      {
        source: '/:path((?!en|fr|ar|front-pages|images|api|favicon.ico).*)*',
        destination: '/en/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
