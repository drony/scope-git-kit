import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppConfig, SiteConfig } from '@/config/schema'
import {
  DRAFT_KEY,
  FACTORY,
  SAVED,
  applyTheme,
  loadDraft,
  mergeConfig,
  sameConfig,
  systemPrefersDark,
  type Resolved,
} from '@/config/theme'
import { storage } from '@/lib/storage'

interface ConfigContextValue {
  /** The live configuration (saved file + any unsaved edits). */
  config: AppConfig
  /** What is currently saved in src/config/app.config.json. */
  saved: AppConfig
  resolvedMode: Resolved
  /** True when the live configuration differs from the saved file. */
  dirty: boolean
  setConfig: (next: AppConfig | ((prev: AppConfig) => AppConfig)) => void
  /** Accepts any JSON (merged with defaults). Returns false when it is not valid JSON. */
  importJson: (text: string) => boolean
  exportJson: () => string
  resetToSaved: () => void
  resetToFactory: () => void
  /** Dev server only: writes src/config/app.config.json. */
  saveToProject: () => Promise<{ ok: boolean; error?: string }>
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
}

const Ctx = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(() => loadDraft() ?? SAVED)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)
  const [panelOpen, setPanelOpen] = useState(false)

  const resolvedMode: Resolved =
    config.theme.mode === 'system' ? (systemDark ? 'dark' : 'light') : config.theme.mode

  useLayoutEffect(() => {
    applyTheme(config.theme, resolvedMode)
  }, [config.theme, resolvedMode])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const dirty = useMemo(() => !sameConfig(config, SAVED), [config])

  useEffect(() => {
    if (dirty) storage.set(DRAFT_KEY, JSON.stringify(config))
    else storage.remove(DRAFT_KEY)
  }, [config, dirty])

  const setConfig = useCallback<ConfigContextValue['setConfig']>((next) => {
    setConfigState((prev) => mergeConfig(typeof next === 'function' ? next(prev) : next, SAVED))
  }, [])

  const importJson = useCallback((text: string) => {
    try {
      setConfigState(mergeConfig(JSON.parse(text), SAVED))
      return true
    } catch {
      return false
    }
  }, [])

  const exportJson = useCallback(() => JSON.stringify(config, null, 2) + '\n', [config])

  const resetToSaved = useCallback(() => setConfigState(SAVED), [])
  const resetToFactory = useCallback(() => setConfigState(FACTORY), [])

  const saveToProject = useCallback(async () => {
    try {
      const res = await fetch('/__config/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (data.ok) {
        storage.remove(DRAFT_KEY)
        // The dev server reloads on its own when the file changes; this is the fallback.
        window.setTimeout(() => window.location.reload(), 600)
      }
      return data
    } catch {
      return { ok: false, error: 'Dev server is not reachable. Use Copy JSON instead.' }
    }
  }, [config])

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      saved: SAVED,
      resolvedMode,
      dirty,
      setConfig,
      importJson,
      exportJson,
      resetToSaved,
      resetToFactory,
      saveToProject,
      panelOpen,
      setPanelOpen,
    }),
    [config, resolvedMode, dirty, setConfig, importJson, exportJson, resetToSaved, resetToFactory, saveToProject, panelOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfig must be used inside <ConfigProvider>')
  return ctx
}

export function useSite(): SiteConfig {
  return useConfig().config.site
}
