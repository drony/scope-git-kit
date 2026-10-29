import { useMemo, useState } from 'react'
import { ClipboardPaste, Copy, Download, Moon, RotateCcw, Save, Sun, Monitor } from 'lucide-react'
import { useConfig } from '@/context/ConfigContext'
import { useToast } from '@/context/ToastContext'
import { useCopy } from '@/lib/useCopy'
import { FONT_LABELS, PRESETS, contrast } from '@/config/theme'
import type { FontId, Mode, PaletteKey, ShadowId, SiteConfig, Theme, ThemeStyle } from '@/config/schema'
import { Button } from '@/components/ui/Button'
import { Tag, type Tone } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Feedback'
import { Segmented } from '@/components/nav/Segmented'
import { Tabs } from '@/components/nav/Tabs'
import { Field, Input, Textarea } from '@/components/forms/Field'
import { Select } from '@/components/forms/Select'
import { Slider } from '@/components/forms/Slider'
import { Modal } from '@/components/overlays/Modal'
import { ColorField } from './ColorField'

/* ---- what can be edited ---------------------------------------------------------- */

const COLOR_GROUPS: { title: string; items: { key: PaletteKey; label: string; hint?: string }[] }[] = [
  {
    title: 'Surfaces',
    items: [
      { key: 'canvas', label: 'Page background' },
      { key: 'surface', label: 'Cards & panels' },
      { key: 'soft', label: 'Subtle background', hint: 'Captions, hovers' },
      { key: 'hairline', label: 'Faint dividers' },
      { key: 'line', label: 'Borders' },
      { key: 'lineStrong', label: 'Strong borders', hint: 'Input hover' },
    ],
  },
  {
    title: 'Text',
    items: [
      { key: 'ink', label: 'Headings & main text' },
      { key: 'body', label: 'Body text' },
      { key: 'muted', label: 'Secondary text' },
    ],
  },
  {
    title: 'Buttons',
    items: [
      { key: 'primary', label: 'Primary button' },
      { key: 'primaryText', label: 'Primary button text' },
    ],
  },
  { title: 'Brand', items: [{ key: 'accent', label: 'Accent', hint: 'Links, focus, highlights' }] },
  {
    title: 'Status',
    items: [
      { key: 'success', label: 'Gains & success' },
      { key: 'warning', label: 'Warnings' },
      { key: 'error', label: 'Losses & errors' },
    ],
  },
  { title: 'Code', items: [{ key: 'terminal', label: 'Code block background' }] },
]

const CONTRAST_CHECKS: { fg: PaletteKey; bg: PaletteKey; label: string }[] = [
  { fg: 'ink', bg: 'canvas', label: 'Headings on page' },
  { fg: 'body', bg: 'canvas', label: 'Body text on page' },
  { fg: 'muted', bg: 'canvas', label: 'Secondary text' },
  { fg: 'primaryText', bg: 'primary', label: 'Button label' },
  { fg: 'accent', bg: 'canvas', label: 'Accent on page' },
]

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'tr-TR', label: 'Türkçe' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'es-ES', label: 'Español' },
  { value: 'ja-JP', label: '日本語' },
]
const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'JPY', 'CHF', 'CAD', 'AUD'].map((c) => ({ value: c, label: c }))

function grade(ratio: number): { tone: Tone; text: string } {
  if (ratio >= 7) return { tone: 'success', text: 'AAA' }
  if (ratio >= 4.5) return { tone: 'success', text: 'AA' }
  if (ratio >= 3) return { tone: 'warning', text: 'Large only' }
  return { tone: 'error', text: 'Low' }
}

/* ---- pieces ----------------------------------------------------------------------- */

