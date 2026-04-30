# Glimpse Status

## Current state

- **Phase:** Pre-CP-1 — scaffold complete, no code yet
- **Last session:** 2026-04-30 — planning + doc scaffold + 5-persona doc-review + scope-tightening revision
- **Next action:** Visual approval is captured (landing v2 mockup, 2026-04-30). Begin CP-1 implementation. Plan: [`docs/plans/2026-04-30-001-feat-glimpse-v1-plan.md`](docs/plans/2026-04-30-001-feat-glimpse-v1-plan.md)

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
