---
title: "feat: CP-3.6 Infographic UX overhaul"
type: feat
status: active
date: 2026-05-06
origin: docs/audits/2026-05-06-cp-3-6-infographic-ux-audit.md
---

# CP-3.6 — Infographic UX overhaul

## Overview

CP-3 shipped 8 Infographic templates as parametrized Vega-Lite specs. The 2026-05-06 walkthrough audit ([`docs/audits/2026-05-06-cp-3-6-infographic-ux-audit.md`](../audits/2026-05-06-cp-3-6-infographic-ux-audit.md)) found that none of them clear the **Dual Standard** today: every template renders as a plain Vega-Lite chart inside a thin border, with no infographic frame, missing categorical labels, captions that contradict their specs, and broken axis defaults. The visceral user reaction was *"would make someone click away."*

CP-3.6 brings every template up to award-winning quality through a single architectural shift — a shared **in-spec frame** wrapper that gives each template an eyebrow, headline, narrative takeaway, source line, and brand mark — plus per-spec discipline on axes, labels, palette, and the caption-spec contract. The shell lives inside the Vega-Lite spec as additional text-mark layers (the pattern Big Number already uses) so SVG/PNG export keeps working with zero changes to the export path.

This is a focused redesign, not a polish pass. The visual approval gate (CLAUDE.md hard stop) fires before code on every template touched.

## Problem Frame

The audit catalogues 7 systemic failures and 18 per-template findings. The systemic ones are all rooted in a single architectural absence: there is no shared "infographic shell" that any template consumes. Each template emits a raw Vega-Lite chart spec, and the surrounding eyebrow/caption rendered by [`src/components/InfographicView.tsx`](../../src/components/InfographicView.tsx) lives in DOM HTML — invisible to PNG/SVG export. The exported visual is therefore a chart, not an infographic, and the caption that promised the takeaway never appears next to the picture a user shares.

