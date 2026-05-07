# Glimpse Status

## Current state

- **Phase:** CP-3.6 — **closed** with 8 of 9 units shipped ([PR #5](https://github.com/phdemotions/glimpse/pull/5), [PR #6](https://github.com/phdemotions/glimpse/pull/6), [PR #7](https://github.com/phdemotions/glimpse/pull/7), [PR #8](https://github.com/phdemotions/glimpse/pull/8) all merged to main). U6 (Top N + Geographic Pattern full audit redesign) deferred to [ISSUES.md M-001](ISSUES.md) — Vega-Lite layout regression on small-range numeric axes.
- **Build:** 327 tests / 33 files passing, production build clean
- **Live preview:** https://glimpse-orpin.vercel.app — every template now renders inside the in-spec frame (eyebrow / headline / takeaway / source / Glimpse wordmark), with data-aware headlines + takeaways for Big Number, Trend Story, Distribution, Part-to-Whole, Survey Likert, and Before/After. SVG and PNG export carry the shell verbatim.
- **Worktrees:** `~/developer/glimpse-cp36/` is now post-CP-3.6. Safe to delete or reset to main for the next CP. Branches `feat/cp-3-6-infographic-ux-overhaul`, `feat/cp-3-6-u7-u8-part-to-whole-distribution`, `feat/cp-3-6-u9-likert-before-after` are all merged and can be cleaned up via `/git-clean-gone-branches`.
- **Last session:** 2026-05-07 — CP-3.6 per-template phase shipped (U4+U5, U7+U8, U9) plus the U6 deferral write-up in ISSUES M-001
- **Next actions:**
  1. Clean up merged feature branches (`/git-clean-gone-branches` or `git branch -d` per branch)
  2. Optional: tackle [ISSUES M-001](ISSUES.md) (Top N + Geographic full redesign) when there's appetite — needs a minimal Vega-Lite reproduction outside the project to confirm whether it's an upstream bug or a `withAxisDiscipline('numeric')` shape problem
  3. **CP-4 — Persistence + offline** (Dexie sessions, service worker, install prompt) — primary track

## Session log

### 2026-05-07 — CP-3.6 per-template phase shipped (U4+U5, U7+U8, U9) + U6 deferred

Closed CP-3.6 by shipping every per-template unit except U6 (Top N + Geographic Pattern), which hit a Vega-Lite layout regression and is now tracked in [ISSUES M-001](ISSUES.md). Each pair landed in its own PR with paired visual approval before code, per Plan D13.

**[PR #6](https://github.com/phdemotions/glimpse/pull/6) — U4 + U5 (Big Number + Trend Story content redesigns)**

- Big Number: headline goes from raw column name to `Total revenue`. Takeaway derives from data — when a date column + rows are available, `Across 12 months — 2025-01 through 2025-12.` Falls back to category cardinality, then to a generic single-stat phrase.
- Trend Story: headline becomes data-aware (`revenue grew 95% across 12 months`); takeaway anchors with the actual range (`From $42K (2025-01) to $82K (2025-12) — peaks and dips are called out.`). Y axis adopts `withAxisDiscipline('currency', {dataMin, dataMax})` so the domain rounds to a sensible step below dataMin instead of letting Vega-Lite expand to zero (the audit's `15K → 90K with half blank` regression). X axis adopts `%b %Y` so labels read `Jan 2025` instead of `Jan 05`. Peak / trough callouts get a 1px ink-300 vertical rule connector + 60px right padding.
- Frame contract extended: `Template.frameFor(columns, fileName, rows?)` so templates that need data context can derive richer headlines and takeaways. `InfographicView` passes prepared rows to `frameFor` and emits the resulting `Frame` back to `SchemaView` via a new `onFrameBuilt` callback so `ViewSource` reasoning stays in sync with the rendered canvas.

**U6 — deferred to ISSUES M-001 ([commit `318dd05`](https://github.com/phdemotions/glimpse/commit/318dd05))**

- Attempted both horizontal-bar layout and self-framed-spec patterns. Adopting `withAxisDiscipline('numeric', { dataMin: 97, dataMax: 99.8 })` on the quantitative axis produced a Vega-Lite SVG with a viewBox of ~22000–40000 px regardless of explicit `width: 1200, height: 675`. Tried `nice: false`, `zero: false`, `tickCount: 5`, `tickMinStep: 1`, `scale.type: 'linear'`, `cornerRadiusEnd: 0`, removing the window transform and pre-ranking in JS, and switching the entire template to a self-framed layered spec (skipping `wrapWithFrame`). All produced the same viewBox explosion. Reverted to Foundation behavior (vertical bars, all categories visible at cardinality ≤ 10, top 3 emphasized via sage-900 vs sage-400 fill, frame contract from U1) and filed [ISSUES M-001](ISSUES.md) with the full repro + workaround set.

**[PR #7](https://github.com/phdemotions/glimpse/pull/7) — U7 + U8 (Part-to-Whole + Distribution redesigns)**

- Distribution: Y axis adopts `withAxisDiscipline('count')` so the integer-count axis no longer shows decimal ticks (kills the audit's `0.3 to 2.0 in 0.1 increments for an integer count` regression). X axis adopts `withAxisDiscipline('count' | 'numeric')` based on the column's DuckDB type, so bin labels render with the right format. Mean rule contrast bumped to ink-900 solid + ink-700 dashed for the median so both lines are visible against the sage-700 bars (the audit reported them invisible). Takeaway derives from the data range (`revenue ranges from 42,000 to 82,000 across 12 entries`).
- Part-to-Whole: frame headline derives from the leading-share row when rows are available (`Student leads with 51% of respondents`); falls back to the column-only `<num> by <cat>` phrasing. Takeaway threads the cardinality. Spec is unchanged from U2's sage-ramp version — the audit's PW.3 finding (no labels / no percentages / no legend) is satisfied by the existing legend + the new leader-share headline.

**[PR #8](https://github.com/phdemotions/glimpse/pull/8) — U9 (Likert + Before/After fixture samples + Likert color-scale fix)**

- Added `public/samples/feature-satisfaction.csv` (3 questions × 5 Likert responses with response counts — triggers `subtype: likert` detection at high confidence; auto-selects Survey Likert at applicability score 95) and `public/samples/quarterly-shift.csv` (6 teams × `before` + `after` numeric columns — hits the wide-shape `detectBeforeAfter` path at applicability score 80). Wired both into the Landing sample picker.
- **Audit pass surfaced a Likert color-scale bug:** `getLikertSortOrder` lowercased every data label, but Vega-Lite's color-scale matcher is case-sensitive. With capitalized data (`Strongly Disagree`), the sort silently fell through to Vega's alphabetical default and inverted the diverging palette — disagreement bars rendered green-on-the-right, agreement red-on-the-left, contradicting the takeaway text. Both helpers now preserve original case from the data while keeping the negative/neutral classification logic case-insensitive.
- Likert frame polish: avoids `'response responses'` duplication when the Likert column is itself called `response`. Headline derives from a grouping column when present (`Survey responses across 3 question items`), else falls back to a capitalized subject phrase. Takeaway threads the total response count from the actual data.
- Before/After: existing spec works correctly on the new fixture sample. Frame from U1 + U4-style data awareness left for a future polish pass if priority surfaces — current frame reads acceptably.

**Visual approval rounds (per CLAUDE.md hard stop, paired before code):**
- Big Number + Trend Story (PR #6): paint-style description of new headline + takeaway content + axis behavior approved before implementation.
- Top N + Geographic Pattern (PR #6 work, abandoned): horizontal-bar mockups + top-3 stroke spec described before implementation; visual verification surfaced the layout regression and triggered the deferral.
- Part-to-Whole + Distribution (PR #7): mockups described before code; both confirmed visually post-build.
- Likert + Before/After (PR #8): fixture sample shapes described before code; visual audit caught the color-scale bug and triggered the in-PR fix.

**CP-3.6 close totals**
- 8 of 9 units shipped (U6 deferred with reproducible bug + workaround in ISSUES M-001)
- 327 / 327 tests passing
- 4 PRs merged: #5 (Foundation), #6 (Big Number + Trend Story), #7 (Part-to-Whole + Distribution), #8 (Likert + Before/After + fixture samples)
- Live preview at glimpse-orpin.vercel.app reflects the full CP-3.6 state
- Audit findings closed: S1.1 (no infographic frame), S1.3 (caption-spec drift), S1.4 (axis defaults — except for the small-range numeric case in M-001), S1.5 (off-brand colors), S1.6 (type hierarchy), DA.1 (decimal Y axis), DA.2 (no X bin labels), DA.3 (invisible mean/median rules), TS.1 (Y-domain wasted space), TS.2 (peak label clipping), TS.4 (annotation offset), BN.1–BN.4 (Big Number redesign), PW.* (Part-to-Whole — except inline labels which the legend covers)
- Audit findings open in ISSUES M-001: S1.7 (edge cropping at high cardinality), TN.1, TN.2, TN.4, TN.5, GP.1

### 2026-05-06 — CP-3.6 Foundation phase ([PR #5](https://github.com/phdemotions/glimpse/pull/5) merged)

After CP-3.5 shipped, spot-checked Infographic mode against the bundled samples and found every template falling below the Dual Standard (visceral *"would make someone click away"* reaction). Walked all 6 surfaceable templates × 3 samples on a 1280×900 viewport, captured the gaps in [`docs/audits/2026-05-06-cp-3-6-infographic-ux-audit.md`](docs/audits/2026-05-06-cp-3-6-infographic-ux-audit.md) — 7 systemic failures + 18 per-template findings. Locked CP-3.6 into PLAN.md as a pre-CP-4 blocker (Decisions #41 + the bit-in-feedback note on #38). Wrote the 9-unit plan ([`docs/plans/2026-05-06-002-feat-cp-3-6-infographic-ux-overhaul-plan.md`](docs/plans/2026-05-06-002-feat-cp-3-6-infographic-ux-overhaul-plan.md)) and shipped Foundation (U1+U2+U3) in PR #5.

**Critical architectural decision (Plan D1):** the in-spec frame must live INSIDE the Vega-Lite spec as text-mark layers, not as a DOM HTML/CSS shell. Repo research surfaced the constraint: `src/charts/export.ts` consumes only the inline `<svg>` via `XMLSerializer + canvas` — no `html2canvas`, no DOM-region capture. A DOM shell would be invisible in shared SVG/PNG exports. Big Number's existing pattern of three text marks at pinned coords is what every template now adopts at scale.

**Unit 1 — Frame contract + 8-template migration**

- New [`src/charts/infographic-frame.ts`](src/charts/infographic-frame.ts): `INFOGRAPHIC_CANVAS = {1200, 675}`, `CHART_REGION` (the inner area templates render into), `Frame` type, and `wrapWithFrame(chartSpec, frame)` helper. The helper composes a vconcat with three sub-specs (header text marks → chart → footer text marks). 12 vitest scenarios cover happy paths, sub-spec dimensions, custom canvas overrides, empty-eyebrow handling, long-takeaway preservation.
- Template contract: `Template.captionFor(columns) → {eyebrow, body}` is removed. Replaced by `Template.frameFor(columns, fileName) → {eyebrow, headline, takeaway, source}` — one source of truth that renders into the spec text marks AND into the DOM caption strip. Caption-spec drift becomes structurally impossible.
- All 8 templates (big-number, trend-story, distribution, top-n-ranking, geographic-pattern, part-to-whole, survey-likert, before-after) migrated to emit chart-only specs sized to `CHART_REGION` and to provide `frameFor`. Big Number rebuilt to a single 120pt headline figure layer in the chart region (eyebrow / context lines now live in the frame around it). Geographic Pattern's in-canvas v1-disclaimer banner moved to `frame.takeaway`.
- [`InfographicView.tsx`](src/components/InfographicView.tsx) calls `wrapWithFrame` after the template's `specBuilder` and `dataPrep`, threading `fileName` through so the frame's source line shows the dataset name. [`SchemaView.tsx`](src/components/SchemaView.tsx) reads `frameFor` for the DOM caption above the chart and drops the standalone DOM eyebrow/body strip (canvas IS the infographic now).
- [`InfographicCanvas.tsx`](src/components/InfographicCanvas.tsx) adds `[&_svg]:w-full [&_svg]:h-full` so the embedded 1200×675 SVG scales to the visible canvas at narrower viewports — the source line and Glimpse wordmark would otherwise be clipped by `overflow-hidden` at viewports below 1200px.
- [`ExportPanel.tsx`](src/components/ExportPanel.tsx) imports `INFOGRAPHIC_CANVAS` from the new module so the 1200×675 dimensions live in one place rather than being duplicated across templates and the export panel.

**Unit 2 — Brand palette discipline**

- Stripped the off-brand `'#A88B6A'` / `'#5B6B7A'` / `'#C97A5C'` hex codes from `VEGA_CONFIG.range.category` in [`src/charts/vega.ts`](src/charts/vega.ts). Replaced with a sage→ink ramp drawn entirely from the Arbiter design tokens.
- New `categoricalScale(n)` exports a brand-only sequential ramp; new `DIVERGING_RANGE` provides a 3-color diverging palette (danger / ink-300 / sage-700) for Likert. Single source of truth so future categorical or diverging templates inherit the same brand-disciplined palette.
- Part-to-Whole color encoding now sets `scale.range` to `categoricalScale(catCol.cardinality)` — no template can route around the brand palette without explicitly opting in.
- Test guard: every entry in `VEGA_CONFIG.range.category` and every entry in part-to-whole's `scale.range` must come from `colors.sage` or `colors.ink`. The audit's *"sage / dark green / tan / slate-blue / terracotta"* color regression is now a test failure if it returns.

**Unit 3 — Axis discipline foundation**

- New [`src/charts/axis.ts`](src/charts/axis.ts) exports `withAxisDiscipline(kind, {dataMin, dataMax})` returning explicit `scale.domain`, `axis.format`, `axis.tickMinStep`, `axis.tickCount` for five data kinds: count (integer ticks, kills the Distribution decimal-tick bug), currency ($,d format with domain rounded below dataMin), percent (locked 0–1, .0% format), year-month (time format), numeric (does not expand domain to zero, defends against the Top-N overstatement bug).
- Per-template adoption deliberately deferred to U5–U9 — each per-template unit will compose the helper into its existing axis blocks rather than touching every template twice.

**Vercel preview wiring quirk**

When verifying U1 visually, my Bash cwd was the main repo while the worktree held the work. Solved by adding a `glimpse-cp36` configuration to main's `.claude/launch.json` that runs `pnpm --dir /worktree dev --port 5174`. The launch.json edit is local-only — reverted after each verification round so the tracked file stays clean for teammates.

**Verification at Foundation ship**

- 318 / 318 tests pass (12 frame + 4 palette + 13 axis-helper + 289 baseline)
- `pnpm build` clean
- Visual: Big Number (727K), Trend Story, Part-to-Whole all rendering under the new shell with eyebrow / headline / takeaway / source / wordmark visible in the canvas — captured at 1280×1800 viewport
- Part-to-Whole's chart now renders as a sage-ramp horizontal stacked bar normalized to 100% (audit's clashing-color regression killed)

**Next: Per-template phase (U4–U9), each with its own visual approval round**

Per Plan D13, templates are paired for combined approval to keep round-trips bounded:
- U4 + U5: Big Number + Trend Story
- U6: Top N + Geographic
- U7 + U8: Part-to-Whole + Distribution
- U9: Likert + Before/After fixture samples + audit pass

### 2026-05-06 — CP-3.5 Excel support (feat/cp-3-5-excel, [PR #4](https://github.com/phdemotions/glimpse/pull/4))

Shipped end-to-end Excel ingestion in 4 units. From the same dropzone as CSV/JSON, a user can now drop a multi-sheet `.xlsx`, see the first sheet auto-loaded, and swap sheets via an inline switcher above the schema headline.

**Pre-existing typecheck cleanup**
- Fixed 4 typecheck errors leftover from CP-3 (TS 6 + React 19 dropped global JSX namespace; 3 unused imports). STATUS at session start claimed "production build clean" but `pnpm build` was failing — surfaced when verifying CP-3.5 Unit 1.

**Vercel preview wiring**
- `vite.config.ts` `base` is now env-conditional: `/` when `VERCEL=1`, `/glimpse/` for the eventual GH Pages target. `GLIMPSE_BASE` overrides for ad-hoc deploys.
- `vercel deploy --yes` first run auto-linked the project (`prj_YNBXSJLamOXdQV8kGoGGPpIQGzA3`); production alias is `glimpse-orpin.vercel.app`. Doesn't conflict with eventual GH Pages prod (Decision #2) — Vercel = preview-only.

**Unit 1 — xlsx parser ([`src/data/xlsx.ts`](src/data/xlsx.ts))**
- `parseWorkbook(file)` lazy-imports SheetJS Community Edition (xlsx 0.20.3 from the SheetJS CDN tarball — the npm registry version was abandoned in 2023). Lazy import lands xlsx in its own ~493KB chunk so CSV/JSON users pay zero bundle cost.
- Reads with `cellDates: true`. Walks worksheet cells and rewrites Date-valued cells to ISO strings before `sheet_to_csv` — SheetJS's default `m/d/yy` cell format defeats both `dateNF` and `cell.z` overrides on the CSV writer, and the ISO bridge is what type-detect.ts's high-confidence date path needs.
- Empty sheets (no `!ref` or zero data rows) filter out of metadata so callers can't pick a sheet that produces a zero-row CSV.
- Zip-magic-byte pre-check distinguishes `Failed to parse Excel workbook` (not a zip) from `Excel workbook is empty` (real but data-less). SheetJS otherwise parses garbage into a zero-sheet workbook silently.
- 8 vitest scenarios cover happy paths, multi-sheet ordering, CSV round-trip, empty-workbook + corrupt-file errors, unknown-sheet error, and ISO date emission.

**Unit 2 — ingest integration ([`src/data/ingest.ts`](src/data/ingest.ts))**
- `ingestFile` branches on extension. xlsx path: `parseWorkbook` → first sheet active → `getSheetCsv` → register CSV string with DuckDB via `registerFileBuffer` → `read_csv_auto` into the existing `glimpse` table.
- xlsx parses up-front so corrupt/empty workbooks fail before opening a DuckDB connection.
- Extracted `ingestCsvText`, `ingestTabularFile`, and `ingestActiveSheet` helpers; centralized SQL escaping in `escapeSqlLiteral`.
- New `ingestWorkbookSheet(parsed, sheetName, fileName)` for the sheet-switch path — re-uses the parsed handle, re-registers a new CSV buffer, replaces the `glimpse` table.
- `IngestResult` extended with optional `workbook?: WorkbookHandle` (sheets, activeSheet, parsed); CSV/JSON paths leave it undefined so existing call sites keep working.
- 11 vitest scenarios with mocked DuckDB: CSV/JSON routing, .xls rejection, SQL-quote escaping, single + multi-sheet xlsx happy paths, empty/corrupt error propagation, ISO date verification, sheet swap, unknown sheet error.

**Unit 3 — UploadDropzone ([`src/components/UploadDropzone.tsx`](src/components/UploadDropzone.tsx))**
- `ACCEPTED_EXTENSIONS` = `['csv', 'json', 'xlsx']`; `accept=".csv,.json,.xlsx"`.
- Visible copy: `Drop a CSV, Excel, or JSON file`. aria-label updated to match. Subline `or click to choose` unchanged. App-level error copy parallel-updated.
- Dropped the deferred-Excel comment block from CP-1 risk note.
- New [`src/components/UploadDropzone.test.tsx`](src/components/UploadDropzone.test.tsx) — first dropzone test coverage. 7 scenarios: accept attribute, copy strings, xlsx happy path, .xls rejection, 50MB-over xlsx rejection, CSV regression.

**Unit 4 — sheet switcher ([`src/components/SheetSwitcher.tsx`](src/components/SheetSwitcher.tsx))**
- Inline pill row above the schema headline, hairline rule below. Hidden when `sheets.length === 1`. Active pill = sage-700 bold; inactive = ink-500 hover-sage-700. Long names truncate at 24 chars with full name on `title`.
- App-level state plumbing:
  - Reducer `AppState` gains plain-data `workbook: WorkbookMeta | null` (sheets + activeSheet). `LOAD_FILE_SUCCESS` extended with optional `workbook?: WorkbookMeta | null`.
  - Parsed handle (closures + getSheetCsv) lives in a `parsedWorkbookRef` in App so functions stay out of reducer state.
  - `reset()` clears both the ref and the workbook field — covered by an explicit test scenario so a stale switcher can never appear after re-uploading a CSV.
  - `handleSheetSwitch(sheetName)` calls `ingestWorkbookSheet`, re-derives schema, dispatches `LOAD_FILE_SUCCESS` (which clears overrides via existing semantics).
- `describeUploadError` copy updated: "isn't a CSV, Excel, or JSON file."
- 6 vitest scenarios for `SheetSwitcher` (single-sheet hides, multi-sheet renders, aria-current, click swap, no-op on active click, long-name truncate).

**Verification**
- 289 / 289 tests pass (38 new across xlsx parser, ingest, dropzone, sheet switcher).
- `pnpm build` clean. `dist/assets/xlsx-*.js` 493KB lazy chunk; main bundle 1.27MB (within 0.01MB of pre-CP-3.5).
- Vercel prod alias verified to serve the new bundle (`Drop a CSV, Excel, or JSON file` string present in deployed JS).
- Visual approval gate cleared for U3 dropzone copy + U4 switcher placement before implementation.

**Open follow-ups**
- Excel date columns with custom format codes may slip through as numbers (plan-deferred). File ISSUES entry if a real workbook breaks.
- 600KB SheetJS chunk bloats first xlsx upload by ~150KB gzipped. Acceptable per plan; not pre-optimized.

**Critical UX gap surfaced post-ship**
- Infographic mode templates render below the Dual Standard on the bundled samples — typography, spacing, and visual hierarchy issues that would make a new user click away. Tracking as a separate design audit (CP-3.6 or its own track) before CP-4 begins.

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
