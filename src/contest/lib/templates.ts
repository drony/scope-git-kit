/**
 * Merge fields in announcements: `{{name}}` becomes the recipient's first name, `{{team}}` their team, `{{contest}}` the
 * contest's title. Pure functions: the composer, the channel previews and the backend all fill a message the same way.
 */

export const TEMPLATE_FIELDS = [
  { name: 'name', label: 'First name', sample: 'Ada', fallback: 'there' },
  { name: 'team', label: 'Team', sample: 'Comets', fallback: 'your team' },
  { name: 'contest', label: 'Contest', sample: 'Aurora Cup', fallback: 'the contest' },
] as const

export type TemplateField = (typeof TEMPLATE_FIELDS)[number]['name']
export type TemplateVars = Partial<Record<TemplateField, string>>

/** Values for a sample recipient, so a preview shows what a real message looks like. */
export const SAMPLE_VARS: Required<TemplateVars> = Object.fromEntries(TEMPLATE_FIELDS.map((f) => [f.name, f.sample])) as Required<TemplateVars>

const FIELD = /\{\{\s*([\w-]+)\s*\}\}/g

/** Fills the known fields. A missing value uses a neutral fallback; unknown fields stay as typed, so a typo is visible. */
export function renderTemplate(text: string, vars: TemplateVars): string {
  return text.replace(FIELD, (whole, name: string) => {
    const field = TEMPLATE_FIELDS.find((f) => f.name === name)
    return field ? vars[field.name] || field.fallback : whole
  })
}

/** Field names in a text that no template knows, for example a misspelled `{{nmae}}`. */
export function findUnknownFields(text: string): string[] {
  const known = new Set<string>(TEMPLATE_FIELDS.map((f) => f.name))
  return [...new Set([...text.matchAll(FIELD)].map((m) => m[1]).filter((name) => !known.has(name)))]
}
