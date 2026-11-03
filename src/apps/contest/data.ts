import { createMemoryAdapter } from '@/contest/data/memoryAdapter'
import { CONTEST_SEED } from './seed/contest'

/** The back-office person using the demo. Review rules depend on who acts: nobody approves their own question. */
export const EDITOR = 'Ada'

/**
 * The demo's backend: everything lives in memory and in localStorage. The `.v9` in the key is the seed's version: change it
 * when the seed changes, so visitors do not keep an old copy.
 */
export const adapter = createMemoryAdapter(CONTEST_SEED, { storageKey: 'contest.demo.state.v9', latencyMs: 140, actor: EDITOR })

/** The demo participant: an invited person from the seed, so the quiz starts empty. */
export const ME = 'p11'
