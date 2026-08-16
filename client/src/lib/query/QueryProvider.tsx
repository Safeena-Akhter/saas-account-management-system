'use client'

// React Imports
import { useState, type ReactNode } from 'react'

// Third-party Imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const QueryProvider = ({ children }: { children: ReactNode }) => {
  // A new QueryClient per component instance (not module-level) so that data
  // fetched for one user during SSR is never accidentally shared with the
  // next request. useState's lazy initializer means this only runs once per
  // mount on the client.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Company/customer/invoice data doesn't change every second -
            // avoid refetching every list on every window focus by default.
            // Individual hooks can override this where fresher data matters
            // (e.g. dashboard stats, notifications).
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false
          },
          mutations: {
            retry: 0
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default QueryProvider
