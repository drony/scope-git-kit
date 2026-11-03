import { useEffect, useState } from 'react'

/** The current time in milliseconds, updated every `intervalMs`. For countdowns and "5 minutes ago" labels. Pass `0` to stop it. */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (intervalMs <= 0) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
