import { createMemoryAdapter } from '@/contest/data/memoryAdapter'
import { CONTEST_SEED } from './seed/contest'

/**
 * The demo's backend: everything lives in memory and in localStorage. The `.v1` in the key is the seed's version: change it
 * when the seed changes, so visitors do not keep an old copy.
 */
export const adapter = createMemoryAdapter(CONTEST_SEED, { storageKey: 'contest.demo.state.v2', latencyMs: 140 })

/** The demo participant: an invited person from the seed, so the quiz starts empty. */
export const ME = 'p11'
