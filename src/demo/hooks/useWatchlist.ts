import { useToast } from '@/kit/context/ToastContext'
import { useStoredSet } from '@/kit/hooks/useStoredSet'

/**
 * The demo's watchlist: a set of symbols kept in this browser and shared by every page (Home, Markets, an asset page).
 * Toggling shows a message with an Undo button.
 */
export function useWatchlist() {
  const set = useStoredSet('finscope.watchlist', ['NVDA'])
  const toast = useToast()

  const toggle = (symbol: string): boolean => {
    const on = set.toggle(symbol)
    toast.push({
      key: 'watchlist',
      tone: 'success',
      title: on ? `Added ${symbol} to your watchlist` : `Removed ${symbol} from your watchlist`,
      duration: 5000,
      action: { label: 'Undo', onClick: () => set.toggle(symbol) },
    })
    return on
  }

  return { size: set.size, has: set.has, toggle }
}
