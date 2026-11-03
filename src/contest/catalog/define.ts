/**
 * The catalog of the contest layer. It uses the same entry shape as the kit catalog (`kit/catalog/define.ts`), with its own
 * group ids. Plain data with no React, so Node can read it directly; `npm run docs` turns it into `docs/components/contest-*.md`.
 */
import type { ComponentDoc, GroupDoc } from '../../kit/catalog/define.ts'

export { prop } from '../../kit/catalog/define.ts'

export type ContestGroupId = 'questions' | 'review' | 'audit' | 'media' | 'communication' | 'people' | 'packs' | 'moderation' | 'versions' | 'weekly' | 'program' | 'live' | 'surveys' | 'data' | 'rules'
export type ContestDoc = ComponentDoc<ContestGroupId>
export type ContestGroupDoc = GroupDoc<ContestGroupId>
