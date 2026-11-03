import raw from './app.config.json'
import { mergeConfig } from '@/kit/theme/theme'

/**
 * This project's saved configuration (colors, style, locale, currency). Missing or invalid values in
 * app.config.json fall back to the kit's defaults, so a partial file is fine.
 */
export const SAVED_CONFIG = mergeConfig(raw)
