# Glimpse

> Make data speak. Locally.

A static, offline-first browser tool that turns raw data files into clear, shareable infographics. Hosted on GitHub Pages. Nothing the user uploads ever leaves their browser.

**Live:** [phdemotions.github.io/glimpse](https://phdemotions.github.io/glimpse) *(deploys with CP-5; until then run locally)*

## What it does

- **Quick mode** *(in progress, CP-2)* — drop a CSV, see opinionated charts auto-chosen from the data shape
- **Infographic mode** *(CP-3)* — generate shareable, social-ready visuals from 8 hand-crafted templates
- **View-source** *(CP-3)* — see the Vega-Lite spec for any chart, plus a plain-English explanation of why this chart shape

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
| Click **Survey responses** | Schema preview + bar chart in <1 s |
| Click **Monthly revenue** or **Country rankings** | Replaces previous dataset |
| Click **← drop another file** | Returns to landing |
| Drop a `.txt` from your filesystem | Inline error: "isn't a CSV or JSON file" |
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

## Project structure

```
glimpse/
├── docs/
│   ├── plans/
│   │   ├── PLAN.md                                          ← durable index, 33 locked decisions, 5 CPs
│   │   └── 2026-04-30-001-feat-glimpse-v1-plan.md           ← CP-1 plan
│   ├── PRODUCT-BRIEF.md
│   ├── VISUAL-IDENTITY.md
│   └── TECHNICAL-ARCHITECTURE.md
├── public/
│   └── samples/                                             ← 3 curated CSVs
└── src/
    ├── App.tsx                                              ← state machine
    ├── components/
    │   ├── Landing.tsx
    │   ├── UploadDropzone.tsx
    │   ├── MobileSoftBlock.tsx
    │   ├── SchemaView.tsx
    │   ├── ChartView.tsx
    │   └── ui/                                              ← Wordmark, Eyebrow, Button
    ├── data/
    │   ├── duckdb.ts                                        ← lazy + idle prefetch
    │   ├── ingest.ts                                        ← file → DuckDB table
    │   └── schema.ts                                        ← types, cardinality, nulls
    ├── charts/
    │   └── vega.ts                                          ← brand-styled Vega config + makeBarSpec
    └── styles/
        ├── globals.css
        └── tokens.ts                                        ← Ink/Sage/Stone, typography, animation, layout, radius
```

## Status

CP-1 (Foundation) shipping on `feat/cp-1-foundation`. CP-2 (Quick mode) next.

See [STATUS.md](STATUS.md) for session log and [docs/plans/PLAN.md](docs/plans/PLAN.md) for the full roadmap.

## Part of [Opus Vita](https://opusvita.org)

> "We build tools that make researchers extraordinary."

By the team behind [Claritas](https://claritas-one.vercel.app) and [Arbiter](https://arbiter.ac).