function ColorsTab() {
  const { config, setConfig, resolvedMode } = useConfig()
  const palette = config.theme.colors[resolvedMode]

  const setColor = (key: PaletteKey, hex: string) =>
    setConfig((c) => ({
      ...c,
      theme: { ...c.theme, colors: { ...c.theme.colors, [resolvedMode]: { ...c.theme.colors[resolvedMode], [key]: hex } } },
    }))

  const activePreset = PRESETS.find((p) => JSON.stringify(p.theme.colors) === JSON.stringify(config.theme.colors))?.id

  return (
    <div>
      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Presets
        </span>
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="preset"
              aria-pressed={activePreset === p.id}
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  theme: { ...c.theme, colors: p.theme.colors, gradient: p.theme.gradient, chart: p.theme.chart },
                }))
              }
            >
              <span className="preset-swatch">
                {p.swatch.map((s) => (
                  <i key={s} style={{ background: s }} />
                ))}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <p className="small" style={{ paddingTop: '1rem' }}>
        Editing the <strong>{resolvedMode}</strong> palette. Switch mode in the Style tab to edit the other one.
      </p>

      {COLOR_GROUPS.map((group) => (
        <div className="editor-section" key={group.title}>
          <span className="eyebrow" style={{ margin: 0 }}>
            {group.title}
          </span>
          {group.items.map((item) => (
            <div className="color-row" key={item.key}>
              <div className="color-name">
                {item.label}
                {item.hint && <small>{item.hint}</small>}
              </div>
              <ColorField label={item.label} value={palette[item.key]} onChange={(hex) => setColor(item.key, hex)} />
            </div>
          ))}
        </div>
      ))}

      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Readability (WCAG)
        </span>
        {CONTRAST_CHECKS.map((c) => {
          const ratio = contrast(palette[c.fg], palette[c.bg])
          const g = grade(ratio)
          return (
            <div className="row spread" key={c.label}>
              <span className="small">{c.label}</span>
              <span className="row" style={{ gap: '0.5rem' }}>
                <span className="mono small tnum">{ratio.toFixed(1)}:1</span>
                <Tag tone={g.tone}>{g.text}</Tag>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GradientTab() {
  const { config, setConfig } = useConfig()
  const { gradient, chart } = config.theme

  const setList = (key: 'gradient' | 'chart', index: number, hex: string) =>
    setConfig((c) => ({
      ...c,
      theme: { ...c.theme, [key]: c.theme[key].map((v, i) => (i === index ? hex : v)) } as Theme,
    }))

  return (
    <div>
      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Brand gradient
        </span>
        <div className="gradient-preview" />
        <h3 className="gradient-sample">
          <span className="gradient">In plain sight.</span>
        </h3>
        {gradient.map((hex, i) => (
          <div className="color-row" key={i}>
            <div className="color-name">Stop {i + 1}</div>
            <ColorField label={`Gradient stop ${i + 1}`} value={hex} onChange={(v) => setList('gradient', i, v)} />
          </div>
        ))}
      </div>
      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Chart colors
        </span>
        <div className="chart-preview">
          {chart.map((hex, i) => (
            <i key={i} style={{ background: hex, height: `${34 + ((i * 37) % 46)}px` }} />
          ))}
        </div>
        {chart.map((hex, i) => (
          <div className="color-row" key={i}>
            <div className="color-name">Series {i + 1}</div>
            <ColorField label={`Chart series ${i + 1}`} value={hex} onChange={(v) => setList('chart', i, v)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function StyleTab() {
  const { config, setConfig } = useConfig()
  const { style, mode } = config.theme

  const patch = (partial: Partial<ThemeStyle>) =>
    setConfig((c) => ({ ...c, theme: { ...c.theme, style: { ...c.theme.style, ...partial } } }))

  return (
    <div>
      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Mode
        </span>
        <Segmented<Mode>
          ariaLabel="Color mode"
          value={mode}
          onChange={(m) => setConfig((c) => ({ ...c, theme: { ...c.theme, mode: m } }))}
          options={[
            { value: 'light', label: 'Light', icon: <Sun aria-hidden="true" /> },
            { value: 'dark', label: 'Dark', icon: <Moon aria-hidden="true" /> },
            { value: 'system', label: 'System', icon: <Monitor aria-hidden="true" /> },
          ]}
        />
      </div>
      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Shape & layout
        </span>
        <Slider label="Corner radius" value={style.radius} min={0} max={24} format={(v) => `${v}px`} onChange={(radius) => patch({ radius })} />
        <Slider
          label="Content width (home, help, sign in)"
          value={style.shell}
          min={880}
          max={1440}
          step={8}
          format={(v) => `${v}px`}
          onChange={(shell) => patch({ shell, shellWide: Math.max(style.shellWide, shell) })}
        />
        <Slider
          label="Wide pages (dashboard, tables, markets)"
          value={style.shellWide}
          min={Math.max(1000, style.shell)}
          max={1920}
          step={8}
          format={(v) => `${v}px`}
          onChange={(shellWide) => patch({ shellWide })}
        />
        <Slider
          label="Header height"
          value={style.navHeight}
          min={56}
          max={120}
          step={2}
          format={(v) => `${v}px`}
          onChange={(navHeight) => patch({ navHeight })}
        />
        <div className="stack-sm">
          <span className="field-label">Shadows</span>
          <Segmented<ShadowId>
            ariaLabel="Shadow strength"
            value={style.shadow}
            onChange={(shadow) => patch({ shadow })}
            options={[
              { value: 'none', label: 'Flat' },
              { value: 'soft', label: 'Soft' },
              { value: 'lifted', label: 'Lifted' },
            ]}
          />
        </div>
      </div>
      <div className="editor-section">
        <span className="eyebrow" style={{ margin: 0 }}>
          Typography
        </span>
        <Field label="Font family">
          <Select<FontId>
            value={style.font}
            onChange={(font) => patch({ font })}
            options={(Object.keys(FONT_LABELS) as FontId[]).map((f) => ({ value: f, label: FONT_LABELS[f] }))}
          />
        </Field>
      </div>
    </div>
  )
}

function GeneralTab() {
  const { config, setConfig } = useConfig()
  const { site } = config

  const patch = (partial: Partial<SiteConfig>) => setConfig((c) => ({ ...c, site: { ...c.site, ...partial } }))

  return (
    <div className="editor-section" style={{ borderBottom: 0 }}>
      <Field label="Site name">
        <Input value={site.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>
      <Field label="Tagline">
        <Input value={site.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
      </Field>
      <Field label="Language & number format" hint="Dates, months and numbers follow this locale.">
        <Select value={site.locale} onChange={(locale) => patch({ locale })} options={LOCALES} />
      </Field>
      <Field label="Currency">
        <Select value={site.currency} onChange={(currency) => patch({ currency })} options={CURRENCIES} searchable />
      </Field>
      <div className="stack-sm">
        <span className="field-label">Week starts on</span>
        <Segmented<'1' | '0'>
          ariaLabel="First day of the week"
          value={String(site.weekStartsOn) as '1' | '0'}
          onChange={(v) => patch({ weekStartsOn: v === '1' ? 1 : 0 })}
          options={[
            { value: '1', label: 'Monday' },
            { value: '0', label: 'Sunday' },
          ]}
        />
      </div>
      <Field label="Support email">
        <Input type="email" value={site.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} />
      </Field>
    </div>
  )
}

function OutputTab() {
  const { exportJson, importJson, dirty, saveToProject, resetToSaved, resetToFactory } = useConfig()
  const toast = useToast()
  const { copy, copied } = useCopy()
  const [importing, setImporting] = useState(false)
  const [pasted, setPasted] = useState('')
  const [importError, setImportError] = useState(false)
  const [saving, setSaving] = useState(false)
  const json = useMemo(() => exportJson(), [exportJson])

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'app.config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const save = async () => {
    setSaving(true)
    const res = await saveToProject()
    setSaving(false)
    toast.push(
      res.ok
        ? { tone: 'success', title: 'Saved to project', description: 'src/config/app.config.json was updated.' }
        : { tone: 'error', title: 'Could not save', description: res.error },
    )
  }

  return (
    <div className="stack">
      <Alert tone={dirty ? 'warning' : 'success'} title={dirty ? 'You have unsaved changes' : 'Matches the saved config'}>
        {dirty
          ? 'They live in this browser only. Copy the JSON, or save it to the project file.'
          : 'The live site is exactly what src/config/app.config.json contains.'}
      </Alert>

      <pre className="json-box" tabIndex={0} aria-label="Current configuration as JSON">
        {json}
      </pre>

      <div className="row wrap">
        <Button onClick={async () => toast.push((await copy(json)) ? { tone: 'success', title: 'JSON copied' } : { tone: 'error', title: 'Copy failed' })}>
          <Copy aria-hidden="true" />
          {copied ? 'Copied' : 'Copy JSON'}
        </Button>
        <Button variant="ghost" onClick={download}>
          <Download aria-hidden="true" />
          Download
        </Button>
        <Button variant="ghost" onClick={() => setImporting(true)}>
          <ClipboardPaste aria-hidden="true" />
          Import
        </Button>
      </div>

      {import.meta.env.DEV && (
        <div className="stack-sm">
          <Button onClick={save} loading={saving} disabled={!dirty} block>
            <Save aria-hidden="true" />
            Save to project
          </Button>
          <span className="field-hint">Dev server only. Writes src/config/app.config.json directly.</span>
        </div>
      )}

      <div className="row wrap">
        <Button variant="plain" size="sm" onClick={resetToSaved} disabled={!dirty}>
          <RotateCcw aria-hidden="true" />
          Discard changes
        </Button>
        <Button variant="plain" size="sm" onClick={resetToFactory}>
          Reset to factory
        </Button>
      </div>

      <Modal
        open={importing}
        onClose={() => setImporting(false)}
        title="Import configuration"
        description="Paste the contents of an app.config.json. Missing values fall back to the saved config."
        actions={
          <>
            <Button variant="ghost" onClick={() => setImporting(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pasted.trim()}
              onClick={() => {
                const ok = importJson(pasted)
                setImportError(!ok)
                if (ok) {
                  setImporting(false)
                  setPasted('')
                  toast.push({ tone: 'success', title: 'Configuration imported' })
                }
              }}
            >
              Apply
            </Button>
          </>
        }
      >
        <Field error={importError ? 'That is not valid JSON.' : undefined}>
          <Textarea
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value)
              setImportError(false)
            }}
            rows={9}
            spellCheck={false}
            style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}
            placeholder='{ "version": 1, "site": { … }, "theme": { … } }'
          />
        </Field>
      </Modal>
    </div>
  )
}

/* ---- editor ------------------------------------------------------------------------- */

type TabId = 'colors' | 'gradient' | 'style' | 'general' | 'output'

export function ThemeEditor() {
  const [tab, setTab] = useState<TabId>('colors')
  const { dirty } = useConfig()

  return (
    <Tabs
      ariaLabel="Theme editor sections"
      value={tab}
      onChange={(t) => setTab(t as TabId)}
      items={[
        { id: 'colors', label: 'Colors' },
        { id: 'gradient', label: 'Gradient' },
        { id: 'style', label: 'Style' },
        { id: 'general', label: 'General' },
        { id: 'output', label: dirty ? 'Output •' : 'Output' },
      ]}
      panels={{
        colors: <ColorsTab />,
        gradient: <GradientTab />,
        style: <StyleTab />,
        general: <GeneralTab />,
        output: <OutputTab />,
      }}
    />
  )
}
