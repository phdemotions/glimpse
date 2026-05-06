---
title: "feat: Infographic mode — 8 templates + brand fills + social export (CP-3)"
type: feat
status: active
date: 2026-04-30
deepened: 2026-04-30
---

# CP-3: Infographic Mode

## Overview

Infographic mode is the second of the two render paths Glimpse ships for v1 (Quick mode landed in CP-2). Same DuckDB-WASM data engine, same Vega-Lite single renderer, same view-source pedagogy — new render shapes: 8 hand-crafted templates with brand fills, social-share dimensions, plain-English captions, and an export pipeline (SVG / PNG / spec JSON) that both modes share.

**Strategic shift from doc-review (2026-04-30):** when the loaded dataset has at least one template scoring ≥95 (a strong fit), the app **defaults to Infographic mode** with that template selected. This keeps the wedge — pedagogy — in the user's first viewport instead of behind a toggle nobody flips. Quick mode remains the fallback when no template fits cleanly.

## Problem Frame

CP-2 ships Quick mode — useful for "what's in this data?" but not for "I need a visual to put in a deck or tweet." Three gaps:

1. **No infographic-grade output.** Quick-mode bar/line/scatter is correct but not *finished*. Users who want to share leave Glimpse for Figma or Datawrapper.
2. **Pedagogy buried behind a toggle.** CP-2 ships view-source but the user lands in Quick mode and ships their chart without ever discovering Infographic templates. The wedge ships, nobody flips. Adversarial review's top finding.
3. **No export.** Even Quick-mode charts can't be saved out. CP-3 ships the export pipeline that both modes use.

