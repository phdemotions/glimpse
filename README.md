# Glimpse

> Make data speak. Locally.

A static, offline-first browser tool that turns raw data files into clear, shareable infographics. Hosted on GitHub Pages. Nothing the user uploads ever leaves their browser.

**Live:** [phdemotions.github.io/glimpse](https://phdemotions.github.io/glimpse) *(deploys with CP-5; until then run locally)*

## What it does

- **Quick mode** — drop a CSV, get an opinionated chart auto-chosen from the data shape: bar / line / scatter / histogram / pie / top-N ranking. Plain-English caption explains the choice. Override any column's inferred type if the auto-pick is wrong
- **View-source** — toggle reveals the Vega-Lite spec JSON + the reasoning behind the chart selection. The pedagogy that ChatGPT code interpreter doesn't ship
- **Infographic mode** *(CP-3)* — generate shareable, social-ready visuals from 8 hand-crafted templates

PDF parsing is moved to **Glimpse-PDF**, a separate v1.1 product.

## Privacy

Data never leaves your browser. There is no server. No analytics. All processing happens locally via WebAssembly.

## Stack

- Vite + React + TypeScript + Tailwind 3
- DuckDB-WASM (data engine, idle-prefetched after landing paint)
- Vega-Lite via vega-embed (single renderer for both modes)
- Dexie.js (saved sessions, CP-4)
- vite-plugin-pwa (offline-first, CP-4)
- Self-hosted variable fonts via @fontsource (Source Serif 4, Inter, JetBrains Mono)

## Run locally

Requires Node 20+ and pnpm 10+.

```bash
pnpm install
pnpm dev          # http://localhost:5173/glimpse/
```

What to try:

| Action | Expected |
|--------|----------|
| Click **Survey responses** | Auto-picks **bar chart** for `role × respondents` with caption explaining the choice |
| Click **Monthly revenue** | Auto-picks **line chart** for the time series |
| Click **Country rankings** | Auto-picks **bar chart** (10 categories ≤ 12) |
| Open **show the spec** disclosure under any chart | Reveals the Vega-Lite spec JSON + the reasoning |
| Override a column's type in the schema table | Chart re-renders with the new picks; caption updates |
| Click **← drop another file** | Resets to landing; previous overrides cleared |
| Drop a `.txt` | Inline error: "isn't a CSV or JSON file" |
| Drop a file >50 MB | Inline error: "Files over 50 MB aren't supported in v1" |
| Resize viewport <768 px | Upload affordance hides; "Glimpse works best on desktop" panel shows |

## Build + preview

```bash
pnpm build        # produces ./dist
pnpm preview      # serves dist at http://localhost:4173/glimpse/ (simulates GitHub Pages)
pnpm typecheck    # strict TS check, no emit
```

## Deploy to GitHub Pages

CP-5 will land a GitHub Action that publishes `dist/` to `gh-pages`. Until then, manual deploy:

```bash
pnpm build
npx gh-pages -d dist -b gh-pages
```

Then in repo settings, point Pages at the `gh-pages` branch / root. Vite's `base: '/glimpse/'` is already configured so the site resolves at `phdemotions.github.io/glimpse`.

## Tests

```bash
pnpm test            # vitest run
pnpm test:watch      # vitest watch mode
```

## Project structure

```
glimpse/
├── docs/plans/                                              ← PLAN.md + per-CP plan files
└── src/
    ├── App.tsx                                              ← state machine + selector + caption
    ├── components/
    │   ├── Landing.tsx, UploadDropzone.tsx, MobileSoftBlock.tsx
    │   ├── SchemaView.tsx                                   ← caption + chart + ViewSource + schema table
    │   ├── ChartView.tsx                                    ← dispatches on ChartChoice.kind
    │   ├── ConfidenceBadge.tsx, TypeOverrideDropdown.tsx
    │   ├── ViewSource.tsx                                   ← spec JSON + why-this-chart
    │   └── ui/                                              ← Wordmark, Eyebrow, Button
    ├── data/
    │   ├── duckdb.ts                                        ← lazy + idle prefetch
    │   ├── ingest.ts                                        ← file → DuckDB table
    │   ├── schema.ts                                        ← extended ColumnInfo (subtype + confidence)
    │   ├── sample-rows.ts                                   ← batched per-column sample fetcher
    │   ├── type-detect.ts                                   ← date / ordinal / Likert / geographic
    │   └── coerce.ts                                        ← BigInt → Number, Date → ISO
    ├── charts/
    │   ├── vega.ts                                          ← brand config + 6 spec builders
    │   ├── selector.ts                                      ← pure ChartChoice selector
    │   ├── captions.ts                                      ← template-based plain-English captions
    │   └── binning.ts                                       ← DuckDB pre-bin for histograms
    └── styles/
        ├── globals.css
        └── tokens.ts                                        ← Ink/Sage/Stone, typography, animation, layout, radius
```

## Status

CP-2 (Quick mode + view-source) shipping. CP-3 (Infographic mode) next.

See [STATUS.md](STATUS.md) for session log and [docs/plans/PLAN.md](docs/plans/PLAN.md) for the full roadmap.

## Part of [Opus Vita](https://opusvita.org)

> "We build tools that make researchers extraordinary."

By the team behind [Claritas](https://claritas-one.vercel.app) and [Arbiter](https://arbiter.ac).
