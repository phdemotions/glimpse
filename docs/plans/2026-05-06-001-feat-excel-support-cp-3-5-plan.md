---
title: "feat: Excel support (CP-3.5)"
type: feat
status: active
date: 2026-05-06
---

# Excel support — CP-3.5

## Overview

Add `.xlsx` ingestion to the existing CSV/JSON pipeline. Glimpse's lead audience is students, who overwhelmingly produce data in Excel rather than CSV. Excel was promised in PLAN.md line 19 as a v1 input format and was deferred during CP-1 ingest work (see [`src/data/ingest.ts:21`](src/data/ingest.ts:21) comment, and [`src/components/UploadDropzone.tsx:5-6`](src/components/UploadDropzone.tsx)). CP-3.5 closes that gap before persistence work in CP-4.

The change is small: a single client-side parser library converts an uploaded workbook into one CSV-string-per-sheet, which is then handed to the existing DuckDB `read_csv_auto` path. Multi-sheet workbooks surface a sheet switcher in the schema header so a user can swap which sheet is the active dataset without re-uploading.

Privacy posture is preserved — SheetJS runs entirely in the browser, no network calls, no telemetry of file contents. Bundle weight is contained by lazy-loading the parser only when the user uploads an `.xlsx` file.

## Problem Frame

Today, a student dragging an `.xlsx` file onto the dropzone hits an "Unsupported file type" error. Their workaround is "Save As → CSV" inside Excel, which loses sheet structure and is friction-laden for a non-expert audience. Excel is the dominant data format for the v1 lead audience (PLAN.md Decision #29) and shipping v1 without it leaves a gap on the most common first interaction path.

CP-3.5 sits between CP-3 (Infographic mode, shipped) and CP-4 (Persistence + offline). It is a small, low-risk capability extension that benefits CP-4 by ensuring all v1 input formats are stable before the persistence layer caches parsed data.

## Requirements Trace

- R1. **Ingest `.xlsx`.** A user drops or picks an `.xlsx` file and ends up at the schema view with a chart, identical to CSV/JSON paths.
- R2. **Multi-sheet handling.** Workbooks with more than one sheet render a sheet switcher; the user can swap the active sheet and the chart re-derives.
- R3. **Single-sheet transparency.** Workbooks with exactly one sheet behave identically to CSV — no extra UI noise.
- R4. **Privacy preserved.** Excel parsing runs in the browser; no network calls during parse (PLAN.md privacy discipline + Decision #28).
- R5. **Bundle discipline.** The xlsx parser is lazy-loaded — users who never upload Excel never pay the bundle cost.
- R6. **Type detection still works.** Excel dates surface as Date values, not `45292`-style serial numbers; numeric-looking text columns stay text. Existing type-detection + chart-selection pipeline downstream is untouched.

## Scope Boundaries

- Excel **read** only. No write/export to `.xlsx` (export remains SVG/PNG/spec JSON per Decision #23).
- No `.xls` (legacy binary) support — `.xlsx` only.
- No formula evaluation — read computed cell values (`cell.v`), never formulas (`cell.f`).
- No multi-sheet **merge** or pivot — one sheet at a time is the active dataset.
- No `.xlsx` sample file in the sample picker — existing CSV samples are sufficient for landing-page demos. Users with Excel files have their own.
- No password-protected workbook support — surface a clear error, do not attempt to crack.

### Deferred to Separate Tasks

- Excel-specific sample for the sample picker — defer to CP-5 polish if useful.
- Cross-sheet joins or pivot semantics — out of v1 scope entirely.

## Context & Research

### Relevant Code and Patterns

- [`src/data/ingest.ts`](src/data/ingest.ts) — current CSV/JSON ingest. Uses `db.registerFileHandle` with `BROWSER_FILEREADER` and `read_csv_auto` / `read_json_auto`. Will gain an Excel branch that converts each sheet to a CSV string and routes through the same DuckDB read path.
- [`src/components/UploadDropzone.tsx:6,69,118,126`](src/components/UploadDropzone.tsx) — `ACCEPTED_EXTENSIONS` tuple, aria-label, visible copy, and `<input accept>` all need to learn about `.xlsx`.
- [`src/data/schema.ts`](src/data/schema.ts) — `ColumnInfo` and type classification. Already format-agnostic post-ingest; should require no changes.
- [`src/charts/selector.ts`](src/charts/selector.ts) — chart selection. Format-agnostic; no changes.
- [`src/components/SchemaView.tsx`](src/components/SchemaView.tsx) — header region around the filename eyebrow is the natural home for the sheet switcher (Unit 4).
- [`src/App.tsx`](src/App.tsx) — top-level state (`fileName`, `schema`, `choice`, `overrides`). Will gain workbook + active-sheet state when an xlsx is loaded.

### Institutional Learnings

- `docs/solutions/` is empty — no prior xlsx work to draw on.
- CP-1 risk note (logged in [`src/components/UploadDropzone.tsx:5-6`](src/components/UploadDropzone.tsx) and [`src/data/ingest.ts:21`](src/data/ingest.ts)) explicitly chose to defer Excel rather than load DuckDB's xlsx extension via CDN, on bundle and privacy grounds. CP-3.5 honors that decision by parsing in JS and feeding the existing DuckDB read path with a CSV string.

### External References

- SheetJS Community Edition (`xlsx` on npm) is the canonical 2026 in-browser xlsx parser. Read with `cellDates: true` so date cells surface as JS Date objects rather than Excel serial numbers (~45292 for 2024-01-01). Read values via `cell.v`, never `cell.f` (formula text).
- Supply-chain note: the npm `xlsx` package has had supply-chain incidents in the past. Pin a known-good version, run `pnpm audit` after install, and consider lazy-loading the module so it is not part of the initial app shell.

## Key Technical Decisions

- **Parser: SheetJS Community Edition (`xlsx`).** De-facto standard, no network calls, handles `.xlsx` and dates correctly with `cellDates: true`. Alternative `exceljs` is heavier and oriented at write paths.
- **Bridge format: CSV string.** Convert each sheet to CSV via SheetJS's `sheet_to_csv`, register that string as a virtual file with DuckDB-WASM, and re-use the existing `read_csv_auto` path. Avoids a second DuckDB ingest mode and keeps type detection identical to CSV uploads.
- **Lazy-load xlsx parser.** Dynamic `import('xlsx')` only when extension is `.xlsx`. Bundle cost stays at zero for CSV/JSON users.
- **Active-sheet model.** A workbook becomes `{ sheets: SheetMeta[]; activeSheet: string }` in app state. Switching sheets re-runs ingest on the same file (parsed workbook cached in memory) — no re-upload.
- **Multi-sheet UI: inline switcher in SchemaView header.** First sheet selected by default. Switcher hidden if `sheets.length === 1`. Visual approval gate fires before Unit 4 implementation per CLAUDE.md hard stop.
- **No xlsx in sample picker.** Existing CSV samples cover the demo path; an xlsx sample would only exist to demo the parser to itself.

## Open Questions

### Resolved During Planning

- **Which library?** SheetJS (`xlsx`). Resolved above.
- **Bridge format — CSV string vs Arrow vs row arrays?** CSV string. Reuses existing read path. Resolved above.
- **Default sheet?** First sheet. Matches Excel's own default open behavior. Resolved above.
- **Multi-sheet UI shape?** Inline switcher in SchemaView header. Resolved above (visual approval still required before implementation).

### Deferred to Implementation

- **Exact SheetJS version pin.** Decide at install time after a quick npm advisory check.
- **CSV-string size ceiling.** The 50MB upload cap applies to the source `.xlsx`; a giant Excel file may produce a CSV string several times larger after expansion. If real files break, add a per-sheet row-count guard at ingest time. Not pre-optimized.
- **Date cells with custom formats.** SheetJS's `cellDates: true` handles standard date cells. Custom-format date columns may surface as numbers; existing type-detection's date regex catches ISO strings only. Verify against a real-world workbook during implementation; if a gap appears, file an issue rather than expand scope here.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
File upload (.xlsx)
       │
       ▼
parseWorkbook(file)  ── lazy import('xlsx')
       │
       ├── workbook.SheetNames   →  ['Q1', 'Q2', 'Notes']
       └── per-sheet metadata    →  rowCount, columnCount
       │
       ▼
ingestWorkbookSheet(workbook, sheetName)
       │
       ├── sheet_to_csv(sheet, { cellDates: true })  →  CSV string
       ├── registerFileHandle('<sheetName>.csv', csvBlob)
       └── read_csv_auto into table 'glimpse'
       │
       ▼
existing schema → selector → ChartView pipeline (unchanged)
```

State shape (app-level):

```
type WorkbookState = {
  fileName: string
  sheets: { name: string; rowCount: number; columnCount: number }[]
  activeSheet: string
}
```

CSV/JSON uploads continue to bypass `WorkbookState` entirely.

## Implementation Units

- [ ] **Unit 1: xlsx parser module**

**Goal:** Add a `parseWorkbook(file)` helper that lazy-loads SheetJS and returns sheet metadata + a handle for ingest.

**Requirements:** R1, R4, R5

**Dependencies:** None (installs `xlsx` package).

**Files:**
- Create: `src/data/xlsx.ts`
- Create: `src/data/xlsx.test.ts`
- Modify: `package.json` (add `xlsx` dep, pinned version)

**Approach:**
- `parseWorkbook(file: File): Promise<ParsedWorkbook>` reads the file as ArrayBuffer, dynamic-imports `xlsx`, calls `XLSX.read` with `{ type: 'array', cellDates: true }`.
- Returns `{ sheets: SheetMeta[]; getSheetCsv(name) → string }`.
- `SheetMeta` = `{ name, rowCount, columnCount }` derived from `!ref` range.
- `getSheetCsv(name)` calls `XLSX.utils.sheet_to_csv` with `{ blankrows: false }`. Sentinel for unknown sheet name → throw.
- Validate at least one non-empty sheet exists; throw a typed error if workbook is empty or password-protected (SheetJS surfaces this via thrown error during `read`).

**Patterns to follow:**
- Mirror the lazy-load pattern used by other data-layer helpers — return a Promise from a single named export.
- Match the typed-error idiom from [`src/data/ingest.ts`](src/data/ingest.ts) (throw `Error` with stable message prefix for downstream display).

**Test scenarios:**
- *Happy path:* parsing a fixture `.xlsx` with one sheet returns `sheets.length === 1` and the sheet's row/column counts match the fixture.
- *Happy path:* parsing a fixture `.xlsx` with three sheets returns `sheets.length === 3` and `sheets[0].name` matches Excel's first-sheet name.
- *Happy path:* `getSheetCsv` round-trips a sheet to CSV with header row and data rows in expected order.
- *Edge case:* a workbook whose only sheet is empty throws an "empty workbook" error.
- *Edge case:* a date-typed cell in the source `.xlsx` surfaces as a Date object in the CSV (verify the CSV string contains an ISO-style date, not the Excel serial number).
- *Error path:* `getSheetCsv('does-not-exist')` throws a typed error.
- *Error path:* a corrupt / non-xlsx ArrayBuffer surfaces a wrapped error with a stable message prefix (so the UI layer can render it consistently with existing CSV/JSON parse errors).

**Verification:**
- All scenarios above pass under `pnpm test`.
- `pnpm build` shows `xlsx` ending up in a separate chunk (lazy-load took effect).

---

- [ ] **Unit 2: ingest pipeline integration**

**Goal:** Extend `ingestFile` to accept `.xlsx`, route through the workbook parser, and feed a chosen sheet's CSV string to DuckDB. Add a sibling `ingestWorkbookSheet` for the multi-sheet switch path.

**Requirements:** R1, R2, R6

**Dependencies:** Unit 1.

**Files:**
- Modify: `src/data/ingest.ts`
- Modify: `src/data/ingest.test.ts` (or create if missing — verify in repo)

**Approach:**
- Extend `IngestResult` with optional `workbook?: { sheets: SheetMeta[]; activeSheet: string }`.
- In `ingestFile`, branch on extension. For `xlsx`:
  - Call `parseWorkbook(file)` from Unit 1.
  - Pick `activeSheet = sheets[0].name`.
  - Call internal helper `ingestSheetCsv(csv, sourceName)` that registers the CSV string as a virtual file via `registerFileHandle` (using a `Blob` wrapper) and runs `read_csv_auto` into the `glimpse` table.
  - Return `IngestResult` with the workbook metadata attached.
- Export `ingestWorkbookSheet(parsedWorkbook, sheetName)` for the sheet-switch path so the UI can swap sheets without re-parsing the file.
- Update the existing CSV/JSON path to leave `workbook` undefined.
- Drop the "Excel parsing is deferred" comment block.

**Patterns to follow:**
- Existing `BROWSER_FILEREADER` registration pattern from [`src/data/ingest.ts:33-38`](src/data/ingest.ts).
- `CREATE OR REPLACE TABLE` idiom for replacing the active dataset.

**Test scenarios:**
- *Happy path:* `ingestFile` with a single-sheet `.xlsx` fixture returns `rowCount > 0`, `workbook.sheets.length === 1`, and the `glimpse` table has the expected column count.
- *Happy path:* `ingestFile` with a three-sheet `.xlsx` fixture returns `workbook.sheets.length === 3` and `workbook.activeSheet === sheets[0].name`.
- *Integration:* after `ingestFile`, calling the existing `getSchema` (from `src/data/schema.ts`) returns the expected `ColumnInfo[]` — proves the format-agnostic-post-ingest contract holds.
- *Integration:* a date column in the source `.xlsx` is classified as `date` by existing schema detection (no Excel-serial numbers leaking through).
- *Happy path:* `ingestWorkbookSheet` swaps the active sheet — the new `glimpse` table reflects the new sheet's data.
- *Error path:* `.xls` (legacy) is rejected with the existing "Unsupported file type" error path, not silently routed to xlsx.
- *Error path:* a `.xlsx` whose only sheet is empty surfaces the Unit 1 error verbatim.

**Verification:**
- All scenarios pass.
- Manual: existing CSV and JSON sample files still ingest with `workbook` undefined.

---

- [ ] **Unit 3: dropzone + accept rules**

**Goal:** Teach `UploadDropzone` and its copy about Excel.

**Requirements:** R1

**Dependencies:** None (UI surface only — visual approval required before merge per CLAUDE.md hard stop).

**Files:**
- Modify: `src/components/UploadDropzone.tsx`
- Modify: `src/components/UploadDropzone.test.tsx` (or create if missing)

**Approach:**
- Extend `ACCEPTED_EXTENSIONS` to `['csv', 'json', 'xlsx']`.
- Update `accept` attribute on `<input>` to `.csv,.json,.xlsx`.
- Update visible copy: `"Drop a CSV, Excel, or JSON file"` (subject to visual approval — see Patterns below). Consider whether the existing `aria-label` and helper-text strings need a parallel update.
- Update copy in [`src/components/Landing.tsx`](src/components/Landing.tsx) to match if the headline mentions specific formats.
- Drop the deferred-Excel comment.

**Execution note:** Visual approval gate fires before this unit is built. Present the proposed dropzone copy + sheet-switcher mock (Unit 4) in one approval pass to avoid a second round-trip.

**Patterns to follow:**
- Existing typography and color patterns in [`src/components/UploadDropzone.tsx:117-120`](src/components/UploadDropzone.tsx) (`font-serif text-lg text-ink-800` for the primary line, `font-sans text-sm text-sage-700` for the subline). New copy must stay inside that hierarchy — no new font weights, no new colors.
- Arbiter language hygiene from `CLAUDE.md` design language section — calm, typography-first, no exclamation, no UI cliché phrases like "Click here to upload".

**Test scenarios:**
- *Happy path:* dropping a `.xlsx` file fires `onFileSelected` and not `onError`.
- *Happy path:* the rendered `<input>` has `accept=".csv,.json,.xlsx"`.
- *Edge case:* dropping a `.xls` file fires `onError` with `unsupported-type`.
- *Edge case:* dropping a `.xlsx` over the 50MB ceiling fires `onError` with `too-large`.

**Verification:**
- All scenarios pass.
- Visual: a screenshot in the preview server confirms the new copy reads naturally and respects the typographic hierarchy.

---

- [ ] **Unit 4: sheet switcher in SchemaView**

**Goal:** Render an inline sheet switcher above the schema when the active dataset came from a multi-sheet workbook. Switching sheets re-runs ingest on the in-memory workbook and re-derives schema/chart.

**Requirements:** R2, R3

**Dependencies:** Units 1, 2. Visual approval required before implementation.

**Files:**
- Create: `src/components/SheetSwitcher.tsx`
- Create: `src/components/SheetSwitcher.test.tsx`
- Modify: `src/components/SchemaView.tsx`
- Modify: `src/App.tsx` (workbook state + active-sheet handler)
- Modify: `src/app/reducer.ts` + `src/app/reducer.test.ts` (new `WORKBOOK_LOADED` and `SHEET_SWITCHED` actions, depending on existing reducer shape — verify in repo before scoping)

**Approach:**
- `SheetSwitcher` is a small horizontal control: filename eyebrow on the left, sheet pills/segmented control on the right. Hidden when `sheets.length === 1`.
- Pill states: active = sage-700 text + ink-200 underline; inactive = ink-500 text. Hairline 1px ink-200 rule beneath, matching existing schema header rules.
- On click of an inactive pill, call back into App which calls `ingestWorkbookSheet` and updates `schema`, `choice`, and clears `overrides` (since column names may differ across sheets).
- App-level state: cache the parsed workbook in a ref (parser handles + sheet metadata) so switches do not re-read the file.
- Reset (existing "drop another file") clears the workbook ref alongside everything else.

**Execution note:** Wait for visual approval (Unit 3 + Unit 4 presented together) before coding the switcher.

**Patterns to follow:**
- SchemaView header layout patterns and the existing 1px hairline conventions from [`src/components/SchemaView.tsx`](src/components/SchemaView.tsx).
- Typography from `CLAUDE.md` Arbiter design language — Inter for chrome, italic lowercase eyebrow for the filename, sage-700 for active state.
- Existing `onReset` flow as a model for state-clearing on user action.

**Test scenarios:**
- *Happy path:* a single-sheet workbook does not render `SheetSwitcher` (DOM assertion).
- *Happy path:* a three-sheet workbook renders three pills with the first marked active.
- *Happy path:* clicking an inactive pill fires the swap callback with the clicked sheet name.
- *Integration:* swapping sheets in App re-runs ingest, updates `schema` and `choice`, and clears `columnTypeOverrides` (verify via reducer test).
- *Edge case:* a sheet name longer than 24 chars truncates with ellipsis (CSS) and exposes the full name via `title` attribute for accessibility.
- *Edge case:* "drop another file" clears the workbook ref so the next CSV upload does not surface a stale switcher.

**Verification:**
- All scenarios pass.
- Manual: load a real multi-sheet `.xlsx`, swap sheets, confirm chart re-derives in <1s and no console errors.

## System-Wide Impact

- **Interaction graph:** `UploadDropzone` → `App.handleFile` → `ingestFile` (existing) → `getSchema` (existing) → `selectChart` (existing) → `ChartView` (existing). The xlsx branch grafts onto the existing chain at `ingestFile`. New side path: `SheetSwitcher` → `App.handleSheetSwitch` → `ingestWorkbookSheet` → schema + chart re-derive.
- **Error propagation:** Excel parse errors surface through the same `IngestResult`/throw path as CSV parse errors — no new error UI needed. Empty-workbook and corrupt-file errors render via the existing landing error panel.
- **State lifecycle risks:** A stale workbook ref after `reset()` would surface a dead switcher on the next CSV upload. Reset must clear the workbook ref alongside `schema`, `fileName`, and `overrides`. Test scenario in Unit 4 covers this.
- **API surface parity:** The `IngestResult` type gains an optional `workbook` field. Existing callers (CSV/JSON paths) continue to ignore it. Tests cover both branches.
- **Integration coverage:** The schema → selector → chart pipeline is format-agnostic by design — Unit 2 includes an integration test that proves a date column from xlsx survives end-to-end as a `date`-typed column with a temporal-axis chart.
- **Unchanged invariants:** No changes to type detection, chart selection, view-source, infographic templates, export pipeline, or persistence (CP-4 is downstream). No changes to mobile soft-block or landing copy beyond the format list. Privacy posture unchanged — no new network calls, no new permissions.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `xlsx` package supply-chain history | Pin a known-good version, run `pnpm audit` after install, document the pinned version + date in `STATUS.md` session log. Lazy-load reduces the blast radius if a future version is compromised. |
| Bundle weight from SheetJS (~600KB minified) | Dynamic `import('xlsx')` so it lands in a separate chunk and only loads on `.xlsx` upload. Verify via `pnpm build` chunk inspection in Unit 1 verification. |
| Excel date cells with non-standard formats | Read with `cellDates: true` so most date cells surface as Date objects. Custom-format date columns may slip through as numbers — accept as a known gap, file an issue if a real user file breaks. |
| Very large workbooks expanding into multi-100MB CSV strings | The 50MB ceiling on `.xlsx` should keep this rare — Excel compresses well. If a real file breaks, add a per-sheet row-count guard at ingest time. Not pre-optimized. |
| Sheet-switch UX feels heavy if a workbook has 20+ sheets | Render up to N pills inline, then collapse to a `<select>`. Defer the threshold decision to implementation when a real fixture surfaces — start with a flat row and revisit only if it looks visually noisy. |
| Reset leaves a stale workbook ref | Test scenario in Unit 4 explicitly covers the "drop another file → upload CSV" path. |

## Documentation / Operational Notes

- Update [`README.md`](README.md) "Supported formats" line to include Excel.
- Update [`docs/PRODUCT-BRIEF.md`](docs/PRODUCT-BRIEF.md) and [`docs/TECHNICAL-ARCHITECTURE.md`](docs/TECHNICAL-ARCHITECTURE.md) to reflect that `.xlsx` is implemented, not deferred.
- Update [`docs/plans/PLAN.md`](docs/plans/PLAN.md) CP table — add a CP-3.5 row marked Active, then mark Complete on ship.
- Update [`STATUS.md`](STATUS.md) at session end with the implementation summary, library version pinned, and bundle-chunk verification result.

## Sources & References

- Origin: user direction (2026-05-06 session). No prior brainstorm doc.
- Related code: [`src/data/ingest.ts`](src/data/ingest.ts), [`src/components/UploadDropzone.tsx`](src/components/UploadDropzone.tsx), [`src/data/schema.ts`](src/data/schema.ts), [`src/components/SchemaView.tsx`](src/components/SchemaView.tsx).
- Related decisions: PLAN.md Decision #29 (lead audience: students), PLAN.md line 19 (CSV/Excel/JSON v1 input formats), CP-1 risk note in [`src/components/UploadDropzone.tsx:5-6`](src/components/UploadDropzone.tsx).
- External: SheetJS Community Edition (`xlsx` on npm) — reads `.xlsx` in-browser with `cellDates: true` for date handling.