The lead audience remains students learning data literacy (Decision #29). Templates are a teaching device — opinionated layouts that demonstrate "this is what a clean infographic of this shape looks like" with the spec + reasoning visible alongside.

## Requirements Trace

- **R1.** Implement 8 named templates as parametrized Vega-Lite specs (all Vega-Lite, no HTML/CSS — Decision #6):
  - **T1. Big Number** — one headline number on a clean canvas, optional comparison reference. Rendered via `mark: 'text'` on a transparent canvas, not HTML/CSS
  - **T2. Top N Ranking** — sorted bar with rank labels (reuses CP-2 `makeRankingSpec`)
  - **T3. Before / After** — paired bars showing change between two states
  - **T4. Trend Story** — line with annotated peaks/troughs
  - **T5. Distribution at a Glance** — histogram with mean/median markers
  - **T6. Part-to-Whole** — stacked bar
  - **T7. Geographic Pattern** — country-aware visualization (CP-3 ships ranked-bar fallback per Decision #37; full choropleth deferred to post-v1 mini-CP)
  - **T8. Survey Results** — diverging stacked bar for Likert / ordinal scales (user-facing label is "Survey Results," internal id is `survey-likert`)
- **R2.** Each template declares its **applicability**: which detected data shapes it fits. Template picker shows the applicable subset for the loaded dataset, sorted by score.
- **R3.** Use the existing Vega-Lite single renderer (Decision #6). No second viz layer.
- **R4.** Apply brand styling (Ink/Sage/Stone palette, Source Serif 4 + Inter, hairline rules, no shadows) consistent with CP-2 charts.
- **R5.** Render templates at **social-share dimensions** (default 1200×675 for Twitter/X; 1080×1080 square option). Output renders cleanly at viewport size and export size.
- **R6.** Reuse CP-2's `<ViewSource>` so each template exposes its Vega-Lite spec + plain-English reasoning. Generalize `<ViewSource>`'s `spec` prop type if needed (it currently expects a Vega-Lite spec; templates produce Vega-Lite specs, so the existing contract holds).
- **R7.** **Mode toggle in SchemaView header.** Quick mode and Infographic mode are user-flippable. Mode auto-defaults to Infographic when at least one template scores ≥95 against the loaded data; otherwise defaults to Quick. User flip is sticky for the session; reset clears it.
- **R8.** Ship **export pipeline**: SVG download, PNG raster (canvas-based with **inlined font subsets** so brand typography survives the SVG → canvas roundtrip), spec JSON download. Available in both modes.
- **R9.** When zero templates fit, picker shows an empty-state panel with a back-link to Quick mode. Mode toggle stays available.
- **R10.** Mode + selectedTemplate state lifecycle: cleared on schema change (different file) and on reset to landing. Override-driven re-applicability does not silently drop a manually-selected template — it preserves the selection if still applicable, and only auto-picks a new default when the previous selection no longer fits.

## Scope Boundaries

- No custom infographic editor — templates only (PLAN.md anti-scope)
- No theme customization beyond the family palette
- No saved-template library or user-authored templates
- No animations or interactive callouts beyond what Vega-Lite tooltips give for free
- **No HTML/CSS layout for any template** — all 8 are Vega-Lite specs (Decision #6)

### Deferred to Separate Tasks

- **Excel parsing** — own mini-CP (CP-3.5) per Decision #36. Lands between CP-3 merge and CP-4 start. Removes the 3-position drift CP-2's plan introduced
- **Full Geographic Pattern map render** — post-v1 mini-CP per Decision #37. CP-3 ships ranked-bar fallback with an honest banner
- **User testing pre-merge** — 3 think-aloud sessions go on the CP-3.5 / post-v1 docket per Decision #38. CP-3 ships on planner intuition + 5-CSV detection corpus

## Context & Research

### Relevant Code and Patterns

- `src/charts/vega.ts` — `VEGA_CONFIG` brand defaults + 6 spec builders (CP-1+CP-2). Templates compose with these
- `src/charts/selector.ts` — Quick-mode selector. Template applicability uses a parallel concept (`applicableTemplates(columns)`); selector untouched
- `src/charts/captions.ts` — caption template per chart kind. CP-3 extends with per-template captions
- `src/data/schema.ts` — `ColumnInfo` with `subtype` + `confidence`. Templates use the subtype field directly (likert → Survey Results template, geographic → Geographic Pattern fallback)
- `src/components/ViewSource.tsx` — disclosure that exposes spec JSON + reasoning. Already accepts any `VegaSpec`; templates produce Vega-Lite specs, so no contract widening needed
- `src/components/SchemaView.tsx` — top-level layout shell. CP-3 adds mode toggle + template picker between caption and chart
- `src/App.tsx` — state machine + `useMemo` selector. CP-3 lifts mode state via `useReducer` to manage the `mode + selectedTemplate + columnTypeOverrides` lifecycle without race conditions

### Institutional Learnings

- `docs/solutions/` is empty — no prior Glimpse solutions yet
- Memory `feedback_single_renderer_collapse.md` — single Vega-Lite renderer beats grammar-of-graphics fragmentation. CP-3 honors the invariant strictly: every template, including Big Number, is a Vega-Lite spec
- Memory `feedback_lead_audience_v1.md` — every CP-3 decision tested against "does this serve a student first?" — including label choices ("Survey Results" not "Likert chart", "Big Number" not "Single Stat with Context")
- Memory `feedback_cut_features_violating_architecture.md` — applies to Decision #6: don't carve exceptions to locked architecture invariants; use Vega-Lite text marks for Big Number rather than introducing an HTML/CSS render path

### External References

External research skipped. Vega-Lite has documented support for all the patterns: `mark: 'text'` for Big Number; `transform: [{stack, offset: 'center'}]` for diverging stacked bar; `transform: [{window: [{op: 'lag/lead'}], ...}, {filter}]` for local-extrema annotations on Trend Story.

## Key Technical Decisions

- **Templates live in `src/templates/` as a flat module per template** plus an `index.ts` registry. Each template exports `{ id, label, description, applicability, specBuilder, captionFor, dataPrep? }`. Mirrors `src/charts/vega.ts` style — pure functions, no React.
- **Big Number is Vega-Lite text marks**, not HTML/CSS. Spec: a transparent canvas with `mark: 'text'` layers — one for the headline number (Source Serif 4, ~80 px), one for the eyebrow label (Inter, italic sage-700, ~14 px), one for the optional comparison line (Inter, ink-500, ~13 px). Honors Decision #6, removes the per-template export branch, keeps view-source consistent.
- **Trend Story local-extrema via lag/lead/calculate.** Vega-Lite v5's `window` op has no built-in extrema operator. Pattern locked in plan: `transform: [{ window: [{ op: 'lag', field: yField, as: 'prev' }, { op: 'lead', field: yField, as: 'next' }] }, { calculate: 'datum[yField] > datum.prev && datum[yField] > datum.next ? "peak" : (datum[yField] < datum.prev && datum[yField] < datum.next ? "trough" : null)', as: 'extremum' }, { filter: 'datum.extremum != null' }]` driving an annotation `mark: 'text'` layer.
- **Diverging stacked bar (Survey Results) uses VL5's `stack: { offset: 'center' }`** + a `calculate` that signs values by Likert position (positive for "Agree", negative for "Disagree"). Standard pattern, no fallback needed.
- **Template applicability is `(columns) → { fits, score, reason? }`**, pure. `applicableTemplates` filters by `fits: true`, sorts by score desc. Score range 0–100. **Auto-default-to-Infographic threshold: ≥95.**
- **`mode` lifecycle via `useReducer` in App.tsx.** Single reducer owns `{ schema, fileName, mode, selectedTemplate, overrides, error }`. Actions: `LOAD_FILE_SUCCESS`, `LOAD_FILE_ERROR`, `RESET`, `OVERRIDE_TYPE`, `SET_MODE`, `SELECT_TEMPLATE`. Atomic transitions remove race conditions between the picker setting a template and `useEffect` clearing it.
- **Mode default rule** (inside reducer's `LOAD_FILE_SUCCESS`):
  - Compute `applicableTemplates(columns)`
  - If `top.score >= 95`: `mode = 'infographic'`, `selectedTemplate = top.id`
  - Else: `mode = 'quick'`, `selectedTemplate = null`
- **Selection persistence on override**: when the user changes a column type, recompute applicability. If the previously-selected template still fits, keep it. If not, fall to next-highest-scoring fit; if none, switch back to Quick mode.
- **Infographic render uses fixed 1200×675 px**. Templates declare `width: 1200, height: 675` in their specs (not `width: 'container'`). InfographicCanvas wraps with CSS `aspect-ratio: 1200/675; width: 100%; max-width: 1200px;` for responsive viewport. Vega-Lite respects the absolute width; resize observer events stay quiet.
- **PNG export inlines font subsets as base64 in the exported SVG before raster.** `@font-face` rules don't carry through SVG → `Image` → canvas — without this, every PNG renders Times New Roman fallback. Locked pattern: pre-generate Latin-only WOFF2 subsets of Source Serif 4 + Inter (~50 KB total), base64-embed inside `<defs><style>@font-face { src: url(data:font/woff2;base64,...) }</style></defs>` of the serialized SVG, then raster.
- **PNG pixel ratio fixed at 2×.** Retina-sharp without bloating file size past ~600 KB. If file size becomes a complaint, drop to 1× and revisit.
- **SVG export**: serialize the rendered `<svg>` from the chart container via `XMLSerializer`. The same font-inlining applies for embedded compatibility (a downloaded SVG opened in Figma/Illustrator will render in fallback fonts otherwise).
- **Spec JSON export reuses ViewSource's `JSON.stringify(spec, null, 2)`** — same source of truth.
- **Template labels are friendly** — "Big Number," "Top 10," "Before/After," "Trend Story," "Distribution," "Part-to-Whole," "Geographic Pattern," "Survey Results." Internal IDs stay technical (`single-stat`, `survey-likert`) for code; user-facing labels never expose jargon. Honors Decision #29 (lead audience: students learning data literacy — terms like "Likert" gate-keep the audience they target).

## Open Questions

### Resolved During Planning

- **Default infographic dimensions?** 1200×675 (Twitter/X / Open Graph). 1080×1080 square is a per-template option from the export panel.
- **Template picker layout?** Visual card grid (2-col on md+, 1-col on sm). Each card: thumbnail at top, friendly label in serif, description in sans, applicability badge if score < 80 ("limited fit") or unselected.
- **Where does the export button live?** Below the chart in both modes. Three options: SVG, PNG, spec JSON.
- **Zero templates fit?** Picker shows empty-state panel; mode toggle stays available; back-link to Quick mode.
- **How does ViewSource integrate with templates?** Same `<ViewSource>` component — template's `specBuilder()` returns a Vega-Lite spec, `captionFor` returns the eyebrow + body, ViewSource consumes both. No contract widening.
- **Big Number "spec"?** The Vega-Lite text-mark spec itself — same JSON shape as every other template, displayed in view-source like any chart.
- **Friendly labels override jargon.** "Survey Results" not "Likert chart," "Big Number" not "Single Stat with Context."
- **Mode default behavior** locked: Infographic when top template scores ≥95; Quick otherwise.

### Deferred to Implementation

- **Top 5 vs Top 10 limit** — both are options; default 10. Per-render toggle exposed in the export panel? Pick during impl when wiring the picker.
- **PNG export pixel ratio** — locked at 2×. Revisit only if file size complaints surface.
- **Trend Story annotation density** — when many local extrema exist (>5 in a 12-point series), thin them. Lock the heuristic during impl after viewing real renders.
- **Big Number value formatting** — 1.2K vs 1,200 vs 1200 — pick during impl with example data.
- **Likert sign convention** — strongly disagree → -2, disagree → -1, neutral → 0, agree → +1, strongly agree → +2. Use ColumnInfo `subtype: 'likert'` to drive but allow user to flip via override.

## Output Structure

```
glimpse/src/
├── templates/                        ← NEW: template registry + per-template modules
│   ├── index.ts                      ← Template registry, applicableTemplates(), threshold constants
│   ├── types.ts                      ← Template, TemplateId, Applicability types
│   ├── big-number.ts                 ← T1 (Vega-Lite text marks)
│   ├── top-n-ranking.ts              ← T2
│   ├── before-after.ts               ← T3
│   ├── trend-story.ts                ← T4
│   ├── distribution.ts               ← T5
│   ├── part-to-whole.ts              ← T6
│   ├── geographic-pattern.ts         ← T7 (ranked-bar fallback for v1)
│   └── survey-likert.ts              ← T8 (user-facing label "Survey Results")
├── charts/
│   ├── export.ts                     ← NEW: SVG/PNG/JSON export helpers + font-inlining
│   └── font-inline.ts                ← NEW: WOFF2 base64 helper for PNG/SVG export
├── data/
│   └── shape-detect.ts               ← NEW: before/after shape detection
└── components/
    ├── ModeToggle.tsx                ← NEW: quick/infographic segmented control
    ├── TemplatePicker.tsx            ← NEW: card grid with applicability badges
    ├── TemplateThumbnail.tsx         ← NEW: 8 minimal SVG thumbnails
    ├── InfographicCanvas.tsx         ← NEW: 1200×675 frame, scales responsively
    ├── ExportPanel.tsx               ← NEW: SVG/PNG/JSON export buttons (with pending state)
    ├── SchemaView.tsx                ← MODIFIED: mode toggle + template picker + export
    ├── ChartView.tsx                 ← MODIFIED: respects mode (quick spec vs template spec)
    └── App.tsx                       ← MODIFIED: useReducer for atomic mode + selection lifecycle
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Reducer-driven mode + template lifecycle

```
                   ┌──── App.tsx — useReducer state ────┐
                   │  schema, fileName,                  │
                   │  mode: 'quick' | 'infographic',     │
                   │  selectedTemplate?: TemplateId,     │
                   │  overrides: Record<string, type>,   │
                   │  error?: string                     │
                   └──────────────┬──────────────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
   LOAD_FILE_SUCCESS         OVERRIDE_TYPE        RESET / SET_MODE / SELECT_TEMPLATE
   (compute applicable    (recompute applicable   (atomic state move)
    templates;            templates; if previous
    if top.score >= 95    selectedTemplate still
    -> mode='infographic'  fits, keep; else
    + selectedTemplate    re-default per
    = top.id)             threshold rule)
```

### Template applicability decision sketch

```
applicableTemplates(columns) → Template[]
  per-template applicability examples (score range 0-100):
    Big Number:     fits when 1 numeric column with cardinality 1 (a "headline number")
                    OR multiple numerics where one is sum-able
                    score: 100 if cardinality 1; 80 if sum-able multi-row
    Top N:          fits when 1 categorical (cardinality 5..50) + 1 numeric
                    score: 100 if cardinality > 12 (best fit), 60 otherwise
    Before/After:   fits when shape-detect.detectBeforeAfter(columns) returns truthy
                    score: 80
    Trend Story:    fits when 1 date col (cardinality >= 3) + 1 numeric
                    score: 90
    Distribution:   fits when 1 numeric col, no categoricals
                    score: 100
    Part-to-Whole:  fits when 1 categorical (cardinality 2..8) + 1 numeric
                    score: 70
    Geographic:     fits when any column has subtype === 'geographic' + 1 numeric
                    score: 60 (renders fallback ranked bar)
    Survey Results: fits when any column has subtype === 'likert' + 1 numeric
                    score: 95

  applicableTemplates() filters fits:true, sorts by score desc.
  Auto-default rule: if top.score >= 95, mode = 'infographic',
  selectedTemplate = top.id. Else mode = 'quick'.
```

### Export pipeline with font inlining

```
SVG  → grab rendered <svg> → inline base64 font subset (Source Serif 4 + Inter, Latin)
       inside <defs><style>@font-face { src: data:font/woff2;base64,... }</style></defs>
       → outerHTML → Blob('image/svg+xml') → URL.createObjectURL → trigger <a download>

PNG  → same SVG with inlined fonts → serialize → data URL → new Image() with that URL
       → onload: drawImage on <canvas> at 1200x675 * 2x devicePixelRatio
       → canvas.toBlob('image/png') → trigger <a download>
       → ExportPanel shows "rendering..." pending state during async raster

JSON → JSON.stringify(spec, null, 2) → Blob('application/json') → trigger <a download>
```

## Implementation Units

- [ ] **Unit 1: Reducer-driven mode + template state in App.tsx + ModeToggle + InfographicCanvas**

**Goal:** Lift mode lifecycle to a `useReducer`. Add SchemaView header `<ModeToggle>` (segmented control) and `<InfographicCanvas>` (1200×675 frame, scales responsively). The reducer guarantees atomic transitions between schema changes, override changes, mode flips, and template selections — eliminating race conditions before they exist.

**Requirements:** R7, R10

**Dependencies:** None (builds directly on CP-2's App.tsx state).

**Files:**
- Create: `src/components/ModeToggle.tsx`
- Create: `src/components/InfographicCanvas.tsx`
- Modify: `src/App.tsx` (replace `useState` for `state + overrides` with single `useReducer`)
- Modify: `src/components/SchemaView.tsx` (mount ModeToggle under title; conditionally render Quick vs Infographic surface)
- Test: `src/components/ModeToggle.test.tsx`
- Test: `src/components/InfographicCanvas.test.tsx`
- Test: `src/app.reducer.test.ts` (extract reducer to `src/app/reducer.ts` for testability)

**Approach:**
- Extract `appReducer(state, action)` to `src/app/reducer.ts`. Pure function, fully testable.
- Actions: `LOAD_FILE_START`, `LOAD_FILE_SUCCESS`, `LOAD_FILE_ERROR`, `RESET`, `OVERRIDE_TYPE`, `SET_MODE`, `SELECT_TEMPLATE`.
- `LOAD_FILE_SUCCESS` payload includes the precomputed `applicableTemplates` result; reducer applies the auto-default rule deterministically.
- `OVERRIDE_TYPE` recomputes applicability inside the reducer; preserves the current selection when still applicable, falls back to the new top template otherwise.
- `RESET` clears everything back to `idle`.
- `ModeToggle`: italic sage segmented control (`quick · infographic`) with hairline border, sage-700 active state.
- `InfographicCanvas`: outer wrapper uses `aspect-ratio: 1200/675; width: 100%; max-width: 1200px; margin: 0 auto;`. Children render at fixed 1200×675 absolute units; CSS scales the visible viewport.

**Patterns to follow:**
- `src/components/ui/Eyebrow.tsx` — italic sage label pattern.
- `src/components/Landing.tsx:Header` — hairline rules, sage hover states.
- React `useReducer` standard pattern.

**Test scenarios:**
- Happy path (reducer): `LOAD_FILE_SUCCESS` with a top template scoring 100 → state has `mode: 'infographic'` + `selectedTemplate` set.
- Happy path (reducer): `LOAD_FILE_SUCCESS` with all templates scoring <95 → state has `mode: 'quick'` + `selectedTemplate: null`.
- Edge case (reducer): `OVERRIDE_TYPE` removes the previously selected template's fit → reducer falls back to the new top template (or `null` + Quick mode).
- Edge case (reducer): `OVERRIDE_TYPE` keeps the current template applicable → selection unchanged.
- Edge case (reducer): `SET_MODE` to a value the schema doesn't support (e.g., infographic with zero applicable templates) → reducer rejects + leaves state intact (or shows empty-state — pick during impl).
- Happy path (ModeToggle): clicking "infographic" dispatches `SET_MODE('infographic')`; active styling moves.
- Happy path (InfographicCanvas): renders children at logical 1200×675; CSS scales to viewport without distortion.

**Verification:**
- Reducer is pure + fully testable without React.
- Visual QA in preview: toggle flips between Quick and Infographic surfaces; canvas frame holds 1200×675 aspect at every viewport ≥ 768 px.

---

- [ ] **Unit 2: Template type system + registry + applicability + shape detection**

**Goal:** Define the `Template` interface and shape detection helpers. Build the registry function `applicableTemplates(columns)` that returns templates sorted by score. Templates land in Units 3–5; this unit ships the contract.

**Requirements:** R2, R7

**Dependencies:** Unit 1 (mode plumbing exists).

**Files:**
- Create: `src/templates/types.ts` (Template, TemplateId, Applicability, AUTO_INFOGRAPHIC_THRESHOLD constant)
- Create: `src/templates/index.ts` (TEMPLATES registry, applicableTemplates fn)
- Create: `src/data/shape-detect.ts` (detectBeforeAfter helper)
- Test: `src/templates/index.test.ts`
- Test: `src/data/shape-detect.test.ts`

**Approach:**
- `TemplateId = 'big-number' | 'top-n' | 'before-after' | 'trend-story' | 'distribution' | 'part-to-whole' | 'geographic' | 'survey-likert'`
- `Template = { id, label, description, applicability(columns) → { fits: boolean, score: number, reason?: string }, dataPrep?(rows, columns) → unknown, specBuilder(prepared, columns) → VegaSpec, captionFor(columns) → Caption }`
- `applicableTemplates(columns)` filters fits:true, sorts by score desc.
- `AUTO_INFOGRAPHIC_THRESHOLD = 95` exported for the reducer to use.
- `shape-detect.detectBeforeAfter(columns)` returns `{ kind: 'wide', beforeCol, afterCol } | { kind: 'long', categoryCol, valueCol } | null`. Patterns:
  - Wide: 2 numeric columns with names matching `before|previous|prior|q[0-9]+_a` and `after|current|new|q[0-9]+_b`
  - Long: 1 categorical with cardinality === 2 + 1 numeric

**Execution note:** Implement test-first. Applicability functions have many branches; characterize each via fixtures before writing the registry.

**Patterns to follow:**
- `src/charts/selector.ts` — pure function over ColumnInfo[]; deterministic.

**Test scenarios:**
- Happy path: empty registry returns empty array.
- Happy path: shape-detect identifies wide before/after via column names.
- Happy path: shape-detect identifies long before/after via 2-cardinality categorical + numeric.
- Edge case: shape-detect returns null when neither shape matches.
- Integration: applicableTemplates returns templates sorted by score desc.
- Integration: AUTO_INFOGRAPHIC_THRESHOLD is exported and equals 95.

**Verification:**
- TypeScript compiles with template registry shape.
- Tests pass — including empty registry case (templates land Unit 3+4+5).

---

- [ ] **Unit 3: Templates A — Big Number (Vega-Lite text marks), Top N Ranking, Trend Story**

**Goal:** Ship 3 of the 8 templates: T1 Big Number (Vega-Lite text marks on transparent canvas), T2 Top N Ranking (reuses CP-2 `makeRankingSpec`), T4 Trend Story (line + lag/lead/calculate annotations).

**Requirements:** R1, R3, R4, R6

**Dependencies:** Unit 2 (registry + types).

**Files:**
- Create: `src/templates/big-number.ts`
- Create: `src/templates/top-n-ranking.ts`
- Create: `src/templates/trend-story.ts`
- Test: `src/templates/big-number.test.ts`
- Test: `src/templates/top-n-ranking.test.ts`
- Test: `src/templates/trend-story.test.ts`

**Approach:**
- **Big Number:** spec is a Vega-Lite layered chart with three text marks on a transparent (no axis, no grid) canvas:
  - Layer 1: headline number (Source Serif 4, ~80 px, ink-900) — uses `mark: { type: 'text', font: <serif>, fontSize: 80 }` + `encoding: { text: { datum: formattedValue } }`
  - Layer 2: eyebrow label (Inter, ~14 px, italic sage-700) above the number
  - Layer 3: optional comparison line (Inter, ~13 px, ink-500) below the number
  - View bounds 1200×675; positions computed in spec.
- **Top N Ranking:** wraps `makeRankingSpec` (CP-2) with infographic dimensions, brand emphasis on top-3 bars via `condition: { test: 'datum._rank <= 3', value: sage-900 }` color rule.
- **Trend Story:** layer 1 = line + point (uses `makeLineSpec` foundation). Layer 2 = annotation text marks at detected peaks/troughs via the lag/lead/calculate transform locked in Key Technical Decisions. Falls back to plain line (no annotation layer added) when no extrema exist (e.g., monotonic series).

**Patterns to follow:**
- `src/charts/vega.ts` — VEGA_CONFIG, spec builder signatures, `makeLineSpec`, `makeRankingSpec`.
- `src/charts/captions.ts` — caption template per kind.

**Test scenarios:**
- Happy path (big-number): single numeric column, single row → spec has 3 text-mark layers; headline encoding text matches the value.
- Happy path (top-n): cardinality-25 categorical + numeric → returns ranking spec with limit 10 + top-3 emphasis rule.
- Happy path (trend-story): 12-month time series with a clear peak in month 8 → annotation layer renders text at that point.
- Edge case (big-number): multiple numerics — picks first by column order; spec still renders.
- Edge case (trend-story): monotonic series — no annotation layer; line still renders.
- Edge case (trend-story): 3-point series with peaks at every endpoint — extrema filter still produces sensible annotations (lag/lead nulls handled).
- Applicability: big-number fits when cardinality=1 (score 100) or sum-able (score 80).
- Applicability: top-n scores 100 when cardinality > 12.
- Integration: each template's specBuilder output validates via `vega-lite` schema and renders via vega-embed against fixture data.

**Verification:**
- All 3 templates registered via Unit 2 registry.
- Big Number renders cleanly via vega-embed (no axis lines, no grid, just typography on transparent canvas).
- Trend Story renders annotations only when extrema exist.

---

- [ ] **Unit 4: Templates B — Distribution, Part-to-Whole, Survey Results**

**Goal:** Ship 3 more templates: T5 Distribution at a Glance (histogram + mean/median markers), T6 Part-to-Whole (stacked bar), T8 Survey Results (diverging stacked bar — internal id `survey-likert`, user-facing label `Survey Results`).

**Requirements:** R1, R3, R4, R6

**Dependencies:** Unit 2 (registry + types).

**Files:**
- Create: `src/templates/distribution.ts`
- Create: `src/templates/part-to-whole.ts`
- Create: `src/templates/survey-likert.ts`
- Test: `src/templates/distribution.test.ts`
- Test: `src/templates/part-to-whole.test.ts`
- Test: `src/templates/survey-likert.test.ts`

**Approach:**
- **Distribution at a Glance:** uses `makeHistogramSpec` foundation (CP-2 already pre-bins in DuckDB) + adds `layer: [{ mark: 'rule', encoding: { x: { datum: meanValue } } }, { mark: 'rule', strokeDash: [4,4], encoding: { x: { datum: medianValue } } }]`. Mean is solid, median is dashed; both sage-700.
- **Part-to-Whole:** stacked bar (single horizontal series) with brand category palette. Uses `transform: 'stack'` + brand color encoding. For 4-8 categories, stacked horizontal bar that reads left-to-right.
- **Survey Results:** diverging stacked bar via `transform: [{ stack: 'value', offset: 'center', as: ['stackStart', 'stackEnd'] }]` + a `calculate` that signs values by Likert position (negative for "Strongly Disagree" / "Disagree", positive for "Agree" / "Strongly Agree", zero for "Neutral"). Sage-700 for agreement, danger-tinted for disagreement, neutral grey for middle. Centerline at 0.

**Patterns to follow:**
- `src/charts/vega.ts:makeHistogramSpec` for distribution foundation.
- `src/charts/vega.ts:VEGA_CONFIG.range.category` for color palette.

**Test scenarios:**
- Happy path (distribution): 1 numeric column → returns spec with bar layer + 2 rule layers (mean solid, median dashed).
- Happy path (part-to-whole): 4 categories + 1 numeric → returns stacked bar spec with category color encoding.
- Happy path (survey-likert): column with `subtype: 'likert'` + numeric counts → returns diverging stacked bar with centerline.
- Edge case (distribution): zero variance (all values identical) → falls back to single-bar with note about degenerate distribution.
- Edge case (survey-likert): no likert column → applicability returns `{ fits: false }`.
- Edge case (part-to-whole): cardinality 8+ → applicability returns `{ fits: false, reason: 'too many categories for part-to-whole' }`.
- Edge case (survey-likert): unrecognized Likert label values (e.g., custom 7-point scale) → fits at lower score; Likert sign convention deferred to ColumnInfo override or impl-time decision.

**Verification:**
- All 3 render via vega-embed against fixture data.
- Survey Results renders diverging-stacked layout with centerline at 0; agreement on right, disagreement on left.

---

- [ ] **Unit 5: Templates C — Before/After + Geographic Pattern (with banner fallback)**

**Goal:** Ship the last 2 templates: T3 Before/After (paired bars) and T7 Geographic Pattern (ranked-bar fallback with sage-700 deferral banner per Decision #37).

**Requirements:** R1, R3, R4, R6, R9

**Dependencies:** Unit 2 (registry + types) + Unit 4 (shared patterns from `part-to-whole`).

**Files:**
- Create: `src/templates/before-after.ts`
- Create: `src/templates/geographic-pattern.ts`
- Test: `src/templates/before-after.test.ts`
- Test: `src/templates/geographic-pattern.test.ts`

**Approach:**
- **Before/After:** consumes the wide or long shape from `shape-detect.detectBeforeAfter`. Renders as paired bars — two columns side-by-side per category — with a sage-tinted "delta" rule connecting paired bar tops via `layer: [{ mark: 'bar' }, { mark: 'rule', strokeDash: [2,2] }]`. For wide shape, dataPrep transposes to long.
- **Geographic Pattern (v1 fallback):** detects via `subtype: 'geographic'`. dataPrep groups by the geographic column + sums the numeric column. Renders as ranked bar (reuses `makeRankingSpec`) with country names. **Banner:** spec includes a top-of-canvas `mark: 'text'` layer rendering the deferral message in sage-700 italic ("Geographic data detected in *country* — full world-map render coming after v1"). Or render the banner as a separate text element above the chart in the InfographicCanvas (not inside the spec) — pick during impl when the layout actually shows.

**Patterns to follow:**
- `src/templates/top-n-ranking.ts` (Unit 3) for the ranked-bar reuse.
- `src/data/shape-detect.ts` (Unit 2) for before/after detection.
- Decision #37 deferral language for the banner copy.

**Test scenarios:**
- Happy path (before-after wide): `[{ name: 'team', before: 5, after: 8 }]` → spec with paired bars + delta rules.
- Happy path (before-after long): `[{ team: 'A', period: 'before', value: 5 }, { team: 'A', period: 'after', value: 8 }]` → spec consumes long shape directly.
- Happy path (geographic): column with `subtype: 'geographic'` + numeric → returns ranked-bar spec + banner text confirming deferral.
- Edge case (before-after): single category → still renders, one paired group.
- Edge case (geographic): column detected but values don't match KNOWN_COUNTRIES (low confidence) → applicability still true; caption uses generic "geographic data detected" rather than asserting country knowledge.
- Edge case (geographic): no numeric column → applicability `false`.

**Verification:**
- Both templates registered + render against fixtures.
- Geographic banner renders with sage-700 styling at the canvas top.

---

- [ ] **Unit 6: Template picker UI + thumbnails**

**Goal:** Build `<TemplatePicker>` — card grid showing applicable templates with hand-drawn thumbnails and applicability badges. Empty state when zero templates apply.

**Requirements:** R2, R7, R9

**Dependencies:** Units 1–5 (templates + reducer ready).

**Files:**
- Create: `src/components/TemplatePicker.tsx`
- Create: `src/components/TemplateThumbnail.tsx` (8 minimal SVG previews — bar/line/etc shapes, ~80×60 px)
- Test: `src/components/TemplatePicker.test.tsx`
- Test: `src/components/TemplateThumbnail.test.tsx`

**Approach:**
- 2-column grid on md+, 1-column on sm. Each card: thumbnail at top, friendly label in serif, description in sans, applicability badge if score < 80 ("limited fit" pill in italic sage).
- Cards: 1px ink-200 border (no shadows). Selected: sage-500 border + sage-50 background tint.
- Empty state when `applicableTemplates(columns).length === 0`: serif headline "Your data doesn't fit any templates yet" + sub explaining + back-link dispatches `SET_MODE('quick')`.
- Thumbnails are static hand-coded SVGs, ~10 minutes each. Eight tiny SVGs minimal: bar shapes, line shapes, big-number "N" placeholder, etc.

**Patterns to follow:**
- `src/components/Landing.tsx` — sample picker as buttons with hover state.
- `src/components/UploadDropzone.tsx` — selected/hover via border + bg shift.

**Test scenarios:**
- Happy path: renders one card per applicable template.
- Happy path: clicking a card dispatches `SELECT_TEMPLATE(id)`.
- Happy path: cards sorted by score desc.
- Edge case: empty templates array → empty state with back-link to Quick mode.
- Edge case: selected template gets sage border + bg tint.
- Accessibility: each card is a button with appropriate label; keyboard navigable.

**Verification:**
- Visual QA in preview: card grid reads cleanly at 1280×900 + 768×1024.
- Clicking a card flips the rendered chart to that template within 200 ms.

---

- [ ] **Unit 7: Export pipeline (SVG + PNG with inlined fonts + spec JSON)**

**Goal:** Build `<ExportPanel>` with 3 buttons. PNG raster inlines font subsets so brand typography survives the SVG → canvas roundtrip. Available in both modes.

**Requirements:** R8

**Dependencies:** Units 1–6 (templates ship rendered SVGs in DOM).

**Files:**
- Create: `src/charts/font-inline.ts` (WOFF2 base64 helper; pre-generated subsets bundled at build time)
- Create: `src/charts/export.ts` (downloadSvg, downloadPng, downloadJson — all use font-inlining where applicable)
- Create: `src/components/ExportPanel.tsx`
- Modify: `src/components/SchemaView.tsx` (mount ExportPanel below chart in both modes)
- Test: `src/charts/export.test.ts`
- Test: `src/charts/font-inline.test.ts`
- Test: `src/components/ExportPanel.test.tsx`

**Approach:**
- **font-inline.ts:** at build time, generate Latin-only WOFF2 subsets of Source Serif 4 + Inter (~25 KB each). Embed as base64 strings in a TS module. `inlineFonts(svgString) → string` injects `<defs><style>@font-face { src: url(data:font/woff2;base64,...) }</style></defs>` into the SVG.
- **downloadSvg(svgEl, filename):** serialize via `XMLSerializer` → call `inlineFonts` → Blob('image/svg+xml') → trigger anchor download.
- **downloadPng(svgEl, dimensions, filename):** serialize SVG → `inlineFonts` → data URL → load via `Image` → onload: `canvas.drawImage` at dimensions × `window.devicePixelRatio` (capped at 2×) → `canvas.toBlob('image/png')` → download. Promise-based for `<ExportPanel>` to show pending state.
- **downloadJson(spec, filename):** `JSON.stringify(spec, null, 2)` → Blob('application/json') → download.
- **`<ExportPanel>`** accepts `{ svgEl, spec, filename }`. Three ghost-variant buttons (sage-700 hover). PNG button shows "rendering..." text while the canvas draws (typically 50–200 ms).

**Patterns to follow:**
- `src/components/MobileSoftBlock.tsx` — `navigator.clipboard` pattern (similar URL-blob lifecycle).
- `src/components/ui/Button.tsx` — ghost variant.

**Test scenarios:**
- Happy path (svg): given an `<svg>` element + inlined-fonts CSS, downloadSvg writes the serialized XML to a Blob with the font CSS in `<defs>`.
- Happy path (json): downloadJson writes pretty-printed JSON with `application/json` MIME.
- Happy path (png): downloadPng draws the SVG onto a canvas at requested dimensions × 2× pixel ratio. (jsdom + small SVG fixture; verify canvas width/height post-draw.)
- Happy path (font-inline): `inlineFonts(svg)` returns SVG string with `<defs><style>` containing `@font-face` rules with base64 src.
- Edge case: missing `<svg>` element → ExportPanel buttons disabled.
- Edge case: SVG with external image refs → CP-3 ships only inline-styled SVGs (no external assets); document in JSDoc.
- Integration (manual): exported PNG opened in macOS Preview shows Source Serif 4 / Inter glyphs, not Times New Roman fallback.

**Verification:**
- Manual: click each export button against the live Quick chart + each of the 8 templates → downloaded files open cleanly in macOS Preview / Figma / a text editor with brand fonts intact.
- File sizes: SVG <120 KB (with inlined fonts), PNG <600 KB at 1200×675 × 2×.
- Test corpus: 3 sample CSVs × 8 templates × 3 export formats = 72 manual exports. Spot-check 12 across the matrix.

---

## System-Wide Impact

- **Interaction graph:** App.tsx becomes the source of truth for `mode + selectedTemplate + overrides` via reducer. SchemaView/ChartView/TemplatePicker are controlled. Reducer-based atomic transitions remove the race-condition class entirely.
- **Error propagation:** template `specBuilder` failures should surface inline in the InfographicCanvas with a fallback "couldn't render this template — try Quick mode" panel. Distinct from chart render errors (already handled).
- **State lifecycle risks:** **resolved by reducer.** Schema change, override change, mode flip, template select, reset — all are reducer actions, all atomic. The clearing rules are unit-tested.
- **API surface parity:** No external API surfaces touched. `<ViewSource>` already accepts any `VegaSpec`; templates produce Vega-Lite specs; **no contract widening needed** because Big Number is now a Vega-Lite text-marks spec, not a LayoutDescriptor (Decision #6 honored).
- **Integration coverage:** One end-to-end test should load a sample CSV in infographic mode, pick the default template, expand view-source, and assert the JSON shown matches what the template builder returned.
- **Bundle size:** templates + thumbnails + font subsets ≈ <80 KB. Acceptable. Bigger size cost remains DuckDB-WASM (CP-1) and Vega-Lite (CP-2).
- **Unchanged invariants:** Vega-Lite is the only renderer (Decision #6, **strictly honored** — Big Number is Vega-Lite text marks). Privacy posture (no analytics, no telemetry) remains. Hide-source default + toggle (Decision #13) is honored. CP-1+CP-2 Quick-mode behavior unchanged when `mode === 'quick'`.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **8 templates × edge cases drift visual quality** | Lock visual approval per template at the start of Unit 3/4/5. Each template gets a screenshot reviewed before commit. Plan caps templates at 8 — no creep |
| **PNG export fonts** — `@font-face` doesn't carry through SVG → Image → canvas | **Locked: inline base64 WOFF2 subsets in exported SVG before raster.** ~50 KB additional per export — acceptable. Manual verification against macOS Preview before merge |
| **Trend Story local-extrema spec complexity** | Pattern locked in Key Technical Decisions: lag/lead/calculate/filter chain in Vega-Lite v5 `transform`. Test scenarios cover 3-point edge case + monotonic fallback |
| **Diverging stacked bar (Survey Results)** | Pure VL5 pattern (`stack: { offset: 'center' }` + signed `calculate`). Standard, no fallback needed |
| **Mode default auto-switch surprises users** | Threshold ≥95 means only very-clean fits trigger the auto-switch. Visible mode toggle always available. Caption explicitly names which template was auto-picked: "Showing Top 10 because your data has 25 categories." |
| **Mode lifecycle race conditions** | **Resolved at design time** via `useReducer`. Unit 1 ships the reducer + tests; Unit 6 dispatches actions, never owns state directly |
| **8 SVG thumbnails × 10 min each = 80 min design work** | Hand-drawn minimal shapes. If a thumbnail takes >20 min, ship an unstyled placeholder + iterate later |
| **No user testing pre-merge** (Decision #38) | Accepted trade. 3 think-aloud sessions on the post-merge / CP-3.5 docket. If post-ship feedback flags template confusion, drop or relabel |
| **Template names ("Likert," "diverging stacked bar") gate-keep students** | **Resolved**: user-facing labels are friendly ("Survey Results," "Big Number"). Internal IDs stay technical. Captions explain in plain English |
| **Geographic ranked-bar fallback erodes trust** | Honest banner ("full world-map render coming after v1") sets expectation. Real fix is post-v1 mini-CP per Decision #37 |
| **Excel parsing scope creep into CP-3** | **Resolved**: Decision #36 — Excel becomes its own focused mini-CP (CP-3.5). Removes the 3-position drift from CP-2's plan |

## Documentation / Operational Notes

- Update `STATUS.md` with CP-3 completion summary and CP-3.5 (Excel) entry point.
- Update `docs/plans/PLAN.md` CP-3 row to `Complete` after merge.
- Update `README.md`: "What it does" — Infographic mode bullet to present tense; add "Export — SVG, PNG, or spec JSON for any chart, with brand typography preserved."
- Add `docs/TECHNICAL-ARCHITECTURE.md` section on the template registry pattern + font-inlining for export.
- No operational rollout concerns — static GitHub Pages, no DB migrations, no flags.

## Sources & References

- `glimpse/CLAUDE.md` — hard stops, stack, design language
- `glimpse/docs/plans/PLAN.md` — locked decisions #6 (now strictly honored), #13, #21, #23, #24, #28, #29, #30, #34, #35, **#36 (Excel → CP-3.5)**, **#37 (Geographic post-v1)**, **#38 (user-testing gap accepted)**
- `glimpse/docs/plans/2026-04-30-001-feat-glimpse-v1-plan.md` — CP-1 plan + outputs
- `glimpse/docs/plans/2026-04-30-002-feat-quick-mode-cp-2-plan.md` — CP-2 plan (selector, captions, view-source)
- `glimpse/docs/VISUAL-IDENTITY.md` — palette, typography, anti-patterns
- `glimpse/docs/TECHNICAL-ARCHITECTURE.md` — stack reasoning, lazy-load strategy
- Memory `feedback_single_renderer_collapse.md` — single Vega-Lite renderer
- Memory `feedback_lead_audience_v1.md` — students lead, friendly labels over jargon
- Memory `feedback_cut_features_violating_architecture.md` — Big Number as Vega-Lite text marks (not HTML/CSS exception)
- CP-1 PR: [phdemotions/glimpse#1](https://github.com/phdemotions/glimpse/pull/1) (merged)
- CP-2 PR: [phdemotions/glimpse#2](https://github.com/phdemotions/glimpse/pull/2) (merged)
- Doc-review (3-persona, 2026-04-30): coherence + feasibility + adversarial passes; findings synthesized into this revision (PNG font fix, Big Number as text marks, mode auto-default to Infographic, Excel → CP-3.5, Geographic deferral, user-testing gap acknowledged)
