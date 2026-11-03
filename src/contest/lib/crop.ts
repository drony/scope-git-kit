/**
 * Crop maths. Pure functions, so the cropper, the thumbnails and the viewer all agree on what part of a picture is shown.
 *
 * Every position here is a fraction (0 to 1) of the picture AFTER it is rotated, because that is what the person sees
 * and drags on. The file itself is never changed: only these numbers are saved (see `MediaAsset.transform`).
 */
import type { MediaAsset } from '../data/types'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export type Rotation = 0 | 90 | 180 | 270
export interface Point {
  x: number
  y: number
}
export type Transform = NonNullable<MediaAsset['transform']>

export const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 }
export const CENTER: Point = { x: 0.5, y: 0.5 }
export const MIN_CROP = 0.05

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The crop and focal point an asset has now, or the whole picture and its centre. */
export function currentCrop(asset: Pick<MediaAsset, 'transform' | 'focal'>): { transform: Transform; focal: Point } {
  return { transform: asset.transform ?? { ...FULL, rotate: 0 }, focal: asset.focal ?? CENTER }
}

/** Width ÷ height of a picture once it is rotated. */
export const rotatedAspect = (width: number, height: number, rotate: Rotation): number => (rotate % 180 === 0 ? width / height : height / width)

/** Turns a quarter turn clockwise (or back) and carries the crop and the focal point along. */
export function rotateCrop(value: { transform: Transform; focal: Point }, direction: 'cw' | 'ccw'): { transform: Transform; focal: Point } {
  const { x, y, w, h } = value.transform
  const { x: fx, y: fy } = value.focal
  const rotate = ((value.transform.rotate + (direction === 'cw' ? 90 : 270)) % 360) as Rotation
  return direction === 'cw'
    ? { transform: { x: 1 - (y + h), y: x, w: h, h: w, rotate }, focal: { x: 1 - fy, y: fx } }
    : { transform: { x: y, y: 1 - (x + w), w: h, h: w, rotate }, focal: { x: fy, y: 1 - fx } }
}

/** The largest rectangle with the given shape that fits inside `inside`, centred in it. `aspect` is width ÷ height in pixels. */
export function fitAspect(inside: Rect, aspect: number, pictureAspect: number): Rect {
  const rel = aspect / pictureAspect // width ÷ height in fractions
  let w = inside.w
  let h = w / rel
  if (h > inside.h) {
    h = inside.h
    w = h * rel
  }
  return { x: inside.x + (inside.w - w) / 2, y: inside.y + (inside.h - h) / 2, w, h }
}

/**
 * What part of the picture a box of the given shape shows. With no `ratio` that is the crop itself. With a `ratio` that
 * differs from the crop's shape, the box covers the crop and slides toward the focal point, so the subject stays in view.
 */
export function visibleWindow(pictureAspect: number, crop: Rect, focal: Point, ratio?: number): Rect {
  const cw = crop.w * pictureAspect // the crop in pixels, with the picture's height as 1
  const ch = crop.h
  if (!ratio || Math.abs(ratio - cw / ch) < 1e-4) return crop
  if (ratio > cw / ch) {
    const h = cw / ratio
    const fy = clamp((focal.y - crop.y) / crop.h, 0, 1)
    return { x: crop.x, w: crop.w, h, y: crop.y + (crop.h - h) * fy }
  }
  const w = (ch * ratio) / pictureAspect
  const fx = clamp((focal.x - crop.x) / crop.w, 0, 1)
  return { y: crop.y, h: crop.h, w, x: crop.x + (crop.w - w) * fx }
}
