import { Moon, Sun } from 'lucide-react'
import { Menu, type MenuEntry } from '@/kit/components/overlays/Menu'
import { Button } from '@/kit/components/ui/Button'
import { useConfig } from '@/kit/context/ConfigContext'
import { NIGHT_STYLES, nightStyleOf } from '@/kit/theme/theme'

interface ThemeToggleProps {
  className?: string
}

/**
 * An icon button that opens a small menu: light, one of the night-blue dark styles, or the system setting. It writes `theme.mode`
 * (and, for a dark style, `theme.colors.dark`) of the configuration, so the choice is kept in this browser like any other theme edit.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { config, setConfig, resolvedMode } = useConfig()
  const { mode, colors } = config.theme
  const style = nightStyleOf(colors.dark)

  const entries: MenuEntry[] = [
    {
      id: 'light',
      label: 'Light',
      icon: <Sun aria-hidden="true" />,
      selected: mode === 'light',
      onSelect: () => setConfig((c) => ({ ...c, theme: { ...c.theme, mode: 'light' } })),
    },
    { type: 'label', id: 'dark-label', label: 'Dark' },
    ...NIGHT_STYLES.map<MenuEntry>((s) => ({
      id: s.id,
      label: s.name,
      icon: <i className="theme-swatch" style={{ background: s.palette.canvas, boxShadow: `inset 0 0 0 1px ${s.palette.line}, inset -0.5rem 0 0 ${s.palette.accent}` }} />,
      selected: mode === 'dark' && style?.id === s.id,
      onSelect: () => setConfig((c) => ({ ...c, theme: { ...c.theme, mode: 'dark', colors: { ...c.theme.colors, dark: s.palette } } })),
    })),
    { type: 'separator', id: 'sep' },
    {
      id: 'system',
      label: 'Match the system',
      selected: mode === 'system',
      onSelect: () => setConfig((c) => ({ ...c, theme: { ...c.theme, mode: 'system' } })),
    },
  ]

  return (
    <Menu
      entries={entries}
      trigger={
        <Button variant="ghost" size="sm" icon className={className} aria-label="Theme: light, dark or system" aria-haspopup="menu">
          {resolvedMode === 'dark' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </Button>
      }
    />
  )
}
