# Documentation

This project is a **reusable component kit** with a **demo app** and **seed data** around it. It is not a product: the
finance content (portfolio, markets, cash flow) is fictional and exists to show the components working together.

| Read this | When you want to |
| --- | --- |
| [Getting started](./getting-started.md) | Run the demo, or use the kit in another project |
| [Architecture](./architecture.md) | Understand the three layers and the rules between them |
| [Component reference](./components/README.md) | Look up a component, hook or utility: props, examples, keyboard behavior |
| [The contest layer](./contest.md) | Questions, media, announcements, participants and scoring: data model, backend contract, components |
| [Theming](./theming.md) | Change colors, radius, fonts, widths, locale and currency |
| [Seed data](./seed-data.md) | Replace the fictional data with your own API |
| [Adding a component](./adding-a-component.md) | Build a new kit component the way the existing ones are built |
| [Deployment](./deployment.md) | Publish the demo (GitHub Pages) or build for another host |

The component reference is generated from `src/kit/catalog` and `src/contest/catalog` by `npm run docs`; do not edit it by hand.
