'use client'

import { useSession } from 'next-auth/react'

import { formatCurrency } from '@/utils/currency'

/**
 * Returns a `format(amount)` function that renders a money amount using the
 * current company's currency (Company.currency, set in Business Settings -
 * the single source of truth for *which* currency, company-wide) and the
 * signed-in user's own display style preference (Preferences ->
 * "symbol"/"code", set in /settings - only ever affects *how* it looks, see
 * utils/currency.ts).
 *
 * Falls back to USD/code style before the session has loaded, matching the
 * server's own defaults (see server/src/services/auth.service.ts's
 * toPublicUser and validators/user.validator.ts) so there's no flash of a
 * different format once the session resolves.
 */
export function useCurrencyFormatter() {
  const { data: session } = useSession()

  const currencyCode = session?.user.company?.currency ?? 'USD'
  const style = session?.user.preferences.currencyFormat ?? 'code'

  return (value: number | string | null | undefined) => formatCurrency(value, currencyCode, style)
}
