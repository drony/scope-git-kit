import { filterFiles } from '@/kit/components/forms/Dropzone'

export interface MediaRules {
  /** Comma-separated types, as in an `<input accept>`: `image/*,audio/mpeg`. */
  accept: string
  maxMb: number
  minWidth?: number
  minHeight?: number
  maxDurationSec?: number
}

export const formatBytes = (n: number): string => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

export const formatDuration = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`

function measure(file: File): Promise<{ width?: number; height?: number; durationSec?: number }> {
  const url = URL.createObjectURL(file)
  const done = <T,>(value: T) => {
    URL.revokeObjectURL(url)
    return value
  }
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(done({ width: img.naturalWidth, height: img.naturalHeight }))
      img.onerror = () => resolve(done({}))
      img.src = url
    })
  }
  if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
    return new Promise((resolve) => {
      const el = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video')
      el.preload = 'metadata'
      el.onloadedmetadata = () => resolve(done({ durationSec: Number.isFinite(el.duration) ? el.duration : undefined }))
      el.onerror = () => resolve(done({}))
      el.src = url
    })
  }
  return Promise.resolve(done({}))
}

/** Checks a file against the rules. Returns a sentence for the person, or null when the file is fine. */
export async function validateMediaFile(file: File, rules: MediaRules): Promise<string | null> {
  const { error } = filterFiles([file], rules.accept, rules.maxMb)
  if (error) return error
  if (rules.minWidth || rules.minHeight || rules.maxDurationSec) {
    const m = await measure(file)
    if (rules.minWidth && m.width !== undefined && m.width < rules.minWidth) return `${file.name} is ${m.width} px wide; the smallest allowed is ${rules.minWidth} px.`
    if (rules.minHeight && m.height !== undefined && m.height < rules.minHeight) return `${file.name} is ${m.height} px tall; the smallest allowed is ${rules.minHeight} px.`
    if (rules.maxDurationSec && m.durationSec !== undefined && m.durationSec > rules.maxDurationSec) return `${file.name} is ${formatDuration(m.durationSec)} long; the longest allowed is ${formatDuration(rules.maxDurationSec)}.`
  }
  return null
}

/** A short label for an `accept` string, for hints: `image/*,audio/mpeg` becomes "images and MP3 audio". */
export function describeAccept(accept: string): string {
  const names = accept.split(',').map((r) => r.trim()).map((r) => (r === 'image/*' ? 'images' : r === 'audio/*' ? 'audio' : r === 'video/*' ? 'video' : r === 'application/pdf' ? 'PDF files' : r))
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
}
