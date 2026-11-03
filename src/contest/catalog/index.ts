import { auditDocs } from './audit.ts'
import { communicationDocs } from './communication.ts'
import { dataDocs } from './data.ts'
import { gateDocs } from './gate.ts'
import { liveDocs } from './live.ts'
import type { ContestDoc, ContestGroupDoc } from './define.ts'
import { mediaDocs } from './media.ts'
import { moderationDocs } from './moderation.ts'
import { packDocs } from './packs.ts'
import { peopleDocs } from './people.ts'
import { programDocs } from './program.ts'
import { questionDocs } from './questions.ts'
import { reviewDocs } from './review.ts'
import { surveyDocs } from './surveys.ts'
import { weeklyDocs } from './weekly.ts'
import { ruleDocs } from './rules.ts'

export type { ContestDoc, ContestGroupDoc, ContestGroupId } from './define.ts'

/** The groups of the contest layer, in the order they are listed in the docs. */
export const CONTEST_GROUPS: ContestGroupDoc[] = [
  { id: 'questions', title: 'Questions & answers', description: 'Write a question, set its answer key, preview it as a participant, and run the quiz.' },
  { id: 'review', title: 'Question review', description: 'Getting a question from a draft to the bank: views with counts, a queue, bulk actions with a dry run, one question at a time with its history, and a reason for every return.' },
  { id: 'media', title: 'Media', description: 'Upload, browse, view, choose and crop pictures, sounds and video.' },
  { id: 'communication', title: 'Announcements & notifications', description: 'Write an announcement for the right people and channels, preview it, and show it to participants as news and as a bell.' },
  { id: 'people', title: 'Participants & scoring', description: 'Invite and manage people, review their answers, score by rubric, and show the ranking.' },
  { id: 'packs', title: 'Content packs', description: 'The snapshot of approved questions the shows are served from: what is in force, coverage by topic, what changed in the bank since, the next pack, and the history.' },
  { id: 'moderation', title: 'Reports & moderation', description: 'Reports about players and questions as cases: a queue by urgency, the evidence and why a case is urgent, a decision with its consequences, and the record of each player.' },
  { id: 'versions', title: 'Version gate', description: 'Which builds of the app may play: players by build, the rule per store, what a player sees, the review before a save, and the simulator.' },
  { id: 'weekly', title: 'Weekly show', description: 'Level, time and source of a question; choosing questions; building the line-up with its difficulty curve; the rundown; and checking levels against real answers.' },
  { id: 'program', title: 'Weekly program', description: 'The recurring plan of the contest: the week board, a show editor, the seats that lead to the final, checks, and the review before a save.' },
  { id: 'live', title: 'Live show', description: 'The waiting room, the player stage, the host console, the answer bars, the scoreboard and the recap.' },
  { id: 'surveys', title: 'Surveys & polls', description: 'Scales, one-tap polls, a survey runner and builder, and the results.' },
  { id: 'audit', title: 'Audit trail', description: 'The record of who changed what: activity per day, filters, the list of changes, one change in full with a readable diff, and revert.' },
  { id: 'data', title: 'Data & hooks', description: 'The backend interface, the in-memory backend, and the hooks that load and save contest data.' },
  { id: 'rules', title: 'Scoring & rules', description: 'Pure functions: scoring, question types, upload rules and crop maths.' },
]

/** Every documented component, hook and utility of the contest layer. */
export const CONTEST_DOCS: ContestDoc[] = [...questionDocs, ...reviewDocs, ...mediaDocs, ...communicationDocs, ...peopleDocs, ...packDocs, ...moderationDocs, ...gateDocs, ...weeklyDocs, ...programDocs, ...liveDocs, ...surveyDocs, ...auditDocs, ...dataDocs, ...ruleDocs]
