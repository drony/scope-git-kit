import { communicationDocs } from './communication.ts'
import { dataDocs } from './data.ts'
import type { ContestDoc, ContestGroupDoc } from './define.ts'
import { mediaDocs } from './media.ts'
import { peopleDocs } from './people.ts'
import { questionDocs } from './questions.ts'
import { ruleDocs } from './rules.ts'

export type { ContestDoc, ContestGroupDoc, ContestGroupId } from './define.ts'

/** The groups of the contest layer, in the order they are listed in the docs. */
export const CONTEST_GROUPS: ContestGroupDoc[] = [
  { id: 'questions', title: 'Questions & answers', description: 'Write a question, set its answer key, preview it as a participant, and run the quiz.' },
  { id: 'media', title: 'Media', description: 'Upload, browse, view, choose and crop pictures, sounds and video.' },
  { id: 'communication', title: 'Announcements & notifications', description: 'Write an announcement for the right people and channels, preview it, and show it to participants as news and as a bell.' },
  { id: 'people', title: 'Participants & scoring', description: 'Invite and manage people, review their answers, score by rubric, and show the ranking.' },
  { id: 'data', title: 'Data & hooks', description: 'The backend interface, the in-memory backend, and the hooks that load and save contest data.' },
  { id: 'rules', title: 'Scoring & rules', description: 'Pure functions: scoring, question types, upload rules and crop maths.' },
]

/** Every documented component, hook and utility of the contest layer. */
export const CONTEST_DOCS: ContestDoc[] = [...questionDocs, ...mediaDocs, ...communicationDocs, ...peopleDocs, ...dataDocs, ...ruleDocs]