Three architectural paths were considered for the shell (see Alternative Approaches Considered). The chosen path — **in-spec frame as Vega-Lite text marks** — preserves every existing invariant: single Vega-Lite renderer (Decision #6), spec-as-pedagogy (Decision #30, #12), JSON spec roundtrip in the export panel (Decision #23), and zero new dependencies in the export path. The pattern is already proven by [`src/templates/big-number.ts`](../../src/templates/big-number.ts) lines 68–113, which composes title + number + body via three text marks at pinned coordinates.

The audit's "Suggested CP-3.6 plan shape" (13 units) was the input scaffold. After repo research, that scaffold collapsed to 9 units — the systemic foundation lands once and every per-template fix folds the systemic work into its own commit, rather than touching every template twice.

## Requirements Trace

(R-prefixed items map back to audit findings — S = systemic, BN/TS/DA/TN/GP/PW/LK/BA = per-template prefixes.)

- R1. Every template renders inside a shared infographic shell (eyebrow, headline, takeaway, source line, wordmark) that ships in SVG and PNG export. *Resolves S1.1, partially S1.6.*
- R2. Every template renders categorical labels (country names, role names, dates, bin bounds) for every visible data point — never anonymous bars. *Resolves S1.2, TN.2, GP.3, PW.3, DA.2.*
- R3. The caption a user reads matches the chart they see — and it ships *with* the chart in export. *Resolves S1.3, all caption-spec contradictions.*
- R4. No Vega-Lite spec relies on auto-scale: every template sets explicit `scale.domain`, `tickMinStep`, and `format` per data shape. *Resolves S1.4, DA.1, TS.1, TN-axis-issues.*
- R5. No off-brand hue appears in any infographic. Single sage ramp for sequential, ink/sage diverging where contrast is required. *Resolves S1.5, PW.2.*
- R6. Type hierarchy reads headline → takeaway → chart → labels → source. Headline must dominate at the export aspect ratio. *Resolves S1.6.*
- R7. No data point or annotation clips at canvas edges. *Resolves S1.7, TS.2, TN.5.*
- R8. Big Number's headline figure is sized to dominate the canvas (≥120pt at 1200×675) with a comparison-reference microcopy line. *Resolves BN.1, BN.2, BN.3, BN.4.*
- R9. Top N Ranking renders horizontally with all categories visible and the top-3 emphasized via stroke + lightness contrast (not by filtering). *Resolves TN.1, TN.3, TN.4.*
- R10. Part-to-Whole renders a single proportional horizontal stacked bar matching its caption, with in-segment labels and a sage ramp. *Resolves PW.1, PW.4.*
- R11. Distribution shows integer x-axis bin labels and visible mean + median rule lines. *Resolves DA.1, DA.2, DA.3, DA.4.*
- R12. Geographic Pattern surfaces country names as bar text marks; the v1-disclaimer banner moves out of the chart canvas into the takeaway region. *Resolves GP.1, GP.2.*
- R13. Trend Story uses an explicit Y domain rounded to a sensible step below data min, peak annotations offset above the line with a connector, and right-padding reserved for the rightmost peak label. *Resolves TS.1, TS.2, TS.4.*
- R14. Survey Likert and Before/After templates ship with representative fixture samples in [`public/samples/`](../../public/samples/) so the audit can complete a second pass and any spec gaps can be fixed before merge. *Resolves "Templates not walked" gap.*
- R15. Every template change clears the visual approval gate before code lands. *CLAUDE.md hard stop.*

## Scope Boundaries

- **Not switching renderers.** Vega-Lite stays the single rendering language (Decision #6). No D3, no Observable Plot, no Mosaic re-introduction.
- **Not changing the export contract.** SVG/PNG/spec-JSON outputs keep their current shapes. Spec-JSON roundtrip stays valid (Decision #23).
- **Not adding new template categories.** The 8 templates locked in PLAN.md remain the v1 set.
- **Not building a full choropleth.** Geographic Pattern keeps the ranked-bar fallback per Decision #37; CP-3.6 adds country-name labels but does not introduce TopoJSON or a map projection.
- **Not introducing snapshot tests.** Existing tests are behavior-style (assert on returned spec shape, applicability, caption strings). New tests follow the same pattern.
- **Not changing the template applicability scoring.** That ships in CP-3 and is out of scope here.
- **No DOM-level shell.** The audit's original "S1.1 — HTML/CSS shell" framing is rejected on export-path grounds; the shell is in-spec instead.

### Deferred to Separate Tasks

- Full choropleth + TopoJSON map render: Decision #37, post-v1 mini-CP.
- Snapshot or visual-regression testing infrastructure: post-v1 polish.
- Real user think-aloud sessions: Decision #38, post-v1 docket.

## Context & Research

### Relevant Code and Patterns

- [`src/templates/types.ts`](../../src/templates/types.ts) — `Template` contract: `{ id, label, description, applicability, specBuilder, captionFor, dataPrep? }`. Will gain a `frameFor(columns) => Frame` slot in U1 so frame metadata lives next to the template's other declarations.
- [`src/templates/big-number.ts`](../../src/templates/big-number.ts) — already composes title + number + body via three text marks at pinned coordinates. The pattern to mirror in `wrapWithFrame`. Note that it overrides `axis.grid: false` per-template — the new shared helper should let templates opt in/out cleanly.
- [`src/components/InfographicView.tsx`](../../src/components/InfographicView.tsx) — embeds spec via `vega-embed` with `renderer: 'svg'`, then hands the inline `<svg>` to `onSvgReady` for export. Will be updated to read DOM eyebrow/takeaway from `frameFor` (single source) so screen and export show the same words.
- [`src/components/InfographicCanvas.tsx`](../../src/components/InfographicCanvas.tsx) — passive 1200×675 frame; **stays passive**. The shell content lives in the spec, not in this component.
- [`src/components/ExportPanel.tsx`](../../src/components/ExportPanel.tsx) — exports `INFOGRAPHIC_DIMENSIONS = { width: 1200, height: 675 }`. Promote to a single export (likely [`src/charts/vega.ts`](../../src/charts/vega.ts) or a new `src/charts/infographic.ts`) so 8 specs stop hardcoding the same numbers.
- [`src/charts/vega.ts`](../../src/charts/vega.ts) — `VEGA_CONFIG.range.category` currently includes off-palette hex codes (`'#A88B6A'`, `'#5B6B7A'`, `'#C97A5C'`). Root cause for the Part-to-Whole color escape. Fixed at this single config in U2.
- [`src/charts/export.ts`](../../src/charts/export.ts) — `downloadSvg` and `downloadPng` consume the inline `<svg>` only via `XMLSerializer + canvas`. **No html2canvas.** Locks the in-spec-frame architecture.
- [`src/styles/tokens.ts`](../../src/styles/tokens.ts) and [`tailwind.config.ts`](../../tailwind.config.ts) — Ink 50–950, Sage 50–950, Stone 50, JetBrains Mono / Inter / Source Serif 4 typography ramp. The shell helper draws color hex values directly from `tokens.ts` so there is one source of truth.
- Per-template tests in [`src/templates/`](../../src/templates/) (one `.test.ts` per template) — behavior-style assertions on spec shape and caption strings. New axis-discipline and frame assertions plug in cleanly.

### Institutional Learnings

- `docs/solutions/` is empty. CP-3.6 is the first compound-source candidate for the Glimpse repo — once shipped, follow up with `ce:compound` to seed institutional learnings around (a) Vega-Lite text-mark composition, (b) HTML-vs-SVG export trade-offs in static SPAs, (c) brand palette enforcement at the chart-config layer.

### External References

- Vega-Lite v5 layered specifications and text-mark positioning: existing patterns in `big-number.ts` cover everything needed. No external research warranted at this depth.
- Award-winning infographic conventions (NYT Upshot, Pew Research, Stripe Atlas, Datawrapper): the audit's "What award-winning would look like" section already enumerates the litmus.

## Key Technical Decisions

- **D1 — Frame lives inside the Vega-Lite spec, not in DOM HTML.** Critical decision. Rationale: SVG/PNG export consumes only the inline `<svg>`, so a DOM-only shell would be invisible in shared exports — defeating the whole template purpose. In-spec frame keeps export clean, preserves the JSON-spec promise, and matches the proven `big-number.ts` pattern.
- **D2 — Single `frameFor(columns)` method on `Template` returns `{ eyebrow, headline, takeaway, source }`.** Replaces the standalone `captionFor`. The same return value renders into the spec (text marks) and into the DOM (above the chart for users who never export). Caption-spec drift becomes structurally impossible.
- **D3 — `wrapWithFrame(chartSpec, frame, dimensions)` helper in [`src/charts/vega.ts`](../../src/charts/vega.ts) composes a layered Vega-Lite spec.** Each template's `specBuilder` returns the *chart layer only*; the frame is composed at consumption time. Keeps each spec builder small and DRY.
- **D4 — Templates declare a chart slot region, not a width/height.** The wrapper allocates the eyebrow/headline/takeaway/source positions deterministically; the chart's inner region is the leftover space. Eliminates the duplicated `width: 1200, height: 675` literals across 8 templates.
- **D5 — Off-brand hex codes in `VEGA_CONFIG.range.category` get removed.** The category palette becomes a sage ramp (sage-200 / sage-400 / sage-600 / sage-800) with a documented graceful-degradation rule for >4 categories (hatch patterns or alternating ink-300 / sage-700).
- **D6 — Axis discipline ships as a small composable helper, not a rewrite of every spec.** `withAxisDiscipline(axisConfig, { kind, dataMin, dataMax })` returns the explicit `scale`, `format`, `tickMinStep`, `tickCount` settings. Templates compose this into their existing axis blocks; the helper centralizes the rules so future templates inherit them.
- **D7 — Top N Ranking switches from vertical to horizontal bars and renders all categories.** Filtering 6 categories down to 3 hides 50% of the data. Horizontal also gives natural y-axis room for category labels — fixes two findings (TN.1 + TN.2) at once.
- **D8 — Top-N emphasis is via stroke + lightness contrast, not via filtering.** Sage-700 fill + ink-900 1px stroke for top-3; sage-300 fill, no stroke, for the rest. Reads at-a-glance.
- **D9 — Big Number target sizing is 120pt at 1200×675.** Roughly 1/4 the canvas height. Verified visually during U4 implementation; if it overflows on extreme number lengths (e.g. `1,234,567,890`) the spec auto-scales down to 100pt with a warning surfaced via `frame.takeaway`.
- **D10 — Part-to-Whole spec rebuilt to a single horizontal stacked bar normalized to 100%.** Matches its caption. Single sage ramp for segments. In-segment labels when segment width ≥ 80px (Vega-Lite `mark.text` with conditional opacity); legend below for narrower segments.
- **D11 — Distribution adds explicit `axis.format: 'd'` and `axis.tickMinStep: 1` for the integer count axis** (DA.1). Mean and median rule lines layer in via `mark: 'rule'` overlay (DA.3).
- **D12 — Geographic Pattern's v1-disclaimer moves into `frame.takeaway`** ("Ranked view shown — full world-map render coming after v1") instead of a banner inside the chart canvas.
- **D13 — Visual approval gate fires per-template, batched in pairs.** Mocking 8 templates in 8 round-trips is too slow; mocking all 8 at once dilutes attention. Pair them by similarity (Big Number + Trend Story; Top N + Geographic; Part-to-Whole + Distribution; Likert + Before/After) and present each pair together for approval.
- **D14 — Likert and Before/After get fixture CSV samples shipped in `public/samples/`.** Without representative samples, the templates cannot be audited or verified visually. The samples double as user-onboarding demos.
- **D15 — No new test infrastructure.** Behavior-style tests stay the norm. Each template's existing `*.test.ts` file gains assertions for `frameFor` shape, `withAxisDiscipline` outputs, and presence of expected layered text marks. Visual regression is gated by the visual approval review, not by snapshots.

## Open Questions

### Resolved During Planning

- **DOM shell vs in-spec frame?** In-spec frame. D1 above. Driven by export-path constraint surfaced in research.
- **Merge `captionFor` and a new frame method, or keep them separate?** Merge into `frameFor`. D2. Single source of truth eliminates drift.
- **Where does `wrapWithFrame` live?** [`src/charts/vega.ts`](../../src/charts/vega.ts) alongside the existing brand config. Considered a new `src/charts/infographic.ts` but the surface is small enough that splitting hurts more than it helps.
- **Filter top-N or render all?** Render all, emphasize top-3 visually. D7 + D8.
- **What palette for >4 categories in Part-to-Whole?** Sage ramp 200/400/600/800; beyond 4, alternate with ink-300 + sage-700 to maintain contrast. The likely v1 datasets stay ≤6 categories so this rule has runway before it gets stress-tested.
- **Where do Likert + Before/After fixture samples come from?** Hand-authored: a 5-point survey-like CSV (e.g. `feature_satisfaction.csv` with strongly-disagree → strongly-agree counts across 5 categories) and a two-state revenue CSV (e.g. `quarterly-shift.csv` with `category, q1_value, q2_value`). Both small, both single-truth, both clearly demo-able.

### Deferred to Implementation

- **Exact pixel coordinates for shell text marks.** Will be tuned visually during U1 against the 1200×675 canvas. The plan locks the *order* and approximate vertical bands; pixel-perfect numbers come from running the build and looking at it.
- **Vega-Lite text-mark word-wrap strategy.** `text` marks support `lineBreak` and `limit` but neither does true word-wrap by default. Likely solution is a JS-side wrap helper that splits long takeaways into 2–3 lines based on character count. Lock the strategy when the first overflowing takeaway lands.
- **Whether to deprecate `captionFor` immediately or keep a shim.** Lean toward replacing in-place since this is pre-v1; only call sites are inside the `templates/`+`components/` layer. Confirm during U1 that nothing else consumes it.
- **How to detect "category visible enough to label inline" vs "needs legend below" in Part-to-Whole.** Approximate via segment percentage threshold (≥10% of total → inline label) but final tuning happens during U7 visual approval.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Frame anatomy at 1200×675

```
┌────────────────────────────────────────────────────────────────────┐  y=0
│                                                                    │
│  italic sage-700 12pt                                              │  y=40
│  EYEBROW (e.g. "trend story")                                      │
│                                                                    │
│  Source Serif 4 / 36pt / ink-900 / semibold                        │  y=80
│  HEADLINE (e.g. "Revenue grew 100% from January to November")      │
│                                                                    │
│  Source Serif 4 / 22pt / ink-700 / regular                         │  y=140
│  TAKEAWAY — narrative sentence, may wrap to 2 lines                │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │  y=200
│  │                                                              │  │
│  │              CHART REGION (Vega-Lite chart spec)             │  │
│  │              ~390px tall × 1140px wide, padded 30 each side  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │  y=590
│                                                                    │
│  Inter 11pt / ink-500       Inter 11pt / sage-700                  │  y=620
│  SOURCE LINE                                            Glimpse.   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘  y=675
```

The wrapper composes a Vega-Lite layered spec where the chart region's spec is what the template's `specBuilder` returned, plus four text-mark layers (eyebrow, headline, takeaway, source) and one wordmark text mark, each pinned to fixed pixel coordinates within the 1200×675 canvas.

### Template flow under CP-3.6

```
TemplatePicker.select(id)
       │
       ▼
InfographicView reads template.specBuilder(rows, columns)
       │                                     ▲
       │                                     │ chart spec only
       ▼                                     │
template.frameFor(columns)                   │
       │                                     │
       └────►  wrapWithFrame(chart, frame, dimensions)
                              │
                              ▼
                    layered Vega-Lite spec  →  vega-embed (renderer: svg)
                              │
                              ▼
                    inline <svg> with chart + frame text marks
                              │
                              ├──► onSvgReady → ExportPanel (SVG/PNG)
                              └──► (DOM eyebrow/takeaway also read frameFor for screen display)
```

The chart's spec width drops from 1200 to 1140; the chart's spec height drops from 675 to 390. Each template adjusts its inner spec to those dimensions in U1 once and never sees the canvas dimensions again.

## Implementation Units

- [ ] **Unit 1: Frame contract + `wrapWithFrame` helper + `frameFor` migration**

**Goal:** Establish the in-spec frame architecture so every template renders inside a shared eyebrow / headline / takeaway / source / wordmark layout that ships in SVG and PNG export. Migrate the 8 existing templates to declare frames and emit chart-only specs.

**Requirements:** R1, R3, R6.

**Dependencies:** None (foundational unit).

**Files:**
- Create: `src/charts/infographic-frame.ts`
- Modify: `src/charts/vega.ts`
- Modify: `src/templates/types.ts`
- Modify: `src/templates/big-number.ts`, `trend-story.ts`, `distribution.ts`, `top-n-ranking.ts`, `geographic-pattern.ts`, `part-to-whole.ts`, `survey-likert.ts`, `before-after.ts`
- Modify: `src/components/InfographicView.tsx`, `InfographicCanvas.tsx`, `ExportPanel.tsx`
- Test: `src/charts/infographic-frame.test.ts`
- Test: existing per-template `*.test.ts` files (extended with frame assertions)

**Approach:**
- Define a `Frame = { eyebrow: string; headline: string; takeaway: string; source: string }` type.
- Extend `Template` (in `src/templates/types.ts`) with `frameFor(columns) => Frame`. Remove `captionFor` (or leave a shim if a non-template caller appears during implementation — verify in repo).
- Promote `INFOGRAPHIC_DIMENSIONS` from `ExportPanel.tsx` to `infographic-frame.ts` as `INFOGRAPHIC_CANVAS = { width: 1200, height: 675 }`. ExportPanel re-imports.
- Define chart-region constants: `CHART_REGION = { x: 30, y: 200, width: 1140, height: 390 }`.
- Build `wrapWithFrame(chartSpec, frame, dims = INFOGRAPHIC_CANVAS)` that emits a layered Vega-Lite spec — the original `chartSpec` layered with five text marks (eyebrow, headline, takeaway, source, wordmark) at the coordinates from the design above.
- Update each template's `specBuilder` to emit a chart spec sized to `CHART_REGION` (no top-level width/height). Add a `frameFor(columns)` method that returns the four caption strings (re-used from current `captionFor` outputs as a starting point — actual text reconciliation happens in per-template units).
- Update `InfographicView.tsx` to call `wrapWithFrame(specBuilder(...), frameFor(...))` before passing to `vega-embed`. Also read `frameFor` for the eyebrow/takeaway DOM display above the chart so screen and export stay in sync.
- Visual approval gate: present a static screenshot of one template (Big Number + Trend Story side-by-side) under the new frame before merging. Per CLAUDE.md hard stop.

**Execution note:** Land the frame helper test-first against a small fixture spec — the wrapper's correctness (right text at right coordinates, original spec preserved as a chart layer) is the riskiest part of U1.

**Patterns to follow:**
- Existing `big-number.ts` text-mark composition pattern (three text marks at pinned coords with explicit `align`, `baseline`, `fontSize`).
- `VEGA_CONFIG` in `vega.ts` for typography defaults — text marks should reference `VEGA_CONFIG.title.font` etc rather than hard-coding font names.
- Tokens from `src/styles/tokens.ts` (sage-700, ink-700, ink-900, ink-500) — never raw hex.

**Test scenarios:**
- *Happy path:* `wrapWithFrame(chartSpec, frame)` returns a Vega-Lite spec with `layer` length 6 (1 chart + 5 frame layers).
- *Happy path:* The frame layers contain text marks whose `text.value` matches the four input frame strings + the `Glimpse.` wordmark.
- *Happy path:* The chart layer is preserved unchanged (deep-equals input `chartSpec`).
- *Happy path:* The returned spec sets `width: 1200, height: 675` from `INFOGRAPHIC_CANVAS`.
- *Edge case:* An empty `eyebrow` or `takeaway` string still renders (no missing-property crash) but the corresponding text mark is suppressed (or rendered with `opacity: 0`) so it does not occupy visual space.
- *Edge case:* A `takeaway` longer than ~80 characters is wrapped to 2 lines via the JS wrap helper (lock helper strategy during implementation).
- *Integration:* For each of the 8 templates, calling `template.frameFor(stubColumns)` returns the four expected fields, and calling `template.specBuilder(stubRows, stubColumns)` returns a spec whose width/height match `CHART_REGION` (proves no template still hardcodes 1200×675).

**Verification:**
- Visual: a sample-loaded Big Number and Trend Story in the dev server show the new shell on screen, with eyebrow/headline/takeaway/source/wordmark in the right positions and SVG export reproducing the same shell.
- Tests: 276+ baseline tests pass plus the new scenarios above.
- View-source mode shows the full layered spec including frame text marks (proves pedagogy stays consistent — Decision #30).

---

- [ ] **Unit 2: Brand palette discipline in shared config**

**Goal:** Strip off-brand hex codes from `VEGA_CONFIG.range.category` and replace with a documented sage ramp + diverging-pair helper. Update per-template scale ranges that explicitly reach into the off-brand colors.

**Requirements:** R5.

**Dependencies:** None — landable in parallel with U1 if convenient, but easier to do after U1 touches the same files.

**Files:**
- Modify: `src/charts/vega.ts`
- Modify: `src/templates/part-to-whole.ts`
- Test: `src/charts/vega.test.ts`

**Approach:**
- Replace `VEGA_CONFIG.range.category` value with `[colors.sage[800], colors.sage[600], colors.sage[400], colors.sage[200], colors.ink[300], colors.sage[700]]` (sage ramp + ink-300 fallback for 5th and beyond). Document the rule via a comment + a small helper `categoricalScale(n)` that returns the first `n` slots.
- For Part-to-Whole, set `scale.range` explicitly to the sage ramp instead of relying on Vega-Lite's auto category palette.
- Add a `divergingScale = [colors.sage[600], colors.ink[200], colors.danger[600]]` helper for Likert (used in U9).

**Patterns to follow:**
- Tokens from `src/styles/tokens.ts` — never raw hex.
- Existing `VEGA_CONFIG` shape in `vega.ts`.

**Test scenarios:**
- *Happy path:* `VEGA_CONFIG.range.category` contains only colors from `colors.sage` and `colors.ink` ramps (assert each entry against the tokens module).
- *Happy path:* `categoricalScale(3)` returns the first three slots (sage-800, sage-600, sage-400).
- *Edge case:* `categoricalScale(8)` returns 8 slots — beyond 6 distinct slots, repeat with reduced opacity (final approach lockable during implementation).
- *Integration:* `part-to-whole.ts` `specBuilder` output's color encoding `scale.range` deep-equals the documented sage ramp (no off-brand hue can sneak through).

**Verification:**
- Visual: Part-to-Whole chart in the dev server renders only sage-ramp segments, no terracotta/slate-blue/tan.
- Tests: all pass.

---

- [ ] **Unit 3: Axis discipline helper + per-template adoption pass**

**Goal:** End the auto-scale era. Provide a small helper that emits explicit `scale.domain`, `tickMinStep`, `format`, and `tickCount` for the common axis kinds (count, currency, percent, year-month, raw-numeric), and adopt it everywhere in the template specs.

**Requirements:** R4.

**Dependencies:** U1 (per-template specBuilders already touched and migrated to chart-region dimensions; doing axis work in the same place avoids touching the templates twice).

**Files:**
- Create: `src/charts/axis.ts`
- Modify: `src/charts/vega.ts` (re-export the helper)
- Modify: each template (`distribution.ts`, `trend-story.ts`, `top-n-ranking.ts`, `part-to-whole.ts`, `geographic-pattern.ts`, `survey-likert.ts`, `before-after.ts` — `big-number.ts` has no axes)
- Test: `src/charts/axis.test.ts`

**Approach:**
- Define `AxisKind = 'count' | 'currency' | 'percent' | 'year-month' | 'numeric'` and `withAxisDiscipline(kind, { dataMin?, dataMax?, locale? }) => Partial<VegaAxis>`.
  - `count` → `format: 'd'`, `tickMinStep: 1`, integer-only.
  - `currency` → `format: '$,d'` (or `'$.0f'` for small values), domain rounded to nearest sensible step below `dataMin`.
  - `percent` → `format: '.0%'`, `domain: [0, 1]`, `tickMinStep: 0.1`.
  - `year-month` → `formatType: 'time'`, `format: '%b %Y'`, no expand.
  - `numeric` → `format: ',d'` for ranges ≥ 1000, `'.2f'` otherwise.
- Each template's spec passes its axis through `withAxisDiscipline(kind, …)` instead of letting Vega-Lite auto-pick.
- The helper is intentionally small — a thin policy layer, not a full axis builder. Templates still own the `axis.title` and orientation.

**Patterns to follow:**
- Existing per-template axis blocks in `top-n-ranking.ts` and `survey-likert.ts` for the JSON shape.
- `VEGA_CONFIG.axis` for inherited defaults — the helper extends, never replaces.

**Test scenarios:**
- *Happy path:* `withAxisDiscipline('count', { dataMin: 0, dataMax: 12 })` returns `{ format: 'd', tickMinStep: 1, scale: { domain: [0, 12] } }`.
- *Happy path:* `withAxisDiscipline('currency', { dataMin: 41000, dataMax: 82000 })` returns a `scale.domain` that rounds the lower bound to ≤ 40,000 and the upper to ≥ 85,000 (no half-blank axis).
- *Edge case:* `withAxisDiscipline('count', { dataMin: 0, dataMax: 0.5 })` still returns integer ticks (defends against the Distribution decimal-axis bug).
- *Edge case:* `withAxisDiscipline('numeric', { dataMin: 97, dataMax: 99.8 })` — close-clustered values — returns a domain that *does not* expand to zero, preserving useful contrast (Top N literacy fix).
- *Integration:* `distribution.ts` `specBuilder` output's `encoding.x.axis.format` is `'d'` after migration.

**Verification:**
- Visual: Distribution chart shows integer ticks; Top N literacy axis shows 95–100 not 15–100; Trend Story Y axis is 40K–85K, not 15K–90K.
- Tests: all pass.

---

- [ ] **Unit 4: Big Number redesign**

**Goal:** Big Number's headline figure dominates the canvas at ≥120pt with a narrative body line and comparison-reference microcopy. The number is what the user sees first; everything else recedes.

**Requirements:** R8.

**Dependencies:** U1 (frame), U2 (palette), U3 (axis — N/A for Big Number but the type adoption applies).

**Files:**
- Modify: `src/templates/big-number.ts`
- Modify: `src/templates/big-number.test.ts`

**Approach:**
- Drop the existing three text marks; emit only the chart-region content (a single 120pt text mark with the headline figure, plus a 16pt sage-italic eyebrow and a 16pt ink-700 microcopy line).
- The frame's `eyebrow`, `headline`, and `takeaway` populate via `frameFor`; the body line is the comparison-reference (e.g. *"Total revenue across 12 months"*) and lives in `frame.takeaway`.
- For numbers ≥ 1,000,000 use `1.2M` style; ≥ 1,000 use `42K`; below that, use raw with thousands separator.
- Visual approval gate: present a paint-style mockup of the new Big Number on monthly-revenue (`727K → "Total revenue across 12 months"`) and on a single-stat scenario (e.g. survey-responses respondents = `817 → "respondents across 6 roles"`).

**Patterns to follow:**
- Existing big-number text-mark positioning and eyebrow color.
- `wrapWithFrame` helper from U1 for the surrounding shell.

**Test scenarios:**
- *Happy path:* `frameFor` for monthly-revenue returns a takeaway containing the row count and a sensible time-axis description (e.g. "across 12 months").
- *Happy path:* `specBuilder` output's text mark has `fontSize ≥ 120` for canvas height 675.
- *Edge case:* A 10-digit number (`1234567890`) auto-shrinks to `1.2B` so it doesn't overflow.
- *Edge case:* A 0-row dataset (defensive) does not crash; `frameFor` returns a takeaway like "no rows in this column" and `specBuilder` renders a zero-state.

**Verification:**
- Visual: Big Number renders at 120pt+ with eyebrow + microcopy + brand wordmark. SVG and PNG export show the same.

---

- [ ] **Unit 5: Trend Story redesign**

**Goal:** Trend Story uses an explicit Y domain rounded to a sensible step below the data minimum, peak annotations offset above the line with a connector, and right-padding reserved for the rightmost peak label so it never clips.

**Requirements:** R7, R13.

**Dependencies:** U1, U2, U3.

**Files:**
- Modify: `src/templates/trend-story.ts`
- Modify: `src/templates/trend-story.test.ts`

**Approach:**
- Apply `withAxisDiscipline('currency', { dataMin, dataMax })` for the Y axis — pulls the domain to roughly `[40000, 85000]` instead of `[15000, 90000]`.
- Adjust peak-annotation marks: text mark `dy: -16` so it sits above the data point, paired with a `mark: 'rule'` 1px ink-300 connector from data point to label.
- Add explicit `padding.right: 60` (in chart-region pixels) so the rightmost peak label has room.
- Visual approval gate: present a mockup of Trend Story on monthly-revenue with the new Y range, offset annotations, and right padding.

**Patterns to follow:**
- Existing trend-story text-mark + rule-mark composition (the spec already layers a peak-annotation layer; tighten it, don't replace).

**Test scenarios:**
- *Happy path:* `specBuilder` output's `encoding.y.scale.domain` has a lower bound at most 1 sensible step below `dataMin` (e.g. `dataMin = 41000` → domain[0] in [35000, 41000]).
- *Happy path:* Peak-annotation text marks have `dy: -16` and a paired rule layer.
- *Edge case:* A flat-line dataset (all values equal) still renders with a meaningful Y domain (auto-expand to ±10% around the value).
- *Edge case:* A data series whose last point is also a peak — the rightmost label has explicit `align: 'right'` so it stays in-canvas.

**Verification:**
- Visual: Trend Story chart on monthly-revenue shows a tight Y range, peak callouts offset above the line with connectors, no edge clipping.

---

- [ ] **Unit 6: Top N Ranking + Geographic Pattern redesign**

**Goal:** Top N renders as a horizontal bar chart matching its caption, with all categories visible and the top-3 emphasized via stroke + lightness contrast. Geographic Pattern inherits the same skeleton, adds country-name labels, and moves the v1-disclaimer out of the chart canvas.

**Requirements:** R2, R9, R12.

**Dependencies:** U1, U2, U3.

**Files:**
- Modify: `src/templates/top-n-ranking.ts`
- Modify: `src/templates/geographic-pattern.ts`
- Modify: `src/charts/vega.ts` (`makeRankingSpec` if shared)
- Modify: `src/templates/top-n-ranking.test.ts`, `src/templates/geographic-pattern.test.ts`

**Approach:**
- Switch `makeRankingSpec` to horizontal bars (numeric on x, categorical on y, sorted descending by numeric).
- Render all categories (no filter); top-3 get `stroke: ink-900, strokeWidth: 1, fill: sage-700`, the rest get `stroke: 'transparent', fill: sage-300`.
- Y-axis labels show the categorical names (country, role, etc) — Vega-Lite handles this automatically when the categorical is on Y; ensure `axis.labelLimit` is high enough that long names don't truncate.
- Geographic Pattern: same horizontal bars, plus a text-mark layer rendering each country name on the bar (right-aligned, ink-900) for high-emphasis labels — even when y-axis labels are present, a country name *on* the bar reads more confidently as "this is the data for this country."
- Geographic Pattern's v1-disclaimer moves into `frameFor.takeaway` (e.g. *"Ranked view shown — full world-map render coming after v1."*) and the in-chart banner is removed.
- Visual approval gate: present mockups of Top N on country-rankings (horizontal, 10 bars, top 3 stroked) and Geographic Pattern (same skeleton + country names on bars + takeaway disclaimer).

**Patterns to follow:**
- Existing `makeRankingSpec` in `vega.ts` (rotate orientation, keep the rest).
- `survey-likert.ts` for an example of horizontal bar layout.

**Test scenarios:**
- *Happy path:* `top-n-ranking` `specBuilder` output's `encoding.x` is the numeric column and `encoding.y` is the categorical column.
- *Happy path:* The output's `mark.color.condition` (or equivalent layer split) emphasizes the top-3 via stroke + fill change.
- *Happy path:* Output renders all rows from input, never filters to top-3 only.
- *Happy path:* `geographic-pattern` `specBuilder` output includes a text-mark layer with the country-name encoding.
- *Edge case:* A 1-row input (single category) renders without crashing and the "top 3" emphasis collapses to a single stroked bar.
- *Edge case:* A category name longer than 30 characters truncates with ellipsis on the Y axis (`labelLimit`).
- *Integration:* `geographic-pattern.ts`'s `frameFor.takeaway` contains the v1-disclaimer text; the spec body contains no banner element.

**Verification:**
- Visual: country-rankings under Top N shows 10 horizontal bars with country names visible; top 3 stroked. Geographic Pattern adds country-name labels on the bars and the disclaimer is in the takeaway, not the canvas.

---

- [ ] **Unit 7: Part-to-Whole redesign**

**Goal:** Part-to-Whole renders a single proportional horizontal stacked bar normalized to 100%, with in-segment labels for wide segments and a legend below for narrow ones. Sage ramp only, never off-brand.

**Requirements:** R2, R3, R5, R10.

**Dependencies:** U1, U2, U3.

**Files:**
- Modify: `src/templates/part-to-whole.ts`
- Modify: `src/templates/part-to-whole.test.ts`

**Approach:**
- Rebuild the spec to a single horizontal stacked bar (full chart-region width, 80px tall, vertically centered in the chart region).
- `transform: aggregate` to compute totals per category, then `joinaggregate` to compute total-overall, then `calculate` to compute share. Vega-Lite's `mark: 'bar'` with `encoding.x.stack: 'normalize'` does most of this.
- Color encoding uses the sage ramp from U2, not the off-brand category palette.
- In-segment labels: text mark layered on top of the bar, with `condition` showing `category + percentage` only when segment width ≥ ~10% of total. Below that, fall back to a legend below the bar.
- Visual approval gate: present a mockup on survey-responses respondents (Student 51% / Industry 22% / Researcher 11% / Educator 7% / Journalist 5% / Other 4%).

**Patterns to follow:**
- Vega-Lite normalize-stack examples.
- Sage ramp from U2.

**Test scenarios:**
- *Happy path:* `specBuilder` output is a single `mark: 'bar'` (or layered: bar + text labels) with `encoding.x.stack: 'normalize'`.
- *Happy path:* The color encoding's `scale.range` matches the sage ramp from U2.
- *Happy path:* The text-mark layer has a `condition` that shows labels only for shares ≥ 10%.
- *Edge case:* A 2-category input renders a bar with both segments labeled inline (above threshold).
- *Edge case:* A 10-category input renders the top-N segments inline-labeled and the rest in a legend below.

**Verification:**
- Visual: Part-to-Whole on survey-responses renders a proportional sage-ramp bar with role + percent labels for big segments and a legend for the long tail.

---

- [ ] **Unit 8: Distribution redesign**

**Goal:** Distribution at a Glance shows integer x-axis bin labels, visible mean + median rule lines (the caption already promises them), and a 16:9 aspect.

**Requirements:** R2, R3, R11.

**Dependencies:** U1, U2, U3.

**Files:**
- Modify: `src/templates/distribution.ts`
- Modify: `src/templates/distribution.test.ts`

**Approach:**
- Rebuild the histogram spec to use `bin: { maxbins: 10 }` on the numeric encoding, with `withAxisDiscipline('count', …)` on the Y-axis (kills the decimal-tick bug).
- X-axis: explicit `format: ',d'` for currency/numeric, `'.2f'` for floats. Bin lower-bound shows on every other tick (`tickCount` set explicitly).
- Mean + median: layer two `mark: 'rule'` overlays — solid sage-700 1px for mean, dashed ink-700 1px for median — using Vega-Lite `transform: 'aggregate'`.
- Aspect ratio: chart region dimensions stay at 1140×390 (16:9.x) — already achieved by U1's chart-region constants.
- Visual approval gate: present a mockup on monthly-revenue values bucketed into 8 bins, with mean ($60.6K) solid and median ($61K) dashed visible.

**Patterns to follow:**
- Vega-Lite layered histogram + rule examples.

**Test scenarios:**
- *Happy path:* `specBuilder` output's `encoding.y.axis.format` is `'d'` and `tickMinStep: 1`.
- *Happy path:* The spec contains 3 layers: histogram bars, mean rule, median rule.
- *Happy path:* The mean and median rules each have a distinguishing stroke (solid vs dashed).
- *Edge case:* A 1-bin distribution (all values identical) does not crash and surfaces an explanation in `frameFor.takeaway`.
- *Edge case:* A column with only 2 distinct values renders 2 bins, not auto-collapsed.

**Verification:**
- Visual: Distribution on monthly-revenue values shows 6–10 integer-axis bars with mean (solid) and median (dashed) rules visible.

---

- [ ] **Unit 9: Likert + Before/After fixture samples + audit pass + spec fixes**

**Goal:** Add representative fixture samples to `public/samples/` so Likert and Before/After templates can be audited and verified visually. Run the audit pass against those samples. Apply U1–U3 systemic fixes plus any per-template gaps surfaced in the second audit.

**Requirements:** R14.

**Dependencies:** U1, U2, U3 (foundational systemic work) — and the audit is best run *after* templates are at the systemic baseline so the only remaining gaps are template-specific.

**Files:**
- Create: `public/samples/feature-satisfaction.csv` (5-point Likert: strongly-disagree → strongly-agree counts × ~5 features)
- Create: `public/samples/quarterly-shift.csv` (two-state revenue: category, q1, q2 × ~6 categories)
- Modify: `src/components/Landing.tsx` (add the two samples to the sample picker)
- Modify: `src/templates/survey-likert.ts`, `src/templates/survey-likert.test.ts`
- Modify: `src/templates/before-after.ts`, `src/templates/before-after.test.ts`

**Approach:**
- Author the two CSVs. Match the existing sample naming + column conventions.
- Run a manual audit pass against each template using the new samples (same workflow as the original audit).
- Apply U1's frame, U2's palette, U3's axis discipline to both templates.
- Likert: ensure diverging stacked bar is centered on neutral, with strongly-disagree/strongly-agree at the ends in distinguishable hues from the U2 diverging-pair helper.
- Before/After: ensure two-state side-by-side bars + labeled change indicator (delta arrow + signed-percent text mark).
- Visual approval gate: present mockups of both templates on their fixture samples.

**Patterns to follow:**
- Existing samples in `public/samples/` for naming, column header style, row count.
- `Landing.tsx`'s sample-picker pattern for adding new buttons.

**Test scenarios:**
- *Happy path:* Both new CSVs parse cleanly through the existing CSV ingest pipeline.
- *Happy path:* Likert template's applicability scoring fires on `feature-satisfaction.csv`.
- *Happy path:* Before/After template's applicability scoring fires on `quarterly-shift.csv`.
- *Happy path:* Both `specBuilder`s emit the chart layer (post-frame) sized to chart-region.
- *Integration:* Loading each new sample from the Landing sample-picker takes the user into Infographic mode with the corresponding template auto-selected (or manually selectable from the picker).

**Verification:**
- Visual: both templates on their fixture samples meet the Dual Standard. SVG + PNG export reproduce the same shell.
- Tests: all pass.

## System-Wide Impact

- **Interaction graph:** Template registry → `InfographicView` → `wrapWithFrame` → `vega-embed` → SVG ref → `ExportPanel`. The new wrapper sits at the shell-composition seam; nothing upstream changes (template registry, applicability scoring) and nothing downstream changes (export math).
- **Error propagation:** `frameFor` may throw if a column shape is malformed; same propagation rules as `captionFor` today (caught by `InfographicView`'s error boundary). Add explicit defensive returns for empty datasets.
- **State lifecycle risks:** None — templates are pure functions, no persistent state. The only stateful component is `InfographicView` and its `onSpecBuilt` / `onSvgReady` callbacks; both consume the wrapped spec correctly because the wrapper is transparent on top.
- **API surface parity:** `Template` contract changes (`captionFor` → `frameFor`). The migration applies once across all 8 templates in U1; no other call sites consume `captionFor` per repo research, but verify during U1 implementation.
- **Integration coverage:** The "shell ships in PNG export" property is the most important integration property — it cannot be proven by unit tests alone. U1's verification includes a visual confirmation that the exported PNG of one template shows the eyebrow/headline/takeaway/source/wordmark in the right positions.
- **Unchanged invariants:**
  - Single Vega-Lite renderer (Decision #6).
  - JSON-spec roundtrip (Decision #23).
  - View-source pedagogy shows the full layered spec (Decisions #12, #30).
  - Privacy posture (no new network calls, no new dependencies for export — Decisions #3, #28).
  - Mobile soft-block (Decision #26) — Infographic mode remains desktop-only-edit.
  - Existing template applicability scoring untouched.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Vega-Lite layered text marks at fixed pixel coordinates may overlap or clip when chart region auto-resizes | Lock chart-region dimensions in U1 (`CHART_REGION = 1140×390`); explicit canvas dimensions on every spec via `wrapWithFrame`. Templates emit chart-only specs at chart-region size, not at canvas size — overlap becomes structurally impossible |
| Long takeaway sentences (≥ 80 characters) wrap unpredictably in Vega-Lite text marks | Implement a JS-side wrap helper in U1 that splits takeaway by character count into 2–3 lines. Lock the line-break heuristic when the first overflowing case appears. Acceptable to ship CP-3.6 with manual line-break control (a `\n` in `takeaway`) and refine the helper after seeing real cases |
| Visual approval gate × 5 templates introduces 5 sequential round-trips and slows shipping | Pair templates by similarity for combined approval (Big Number + Trend Story; Top N + Geographic; Part-to-Whole + Distribution; Likert + Before/After). 4 round-trips, not 8 |
| Existing per-template tests break when `captionFor` is replaced by `frameFor` | The migration applies in U1. Update each template's existing test to assert on `frameFor` shape rather than `captionFor`. Behavior tests stay tightly typed; surprise breakage caught at test time |
| PNG export rasterization may handle text marks differently than the inline SVG | Verify in U1 verification — generate a PNG of one template and confirm the shell text is present and legible. If rasterization drops fonts, fall back to the existing font-inlining logic in `src/charts/export.ts` (already proven in CP-3) |
| The Likert and Before/After fixture samples may surface bugs in those templates that are out of scope for U9 | Treat U9 as time-boxed. If the audit pass surfaces gaps that need design work beyond U1–U3 systemic fixes, capture them in `ISSUES.md` and ship the rest of CP-3.6 without holding on those two templates. They are the lowest-frequency templates per applicability scoring |
| `INFOGRAPHIC_DIMENSIONS` is duplicated in 8 specs and `ExportPanel` — refactoring may miss a copy | U1's integration test enumerates all 8 templates and asserts none hardcodes 1200×675; the test fails if any template lags behind |

## Documentation / Operational Notes

- Update [`docs/PRODUCT-BRIEF.md`](../PRODUCT-BRIEF.md) and [`docs/TECHNICAL-ARCHITECTURE.md`](../TECHNICAL-ARCHITECTURE.md) to describe the in-spec frame architecture and link to this plan.
- Update [`docs/plans/PLAN.md`](../plans/PLAN.md) Phasing table — mark CP-3.6 status `Active` while in flight and `Complete (#X)` on merge.
- Update [`STATUS.md`](../../STATUS.md) at session end with implementation summary, total tests passing, and visual-approval evidence per template.
- After CP-3.6 ships, invoke `ce:compound` to seed `docs/solutions/` with at least three entries: (a) "Vega-Lite text-mark composition for infographic shells," (b) "Avoiding HTML-DOM shells when SVG export is the contract," (c) "Brand-palette enforcement at the chart-config layer."

## Sources & References

- **Origin document:** [`docs/audits/2026-05-06-cp-3-6-infographic-ux-audit.md`](../audits/2026-05-06-cp-3-6-infographic-ux-audit.md) — walkthrough findings.
- **CP-3 origin plan (context):** [`docs/plans/2026-04-30-003-feat-infographic-mode-cp-3-plan.md`](2026-04-30-003-feat-infographic-mode-cp-3-plan.md).
- **Locked decisions (PLAN.md):** Decision #6 (single Vega-Lite renderer), #12 (view-source = spec + plain-English why), #23 (export = SVG + PNG + spec JSON), #28 (no analytics), #30 (pedagogy is the wedge), #37 (Geographic ranked-bar fallback), #38 (user-testing trade-off triggered CP-3.6), #41 (CP-3.6 trigger).
- **Design language:** `CLAUDE.md` Arbiter section + [`docs/VISUAL-IDENTITY.md`](../VISUAL-IDENTITY.md).
- Related code (key files): [`src/templates/types.ts`](../../src/templates/types.ts), [`src/templates/big-number.ts`](../../src/templates/big-number.ts), [`src/components/InfographicView.tsx`](../../src/components/InfographicView.tsx), [`src/components/ExportPanel.tsx`](../../src/components/ExportPanel.tsx), [`src/charts/vega.ts`](../../src/charts/vega.ts), [`src/charts/export.ts`](../../src/charts/export.ts), [`src/styles/tokens.ts`](../../src/styles/tokens.ts).

## Alternative Approaches Considered

| Approach | Why rejected |
|----------|--------------|
| **DOM HTML/CSS shell wrapping the chart** (the audit's original framing) | Export reads only inline `<svg>` (research finding). DOM shell would render on screen but be invisible in shared exports — defeats the template purpose entirely. Adopting this would also require introducing html2canvas, breaking the JSON-spec roundtrip and adding a 600KB+ dep for a pure visual concern |
| **Switch export to DOM-region capture (html2canvas / dom-to-image)** | Same concerns as above plus: (a) breaks the spec-JSON export contract, (b) introduces font-loading races, (c) deviates from Decision #3 (no third-party runtime dependencies during processing) |
| **Build a separate "export-time SVG composer" that wraps the chart SVG with hand-built `<text>`/`<rect>` SVG nodes at export time** | Two render paths (one for screen, one for export) = two places to keep in sync. Caption-spec drift (S1.3) returns at the screen-vs-export seam. Worth revisiting only if the in-spec frame ever proves too constraining for some template |
| **Major Vega-Lite version migration to v6 / external chart kit (Chart.js, Recharts)** | Out of scope; Decision #6 locks Vega-Lite. The frame issue is shell composition, not the chart engine |
| **Snapshot tests against generated SVG to prevent visual regression** | No snapshot infra exists. Adding it is a separate concern with its own setup cost; CP-3.6 holds the line via behavior-style tests + visual approval gate. Snapshots are a post-v1 nice-to-have |

## Success Metrics

- **Subjective (visceral):** A developer or design reviewer who hasn't seen the audit looks at any of the 8 templates rendered on their fixture sample and reads the result as a finished, shareable visual — not as an exploratory chart. The opposite of *"would make someone click away."*
- **Objective:**
  - All 8 templates render eyebrow, headline, takeaway, source, and wordmark in both DOM and exported SVG/PNG. Visual approval recorded per template.
  - No template hardcodes 1200×675 (test enforced).
  - No template's color scale references a non-token hex value (test enforced).
  - No template's caption-string output contradicts its rendered chart (manually walked + visually approved).
  - All existing tests + new tests pass; no regressions in CSV/JSON/xlsx ingest, type detection, chart selection, view-source, or export paths.
- **Operational:** CP-3.6 ships before CP-4 begins (per Decision #41). No new dependencies in `package.json`. Bundle size unchanged within ±5%.
