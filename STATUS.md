# Glimpse Status

## Current state

- **Phase:** CP-3 — Infographic mode **complete**, PR #3 open on `feat/cp-3-infographic` (worktree at `~/developer/glimpse-cp3/`)
- **Build:** 257 tests / 27 files passing, production build clean
- **Last session:** 2026-05-06 — CP-3 implementation (7 units + 1 bug fix), visual QA, PR #3 opened
- **Next action:** Merge [PR #3](https://github.com/phdemotions/glimpse/pull/3), then begin CP-3.5 (Excel parsing mini-CP — Decision #36)

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

### 2026-05-06 — CP-3 Infographic mode implementation (feat/cp-3-infographic)

Worktree at `~/developer/glimpse-cp3/`. 7 implementation units shipped via serial subagents + 1 bug fix from visual QA.

**Template system (`src/templates/`)**
- `types.ts` — Template interface, TemplateId union (8 members), Applicability type with score/fit/reason
- `index.ts` — Registry via direct imports into array literal (avoids circular dep from side-effect push pattern)
- 8 templates: big-number, top-n-ranking, trend-story, distribution, part-to-whole, survey-likert, before-after, geographic-pattern
- Each exports applicability (pure function → {fits, score}), specBuilder (data+columns → VegaSpec), captionFor

**App state (`src/app/`)**
- `reducer.ts` — useReducer replaces fragmented useState. Actions: LOAD_FILE_START/SUCCESS/ERROR, RESET, OVERRIDE_TYPE, SET_MODE, SELECT_TEMPLATE. AUTO_INFOGRAPHIC_THRESHOLD=95 auto-selects infographic mode when top template scores high
- Bug fix: removed SET_MODE guard that blocked infographic entry without selectedTemplate — users need to enter mode to see picker

**Components**
- `ModeToggle.tsx` — Quick/Infographic segmented control
- `InfographicCanvas.tsx` — 1200×675 fixed dimensions, CSS aspect-ratio scaling
- `TemplatePicker.tsx` — 2-col card grid with applicability badges
- `TemplateThumbnail.tsx` — 8 inline SVG symbolic previews
- `InfographicView.tsx` — async DuckDB→dataPrep→specBuilder→vega-embed pipeline
- `ExportPanel.tsx` — SVG/PNG/JSON ghost buttons with pending state

**Export pipeline (`src/charts/`)**
- `font-inline.ts` — WOFF2 fetch via ?url import, base64 into SVG <defs><style>
- `export.ts` — downloadSvg (with inlined fonts), downloadPng (2x pixel ratio), downloadJson

**Bug fixes during visual QA**
- Big Number: `datum:` → `value:` encoding (pixel coords not data scale); added baseline properties
- Reducer: removed SET_MODE infographic guard; ModeToggle hasTemplates prop gates UI instead

**Commits:** 8 on `feat/cp-3-infographic` (U1–U7 + 1 fix)
**Tests:** 257 across 27 files, all passing
**PR:** [#3](https://github.com/phdemotions/glimpse/pull/3) opened against main

### 2026-04-30 — CP-2 Quick mode + view-source implementation (feat/cp-2-quick-mode)

Worktree at `~/developer/glimpse-cp2/`. 8 implementation units shipped end-to-end. From the same upload flow as CP-1, the user now lands on a schema view with an auto-selected chart, plain-English caption, type-override per column, and a view-source toggle exposing the Vega-Lite spec.

**Test infra (new in CP-2)**
- vitest 4 + jsdom + @testing-library/react
- 85 tests across 9 files, all passing
- `pnpm test` / `pnpm test:watch` scripts

**Data layer (`src/data/`)**
- `coerce.ts` — central BigInt → Number + Date → ISO coercion (replaces inline ChartView coerce)
- `sample-rows.ts` — single batched DuckDB query with client-side transpose (avoids per-column round trips on wide datasets)
- `type-detect.ts` — date (ISO incl. YYYY-MM, US M/D/YYYY), Likert with N/A sentinel filter + cardinality fallback, geographic with conservative confidence
- `schema.ts` — `ColumnInfo` extended with `subtype` (`ordinal`/`likert`/`geographic`) and 3-tier `confidence`

**Charts layer (`src/charts/`)**
- `selector.ts` — pure function: `selectChart(columns, overrides) → ChartChoice`. Decision tree picks bar / line / scatter / histogram / pie / ranking / none. Line guard: ≥3 distinct dates required
- `vega.ts` — 5 new spec builders: line (temporal/nominal axis), scatter, histogram (consumes pre-binned rows), pie, ranking (explicit window sort by yField)
- `binning.ts` — DuckDB pre-bin helper using FLOOR/COUNT GROUP BY, Sturges' formula for bin count
- `captions.ts` — template-based plain-English captions per chart kind, locked tone benchmark, ≤200 chars per body

**Components**
- `ConfidenceBadge.tsx` — silent for high, italic sage hint for medium, ink-200 pill warning for low
- `TypeOverrideDropdown.tsx` — native `<select>` with friendly labels (text/numeric/date/true-false)
- `ViewSource.tsx` — `<details>` disclosure with two-column "why this chart" + spec JSON; copy spec button
- `SchemaView.tsx` — caption above chart, 20-col disclosure for wide schemas, type override per row, view-source under chart
- `ChartView.tsx` — dispatches on `ChartChoice.kind`, runs DuckDB pre-bin for histogram, reports built spec back to parent for view-source mirror, falls back to manual picker on `kind: 'none'`
- `App.tsx` — `columnTypeOverrides` state lifted to top-level; `useMemo(() => selectChart(...))` for stable identity; `reset()` clears overrides

**Plan adjustments during implementation**
- `PIE_MAX = 5` (was 6 in plan decision sketch) — reconciled internal plan contradiction; cardinality 6 = bar matches plan unit-test scenarios + better legibility
- ISO date regex extended to allow `YYYY-MM` (ISO 8601 reduced-precision) — `monthly-revenue.csv` uses `2025-01` style which wouldn't match the strict `YYYY-MM-DD` regex

**Verification (preview server, viewport 1280×900 + mobile 375×812)**
- `survey-responses` (6 roles × 1 numeric) → **bar chart** ✓
- `monthly-revenue` (12 months × 2 numerics) → **line chart** with temporal axis ✓
- `country-rankings` (10 countries × 2 numerics) → **bar chart** (cardinality 10 ≤ 12) ✓
- View-source disclosure exposes the live spec JSON + reasoning + caption ✓
- Override `respondents` numeric → text → caption updates to use `confidence_score` ✓
- Reset clears overrides — re-loading sample shows original auto-pick ✓
- Mobile <768px shows soft-block, headline + privacy + footer remain ✓

**Commits planned on `feat/cp-2-quick-mode`** (about to land):
1. CP-2 Quick mode + view-source implementation

Branch ready to push + PR after this commit.

## Health

- Code: CP-1 + CP-2 merged, CP-3 PR open
- Tests: 257 passing (27 files)
- Docs: current
- Deploy: not deployed (CP-5)

## Next session quickstart

1. `gh pr merge 3 --squash` (or review + merge PR #3)
2. Plan CP-3.5 Excel parsing: `ce-plan` with Decision #36 context
3. Or skip to CP-4 (Persistence + offline) if Excel is low priority
