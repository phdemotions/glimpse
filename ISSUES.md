# Glimpse Issues

> Open issues by priority. Closed issues archived after CP completion.

## Critical

_(none)_

## High

_(none — accumulate during CP-1)_

## Medium

### M-001 — Top N + Geographic Pattern: full audit redesign blocked by Vega-Lite layout explosion

**Surfaced:** 2026-05-07 during CP-3.6 U6 (audit findings TN.1, TN.2, TN.4, TN.5, GP.1).

**Symptom:** Adopting `withAxisDiscipline('numeric', ...)` on the quantitative axis of Top N or Geographic Pattern produces a Vega-Lite SVG with a viewBox of ~22000–40000 px on the axis aligned with the quantitative scale (Y for vertical bars, X for horizontal). The chart renders all bars + labels but the canvas auto-scales each tick to a huge band, leaving the visible InfographicCanvas region nearly empty.

**Reproduction:** Use `withAxisDiscipline('numeric', { dataMin: 97, dataMax: 99.8 })` on Top N's Y axis with `nice: false, zero: false`. Run on `country-rankings.csv`. The rendered SVG comes out 22953 px tall regardless of explicit `width: 1200, height: 675`.

**What was tried (all failed to constrain layout):**
- Horizontal bars (nominal Y + quantitative X) — chart explodes to 40003 px wide instead.
- `tickCount: 5` and `tickMinStep: 1` on the discipline axis.
- Explicit `nice: false, zero: false`, `scale.type: 'linear'`.
- Self-framed pattern (skip `wrapWithFrame`, embed text marks directly via a single layered spec).
- Removing the window transform and pre-ranking in JS.
- Disabling `cornerRadiusEnd`.

**Plausible cause:** Vega-Lite layout interaction between layered text marks at fixed `value:` pixel positions and a quantitative scale's auto-tick density on a small-range domain. The `withAxisDiscipline('numeric')` for ranges < 100 returns `format: '.2f'` with no `tickMinStep`, leaving Vega to pick step density. For `[97, 100]` with `nice: false`, the auto step is 0.01 → ~300 ticks → enormous canvas allocation regardless of explicit `width`/`height`.

**Workaround in current main:** Top N + Geographic stay on Foundation behavior — `makeRankingSpec` (vertical bars, `transform: [{filter: 'datum._rank <= 10'}]`, top 3 in sage-900 vs sage-400, frame contract from U1). All 10 categories visible for cardinality ≤ 10 datasets; top 3 emphasized via fill. Caption-spec drift fixed by the U1 frame migration.

**Audit findings still open:**
- TN.1 (caption claimed horizontal, renders vertical) — caption text now neutralized by U1's frame migration; spec orientation fix still pending.
- TN.2 (no category labels at high cardinality) — present.
- TN.4 (top-3 emphasis is fill-only, not the audit's `stroke + lightness`).
- TN.5 (rightmost bar clipping at high cardinality).
- GP.1 (Geographic visually identical to Top N).

**Next step when picking this back up:**
1. Build a minimal Vega-Lite reproduction outside the project to confirm the bug surface.
2. File upstream if Vega-Lite v5 layout regression; otherwise rework `withAxisDiscipline('numeric')` output for small-range domains to set explicit `tickStep` so auto-density does not kick in.
3. Once layout is solved, retry both horizontal layout and self-framed text marks for the audit's full TN/GP redesign.

## Low

_(none yet)_

## Closed

_(empty)_
