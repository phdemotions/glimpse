# Glimpse

> **Make data speak. Locally.**
>
> Glimpse turns raw spreadsheets and academic articles into clear, shareable infographics — entirely in the browser, with nothing leaving the user's machine.

---

## HARD STOP: Visual Approval Required

> **This rule is MANDATORY and overrides all other workflow instructions.**

Any change that affects what the user sees — UI, layout, colors, typography, spacing, icons, animations, copy displayed on screen, component structure, or any other visual output — MUST be presented to the user for approval BEFORE implementation begins.

### How to present for approval
1. **Describe the change** — what will change and why
2. **Show before/after** — ASCII mockups, markdown tables, or descriptive layouts
3. **Wait for explicit approval** — do not proceed until the user says yes
4. **If denied** — ask what they would prefer instead

### No exceptions
Not for "small" changes. Not for "obvious" improvements. Not for refactors that "shouldn't change anything visually." If unsure whether a change is visual, treat it as visual and ask.

---

## HARD STOP: First Impressions Are Never Deferred

Any work that affects what a new user sees on their first interaction — landing surface, empty states, upload prompt, sample-data picker — is the highest-priority design work and ships in the same session it is identified.

1. First impressions ship in the same session they are identified
2. Every empty state has a clear, tappable CTA
3. Copy motivates, not instructs — sell the feeling first
4. Speed is part of the impression — first paint <1.5s on cold load
5. The first chart a user sees should make them feel competent, not lectured

If you identify a first-impression issue during an audit, fix it now. Not later. Not next session. Now.

---

## Inherits

Opus Vita Dual Standard + Three Gates from `~/developer/CLAUDE.md`. Read those first.

---

## What Glimpse Is

