# Glimpse Status

## Current state

- **Phase:** CP-1 — Foundation **shipping** on `feat/cp-1-foundation`
- **Last session:** 2026-04-30 — CP-1 implementation end-to-end
- **Next action:** Push `feat/cp-1-foundation`, open PR against `main`, review, merge. Then begin CP-2 (Quick mode — type detection, opinionated default chart selection)

## Session log

### 2026-04-30 — Planning + doc scaffold + open-questions resolution

- Locked product brief: in-browser data → infographic tool, GitHub Pages, offline-first, nothing leaves the browser
- Researched 2026 best-practice stack — chose Vite + React over Next.js for offline-first SPA shape
- Locked design language to Arbiter family — Ink/Sage/Stone palette, Source Serif 4 + Inter + JetBrains Mono, hairline borders, no shadows
- Wrote `CLAUDE.md` (hard stops, stack, design language, privacy discipline)
- Wrote `docs/plans/PLAN.md` with 7-CP phasing and 19 initial locked decisions
- Wrote `docs/plans/2026-04-30-001-feat-glimpse-v1-plan.md` — CP-1 foundation plan
- Wrote ancillary docs — `README.md`, `ISSUES.md`, `docs/PRODUCT-BRIEF.md`, `docs/VISUAL-IDENTITY.md`, `docs/TECHNICAL-ARCHITECTURE.md`
- Resolved all 8 open questions — added locked decisions #20–#27:
  - Domain v1: `phdemotions.github.io/glimpse`, custom subdomain deferred
  - AI summary: BYO API key in localStorage, no paid tier, no accounts (later revised — see below)
  - No iframe embed v1 (export spec JSON + standalone HTML instead)
  - Export formats: SVG + PNG + spec JSON (skip PDF)
  - Type detection: auto-detect + low-confidence flagging + override UI
  - PDF extraction quality: UX-recovery bar (<2 min per typical article) (later revised — PDF dropped from v1)
  - Desktop-first, mobile view-only (<768px soft-blocked)
  - Light-mode only v1, dark mode deferred
- **Drafted landing surface mockup v2** — wordmark header, "Show, don't tell." headline, dropzone, sample picker, mobile soft-block, "an opus vita tool" eyebrow + opusvita.org/github links in footer. Visual approval captured.
- **5-persona doc-review** (Feasibility, Scope Guardian, Adversarial, Coherence, Product Lens) flagged: PDF extraction unfalsifiable, dual-audience fragile, brand incoherence with researcher focus, DuckDB cold-load blocks first-chart promise, Mosaic+Plot+Vega-Lite redundant, BYO API key has CORS + UX walls.
- **Adopted 7-pick scope-tightening revision** — added decisions #28–#33, restructured CPs from 7 → 5:
  - **#28 No analytics in v1** — locked (resolved TECHNICAL-ARCHITECTURE ambiguity)
  - **#29 Lead audience: students** — industry demoted to "also works for"
  - **#30 Pedagogy is the wedge, not local-first** — view-source moves into CP-3 alongside templates
  - **#31 PDF parsing → Glimpse-PDF v1.1** (separate product) — saves ~6 weeks v1 scope
  - **#32 Scope-revisit trigger: 8 weeks from CP-1 start** — opportunity-cost check against Marginalia/Arbiter/Claritas
  - **#33 Glimpse positioned as funnel into Opus Vita research suite**
  - **Decision #6 revised** — single Vega-Lite renderer for both modes (drops Mosaic + Observable Plot)
  - **Decision #21 revised** — AI summary dropped from v1 (CORS + UX walls)
- **Updated all docs** to reflect revisions: CLAUDE.md, PLAN.md, CP-1 plan, PRODUCT-BRIEF, TECHNICAL-ARCHITECTURE, VISUAL-IDENTITY (added font filenames + licenses), README
- **Coherence cleanups landed:** view-source as canonical label (not "pedagogy mode"), Mosaic absent from CP-1, Parquet noted deferred, font filenames + license URLs locked, mobile breakpoint phrasing harmonized

**Final plan shape:** 33 locked decisions, 5 CPs (Foundation → Quick mode → Infographic+View-source → Persistence+Offline → Polish+Deploy), tabular-only v1, no PDF, no AI, no analytics, no Mosaic, no Plot.

### 2026-04-30 — CP-1 Foundation implementation (feat/cp-1-foundation)

Shipped end-to-end CP-1 spine. From a cold landing, a user can drop a CSV/JSON or click a sample and see a brand-styled bar chart in <1s after warm-up.

