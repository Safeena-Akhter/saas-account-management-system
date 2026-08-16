// Single source of truth for turning a raw number into money text anywhere
// in the app. Before this existed, every table/dashboard/report defined its
// own local `currency()` helper hardcoded to
// `toLocaleString(undefined, { style: 'currency', currency: 'USD' })` -
// which is why changing the company's currency in Business Settings had no
// visible effect anywhere else. Every one of those call sites now goes
// through this instead (see hooks/useCurrencyFormatter.ts for the hook
// version used inside components).

export type CurrencyFormatStyle = 'symbol' | 'code'

// Deliberately NOT relying on Intl.NumberFormat's built-in currency symbols
// here: browsers' ICU data has no real glyph for PKR or SAR (it just falls
// back to printing the 3-letter code, making the "symbol" and "code" styles
// look identical for exactly the currencies this deployment's users asked
// for). This table is a small, explicit, easy-to-extend source of truth
// instead - add a row here to support a new currency's "symbol" style.
// `position` follows each currency's common real-world convention: Western
// currencies conventionally prefix ("$2,000.00"), while PKR/SAR/AED are
// more commonly written with the abbreviation after the number in everyday
// use ("2,000.00Rs").
const CURRENCY_META: Record<string, { symbol: string; position: 'prefix' | 'suffix' }> = {
  USD: { symbol: '$', position: 'prefix' },
  EUR: { symbol: '€', position: 'prefix' },
  GBP: { symbol: '£', position: 'prefix' },
  CAD: { symbol: 'CA$', position: 'prefix' },
  AUD: { symbol: 'A$', position: 'prefix' },
  INR: { symbol: '₹', position: 'prefix' },
  PKR: { symbol: 'Rs', position: 'suffix' },
  SAR: { symbol: 'SR', position: 'suffix' },
  AED: { symbol: 'AED', position: 'suffix' }
}

/**
 * Formats a money amount using a given ISO currency code and display style.
 *
 * @param value        Raw amount (number or numeric string - Prisma Decimal
 *                      fields arrive over the API as strings).
 * @param currencyCode The company's currency (Company.currency, e.g.
 *                      "PKR") - never a per-user choice, see
 *                      hooks/useCurrencyFormatter.ts.
 * @param style         'code' -> "PKR 2,000.00" (always unambiguous, works
 *                      for any code even if CURRENCY_META has no entry for
 *                      it). 'symbol' -> "2,000.00Rs" / "$2,000.00" using the
 *                      table above, falling back to 'code' behavior for an
 *                      unlisted currency.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currencyCode: string | null | undefined,
  style: CurrencyFormatStyle = 'code'
): string {
  const amount = Number(value) || 0
  const code = (currencyCode || 'USD').toUpperCase()
  const number = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (style === 'symbol') {
    const meta = CURRENCY_META[code]

    if (meta) {
      return meta.position === 'prefix' ? `${meta.symbol}${number}` : `${number}${meta.symbol}`
    }
  }

  return `${code} ${number}`
}
