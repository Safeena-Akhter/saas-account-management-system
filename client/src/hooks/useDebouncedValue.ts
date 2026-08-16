// React Imports
import { useEffect, useState } from 'react'

// Generic debounce: returns `value`, but only after it's stopped changing
// for `delayMs`. Used by search inputs (e.g. user-management's search box)
// so every keystroke doesn't fire a fresh network request - only pauses do.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)

    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
