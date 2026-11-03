/** The demo's "today" at 09:00 UTC, so dates, countdowns and "Yesterday" labels always make sense. */
export const T0 = new Date().setUTCHours(9, 0, 0, 0)
export const day = (n: number, hour = 9) => new Date(T0 + n * 86_400_000 + (hour - 9) * 3_600_000).toISOString()
