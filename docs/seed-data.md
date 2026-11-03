# Seed data

All fictional data lives in `src/apps/<app>/seed`. Nothing else in the project invents a number, a name or an article. That is what
makes the demo replaceable: swap these modules for your API and the pages keep working.

| Module | Contains |
| --- | --- |
| `market.ts` | Assets and their price history, holdings, portfolio series, transactions, calendar events, headlines |
| `finance.ts` | The cash flow rows (July to October 2026) and the functions that read an amount, budget or note |
| `help.ts` | Help center categories and articles |
| `content.ts` | Pricing plans and FAQs |

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
