---
title: "feat: Foundation scaffold (CP-1)"
type: feat
status: active
date: 2026-04-30
---

# CP-1: Foundation

> Prove the spine: a user uploads a CSV, sees it parsed, picks a chart, sees the chart. End-to-end. No infographic mode yet, no PDFs, no templates, no view-source.

## Goal

A first-time visitor lands on Glimpse, drops a CSV, and sees a useful, well-styled bar chart within ten seconds. That is the minimum that proves the architecture and the design language.

## Non-goals (CP-1)

- Infographic mode — CP-3
- View-source pedagogy — CP-3 (ships with infographic mode, the moat)
- Service worker / offline — CP-4
- Saved sessions — CP-4
- Auto chart-type selection — CP-2
- PDF parsing — out of v1 scope (Glimpse-PDF v1.1, separate product)

## Scope

### Must ship

1. **Repo scaffold** — Vite + React + TypeScript + Tailwind 3, design tokens (Ink/Sage/Stone), Source Serif 4 + Inter + JetBrains Mono fonts self-hosted
2. **Landing surface** — wordmark header + headline + sub + dropzone + sample-data picker; "an opus vita tool" eyebrow + opusvita.org/github links live in **footer** (per Landing v2 mockup approved 2026-04-30)
3. **File upload** — drag-and-drop and click-to-pick, accept `.csv`, `.xlsx`, `.json`, file-size guard (50MB v1)
4. **DuckDB-WASM init** — lazy-loaded on first upload, ~3–5MB cost amortized after first chart, progress indicator
5. **Schema preview** — table sample (first 10 rows), inferred column types
6. **One chart end-to-end** — pick X column, pick Y column, render a brand-styled bar chart via **Vega-Lite** (single renderer for both modes per Decision #6)
7. **Sample-data picker** — 3 curated CSVs (survey responses, monthly revenue, country rankings)
8. **DuckDB-WASM idle prefetch** — kick off WASM fetch from `requestIdleCallback` after landing paint, not on first click. Mitigates the cold-load risk surfaced in 2026-04-30 doc-review (5MB on 3–10 Mbps dorm wifi = 4–13s)
9. **Empty-state copy** — sells the feeling first ("Drop a spreadsheet. We'll handle the rest.")

### Could ship (stretch)

- Inline error toasts for unsupported file types and oversize files
- Loading skeletons during DuckDB init and parse
- Keyboard support — paste CSV text via Cmd+V on landing

### Locked-decision touchpoints affecting CP-1

- **Decision #6** — Vega-Lite is the single renderer; no Mosaic, no Observable Plot in CP-1 or any later CP
- **Decision #19** — fonts self-hosted in `public/fonts/`, no Google Fonts CDN
- **Decision #20** — Vite `base` config set to `/glimpse/` for `phdemotions.github.io/glimpse` subpath
- **Decision #26** — landing surface implements soft-block at viewports narrower than 768px: "Glimpse works best on desktop." Mobile users still see headline + value prop + footer, just no upload affordance
- **Decision #27** — light mode only; no `dark:` variants in CP-1
- **Decision #28** — no analytics in v1 — no Plausible, no GA, no event payloads of any kind
- **Decision #29** — every CP-1 copy and UI decision serves a student first
- **Decision #33** — landing footer references "by the team behind Claritas and Arbiter" (links to opusvita.org)

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  React UI (Vite, Tailwind, design tokens)              │
│  ├─ <Landing> ── upload affordance, sample picker      │
│  ├─ <SchemaView> ── columns, types, sample rows        │
│  └─ <ChartView> ── X/Y picker, Vega-Lite render        │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Data engine (DuckDB-WASM, idle-prefetched)            │
│  ├─ ingest(file) ── reads CSV/Excel/JSON               │
│  ├─ schema(table) ── column names + inferred types     │
│  └─ query(sql) ── arbitrary SELECT for chart data      │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Render (Vega-Lite via vega-embed)                     │
│  └─ {mark: "bar", encoding: {...}} → SVG → React DOM   │
└────────────────────────────────────────────────────────┘
```

State: `useState` and a small `<DataContext>` are enough for CP-1. Add Zustand or similar in CP-2 only if the state graph grows.

DuckDB-WASM is fetched in `requestIdleCallback` after first paint of the landing — not on the user's first click. Click-time experience: WASM is already warm, parsing begins immediately.

## File layout

```
glimpse/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/
│   ├── fonts/                   ← self-hosted Source Serif 4, Inter, JetBrains Mono
│   └── samples/
│       ├── survey-responses.csv
│       ├── monthly-revenue.csv
│       └── country-rankings.csv
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   ├── globals.css
    │   └── tokens.ts            ← Ink/Sage/Stone palette + typography
    ├── components/
    │   ├── Landing.tsx
    │   ├── UploadDropzone.tsx
    │   ├── SchemaView.tsx
    │   ├── ChartView.tsx
    │   └── ui/                  ← shared primitives (Button, Field, Eyebrow)
    ├── data/
    │   ├── duckdb.ts            ← DuckDB-WASM wrapper, lazy init
    │   ├── ingest.ts            ← file → DuckDB table
    │   └── schema.ts            ← inferred type helpers
    └── charts/
        └── vega.ts              ← Vega-Lite + vega-embed wrapper, brand-styled defaults
```

## Tasks (sequenced)

1. **Initialize project** — `pnpm create vite glimpse --template react-ts`, add Tailwind 3, postcss, autoprefixer
2. **Self-host fonts** — Source Serif 4, Inter, JetBrains Mono in `public/fonts/`, declared in `globals.css` (no Google Fonts CDN)
3. **Build design tokens** — `src/styles/tokens.ts` mirroring `opusvita-org/lib/design/tokens.js` (palette, typography, animation, layout, radius)
4. **Wire Tailwind config** — extend with tokens; match family conventions
5. **Build `<Landing>`** per **Landing v2 mockup** (approved 2026-04-30) — wordmark header ("Glimpse." with sage period) + about link, hairline rule, headline **"Show, don't tell."**, sub ("Drop a spreadsheet or paste a paper. Get a chart worth sharing."), dropzone, sample-data picker, privacy line, hairline rule, footer eyebrow ("an opus vita tool") + opusvita.org · github links
6. **Build `<UploadDropzone>`** — drag-and-drop, click-to-pick, accept rules, file-size guard
7. **Wire DuckDB-WASM** — install `@duckdb/duckdb-wasm`, **prefetch via `requestIdleCallback` after landing paint**, then warm-init on first upload. Show progress only if click arrives before idle prefetch completes
8. **Build `<SchemaView>`** — table name, columns, types, first 10 rows
9. **Build `<ChartView>`** — column pickers (X categorical, Y numeric), Vega-Lite bar render via `vega-embed`, brand defaults from `src/charts/vega.ts`
10. **Sample data picker** — 3 curated CSVs, "Try a sample" link below dropzone
11. **Empty + error states** — file too big, parse fail, unsupported type
12. **Mobile soft-block** — viewports narrower than 768px replace upload affordance with "Glimpse works best on desktop" panel. Headline + value prop + footer still visible
13. **Vite base path** — set to `/glimpse/` in `vite.config.ts` for GitHub Pages subpath
14. **Footer + brand link** — "by the team behind [Claritas](https://claritas-one.vercel.app) and [Arbiter](https://arbiter.ac)" + opusvita.org link (Decision #33)
15. **Visual QA pass** — match family identity, hairline borders, italic sage eyebrows
16. **End-to-end verification** — start dev server, run all 3 sample files plus a hand-picked external CSV
17. **README** — what Glimpse is, run locally, deploy to GitHub Pages

## Definition of done

- Cold load to interactive: <2s on a wired connection (LCP target <1.5s)
- DuckDB-WASM does not block initial paint — idle-prefetched after landing paint via `requestIdleCallback` so click-time experience is warm on broadband
- Drop a CSV → schema preview within 1s of file read complete
- Pick X and Y → chart renders within 200ms (excluding initial DuckDB load)
- Visual identity matches the Arbiter family in screenshot side-by-side review
- All copy passes the "would a non-expert understand this in two seconds" test
- README explains: what Glimpse is, how to run locally, how to deploy to GitHub Pages

## Risks specific to CP-1

| Risk | Mitigation |
|------|------------|
| **DuckDB-WASM bundle size on cold load** | **Idle-prefetch via `requestIdleCallback` after landing paint** (per task #8). Show progress only if click arrives before idle fetch completes |
| **Excel parsing edge cases in DuckDB-WASM** | If we hit a wall, defer Excel to CP-2 and ship CSV+JSON only |
| **Tailwind v3 vs v4 ambiguity** | Stay v3 — match family. Migrate when family migrates |
| **Vega-Lite SVG rendering inside React** | Use `useEffect` to mount via `vega-embed`; don't try to make the chart a React component |

## Verification (manual)

| # | Step | Expected |
|---|------|----------|
| 1 | Open dev server, view landing | Wordmark header + hairline rule; "Show, don't tell." headline lands directly (no eyebrow above); dropzone visible; sample picker visible; footer eyebrow + opusvita.org/github links visible at bottom |
| 2 | Click sample "survey-responses.csv" | Schema preview shows columns + first 10 rows in <1s |
| 3 | Pick `question` (X) and `count` (Y) | Bar chart renders; brand colors; Source Serif title |
| 4 | Drop `monthly-revenue.csv` from disk | Replaces previous data; schema updates; default chart renders |
| 5 | Drop a 100MB file | Soft error toast — "Files over 50MB are not supported in early versions" |
| 6 | Drop a `.txt` file | Soft error toast — "Try CSV, Excel, or JSON" |
| 7 | Refresh after upload | Returns to landing — no persistence in CP-1, that's expected |
| 8 | Resize viewport <768px | Upload affordance hides; "Glimpse works best on desktop" panel shows; eyebrow + headline still visible |
| 9 | Build and serve from `/glimpse/` subpath | All assets resolve, no broken paths (simulates GitHub Pages deploy) |

## What CP-2 expects from CP-1

- DuckDB query layer abstracted enough to be called from CP-2's auto-chart logic
- Chart render layer accepts a "chart spec" object so CP-2 can swap bar→line→scatter without rewiring
- Type-detection helpers in `src/data/schema.ts` returning `{ column, type, cardinality, nullCount }` per column
- Empty/error states reusable across modes