**Scaffold + design system**
- Vite 8 + React 19 + TypeScript 6 + Tailwind 3 + postcss + autoprefixer
- Vite `base: '/glimpse/'` for GitHub Pages subpath
- pnpm `onlyBuiltDependencies` for esbuild (pnpm 10+ trap)
- Self-hosted variable fonts via `@fontsource-variable` (Source Serif 4 opsz, Inter opsz, JetBrains Mono wght) — bundled into dist, no Google Fonts CDN
- `src/styles/tokens.ts` mirrors `opusvita-org/lib/design/tokens.js` (Ink/Sage/Stone palette + ramps, typography, animation, layout, radius)
- `tailwind.config.ts` extends with tokens via `satisfies Config`
- Updated VISUAL-IDENTITY.md to lock @fontsource-variable pattern (privacy-equivalent to manual public/fonts/, simpler version mgmt)

**Landing v2 (visual approval captured)**
- Wordmark header (`Glimpse.` with sage period) + about link, hairline rule
- Headline 'Show, don't tell.' (text-5xl on md+, text-4xl on mobile)
- Sub line in serif lg
- UploadDropzone — drag-drop + click-to-pick + 50MB size guard + extension guard (.csv/.json), drag-over state (sage-500 border + sage-50/60 bg)
- Sample picker (3 secondary buttons) wired to ingest pipeline
- Privacy line in sans 14px ink-500
- Footer: 'an opus vita tool' eyebrow + Claritas/Arbiter/opusvita.org/github links

**Mobile soft-block (PLAN.md Decision #26)**
- <768px viewport replaces upload affordance with 'Glimpse works best on desktop' panel + Copy URL button; headline + footer remain visible

**Data pipeline (src/data/)**
- `duckdb.ts`: AsyncDuckDB singleton with `requestIdleCallback` prefetch after landing paint — resolves the cold-load risk surfaced in 2026-04-30 doc-review
- `ingest.ts`: BROWSER_FILEREADER + read_csv_auto / read_json_auto into a 'glimpse' table
- `schema.ts`: DESCRIBE + per-column null/cardinality stats + 10-row sample; classifies DuckDB types into numeric/string/date/boolean

**Charts (src/charts/)**
- `vega.ts`: brand-styled Vega config (Source Serif title, Inter axis labels, sage-700 bar fill, ink-200 grid) + `makeBarSpec` helper. Vega-Lite is the single renderer per Decision #6
- BigInt → Number coercion in ChartView so DuckDB integer columns flow into Vega without runtime errors

**Components**
- ChartView: X (categorical/date) + Y (numeric) pickers, vega-embed SVG output with empty state
- SchemaView: filename eyebrow + row/column count headline + chart + schema table + first-N rows
- Landing: state-aware (idle/loading/error) with inline panels replacing the dropzone
- App: state machine (idle → loading → ready → reset) with prefetchDuckDB on mount

**Sample data (public/samples/)**
- survey-responses.csv (categorical × numeric)
- monthly-revenue.csv (date × numeric)
- country-rankings.csv (categorical × numeric)

**Plan adjustments**
- Excel deferred to CP-2 per CP-1 risk note (UploadDropzone narrowed to .csv/.json)
- CP-1 plan task #2 reflects @fontsource-variable pattern

**Verification (preview server, viewport 1280×900 + mobile 375×812)**
- All 3 samples ingest in <1s after warm-up
- Bar chart renders with sage-700 bars, Source Serif titles, Inter axis labels, ink-200 hairline grid
- 'drop another file' resets to landing
- Mobile soft-block hides upload + samples; preserves headline, privacy line, footer
- Console clean across all 3 sample loads
- Manual size/type error testing deferred to README run-locally instructions

**Commits on `feat/cp-1-foundation`**
1. `8db58d4` feat: scaffold Vite + React + Tailwind, ship Landing v2
2. `e2ddd26` feat: data pipeline + SchemaView + ChartView + sample CSVs

Branch ready to push + PR.

## Health

- Code: not started
- Tests: not started
- Docs: bootstrapped
- Deploy: not deployed

## Next session quickstart

1. Read `docs/plans/PLAN.md` and `docs/plans/2026-04-30-001-feat-glimpse-v1-plan.md`
2. Run `pnpm create vite glimpse --template react-ts` inside `~/developer/glimpse/`
3. Move generated files into the existing repo root, install Tailwind 3, build design tokens
4. Get visual approval on `<Landing>` mockup before writing the component
