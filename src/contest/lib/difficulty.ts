/**
 * The five difficulty levels and what they mean in numbers. The writer's level is a guess; the real level is the share of
 * people who got the question right. A question that most people get right is easy, whatever its writer thought.
 */
import type { Difficulty } from '../data/types'

export interface LevelInfo {
  level: Difficulty
  name: string
  hint: string
  /** The share of right answers this level expects, from (included) to (excluded). */
  range: [number, number]
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Warm-up', hint: 'Nearly everyone knows it.', range: [0.85, 1.01] },
  { level: 2, name: 'Easy', hint: 'Most people get it.', range: [0.65, 0.85] },
  { level: 3, name: 'Medium', hint: 'About half get it.', range: [0.45, 0.65] },
  { level: 4, name: 'Hard', hint: 'Few get it.', range: [0.25, 0.45] },
  { level: 5, name: 'Finale', hint: 'Only the best get it.', range: [0, 0.25] },
]

export const levelInfo = (level: Difficulty): LevelInfo => LEVELS[level - 1]

/** Fewest answers before an observed difficulty is worth trusting. */
export const MIN_ANSWERS = 30

/** The level that a share of right answers (0 to 1) belongs to. */
export function observedLevel(p: number): Difficulty {
  return (LEVELS.find((l) => p >= l.range[0] && p < l.range[1])?.level ?? 5) as Difficulty
}

export interface Calibration {
  state: 'no-data' | 'few-data' | 'fits' | 'easier' | 'harder'
  observed?: Difficulty
  message: string
}

/** Compares the level a writer gave with how people really answered. */
export function calibrationHint(declared: Difficulty | undefined, p: number | null, answered: number): Calibration {
  if (p === null || answered === 0) return { state: 'no-data', message: 'Not asked yet.' }
  const observed = observedLevel(p)
  if (answered < MIN_ANSWERS) return { state: 'few-data', observed, message: `Only ${answered} answers so far; wait for ${MIN_ANSWERS}.` }
  if (!declared) return { state: 'fits', observed, message: `People found it ${levelInfo(observed).name.toLowerCase()}.` }
  const gap = observed - declared
  if (gap === 0) return { state: 'fits', observed, message: 'The level fits how people answered.' }
  return gap < 0
    ? { state: 'easier', observed, message: `Easier than ${levelInfo(declared).name}: ${Math.round(p * 100)}% got it. Move it to ${levelInfo(observed).name}.` }
    : { state: 'harder', observed, message: `Harder than ${levelInfo(declared).name}: ${Math.round(p * 100)}% got it. Move it to ${levelInfo(observed).name}.` }
}
