---
title: "CP-3.6 — Infographic mode UX audit"
type: audit
status: active
date: 2026-05-06
auditor: Claude (Opus 4.6) + walkthrough on 1280×900 viewport
samples_walked:
  - monthly-revenue.csv (12 rows × 3 columns)
  - country-rankings.csv (10 rows × 3 columns)
  - survey-responses.csv (6 rows × 3 columns)
templates_seen:
  - Big Number (2 samples)
  - Trend Story (1 sample)
  - Distribution at a Glance (1 sample)
  - Top N Ranking (2 samples)
  - Geographic Pattern (1 sample)
  - Part-to-Whole (1 sample)
templates_not_triggered:
  - Survey Likert (sample data has float confidence scores, not 1–5 integers)
  - Before/After (no sample carries two-state shape)
---

# CP-3.6 — Infographic mode UX audit

## Why this audit exists

CP-3 shipped 8 Infographic templates as parametrized Vega-Lite specs with social-share export (PR #3, merged 2026-05-06). The CP-3 doc-review accepted a "ship on planner intuition + 5-CSV detection corpus" trade-off (Decision #38). Within minutes of CP-3.5 ship, walkthrough of Infographic mode against the bundled samples surfaced a visceral *"absolutely awful, would make someone click away"* reaction — the bit-in-feedback signal that Decision #38 explicitly listed as the trigger.

Templates fail the **Dual Standard** today:
- **Apple Design Award lens:** none of the templates read as a finished, shareable infographic — every one looks like an exploratory Vega-Lite chart with a small border around it.
- **Enterprise SaaS lens:** several render with broken axes, contradictory captions, missing labels, or hidden data points. A university IT department reviewing this would mark it incomplete.

This audit catalogs every issue surfaced in the walkthrough, scored by severity and grouped so a CP-3.6 plan can attack the right things first. Screenshots from the walkthrough live in [`docs/audits/2026-05-06-cp-3-6-infographic-screenshots/`](2026-05-06-cp-3-6-infographic-screenshots/) (referenced inline).

---

## The 7 systemic failures (Severity 1 — visible across templates)

These break templates regardless of which sample is loaded. Fix these first; per-template fixes (Section "Per-template findings") become much smaller after.

### S1.1 No infographic frame whatsoever

Every template renders as a Vega-Lite chart inside a thin-bordered rectangle. No title row, no source line, no brand wordmark, no quoted takeaway, no canvas dimensions tied to a social-share aspect ratio. Big Number's "canvas" is a nearly empty box with the number floating in the middle; Trend Story's "canvas" is a line chart with a Vega axis. Either is what a Vega notebook produces — not an infographic.

**Why this matters:** the wedge in PLAN.md is not "render charts" — ChatGPT code interpreter does that. The wedge is *templates that ship a finished, shareable visual*. Without a frame, every template falls back into "weak chart" territory and the differentiation collapses.

**Implication for fix:** every template needs an HTML/CSS shell that wraps the Vega-Lite spec with consistent scaffolding: headline (Source Serif 4), eyebrow (italic sage), takeaway sentence (Source Serif 4 / regular), Vega chart, source line (sans / ink-500), and "by Glimpse" or wordmark in the footer. Canvas dimensions match the export aspect ratios already encoded in `INFOGRAPHIC_DIMENSIONS`. The Vega chart is a rendered region inside the shell — not the entire surface.

### S1.2 Categorical labels disappear at template-render time

- **Top N Ranking** on country-rankings: 10 country bars rendered, no country name visible anywhere on the chart.
- **Top N Ranking** on survey-responses: only the top 3 highlighted bars are visible — the other 3 categories are dropped entirely and there is no role label for the visible ones.
- **Geographic Pattern** on country-rankings: bars carry only y-axis numeric labels; no country names.
- **Part-to-Whole** on survey-responses: 6 vertical color blocks with no role names, no percentages, no legend.
- **Distribution at a Glance** on monthly-revenue: bins have no x-axis values at all.

The CP-3 specs likely emit pure Vega-Lite without explicit text encodings on bar marks, and the host data column is left as the bar's positional encoding only. Without an explicit `text` mark or axis labelling, Vega-Lite hides the categorical names.

### S1.3 Captions contradict the implementation

The plain-English captions Glimpse ships are a wedge feature (Decision #30 — pedagogy), so caption-spec drift is a high-severity wound.

- **Top N Ranking** caption claims "horizontal bar chart" — implementation renders vertical bars.
- **Part-to-Whole** caption claims "horizontal stacked bar normalized to 100%" — implementation renders unstacked vertical bars in clashing colors.
- **Survey Top N** eyebrow says "top 10" — implementation visibly shows 3 bars.
- **Distribution at a Glance** caption claims "solid line marks the mean, dashed marks the median" — neither line is visible in the rendered chart.

Either the caption text needs to change or the spec needs to change. Both options are in scope for CP-3.6, but they MUST match — and the audit recommends fixing the spec, not the caption, since the caption *is* the wedge.

### S1.4 Vega-Lite axis defaults are picking unfortunate scales

- **Distribution at a Glance** Y axis is `0.3 → 2.0` in 0.1 increments for an integer count of records. The data only has 6 distinct row counts (all integers).
- **Trend Story** Y axis is `15,000 → 90,000` when actual data range is `41,000 → 82,000` — half the chart's vertical space is blank.
- **Top N Ranking** on country-rankings Y axis is `15 → 100` for literacy values that are all 97–99.8 — visually overstates the differences and turns nearly-identical values into giant bar-height variation.

Auto-scale is wrong for infographic-grade output. Each template spec needs explicit `scale.domain` and tick-value control, with sensible per-shape defaults (counts → integers; close-clustered values → expanded zoom; revenue/dollars → start at zero or just below min).

### S1.5 Brand color discipline is not enforced

- **Part-to-Whole** uses an entirely off-brand palette — sage, dark green, tan, slate-blue, terracotta side-by-side. Looks like an accident.
- All other templates use brand sage 700, but solid blocks with no stroke variation, no gradient ramp for category position, no opacity scale for emphasis.

Per Arbiter design language (`CLAUDE.md`): single-hue ramps within ink/sage/stone, hairline borders, no shadows. The Part-to-Whole color escape is a one-line fix in the spec; the broader pattern needs a documented "infographic palette" that templates draw from.

### S1.6 Type hierarchy is inverted

Big Number's `727K` headline is dwarfed by the surrounding empty canvas; the body line "Sum of 12 rows" sits 8px below the number in the same weight family. For a template whose entire purpose is *one number you cannot miss*, the number must dominate (≥80pt minimum, suggested 120pt at the 1200×675 social-share dimension).

Trend Story's chart-axis labels (font-mono 11px) are visually louder than the takeaway sentence above the chart. The information hierarchy is backwards: takeaway should lead, chart should support, axis labels should recede.

### S1.7 Cropping at canvas edges

- Trend Story's `71,000` peak annotation is cut off at the right edge.
- Top N Ranking on country-rankings clips the rightmost bar (rank 10) in half.

These are cropping bugs — the canvas width vs the chart-width-plus-padding math is off. Easy to fix once the template shell is in place (S1.1) because dimensions become explicit.

---

## Per-template findings (Severity 2 — template-specific)

### Big Number (`big-number.ts`)

| # | Issue | Severity | Fix sketch |
|---|-------|----------|------------|
| BN.1 | Headline number too small for canvas (~64pt visually) | 2 | Bump to 120pt at the 1200×675 export size |
| BN.2 | "Sum of 12 rows" body is technical, not narrative | 2 | "Total revenue across 12 months" — derive context from column type + cardinality |
| BN.3 | Empty space top + bottom of canvas | 2 | Tighten via vertical centering + explicit canvas height |
| BN.4 | No comparison reference (Single Stat WITH context per PLAN.md) | 2 | Add a "vs prev period" or "across N units" microcopy line |

### Trend Story (`trend-story.ts`)

| # | Issue | Severity | Fix sketch |
|---|-------|----------|------------|
| TS.1 | Y-axis starts at 15,000 (data min 41,000) — half the chart is empty space | 1 | Explicit `scale.domain` rounding to nearest sensible step below data min |
| TS.2 | Peak annotation text clipped at right edge | 1 | Reserve right padding for label + use `align: 'right'` on rightmost peaks |
| TS.3 | Axis labels (mm-dd, $) are louder than the headline takeaway | 2 | Reduce axis label weight; raise headline to 32pt+ |
| TS.4 | Annotations sit ON the line — easy to miss | 2 | Offset 8px above peak, tiny dot at the data point, line connecting dot to label |

### Distribution at a Glance (`distribution.ts`)

| # | Issue | Severity | Fix sketch |
|---|-------|----------|------------|
| DA.1 | Y-axis is decimals 0.3–2.0 for integer count | 1 | `axis.tickMinStep: 1`, `format: 'd'` |
| DA.2 | No x-axis bin labels at all | 1 | Show bin lower bound on every other tick |
| DA.3 | Mean and median rule lines not visible (caption claims they exist) | 1 | Either render them with explicit `mark: 'rule'` overlay or rewrite caption |
| DA.4 | Aspect ratio is too tall | 2 | Histogram should be wider than tall (3:2 or 16:9) |

### Top N Ranking (`top-n-ranking.ts`)

| # | Issue | Severity | Fix sketch |
|---|-------|----------|------------|
| TN.1 | Caption says "horizontal" — renders vertical | 1 | Switch spec to horizontal (`x: numeric`, `y: categorical`); horizontal bars also fit category labels naturally |
| TN.2 | No category labels rendered | 1 | Once horizontal, labels live on the y-axis automatically |
| TN.3 | Survey case shows only 3 bars when 6 exist | 1 | Don't filter — render all bars, just deemphasize bottom ones (sage-300 on bottom, sage-700 on top 3) |
| TN.4 | Top-3 highlighting is invisible at sample sizes >7 (sage-700 vs sage-300 too subtle) | 2 | Add a 1px ink-200 stroke and use a darker contrast pair (ink-900 vs sage-300) |
| TN.5 | Rank-10 bar clipped at right edge on country sample | 2 | Solved by horizontal swap; otherwise add right padding |

### Geographic Pattern (`geographic-pattern.ts`)

| # | Issue | Severity | Fix sketch |
|---|-------|----------|------------|
| GP.1 | Visually identical to Top N Ranking — no geographic affordance | 2 | Until full choropleth lands (Decision #37), at least add country flags or country-code labels in the bar text mark |
| GP.2 | "Geographic data detected — full world-map render coming after v1" banner inside the chart breaks the infographic illusion | 2 | Keep the disclaimer in the View Source / caption area, not on the chart canvas |
| GP.3 | Same anonymous-bars problem as TN.2 | 1 | Fixed by S1.2 |

### Part-to-Whole (`part-to-whole.ts`)

| # | Issue | Severity | Fix sketch |
|---|-------|----------|------------|
| PW.1 | Caption claims horizontal stacked, implementation is vertical unstacked | 1 | Rewrite spec to horizontal stacked bar normalized to 100% — matches caption |
| PW.2 | Random off-brand color palette | 1 | Sage ramp (sage-200 / sage-400 / sage-600 / sage-800) for up to 4 categories; gracefully degrade with hatch patterns or explicit darker tones beyond 4 |
| PW.3 | No category labels, no percentages, no legend | 1 | Inline labels inside each segment if width >= 80px, else legend below |
| PW.4 | Bar widths visually equal vs the data — losing the proportional encoding | 1 | Single horizontal stacked bar full width of canvas, segment width proportional to share — not separate vertical bars |

### Templates that did not surface during walkthrough

| Template | Why no walk happened | What audit gap remains |
|----------|---------------------|------------------------|
| Survey Likert | `confidence_score` in `survey-responses.csv` is float (3.2, 4.1...) so detection skipped Likert | Add a Likert-shaped sample (5-point integer column, 1–5) before CP-3.6 ships and audit then |
| Before/After | No sample carries two-state shape (e.g. `revenue_2024` + `revenue_2025`) | Ditto — add a Before/After sample then audit |

These two need their own audit pass once representative samples land.

---

## What award-winning would look like (anti-AI-slop test)

For each template, the litmus test is: *"Could this image be the cover of a New York Times Upshot piece, or a Pew Research summary, or a Stripe Atlas one-pager?"*

That requires, at minimum:
1. A clear single-sentence takeaway that names the data and the surprise — not "Showing X by Y" but "Revenue grew 100% from January to November, peaking in November at $82K."
2. Typographic discipline: a headline, a takeaway, a chart, a source line, a brand mark — in that visual order.
3. Real labels: every data point that matters has a name OR the chart explicitly visualizes the proportion (e.g. stacked-bar segment widths read as percentages).
4. Print-quality margins: minimum 32px gutter on every side.
5. Color discipline: one brand hue, modulated by lightness or opacity, not five hues.
6. No Vega defaults visible: no "Count of Records" axis title, no "1.4" tick label on integer counts, no rotated y-axis-label, no auto-format dollar string.

None of the current templates pass even three of these.

---

## Suggested CP-3.6 plan shape (input for `ce:plan`)

The fix is too large for "polish work in CP-5". Run a dedicated CP-3.6 with this rough shape:

| Unit | Goal | Source |
|------|------|--------|
| U1 | Build a shared `<InfographicShell>` HTML/CSS wrapper component (headline, eyebrow, takeaway, chart slot, source line, wordmark) at fixed canvas dimensions matching `INFOGRAPHIC_DIMENSIONS` | S1.1 |
| U2 | Define an "infographic palette" — single sage ramp for sequential, ink/sage/stone diverging for Likert, no off-brand hues — and centralize in `vega.ts` config | S1.5 |
| U3 | Per-spec axis discipline pass — explicit `scale.domain`, `tickMinStep`, `format`, no auto-scale | S1.4 |
| U4 | Per-spec label pass — every categorical encoding gets visible labels (text marks on bars or axis labels with rotation budget) | S1.2 |
| U5 | Reconcile every template's caption against its spec — fix the spec, not the caption (caption is the wedge) | S1.3 |
| U6 | Big Number redesign — 120pt headline, narrative body line, comparison reference | BN.* |
| U7 | Top N Ranking → horizontal bars, all categories rendered, top 3 emphasized via stroke + contrast (not filter) | TN.* |
| U8 | Part-to-Whole → single horizontal stacked bar, proportional segments, in-segment labels with legend fallback | PW.* |
| U9 | Distribution → integer x-axis with bin labels, visible mean + median rule lines, 16:9 aspect | DA.* |
| U10 | Geographic Pattern → country-name labels in bar text marks; move v1-disclaimer out of chart canvas | GP.* |
| U11 | Trend Story → explicit Y domain, peak annotations with offset + connector + right-padding for last peak | TS.* |
| U12 | Add Likert + Before/After fixture samples, run audit pass, ship spec fixes for those two | Templates not walked |
| U13 | Visual approval gate against all 8 templates × at least one representative sample each before merge | CLAUDE.md hard stop |

Each unit is independent enough to land in its own commit. U1 is foundational and should land first. U2-U5 are the systemic fixes that benefit every template; the per-template units can land in any order after.

---

## Tracking

- Decision #41 (PLAN.md) is the durable trigger for CP-3.6.
- STATUS.md "Next actions" list CP-3.6 as a pre-CP-4 blocker.
- This audit lives at `docs/audits/2026-05-06-cp-3-6-infographic-ux-audit.md`.
- A `ce:plan` invocation against the "Suggested CP-3.6 plan shape" section produces the implementation plan.

## Severity legend

- **Severity 1** — breaks the template; user would click away. Fix before any v1 launch.
- **Severity 2** — template still functions but reads as low-effort or unprofessional. Fix before any v1 launch — these are what separate "AI slop" from "award-winning."
- **Severity 3** — polish that can wait for CP-5 if everything else lands first. (None in this audit — all findings are S1 or S2.)
