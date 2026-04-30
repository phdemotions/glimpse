---
title: "feat: Quick mode + view-source (CP-2)"
type: feat
status: active
date: 2026-04-30
deepened: 2026-04-30
---

# CP-2: Quick Mode + View-Source

## Overview

Quick mode is the opinionated default that meets the user's data without forcing them to learn a chart-picker. CP-1 ships a single-shape bar chart with manual X/Y selection. CP-2 turns that into a tool that *reads* the data — detects column types with a 3-tier confidence model, picks the chart type that fits the shape, renders it with brand-styled defaults, explains the choice in plain English, **and exposes the underlying Vega-Lite spec via a view-source toggle**.

View-source ships in CP-2 alongside Quick mode, not later (PLAN.md Decision #30 revised, post-CP-2 doc-review). The wedge differentiator from ChatGPT code interpreter is the spec + plain-English "why" — without it, Quick mode is a convenience layer the competitor already covers. With it, Quick mode is the moat.

## Problem Frame

CP-1 proves the spine but stops short of the core experience. Four gaps:

1. **No type intelligence.** DuckDB returns raw types; we don't classify ordinal/Likert/geographic columns or date-vs-string ambiguity. Misclassification is the #1 chart-breaking failure mode (PLAN.md Decision #24).
2. **No chart selection.** Bar-only is fine for proving the renderer, wrong as a daily-use default.
3. **No explanation.** The wedge is pedagogy (Decision #30). Even Quick mode needs one sentence naming the chart and the data shape behind the choice.
4. **No view-source.** The CP-1 doc-review revision moved view-source out of CP-3 because CP-2 without it ships only the convenience layer the competitor already provides. Pedagogy ships with the surface it differentiates, not after.

The lead audience is students learning data literacy (Decision #29). Every CP-2 decision serves a student first: they get a chart they can defend, with words they can use, a way to fix it if our guess is wrong, and the spec + reasoning shown beside it so they're learning, not just consuming.

## Requirements Trace

- **R1.** Detect column types beyond DuckDB's primitive classifications: numeric, string, date (high/low confidence), ordinal/Likert (English-anchored + cardinality fallback), geographic (low confidence by default), boolean.
- **R2.** Pick a default chart type from the detected shape: bar, line, scatter, histogram, pie/donut, top-N ranking. (No infographic templates yet — those land in CP-3.)
- **R3.** Render the chosen chart via the existing Vega-Lite single renderer (PLAN.md Decision #6) — no second viz path.
- **R4.** Generate a plain-English caption that names the chart type and explains the data-shape reasoning. Tone benchmark locked in plan.
- **R5.** Surface inferred type per column with a 3-tier confidence badge (PLAN.md Decision #35 operationalizing #24).
- **R6.** Provide a frictionless type-override UI. Override propagates to chart selector and caption.
- **R7.** Honor PLAN.md Decision #34 — ISO 8601 dates high confidence, US `M/D/YYYY` patterns medium confidence (flagged for confirmation), other formats default to string.
- **R8.** Keep CP-1 manual X/Y picker available as a fallback when auto-selection has too few options or a tied result.
- **R9.** **Ship a view-source toggle** that exposes the Vega-Lite spec JSON for the active chart and a plain-English "why" panel explaining the selector's reasoning.

## Scope Boundaries

- No infographic-mode templates (CP-3)
- No saved sessions or service worker (CP-4)
- No multi-chart small-multiples or faceting
- No statistical inference, regression, or hypothesis testing — wrong tool, wrong audience (PLAN.md anti-scope)

### Deferred to Separate Tasks

- **Excel parsing** — deferred to **CP-3** alongside the templates work, where DuckDB-WASM `excel` extension can be loaded once and shared across both modes. (CP-1 risk note proposed CP-2; CP-3 is the cleaner home given extension load weight.)
- **Geographic chart rendering** — type detection identifies a country/state/lat-lng column in CP-2; the choropleth/bubble-map *render* lands with templates in CP-3.

## Context & Research

### Relevant Code and Patterns

- `src/data/schema.ts` — current type classifier (`numeric` / `string` / `date` / `boolean` / `unknown`). CP-2 adds finer types and confidence + extends `ColumnInfo`.
- `src/data/duckdb.ts` — singleton accessor and idle prefetch. Untouched in CP-2; selector queries flow through the same connection pattern as CP-1.
- `src/charts/vega.ts` — `VEGA_CONFIG` brand defaults + `makeBarSpec`. CP-2 adds `makeLineSpec`, `makeScatterSpec`, `makeHistogramSpec`, `makePieSpec`, `makeRankingSpec`. All share `VEGA_CONFIG`.
- `src/components/ChartView.tsx` — manual X/Y picker. CP-2 wraps this with auto-selector but keeps the picker available as the override path. BigInt coercion is currently in this file; CP-2 moves it to a shared util to prevent regression as new specs land.
- `src/components/SchemaView.tsx` — current schema table. CP-2 adds caption above chart, confidence badges, type-override dropdowns, and a view-source disclosure under the chart.
- `src/styles/tokens.ts` — palette, typography, animation tokens. No changes; CP-2 uses existing `sage`, `ink`, `warning` tokens.

### Institutional Learnings

- `docs/solutions/` is empty (Glimpse is new). No prior solutions to reference yet.
- PLAN.md Decision #6 — Vega-Lite is the single renderer for both modes. CP-2 must not introduce Plot, Mosaic, or any second renderer.
- Memory: `feedback_single_renderer_collapse.md` — when chart-type count is small (~5–10), one rendering library beats best-of-breed fragmentation. CP-2 stays inside Vega-Lite.
- Memory: `feedback_lead_audience_v1.md` — lead audience is students; every CP-2 decision tested against "does this serve a student first?"

### External References

External research skipped. Vega-Lite specs for the 5 chart types are well-documented; the codebase has the working `makeBarSpec` to mirror; type-detection heuristics are domain-standard.

## Key Technical Decisions

- **Type-detection lives in `src/data/schema.ts` (extending `ColumnInfo`) plus a new `src/data/type-detect.ts` for the helpers.** Single source of truth flows through every consumer.
- **Confidence is a 3-tier enum (`high` / `medium` / `low`)** — discrete tiers map cleanly to UI affordances and avoid false numeric precision (PLAN.md Decision #35).
- **Chart selector is a pure function with `useMemo` at the call site.** `selectChart(columns, overrides)` has no I/O, no side effects. Memoized in React to keep useEffect dependencies stable and prevent re-render churn.
- **Sample-collection query is batched into a single round trip** — one CTE-based query returns up to 50 sample values per column for all columns at once. Avoids the per-column-query trap that would breach CP-1's sub-1s `getSchema` budget on wide datasets.
- **Captions are template-based, not LLM-generated** — per PLAN.md Decision #21, no LLM calls in v1.
- **Caption tone benchmark locked in plan**, not deferred. Voice = direct, addresses "you," names actual columns, no jargon. Reading-level target ≤ grade 9 (Flesch-Kincaid). Locked example sentences for each chart kind in Unit 4.
- **Override = single source of truth, lifted to App.tsx.** A `columnTypeOverrides` map lives in `App.tsx` alongside the schema state so `reset()` clears it cleanly. SchemaView and ChartView are controlled.
- **BigInt coercion centralized in `src/data/coerce.ts`** — prevents the regression that would happen when new chart specs are added without remembering CP-1's coerce step.
- **Histogram pre-bins in DuckDB**, not in Vega-Lite client-side. `SELECT FLOOR(value / bin_width) * bin_width AS bucket, COUNT(*)` runs in the engine and ships only aggregated rows to Vega-Lite — keeps performance flat for 50K+ row datasets.
- **Date precedence:** ISO 8601 → high. US `M/D/YYYY` → medium (override prompt). Other → string. Per PLAN.md Decision #34.
- **Likert detection** is anchor-based with cardinality fallback. English anchors (`strongly agree`, `agree`, etc.) at medium confidence when ≥80% of non-null values match. Otherwise: cardinality 3–7 + all-string + cardinality < 0.4 × row count → ordinal at low confidence. Real-world surveys with "Don't know / N/A" pass after filtering nulls/sentinel values from the match denominator.
- **Geographic detection** is name-anchored at low confidence by default. Column name matches `country|state|province|region|lat|lng|longitude|latitude` → geographic at *low* confidence; bumps to medium only when values match a known list (CP-2 ships ISO 3166 country names + 2/3-letter codes). Render is deferred to CP-3.
- **Line chart guard** — line is selected only when n ≥ 3 distinct date values AND the date series spans at least three intervals. Below that, fall through to bar.
- **Top-N ranking spec** explicitly sorts by measure before windowing — `transform: [{ window: [{ op: 'rank', as: '_rank' }], sort: [{ field: yField, order: 'descending' }] }, { filter: 'datum._rank <= 10' }]`.
- **TypeOverrideDropdown collapses past 20 columns** — beyond 20, schema table renders the first 20 inline and a "show all N columns" disclosure for the rest, so the schema panel doesn't dominate over the chart.
- **View-source toggle** lives in `<ChartView>` as a disclosure under the chart. Off by default (Decision #13: hide-source default; toggle to reveal). On reveal: spec JSON in monospace + plain-English "why" derived from `ChartChoice`. Same component will be reused in CP-3 for templates.

## Open Questions

### Resolved During Planning

- **Should ChartView retain its X/Y picker?** Yes — as the override path. When `ChartChoice.kind === 'none'` the picker is the primary surface (CP-1 fallback). Otherwise it's reachable under a "tweak" disclosure.
- **What's the chart-selector failure mode?** When no chart fits, render `kind: 'none'` with a caption explaining why (e.g., "your data has no numeric measure to plot") and surface the manual picker.
- **Where does the caption render?** Above the chart. Italic sage chart-kind eyebrow on top, body line in `font-serif text-lg text-ink-700` below it.
- **Confidence badge placement?** In the schema-table type cell, inline with the type label. Low confidence shows the override dropdown immediately; medium shows a hint; high shows just the type label.
- **View-source UX?** A `<details>` disclosure under the chart titled "Show the spec" (italic sage, hairline-flanked eyebrow style). On expand: two columns — left shows formatted Vega-Lite spec JSON in JetBrains Mono, right shows the chart-selection reasoning prose.
- **Lifecycle owner for `columnTypeOverrides`?** App.tsx, alongside the existing app-state machine. Ensures `reset()` clears it.

### Deferred to Implementation

- **Histogram bin count.** Sturges' formula vs Freedman-Diaconis vs fixed 20. Pick during implementation against real sample data; lock in code with a comment.
- **Pie chart cardinality cap** — pie shouldn't render past N slices. Pick the cap (likely 6) during implementation when looking at how it actually renders.
- **Date format support beyond ISO + US** — European D/M/YYYY, Unix timestamps, ISO with timezone. Defer detection of these to evidence from real user files.
- **Spec JSON formatter** — built-in `JSON.stringify(spec, null, 2)` is likely enough for v1; revisit if reviewers want syntax highlighting.

## Output Structure

```
glimpse/src/
├── data/
│   ├── schema.ts                  ← MODIFIED: extends ColumnInfo with subtype + confidence
│   ├── type-detect.ts             ← NEW: detection helpers (date, ordinal, geo, Likert)
│   ├── sample-rows.ts             ← NEW: batched per-column sample fetcher (single query)
│   └── coerce.ts                  ← NEW: BigInt → Number coercion (centralized)
├── charts/
│   ├── vega.ts                    ← MODIFIED: adds line/scatter/histogram/pie/ranking specs
│   ├── selector.ts                ← NEW: pure function — schema → ChartChoice
│   └── captions.ts                ← NEW: template-based caption generator + reasoning
└── components/
    ├── ChartView.tsx              ← MODIFIED: auto-selects on schema change, retains picker as override, mounts view-source disclosure
    ├── SchemaView.tsx             ← MODIFIED: caption above chart, confidence column in schema table, 20-col collapse
    ├── TypeOverrideDropdown.tsx   ← NEW: per-column dropdown
    ├── ConfidenceBadge.tsx        ← NEW: high/medium/low affordance primitive
    └── ViewSource.tsx             ← NEW: disclosure component — spec JSON + reasoning
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Data flow

```
DuckDB schema (CP-1 base)
        │
        ├─► sample-rows.ts: ONE batched query
        │     SELECT column_name,
        │            list(non_null_value)[1:50] AS samples
        │     FROM unnested(...)
        │
        ▼
type-detect.ts: enrich each column with
   - subtype (ordinal | likert | geographic | null)
   - confidence (high | medium | low)
        │
        ▼
ColumnInfo[] (extended)
        │  + columnTypeOverrides (App.tsx state)
        ▼
useMemo(() => selectChart(cols, overrides), [cols, overrides])
        │
        ▼
ChartChoice  { kind, xField, yField, sortDesc, limit, reasoning }
        │
        ├─► makeBarSpec / makeLineSpec / ...   ← src/charts/vega.ts
        │       │
        │       ▼
        │     VegaSpec  (BigInt-coerced data)
        │       │
        │       ▼  vega-embed → SVG
        │
        └─► captions.ts → { eyebrow, body }
                │
                ▼  rendered above chart
                +
                view-source disclosure under chart:
                  ├─ JSON.stringify(spec, null, 2)
                  └─ ChartChoice.reasoning + caption.body
```

### Chart-selection decision sketch

```
schema → categorical_count, numeric_count, date_count_distinct,
         geo_count, total_rows, max_cardinality

  geo_count >= 1 AND has known-list match     → geo (defer render to CP-3, fall through)
  date_count_distinct >= 3 AND numeric_count >= 1 AND monotonic-ish
                                              → line (single Y) or scatter (multiple Y)
  numeric_count >= 2 AND no usable date       → scatter
  numeric_count == 1 AND categorical == 0     → histogram
  categorical_count == 1, numeric_count == 1, cardinality <= 6   → pie
  categorical_count == 1, numeric_count == 1, 7 <= cardinality <= 12 → bar
  categorical_count == 1, numeric_count == 1, cardinality > 12  → ranking (top-N bar)
  fallback                                    → kind: 'none'
                                                (manual picker primary)
```

This is directional. The implementer adjusts thresholds against real samples.

## Implementation Units

- [ ] **Unit 1: Centralize BigInt coercion + add batched sample fetcher**

**Goal:** Move BigInt coercion out of ChartView into a shared util, and add a single-batched-query sample collector. Both are foundations Units 2-7 depend on.

**Requirements:** R1 (foundation), R3 (regression prevention)

**Dependencies:** None.

**Files:**
- Create: `src/data/coerce.ts`
- Create: `src/data/sample-rows.ts`
- Modify: `src/components/ChartView.tsx` (remove inline `coerce`, import from shared)
- Test: `src/data/coerce.test.ts`
- Test: `src/data/sample-rows.test.ts`

**Approach:**
- `coerce.ts` exports `toJsValue(value: unknown): unknown` — handles BigInt → Number, Arrow Date → ISO string, Arrow Decimal → Number. Used everywhere DuckDB rows enter app code.
- `sample-rows.ts` exports `getSampleRows(tableName, columnNames, n=50): Promise<Record<string, unknown[]>>` — issues ONE query that returns up to N non-null sample values per column. Implementation: `SELECT '<col1>' AS col, <col1>::VARCHAR AS sample FROM <table> WHERE <col1> IS NOT NULL LIMIT 50 UNION ALL ...` joined per column then aggregated client-side, OR a single CTE using `array_agg` per column. Benchmark both during implementation; commit to whichever stays under 200 ms on 100-column synthetic data.

**Patterns to follow:**
- `src/data/schema.ts` — pure-function helpers, async DB connection pattern.

**Test scenarios:**
- Happy path (coerce): BigInt(42) → Number 42; Arrow Date instance → ISO string; plain string → unchanged.
- Edge case (coerce): BigInt(2 ** 60) → Number with documented precision-loss comment, no throw.
- Happy path (sample-rows): 3-column table, 100 rows → returns max 50 per column, all non-null.
- Edge case (sample-rows): table where one column is all-null → returns empty array for that column, others unaffected.
- Performance benchmark (sample-rows): 100-column synthetic table → returns under 200 ms in dev.
- Edge case (sample-rows): column name contains a quote `"` → escaped safely, no SQL injection.

**Verification:**
- `pnpm typecheck` clean.
- `coerce` unit tests pass with no regressions in CP-1's chart render path.
- Sample fetcher returns expected shape for the 3 sample CSVs.

---

- [ ] **Unit 2: Extend type detection in `src/data/schema.ts` + new `src/data/type-detect.ts`**

**Goal:** Enrich DuckDB schema output with finer column subtypes and a 3-tier confidence value.

**Requirements:** R1, R5, R7

**Dependencies:** Unit 1 (sample-rows fetcher).

**Files:**
- Create: `src/data/type-detect.ts`
- Modify: `src/data/schema.ts`
- Test: `src/data/type-detect.test.ts`

**Approach:**
- Extend `ColumnInfo` with `subtype: 'ordinal' | 'likert' | 'geographic' | null` and `confidence: 'high' | 'medium' | 'low'`.
- `type-detect.ts` exports pure functions:
  - `detectDateConfidence(samples: string[])` — ISO regex (high), US `M/D/YYYY` regex (medium), else `low` and string.
  - `detectOrdinalLikert(samples: string[])` — first filter sentinel nulls (`'n/a'`, `'don’t know'`, `''`); English anchor match ≥80% with cardinality 3–7 → likert at medium; else cardinality 3–7 + all-string + low-distinct → ordinal at low.
  - `detectGeographic(name: string, samples: string[])` — name regex match alone → low confidence; values match ISO country list → medium.
- `schema.ts` calls `getSampleRows` (Unit 1) once, then runs detection helpers per column from the in-memory samples. No additional DuckDB round trips beyond the single batched sample query.
- ISO date regex: `/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/`
- US date regex: `/^\d{1,2}\/\d{1,2}\/\d{4}$/`
- ISO 3166 country list: bundled at compile time (~250 entries — small).

**Patterns to follow:**
- `src/data/schema.ts:classifyType` — keep type classification as pure functions.

**Test scenarios:**
- Happy path: ISO dates → date, high.
- Happy path: US dates → date, medium.
- Happy path: Likert with `['Strongly Agree', 'Agree', 'Neutral', 'Disagree']` → likert, medium.
- Happy path: Likert with N/A — `['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Don’t know']` → likert, medium (after N/A filter).
- Happy path: country names → geographic, medium (with value match).
- Happy path: column named `state` with values `['active', 'pending', 'closed']` → string + low geographic confidence (name match without value match).
- Edge case: 2-element date series → date, low (line-chart guard kicks in at selector layer, not detection).
- Edge case: column name "year" with 4-digit numbers → numeric (not date) — year-as-numeric is the safer default.
- Edge case: empty samples → low confidence, no subtype.
- Error path: malformed regex input → returns low confidence, no throw.

**Verification:**
- All 3 sample CSVs in `public/samples/` classify as expected: `month` → date high, `country` → geographic medium, `confidence_score` → numeric high.
- Detection runs entirely from in-memory samples — no per-column DuckDB queries.

---

- [ ] **Unit 3: Pure chart selector in `src/charts/selector.ts`**

**Goal:** Map the extended schema (plus user overrides) to a `ChartChoice` describing which chart spec to render and the reasoning behind it.

**Requirements:** R2, R6, R8

**Dependencies:** Unit 2 (`ColumnInfo` extension).

**Files:**
- Create: `src/charts/selector.ts`
- Test: `src/charts/selector.test.ts`

**Approach:**
- Export `ChartKind = 'bar' | 'line' | 'scatter' | 'histogram' | 'pie' | 'ranking' | 'none'`.
- Export `ChartChoice = { kind: ChartKind, xField?: string, yField?: string, sortDesc?: boolean, limit?: number, reasoning: string }` — `reasoning` is a short developer-facing string captured for the view-source panel and caption.
- Export `selectChart(columns: ColumnInfo[], overrides?: Record<string, ColumnType>): ChartChoice`. Pure, no I/O.
- Apply overrides before classification.
- Implement decision sketch in High-Level Technical Design.
- **Line-chart guard:** require `dateColumn.distinctCount >= 3` AND `dateColumn` parses as monotonic-ish (sorted ascending OR descending dominates 80%+ of pairs). If guard fails, fall through to bar with the date as categorical X.
- Fallback: `kind: 'none'` with reasoning "no numeric measure to plot."

**Execution note:** Implement test-first. The decision tree has many branches; characterize each with a fixture before writing the dispatch.

**Patterns to follow:**
- `src/data/schema.ts:classifyType` — pure-function style.

**Test scenarios:**
- Happy path (line): date with 12 distinct months + 1 numeric → `{ kind: 'line', xField: 'month', yField: 'revenue', reasoning: 'Date column with 12 values...' }`.
- Happy path (bar): 6-cardinality category + 1 numeric → `{ kind: 'bar' }`.
- Happy path (top-N ranking): 25-cardinality category + 1 numeric → `{ kind: 'ranking', sortDesc: true, limit: 10 }`.
- Happy path (pie): 4-cardinality + 1 numeric → `{ kind: 'pie' }`.
- Happy path (histogram): single numeric only → `{ kind: 'histogram', xField: 'value' }`.
- Happy path (scatter): 2 numerics → `{ kind: 'scatter' }`.
- Edge case (line guard): 2 distinct dates → falls through to bar.
- Edge case: no numeric column → `{ kind: 'none' }`.
- Edge case: tied categorical alternatives → deterministic preference order documented in code.
- Override scenario: user overrides date → string → falls back from line to bar.
- Reasoning string: each branch produces a non-empty `reasoning` ≤ 120 chars.

**Verification:**
- Selector returns deterministic results for identical inputs.
- All 3 sample CSVs select an expected chart type without overrides.
- Reasoning strings are present on every branch (later consumed by view-source).

---

- [ ] **Unit 4: New Vega-Lite specs in `src/charts/vega.ts`**

**Goal:** Add brand-styled spec builders for line, scatter, histogram, pie, and ranking. All consume `VEGA_CONFIG` for styling parity with the existing `makeBarSpec`. Histogram pre-bins in DuckDB before reaching Vega-Lite.

**Requirements:** R2, R3

**Dependencies:** Unit 3 (so `ChartChoice` shape is locked).

**Files:**
- Modify: `src/charts/vega.ts`
- Test: `src/charts/vega.test.ts`

**Approach:**
- Export `makeLineSpec`, `makeScatterSpec`, `makeHistogramSpec`, `makePieSpec`, `makeRankingSpec` alongside existing `makeBarSpec`.
- All return `VegaSpec` and consume `VEGA_CONFIG`.
- Line: `mark: 'line'` + `point: { fill: sage-700 }`. X is `temporal` when ISO, `nominal` when US-medium-confidence (Vega struggles with US dates).
- Scatter: `mark: { type: 'point', filled: true }` + opacity 0.7.
- Histogram: receives **already-binned** rows of shape `{ bucket, count }`. Spec uses `mark: 'bar'` with `x: bucket` and `y: count`. Pre-binning happens in ChartView via DuckDB query: `SELECT FLOOR(value / bin_width) * bin_width AS bucket, COUNT(*) AS count FROM tbl GROUP BY bucket ORDER BY bucket`. `bin_width` derived from Sturges' formula at the call site.
- Pie: `mark: 'arc'` + `theta` encoding. Color from `range.category`.
- Ranking: `mark: 'bar'` + `transform: [{ window: [{ op: 'rank', as: '_rank' }], sort: [{ field: yField, order: 'descending' }] }, { filter: 'datum._rank <= 10' }]` + `encoding.x.sort: '-y'`.

**Patterns to follow:**
- `src/charts/vega.ts:makeBarSpec` — keep the same signature shape and `VEGA_CONFIG` consumption.

**Test scenarios:**
- Happy path: each spec function returns a valid Vega-Lite spec with `$schema`, `data.values`, `mark`, `encoding`.
- Happy path (ranking): spec includes the `window` transform with `sort` field set to `yField`.
- Happy path (histogram): receives pre-binned `[{ bucket, count }]` rows; renders bar marks correctly.
- Edge case: empty data → spec valid (Vega renders empty axes).
- Edge case (line): xField with US-format dates → spec uses `nominal` axis, not `temporal`.
- Integration: spec + `vega-embed` produces SVG without console errors against fixture data.

**Verification:**
- Each new spec renders successfully via `vega-embed` in dev preview against the 3 sample CSVs.
- Visual QA in preview shows brand parity: sage fills, ink-200 grid, Source Serif title, Inter labels.
- Histogram on a synthetic 50K-row numeric dataset renders within 500 ms (pre-bin keeps it flat).

---

- [ ] **Unit 5: Caption generator in `src/charts/captions.ts`**

**Goal:** Produce a one-sentence plain-English caption explaining the chart-type choice and the data shape.

**Requirements:** R4

**Dependencies:** Unit 2 (column types) + Unit 3 (`ChartChoice`).

**Files:**
- Create: `src/charts/captions.ts`
- Test: `src/charts/captions.test.ts`

**Approach:**
- Export `captionFor(choice: ChartChoice, columns: ColumnInfo[]): { eyebrow: string, body: string }`.
- `eyebrow` = chart-kind label, lowercase italic (`"line chart"`, `"bar chart"`, `"histogram"`).
- `body` = full sentence. Tone benchmark locked (see below). Names actual column names where it helps the user. No jargon (no "dimension", "cardinality", "encoding").

**Locked tone benchmark — example body strings per kind:**

| Kind | Example body |
|------|--------------|
| line | "Showing a line chart because your data has 12 dates in *month* and one number to track in *revenue*." |
| bar | "Showing a bar chart because your data has 6 categories in *role* and one number to compare in *respondents*." |
| ranking | "Showing the top 10 because *country* has 25 values — too many to read at a glance." |
| histogram | "Showing a histogram because *score* is the only column with numbers and there's nothing to group by." |
| pie | "Showing a pie chart because *role* has 4 categories — small enough to compare as parts of a whole." |
| scatter | "Showing a scatter plot because both *income* and *age* are numbers." |
| none | "We couldn't pick a chart automatically — your data has no numeric column to plot." |

Reading-level target ≤ grade 9 (Flesch-Kincaid). Sentences under 200 chars.

**Patterns to follow:**
- Pure function, side-effect-free, like `selectChart`.

**Test scenarios:**
- Happy path: each chart kind produces a body matching the locked benchmark shape (column names interpolated correctly).
- Happy path: column names with markdown-special characters (`*`, `_`, backticks) render safely — no template injection.
- Edge case: column name longer than 40 chars → truncated with ellipsis.
- Edge case: `kind: 'none'` → caption explains why no chart was possible.
- Integration: caption stays under 200 chars for all 7 fixture cases.
- Reading level: snapshot test against grade-level metric for each example body.

**Verification:**
- Each sample CSV produces a caption under 200 chars naming the actual columns.
- A reviewer reading only the caption can guess the chart type and data shape.

---

- [ ] **Unit 6: UI primitives — `ConfidenceBadge` + `TypeOverrideDropdown`**

**Goal:** Two small reusable UI components that surface inferred type and accept user overrides.

**Requirements:** R5, R6

**Dependencies:** Unit 2 (so `ColumnInfo['confidence']` is locked).

**Files:**
- Create: `src/components/ConfidenceBadge.tsx`
- Create: `src/components/TypeOverrideDropdown.tsx`
- Test: `src/components/ConfidenceBadge.test.tsx`
- Test: `src/components/TypeOverrideDropdown.test.tsx`

**Approach:**
- `ConfidenceBadge`: `high` → no badge. `medium` → faint italic sage hint. `low` → ink-200 border pill with warning-tinted text.
- `TypeOverrideDropdown`: native `<select>` styled per existing form pattern. Pre-filled with detected type. Options: `numeric`, `text`, `date`, `ordinal`, `boolean`. Calls `onChange(name, type)` on selection.
- Components are presentational only. State lives in `App.tsx`.

**Patterns to follow:**
- `src/components/ChartView.tsx:ColumnPicker` — italic sage label, ink-200 border, sage-500 focus ring.
- VISUAL-IDENTITY anti-patterns: no uppercase tracked smallcaps for labels.

**Test scenarios:**
- Happy path: `confidence: 'high'` → renders nothing visible.
- Happy path: `confidence: 'medium'` → renders italic hint with sage-700 color.
- Happy path: `confidence: 'low'` → renders pill with `border-ink-200`, `text-warning`.
- Happy path (dropdown): user selects "text" → `onChange` called with `(name, 'string')`.
- Edge case (dropdown): unmapped DuckDB type → defaults to "text".
- Accessibility: dropdown wraps `<select>` in `<label>`; focus-visible ring is present.

**Verification:**
- Visual inspection in dev preview: high-confidence rows show clean type label; medium shows hint; low shows pill.
- Override dropdown changes the chart type after selection without page reload.

---

- [ ] **Unit 7: View-source disclosure (`src/components/ViewSource.tsx`)**

**Goal:** Ship the wedge — a toggleable disclosure that exposes the active Vega-Lite spec JSON and a plain-English "why" alongside the chart.

**Requirements:** R9

**Dependencies:** Unit 3 (`ChartChoice.reasoning`) + Unit 4 (specs) + Unit 5 (captions).

**Files:**
- Create: `src/components/ViewSource.tsx`
- Test: `src/components/ViewSource.test.tsx`

**Approach:**
- `<ViewSource spec={VegaSpec} reasoning={string} caption={string} />` — controlled component.
- Off by default (PLAN.md Decision #13). Disclosure pattern using native `<details>` + `<summary>`.
- Summary: italic sage eyebrow `"show the spec"` with hairline rule before/after.
- Open: two-column layout above 768px viewport, stacked under it.
  - **Left column ("Why this chart"):** caption body + `reasoning` rendered as serif prose.
  - **Right column ("The spec"):** `JSON.stringify(spec, null, 2)` in `<pre>` with JetBrains Mono. "Copy spec" link below the pre that copies the JSON to clipboard.
- A11y: `<details>` is natively keyboard-accessible. `aria-expanded` handled by browser.
- Will be reused in CP-3 for templates — keep the contract spec-agnostic.

**Patterns to follow:**
- `src/components/MobileSoftBlock.tsx` — Eyebrow + section pattern.
- VISUAL-IDENTITY: hairline borders, no shadows, JetBrains Mono for code.

**Test scenarios:**
- Happy path: closed by default, click opens, click closes.
- Happy path: spec JSON renders as formatted multi-line string.
- Happy path: clicking "Copy spec" writes the JSON to `navigator.clipboard`.
- Edge case (clipboard unavailable): button hides or shows fallback text.
- Edge case: very large spec (10KB) renders without overflow blowing layout — pre uses `overflow-auto`.
- Accessibility: focus moves between summary, copy button, and JSON region in expected order.
- Integration: `<ViewSource>` paired with the live `<ChartView>` shows the actual rendered spec, not a stale copy.

**Verification:**
- Visual: matches Arbiter family — italic sage eyebrow, hairline rules, no shadow, JetBrains Mono for code.
- The disclosure adds zero LCP cost when closed (component renders no children until expanded).
- Reusability check: can be dropped into a CP-3 template view without modification.

---

- [ ] **Unit 8: Wire it together — `ChartView` + `SchemaView` + `App` integration**

**Goal:** Replace CP-1's manual-only X/Y picker with auto-selection driven by the selector, surface caption + confidence badges + view-source, and route override events back through the selector for re-render.

**Requirements:** R2, R3, R4, R5, R6, R8, R9

**Dependencies:** Units 1–7.

**Files:**
- Modify: `src/App.tsx` (lift `columnTypeOverrides` state)
- Modify: `src/components/ChartView.tsx` (consume `ChartChoice`, route through correct spec, mount `<ViewSource>`)
- Modify: `src/components/SchemaView.tsx` (caption above chart, confidence column, type-override dropdowns, 20-col collapse)
- Test: `src/components/ChartView.test.tsx`
- Test: `src/components/SchemaView.test.tsx`

**Approach:**
- App.tsx owns `columnTypeOverrides: Record<string, ColumnType>`. `reset()` clears it alongside the schema.
- Pass `columnTypeOverrides` + `onTypeOverride(name, type)` down to SchemaView and onward to TypeOverrideDropdown.
- SchemaView calls `useMemo(() => selectChart(schema.columns, overrides), [schema.columns, overrides])` — stable identity prevents ChartView re-render loops.
- SchemaView renders the caption + `<ChartView choice={...} schema={...} />` + schema table + view-source disclosure.
- ChartView dispatches on `choice.kind` to the matching `make…Spec`. For histograms, runs the DuckDB pre-bin query first, then passes binned rows to `makeHistogramSpec`.
- Schema table:
  - Replaces the type cell with `<TypeOverrideDropdown />` + `<ConfidenceBadge />`.
  - Past 20 columns: render first 20 inline + a `<details>` disclosure for "show all N columns".
- When `choice.kind === 'none'`, ChartView shows the manual X/Y picker as primary surface (CP-1 fallback).
- BigInt coercion now uses `coerce.ts` from Unit 1 — ChartView's inline `coerce` is removed.

**Patterns to follow:**
- `src/components/SchemaView.tsx` — keep header + chart + schema table + sample rows shell.
- `src/components/ChartView.tsx` — keep the existing useEffect-mount pattern for vega-embed; just dispatch on chart kind.

**Test scenarios:**
- Happy path: load `monthly-revenue.csv` → caption "line chart" + line chart renders.
- Happy path: load `survey-responses.csv` → caption "bar chart" + bar chart renders.
- Happy path: load `country-rankings.csv` → caption "top 10" + ranking chart renders.
- Override path: with `survey-responses` loaded, override `confidence_score` from numeric → text → ChartView falls back to manual picker; caption updates to "we couldn't pick a chart" reasoning.
- Override path: load CSV with US dates flagged medium → user confirms via dropdown → chart switches from bar to line.
- View-source path: open disclosure → spec JSON visible; copy spec writes to clipboard.
- Edge case: empty dataset → both views render with "no data" affordances.
- Edge case: 30-column dataset → schema table shows first 20 inline; disclosure reveals remaining 10.
- Reset flow: load sample → override a type → click "drop another file" → load second sample → confirm override does NOT persist.
- Integration: useMemo dependency stability — change unrelated state (e.g., view-source toggle) → no chart re-render.

**Verification:**
- All 3 sample CSVs auto-select an expected chart type without override.
- Each sample renders its caption above the chart with the correct chart-kind eyebrow.
- Manually overriding a column type triggers chart re-render within 200 ms.
- View-source disclosure exposes the actual rendered spec (not a stale copy).
- Visual identity matches CP-1: hairline borders, italic sage eyebrows, no shadows, sage-700 chart accents.

## System-Wide Impact

- **Interaction graph:** App.tsx becomes the override owner; SchemaView and ChartView become controlled. The CP-1 "ChartView owns its own pickers" pattern shifts — useEffect deps must be exhaustive on `choice` so chart kind changes trigger re-render without identity churn. `useMemo` around `selectChart` is required.
- **Error propagation:** `selectChart` returning `kind: 'none'` is a valid state, not an error. Distinct from a Vega render failure (which the existing error path handles).
- **State lifecycle risks:** App.tsx `reset()` must clear `columnTypeOverrides` along with the schema. Audit confirms this is now in scope (Unit 8).
- **API surface parity:** No external API surfaces touched. Internal `getSchema()` shape extends — verify the only caller (App.tsx) consumes `subtype` + `confidence`.
- **Integration coverage:** A handful of unit-level fakes will pass while the live chart breaks because real DuckDB type strings vary. At least one integration test must use the real DuckDB-WASM fixture path against a sample CSV.
- **Calibration loop (acknowledged limit):** Decision #28 locks "no analytics in v1." That means CP-2's 5-CSV test corpus is the only feedback channel between ship and CP-5 polish. Accept the slower learning cycle as a privacy trade. If misclassification reports start coming in, revisit Decision #28 with explicit scope.
- **Unchanged invariants:** Vega-Lite is still the only renderer (Decision #6). DuckDB-WASM idle prefetch (CP-1) is unchanged. Brand-styled `VEGA_CONFIG` is unchanged — new specs consume it as-is. Privacy posture (no analytics, no telemetry — Decisions #28, #21) remains. Hide-source default + toggle to reveal (Decision #13) is honored by Unit 7.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **Detection misses real-world quirks** (year-only `2024`, abbreviated month names, currency-formatted numbers) | Test corpus = 3 sample CSVs + 2 hand-picked external CSVs (one survey export with mixed types, one financial export with currency). If misclassification rate exceeds ~20%, lower confidence for the affected detector |
| **Caption tone drifts during implementation** | Tone benchmark locked in Unit 4 with example bodies per chart kind; reading-level target ≤ grade 9. Reviewer verifies against the locked examples before merge |
| **Override UI causes confusion** ("why is there both a schema dropdown AND an X/Y picker?") | Demote the X/Y picker to a "tweak" disclosure under the chart. Most users only see it when ChartChoice is `none` |
| **Vega-Lite spec drift across types** | Lock spec signatures via test scenarios in Unit 4 — once helpers are tested, dispatch is mechanical |
| **Top-N truncation hides important rows** | Caption explicitly names the truncation. Future CP could add "show all" link |
| **Likert detection false positives** | English anchor match requires ≥80% after N/A filtering, plus cardinality 3–7. Cardinality fallback at low confidence opens the override UI immediately |
| **`useMemo` dep arrays misconfigured cause stale renders** | Lint rule (`react-hooks/exhaustive-deps`) enforced in eslint config. Test coverage on chart re-render path verifies behavior |
| **Wide schema (100+ cols) overwhelms the schema table** | Inline render limited to first 20 columns; disclosure reveals the rest |
| **Wide schema sample-fetch performance** | Single batched query (Unit 1); benchmark on 100-column synthetic data — reject implementations that exceed 200 ms |
| **No analytics = no calibration signal** | Acknowledged trade-off (Decision #28). Quality calibration relies on the locked 5-CSV corpus + qualitative interviews. If real misclassification reports surface, revisit Decision #28 with an explicit scope |

## Documentation / Operational Notes

- Update `STATUS.md` with CP-2 completion summary and CP-3 entry point.
- Update `docs/plans/PLAN.md` CP-2 row to `Complete` after merge.
- Document the chart-selection decision tree in `docs/TECHNICAL-ARCHITECTURE.md` so CP-3 (templates) can reference it.
- README "What it does" section: update Quick mode bullet from `(in progress, CP-2)` to a present-tense description; update "View-source" bullet from `(CP-3)` to present tense.
- No operational rollout concerns — static GitHub Pages, no DB migrations, no flags.

## Sources & References

- `glimpse/CLAUDE.md` — hard stops, stack, design language
- `glimpse/docs/plans/PLAN.md` — locked decisions #6, #13, #21, #24, #28, #29, #30, #34, #35
- `glimpse/docs/plans/2026-04-30-001-feat-glimpse-v1-plan.md` — CP-1 plan + outputs
- `glimpse/docs/VISUAL-IDENTITY.md` — palette, typography, anti-patterns
- `glimpse/docs/TECHNICAL-ARCHITECTURE.md` — stack reasoning, lazy-load strategy
- Memory `feedback_single_renderer_collapse.md` — single Vega-Lite renderer
- Memory `feedback_lead_audience_v1.md` — students lead, industry "also works for"
- CP-1 PR: [phdemotions/glimpse#1](https://github.com/phdemotions/glimpse/pull/1)
- Doc-review (3 personas, 2026-04-30): coherence + feasibility + adversarial passes; findings synthesized into this revision