- **Lead audience:** students learning data literacy. Industry communicators are "also works for" — a secondary fit, not a co-primary
- **Primary goal:** turn raw data files into clear, shareable visuals — without the data ever leaving the user's machine
- **The wedge:** **pedagogy** — view-source mode reveals the Vega-Lite spec and a plain-English explanation of *why* the chart looks the way it does. ChatGPT code interpreter does Quick-mode at 80% quality; pedagogy is the durable differentiator
- **Brand position:** free, no-account on-ramp into the Opus Vita research suite. Tagline angle: "by the team behind Claritas and Arbiter"
- **Privacy posture:** data sovereignty is the product. No backend, no analytics, no telemetry of uploaded files (PLAN.md Decision #28)

The "read others' data" pathway exists primarily as a learning step toward "publish data clearly."

## What Glimpse Is Not

- Not a server-side data tool (Tableau, Looker, Datawrapper)
- Not a data warehouse or BI platform
- Not a research-grade statistical package
- **Not a PDF tool** in v1 — PDF parsing moved to **Glimpse-PDF** v1.1 (separate product, see PLAN.md Decision #31)
- Not an AI-summary tool — feature dropped from v1 due to CORS + UX walls (Decision #21)
- Not Claritas (lit review tool) or Sententia (evidence search)

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Vite + React + TypeScript** | Right tool for offline-first SPA. ~50KB shell. Native GitHub Pages SPA fit |
| Styling | **Tailwind CSS 3** | Match family |
| Data engine | **DuckDB-WASM** | 10-100x faster than Arquero/SQLite-WASM. Standard for in-browser analytics in 2026 |
| Charts (both Quick + Infographic modes) | **Vega-Lite** (single renderer) | One spec language, one bundle, one mental model. View-source pedagogy stays consistent across modes. Replaces Mosaic + Observable Plot per 2026-04-30 doc-review |
| Hand-drawn aesthetic | **Rough.js** (optional) | Sketchy filter on SVG output. Flagged weak link — isolate behind interface |
| Storage | **Dexie.js** (IndexedDB wrapper) | Saved sessions, cached parsed data |
| Offline | **vite-plugin-pwa** (Workbox) | Standard 2026 service-worker pattern |

**Removed from v1 (see PLAN.md decisions #21, #31):**
- ~~PDF.js + custom row/col clusterer~~ — moved to Glimpse-PDF v1.1 (separate product)
- ~~Mosaic + Observable Plot~~ — collapsed into single Vega-Lite renderer

Full reasoning in `docs/TECHNICAL-ARCHITECTURE.md`.

---

## Design Language — Arbiter Family

Glimpse shares the visual identity of Claritas, Arbiter, and opusvita-org so all Opus Vita products feel like one family.

### Typography
- **Source Serif 4** — page titles, infographic headlines, the character actor
- **Inter** — UI chrome, navigation, buttons, labels
- **JetBrains Mono** — numeric accents in charts (rare)

### Palette
- **Ink** — deep green-near-black `#1A241E` — primary text, full ramp 950→50
- **Sage** — muted green `#386857` — eyebrows, CTAs, brand chart color
- **Stone** — warm off-white `#FAFAF7` — page background

### Patterns
- Italic lowercase eyebrows in sage-700 (never uppercase tracked smallcaps)
- Hairline 1px ink-200 rules instead of card borders or drop shadows
- 8px max border-radius on UI; 2px on marketing buttons (press-like)
- 180ms transitions with Stripe easing `cubic-bezier(0.2, 0.8, 0.2, 1)`
- No drop shadows, no pill buttons, no gradient text
- iA Writer feel — calm, focused, typography-first, whitespace as a feature

Anti-patterns: purple gradients, heavy shadows, dashboard metric grids, gradient buttons, rounded-full buttons, confetti, centered text blocks.

---

## Read First

1. `docs/plans/PLAN.md` — durable plan index, locked decisions, open questions, risks
2. `STATUS.md` + `ISSUES.md` — current state
3. `docs/PRODUCT-BRIEF.md` — what we are building and why
4. `docs/VISUAL-IDENTITY.md` — design tokens and component patterns
5. `docs/TECHNICAL-ARCHITECTURE.md` — stack and data flow
6. `docs/solutions/` — documented solutions with YAML frontmatter (when populated)

---

## Documentation Standards

Glimpse follows compound engineering conventions for all planning and solution documentation.

**Directory structure:**
- `docs/plans/` — implementation plans, one per CP
- `docs/plans/PLAN.md` — durable index linking individual CP plan files; contains locked decisions, open questions, risks, working agreements
- `docs/brainstorms/` — `ce:brainstorm` outputs, naming `YYYY-MM-DD-<topic>-requirements.md`
- `docs/solutions/` — documented solutions organized by category with YAML frontmatter

**Plan filename:** `YYYY-MM-DD-NNN-<type>-<description>-plan.md`

**Plan YAML frontmatter (required):**
```yaml
---
title: "type: Description (CP-N)"
type: feat | fix | refactor | docs
status: active | complete | deferred
date: YYYY-MM-DD
---
```

**Workflow:**
- New feature or CP — invoke `ce:plan` before implementation
- Solved problem — invoke `ce:compound` into `docs/solutions/`
- PLAN.md is the index — update the CP table status when a CP ships

---

## Template Conventions (CP-3+)

- **Registration:** each template exports its object; `src/templates/index.ts` imports directly into the `TEMPLATES` array literal. No side-effect push pattern (causes circular deps)
- **Vega-Lite text positioning:** use `value:` (pixel coords) not `datum:` (data scale) for fixed-position text marks. `datum:` generates phantom axes
- **Applicability:** pure function `(columns) → {fits, score, reason?}`. Score ≥95 triggers auto-infographic mode (AUTO_INFOGRAPHIC_THRESHOLD)
- **Infographic canvas:** fixed 1200×675 spec dimensions, scaled via CSS `aspect-ratio`. All templates target this viewport
- **Export font inlining:** WOFF2 fetched via `?url` import, base64-encoded into SVG `<defs><style>` before PNG rasterization

---

## Privacy Discipline (locked)

- **Data never leaves the browser.** No telemetry of uploaded files. No phone-home requests during processing
- **No analytics in v1** — not even page-view counters (PLAN.md Decision #28)
- **No AI summary** — dropped per Decision #21 (CORS prevents browser-direct API calls; would require a backend proxy that breaks the static promise)
- **First-load assets only.** Self-host fonts in `public/fonts/`. No Google Fonts CDN, no third-party JS
- **GitHub Pages = static.** No server, no edge functions, no exception
- **Service worker** caches the app shell so the tool works fully offline after first load. Never caches user file content

Any deviation from this list requires a row in `docs/plans/PLAN.md` locked decisions and explicit user sign-off.

---

## Session Protocol

Start every working session by reading `STATUS.md`, `ISSUES.md`, and `docs/plans/PLAN.md` — in that order. End every working session by updating `STATUS.md` with what was done and what is next.

Use `compound-engineering:ce-plan` for new CPs and `compound-engineering:ce-compound` for documenting solutions.

---

*Last updated: 2026-05-06 — CP-3 template conventions added.*
