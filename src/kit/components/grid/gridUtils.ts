/** Splits a locale's number format into its group and decimal separators. */
function separators(locale: string) {
  let parts: Intl.NumberFormatPart[]
  try {
    parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  } catch {
    parts = new Intl.NumberFormat('en-US').formatToParts(12345.6)
  }
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  }
}

/**
 * Reads a number typed or pasted by a person: currency symbols, spaces and the locale's
 * thousands separator are ignored, "-" or "(…)" make it negative. Returns null when it is not a number.
 */
export function parseNumber(text: string, locale: string): number | null {
  const { group, decimal } = separators(locale)
  const cleaned = text.replace(/[^\d.,\-−()]/g, '')
  if (!/\d/.test(cleaned)) return null
  const negative = /[-−]/.test(cleaned) || /^\(.*\)$/.test(cleaned)
  let digits = cleaned.replace(/[-−()]/g, '')
  if (group !== decimal) digits = digits.split(group).join('')
  digits = digits.replace(decimal, '.')
  if ((digits.match(/\./g) ?? []).length > 1) return null
  const n = Number(digits)
  return Number.isFinite(n) ? (negative ? -n : n) : null
}

/** A number in the locale's decimal style without thousands separators, for editing and export. */
export function plainNumber(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 6 }).format(n)
  } catch {
    return String(n)
  }
}

/** 0 → A, 25 → Z, 26 → AA */
export function columnLetter(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

/** Quotes a CSV field when needed. */
function field(text: string, delimiter: string): string {
  return /["\n\r]/.test(text) || text.includes(delimiter) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Excel in locales with a decimal comma expects semicolons. */
export function csvDelimiter(locale: string): string {
  return separators(locale).decimal === ',' ? ';' : ','
}

export function toCsv(rows: string[][], delimiter: string): string {
  return rows.map((r) => r.map((c) => field(c, delimiter)).join(delimiter)).join('\r\n')
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  // The BOM makes Excel read the file as UTF-8.
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
