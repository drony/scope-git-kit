# Theming

Everything visual is driven by one file, `src/config/app.config.json`, which the kit turns into CSS variables.

## Three ways to change it

1. **Live editor.** On the dev server click the floating **Theme** button on any page, or open `/settings`. Colors (light and
   dark), brand gradient, chart colors, radius, widths, header height, shadows, font, locale, currency and site name update the
   whole site as you type.
2. **Save.** In the editor's **Output** tab press **Save to project** (dev server only) to write the file, or **Copy JSON** /
   **Download** and replace `app.config.json` yourself.
3. **Edit the JSON.** Missing or invalid values fall back to defaults, so a partial file is fine.

Unsaved edits are kept in your browser (`localStorage`) until you save or discard them.

## The configuration

```jsonc
{
  "version": 1,
  "site": { "name": "…", "tagline": "…", "locale": "en-US", "currency": "USD", "weekStartsOn": 1, "supportEmail": "…" },
  "theme": {
    "mode": "light",                       // "light" | "dark" | "system"
    "colors": { "light": { … }, "dark": { … } },   // 16 colors each, see below
    "gradient": ["#…", "#…", "#…", "#…", "#…", "#…"],  // six stops
    "chart":    ["#…", "#…", "#…", "#…", "#…"],        // five series colors
    "style": { "radius": 10, "shell": 1152, "shellWide": 1440, "navHeight": 104, "shadow": "soft", "font": "geist" }
  }
}
```

The full schema is `src/kit/theme/schema.ts`; the defaults and presets are in `src/kit/theme/theme.ts`.

## CSS variables

`applyTheme` writes these onto `<html>`. Use them in your own CSS; never hard-code a color.

| Variable | From | Used for |
| --- | --- | --- |
| `--canvas` | `canvas` | Page background |
| `--surface` | `surface` | Cards, panels, inputs |
| `--soft` | `soft` | Subtle backgrounds, captions, hovers |
| `--hairline`, `--line`, `--line-strong` | `hairline`, `line`, `lineStrong` | Faint dividers, borders, strong borders |
| `--ink`, `--body`, `--muted` | `ink`, `body`, `muted` | Headings, body text, secondary text |
| `--primary`, `--primary-text` | `primary`, `primaryText` | Primary button and its label |
| `--accent` | `accent` | Links, focus ring, highlights |
| `--success`, `--warning`, `--error` | same | Gains, warnings, losses and errors |
| `--terminal` | `terminal` | Code block background |
| `--g1` … `--g6` | `gradient` | The brand gradient (`--gradient` is derived) |
| `--chart-1` … `--chart-5` | `chart` | Chart series |
| `--radius`, `--radius-sm`, `--radius-lg` | `style.radius` | Corner radii (small and large are derived) |
| `--shell`, `--shell-wide`, `--nav-h` | `style` | Content widths and header height |
| `--sans` | `style.font` | Font stack |

`base.css` derives more tokens from these with `color-mix`: `--accent-strong`, `--accent-soft`, `--accent-wash`, `--success-text`,
`--success-soft`, `--error-soft`, `--warning-soft`, `--primary-hover`. They follow when you change the base colors.

## Dark mode

`mode: "system"` follows the operating system. The editor shows and edits the palette of the mode currently in use; switch
mode in the **Style** tab to edit the other palette. `<html data-theme>` is `light` or `dark`.

## Contrast

The **Colors** tab shows the WCAG contrast of the most important pairs (headings, body, secondary text, button label, accent)
and grades them AAA, AA, "Large only" or "Low". Aim for AA on everything people read.

## Wide pages

Data-heavy pages use `shellWide`; reading pages use `shell`. Which is which is the list in `src/demo/config/pages.ts`.
