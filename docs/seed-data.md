# Seed data

All fictional data lives in `src/apps/<app>/seed`. Nothing else in the project invents a number, a name or an article. That is what
makes the demo replaceable: swap these modules for your API and the pages keep working.

| Module | Contains |
| --- | --- |
| `market.ts` | Assets and their price history, holdings, portfolio series, transactions, calendar events, headlines |
| `finance.ts` | The cash flow rows (July to October 2026) and the functions that read an amount, budget or note |
| `help.ts` | Help center categories and articles |
| `content.ts` | Pricing plans and FAQs |

The Contest Scope app (`src/apps/contest/seed`) has its own seed:

| Module | Contains |
| --- | --- |
| `time.ts` | `T0` (today, 09:00 UTC) and `day(n, hour)`: every date is worked out from today, so "tomorrow" stays tomorrow |
| `contest.ts` | The contest, rounds and prizes, the first questions with their answer keys, media, participants, submissions, announcements |
| `audit.ts` | The audit trail: about thirty changes over the last weeks by four people, written from the seed itself so the snapshots match the demo. Edits, approvals, returns, a deletion, decisions about reports, a gate change, packs, the program, a topic, media, the contest, and one change that was reverted |
| `packs.ts` | The topics (one archived) and three content packs, the last one in force. The pack in force has drifted from the bank: three questions were approved after it, two were edited, one was returned to review and one belongs to the archived topic |
| `gate.ts` | The version gate in force for App Store, TestFlight and Google Play, how many players use each build (made from a fixed seed, leaning to the newest builds) and the build each demo participant plays on: most are current, a few are behind, one is below the minimum and one is on a stopped build |
| `moderation.ts` | Reports about players and questions (open and handled), the violations that came from them and one claim. `applyEvidence` gives two players traces in their answers: one answers within a second or two, one gives the same unusual wrong answers as another |
| `review.ts` | Sixteen more questions at every stage of the review (drafts, waiting, pre-approved, returned with a reason, in the trash, approved) and a review history for the questions that were already in the bank. Four people write and review: Ada is the demo editor, so some questions wait for her and some she cannot touch |
| `program.ts` | The weekly program (Monday to Saturday daily shows at 20:00 Istanbul time, a Sunday final) and registration counts for the next two weeks. The counts come from a fixed seed: highest for the nearest shows, one show is full |
| `weekly.ts` | More questions (level 1 to 5, topics, sources; one rests only on Wikipedia, one has no source), three past shows with results, the next show, a draft with problems, surveys and their answers |

The weekly seed is made with `mulberry32` and `lib/simulate.ts`: a past show is played by bots, so some questions turn out easier or
harder than their level. That is what gives `DifficultyCalibration` something to show. The stored demo state has a version in its
key (`contest.demo.state.v9`); raise it when the shape of the seed changes.

## Properties of the seed layer

- **Deterministic.** Series are generated with a seeded random generator (`kit/lib/random.ts`), so every reload and every
  visitor sees the same numbers.
- **Plain TypeScript.** No React, no rendering. `npm run check:layers` fails if a seed file imports React, a page or a kit component
  (type-only imports are allowed).
- **Typed.** Each module exports the types its consumers use (`Asset`, `HoldingRow`, `CashRowDef`, `HelpArticle` …).

## Replacing it with real data

1. Keep the **types**, change where the values come from. For example, make `holdingRows()` call your API and return the
   same `HoldingRow[]`.
2. Most screens read seed functions synchronously. For async data, fetch in the page (or a hook) and pass the result to the
   kit component as props; the kit components do not care where rows come from.
3. Remove what you do not need. The demo pages that use the seed are the only consumers, so deleting a page and its seed
   module together is safe.

## Editable tables and stored edits

The cash flow and positions tables do not modify the seed. Edits are stored separately in `localStorage` as
`{ "rowId|column": value }` (`kit/lib/edits.ts`) and layered on top of the seed values when rendering. To persist edits
on a server, replace `loadEdits` / `saveEdits` in `useEditStore` with calls to your API.
