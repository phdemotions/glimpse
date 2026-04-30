# Glimpse PLAN

> Durable product plan. Locked decisions, open questions, risks, working agreements. Index for individual CP plan files.

**Last updated:** 2026-04-30 (post-CP-1 ship + CP-2 plan revision — 35 locked decisions, 5 CPs)
**Status:** CP-1 in PR; CP-2 plan active — view-source pulled forward into CP-2 per doc-review

---

## What we are building (locked)

**Glimpse** — a static, offline-first browser tool that turns raw data files and academic article PDFs into clear, shareable infographics. Hosted on GitHub Pages. Nothing the user uploads ever leaves their browser.

**Two modes, same tool:**
- **Quick mode** — opinionated default charts (bar, line, scatter, pie, distribution) for fast exploration
- **Infographic mode** — 6–8 hand-crafted templates for shareable, social-ready visuals

**One input v1, one workflow:**
- Tabular data — CSV, Excel, JSON (Parquet deferred)
- _Academic article PDFs deferred to **Glimpse-PDF** (v1.1 separate product) — see Decision #31_

**Lead audience: students learning to read and present data.**
Industry communicators making infographics for non-experts is "also works for" — a secondary fit, not a co-primary. Resolves the dual-audience tension surfaced in the 2026-04-30 doc-review.

**The wedge: pedagogy.**
View-source mode (Vega-Lite spec + plain-English why) is the durable differentiator no LLM-based competitor naturally produces. Local-first is a supporting trust signal, not the headline. Templates + pedagogy is the moat, not Quick-mode charts.

**Brand position:**
Glimpse is positioned as a free, no-account on-ramp into the Opus Vita research suite. Tagline angle: "by the team behind Claritas and Arbiter." Earns brand equity for the research products by serving the audience just upstream of them.

---

## Locked decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | **Name: Glimpse** | Friendly, student-feel, "see your data quickly" |
| 2 | **Hosting: GitHub Pages** | Free, static, version-controlled, embodies the offline-first promise |
| 3 | **No backend, no auth, no DB in v1** | Data sovereignty is the product |
| 4 | **Stack: Vite + React + TypeScript** | Right shape for offline-first SPA. ~50KB shell vs ~250KB Next.js. Native GitHub Pages SPA fit |
| 5 | **Data engine: DuckDB-WASM** | 10–100x faster than Arquero or SQLite-WASM. Standard 2026 in-browser analytics |
| 6 | **Single renderer: Vega-Lite for both Quick and Infographic modes** | One spec language, one bundle, one mental model. View-source pedagogy stays consistent across modes. Drops Mosaic + Plot per 2026-04-30 doc-review (three viz layers for ~5 chart types was unjustified) |
| 7 | _(reserved — was duplicated by #6)_ | Vega-Lite serves both modes per #6 |
| 8 | _(deferred to Glimpse-PDF v1.1 — see #31)_ | PDF table extraction is its own product; was unfalsifiable scope risk for v1 |
| 9 | **Storage: IndexedDB via Dexie.js** | Saved sessions, cached parsed data; raw IDB API too hostile |
| 10 | **Offline: vite-plugin-pwa** | Workbox under the hood; standard 2026 pattern |
| 11 | **Design language: Arbiter family** | Ink/Sage/Stone palette, Source Serif 4 + Inter + JetBrains Mono, hairline borders, no shadows |
| 12 | **View-source layers: Vega-Lite spec + plain-English why** | Show the JSON, explain the chart-type choice |
| 13 | **Hide source by default** | Toggle to reveal — non-expert default, expert opt-in |
| 14 | **Pay tier: hypothetical** | No auth scaffolding, no Stripe stubs in v1 |
| 15 | _(deferred with PDF parsing — see #31)_ | Inline-number extraction lives with Glimpse-PDF |
| 16 | **Visual approval gate** | Hard stop — every visual change is approved before built. Inherited from Opus Vita |
| 17 | **First-impressions never deferred** | Hard stop — landing/empty states ship the same session they are identified |
| 18 | **Tailwind v3** | Match family stack — defer v4 migration until the rest of Opus Vita moves |
| 19 | **Self-host fonts** | Privacy — no Google Fonts CDN |
| 20 | **Domain v1: `phdemotions.github.io/glimpse`** | Free, instant, GitHub Pages default. Custom subdomain `glimpse.opusvita.org` deferred to post-CP-5 polish (5-min CNAME). Vite `base` configured for the subpath |
| 21 | **AI summary feature: dropped from v1** | Doc-review surfaced two blockers: (a) Anthropic/OpenAI APIs do not allow direct browser-origin calls — would require a proxy backend, breaking Decision #3; (b) UX wall — students will not obtain API keys + billing to paste into a webpage. Revisit only if real demand surfaces, and only with a proxy architecture decision |
| 22 | **No iframe embed v1** | Export Vega-Lite spec JSON + standalone HTML instead. Anyone can self-host. Avoids X-Frame-Options config, sizing edge cases, and a new attack surface. Revisit only if real demand surfaces |
| 23 | **Export formats v1: SVG + PNG + spec JSON** | SVG (scalable, Figma-editable), PNG (universal share), spec JSON (view-source + recipe sharing). Skip PDF — browser print covers it, jsPDF dep not worth ~200KB |
| 24 | **Type detection: auto-detect + low-confidence flagging + override UI everywhere** | Every column shows inferred type with override dropdown and confidence badge. Misclassified types are the #1 chart-breaking failure mode — make recovery instant rather than chase perfect detection |
| 25 | _(deferred with PDF parsing — see #31)_ | UX-recovery bar belongs to Glimpse-PDF |
| 26 | **Desktop-first; mobile view-only** | Real editing requires ≥768px viewport. Below that: soft-block message "Glimpse works best on desktop" with view-only access to landing + exported infographics. DuckDB-WASM ~5MB + Vega-Lite ~700KB are wrong cost on phones for editing |
| 27 | **Light-mode only v1** | Defer dark mode to post-v1. Doubles design QA. Shared infographics export light-themed by default for universal display compatibility. Family-wide dark-mode sync revisited later |
| 28 | **No analytics in v1** | Resolves the TECHNICAL-ARCHITECTURE ambiguity ("Plausible-style page-view counter or none in v1"). v1 = none. Even page-view counters can leak referrer + UA fingerprints. If maintainer signal becomes critical, revisit with explicit decision row + privacy-policy update |
| 29 | **Lead audience v1: students.** Industry communicator demoted to "also works for" | Doc-review (Adversarial + Product Lens) surfaced dual-audience as the premise most likely to crack. Single audience drives v1 roadmap; second audience benefits from same surface but does not get features carved for them |
| 30 | **The wedge is pedagogy, ships with Quick mode in CP-2** | ChatGPT code interpreter already covers Quick-mode at 80% quality. The durable differentiator is view-source + plain-English-why, which LLMs do not naturally ship. **View-source ships in CP-2 alongside Quick mode and ships again in CP-3 alongside templates — same component, both modes consume it.** Revised after CP-2 doc-review (2026-04-30) flagged that Quick mode without view-source = "ChatGPT clone with a footnote" and the wedge should never ship later than the surface it differentiates |
| 31 | **PDF parsing deferred to Glimpse-PDF (v1.1, separate product)** | Custom row/col clusterer is months of engineering; quality bar against academic PDFs is unfalsifiable without a locked corpus; cuts ~6 weeks from v1 timeline. Glimpse v1 ships tabular only. Decisions #8, #15, #25 (and old CP-4) all defer with this |
| 32 | **Scope-revisit trigger: 8 weeks from CP-1 start** | If v1 has not shipped 8 weeks after CP-1 begins, pause and re-evaluate against opportunity cost on Marginalia / Arbiter / Claritas. Trigger, not kill — outcome may be re-scope, re-sequence, or continue |
| 33 | **Glimpse positioned as funnel into Opus Vita research suite** | Resolves the brand-coherence concern (Product Lens). Glimpse is "free data tool by the team behind Claritas and Arbiter." Earns research-product brand equity by serving the audience upstream. Marketing copy and footer link reflect this |
| 34 | **Date-format detection: ISO 8601 high confidence, US `M/D/YYYY` medium, else string** | New CP-2 sub-decision (was incorrectly cited as PLAN.md #5 in early CP-2 plan draft — corrected). ISO is unambiguous. US format is acknowledged because target audience writes US-formatted dates; medium confidence triggers user confirmation via override UI before committing to a line chart. Other locale-specific formats (D/M/YYYY, written month names) defer to evidence from real user files |
| 35 | **3-tier confidence enum (`high` / `medium` / `low`) operationalizes Decision #24** | Decision #24 said "low-confidence flagging + override UI." CP-2 implements that via 3 discrete tiers, mapping cleanly to UI affordances: high = no badge, medium = subtle hint, low = inline override prompt. Discrete tiers avoid false numeric precision and stay defensible without analytics signal (Decision #28) |

---

## Phasing (CPs) — revised post-doc-review (5 CPs, was 7)

| CP | Title | Plan file | Status |
|----|-------|-----------|--------|
| CP-1 | **Foundation** — scaffold, layout, upload, DuckDB wired, sample CSV → first chart via Vega-Lite | [`2026-04-30-001-feat-glimpse-v1-plan.md`](2026-04-30-001-feat-glimpse-v1-plan.md) | Pending |
| CP-2 | **Quick mode + view-source (the moat lands early)** — type detection, opinionated default Vega-Lite specs, plain-English captions, override UI, **view-source toggle exposing spec JSON + plain-English why** | [`2026-04-30-002-feat-quick-mode-cp-2-plan.md`](2026-04-30-002-feat-quick-mode-cp-2-plan.md) | Active |
| CP-3 | **Infographic mode** — 8 templates as parametrized Vega-Lite specs, brand fills, social-share export (SVG/PNG/spec JSON). View-source component shipped in CP-2 is reused for templates | TBD | — |
| CP-4 | **Persistence + offline** — Dexie sessions, service worker, install prompt | TBD | — |
| CP-5 | **Polish + GitHub Pages deploy** | TBD | — |

**Removed from v1 (per Decisions #21, #31):**
- ~~CP-4 PDF parsing~~ → moved to Glimpse-PDF v1.1 (separate product)
- ~~AI summary BYO API key~~ → dropped, CORS + UX walls

**Sequencing logic:**
- **CP-1** proves the spine end-to-end (data in → chart out) before any feature breadth — single Vega-Lite renderer, not three layers
- **CP-2** generalizes the spine across data shapes — type detection, opinionated default specs, plain-English captions
- **CP-3 is the moat.** Templates and view-source pedagogy ship together, not as separate phases — pedagogy is what makes Glimpse durable against ChatGPT code interpreter
- **CP-4** makes the tool offline-first; service-worker comes after content surfaces are stable, otherwise stale UI gets cached
- **CP-5** ships v1 publicly on GitHub Pages

Glimpse-PDF (v1.1) is a separate plan; reuses Glimpse v1 chart engine but adds PDF.js + custom row/col clusterer + extraction-review UI as its own product surface.

---

## Infographic templates (target set, locked v1)

| # | Template | When it fits |
|---|----------|--------------|
| 1 | **Single Stat with Context** | One headline number plus a comparison reference |
| 2 | **Top 5 / Top 10 Ranking** | Ordered categorical with one numeric measure |
| 3 | **Before / After Comparison** | Two states with change highlighted |
| 4 | **Trend Story** | Time series with annotated turning points |
| 5 | **Distribution at a Glance** | Histogram with mean/median markers |
| 6 | **Part-to-Whole** | Proportional breakdown — treemap or stacked bar |
| 7 | **Geographic Pattern** | Choropleth or bubble map (only when location data detected) |
| 8 | **Survey Results / Likert** | Diverging stacked bar for attitudinal data |

Each template is a Vega-Lite spec parametrized by detected data shape. Brand colors, type, and social-share dimensions baked in.

---

## Open questions

_All initial open questions resolved 2026-04-30 — see locked decisions #20–#27. New questions will accumulate during CP work._

| # | Question | Owner | Decide by |
|---|----------|-------|-----------|
| _(none)_ | | | |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **DuckDB-WASM cold load on student bandwidth blocks "first chart in 10s"** | High | Medium | **Prefetch DuckDB-WASM in idle after landing paint, not on click.** ~3–5MB on shared dorm wifi (3–10 Mbps) is 4–13s — a click-time block kills the promise |
| **Vega-Lite spec authoring fatigue (8 templates × edge cases)** | Medium | Medium | Build a template-authoring helper inside Glimpse first, then ship templates. Cut templates to 3 (Single Stat, Top 5, Trend) if CP-3 stalls |
| **Rough.js stale upstream** | Medium | Low | Isolate behind a renderer interface so it can be swapped |
| **GitHub Pages SPA routing quirks (404.html redirect, deep links)** | Low | Low | Document; verify in CP-5 |
| **Service-worker cache staleness during dev** | Medium | Low | Disable SW in dev mode, enable only in production builds |
| **Privacy posture creates debugging black hole** | Medium | Medium | Bug reports rely on users sharing files (which contradicts the promise) or reproducing locally. Accept slower bug-fix cycle as a cost of the privacy stance — or revisit Decision #28 |
| **Mobile soft-block kills share loop** | Medium | Medium | Recipients of shared infographics open links on phones. CP-3 must support **mobile view-of-output** (just no editing) so the share loop survives |
| **Lead-audience drift** (industry features creep into student-led roadmap) | Medium | Medium | Decision #29 is the test — every feature must answer "does this serve a student first?" before it ships |

---

## Working agreements

- **Visual approval gate** — see CLAUDE.md hard stop
- **First impressions ship same session** — see CLAUDE.md hard stop
- **No data leaves the browser** — non-negotiable. Any deviation requires a locked-decisions row + explicit sign-off
- **Plan-first** — every CP gets a `docs/plans/...-plan.md` file before code
- **`/session-end` after work touches code or docs** — captures decisions, updates STATUS
- **Lead-audience test** — every feature, every copy decision, every UI choice must serve a student first; if it primarily serves an industry user, ask whether it belongs in v1 (Decision #29)
- **Scope-revisit trigger** — at 8 weeks from CP-1 start, pause and re-evaluate Glimpse against opportunity cost on Marginalia / Arbiter / Claritas (Decision #32). Trigger does not mean kill — it means deliberate decision

---

## Anti-scope (will not build in v1)

- **PDF parsing** — moved to Glimpse-PDF v1.1 (separate product, see Decision #31)
- **AI summary / chart suggestion** — dropped (CORS + UX walls, see Decision #21)
- User accounts, auth, login
- Cloud storage, sync across devices
- Collaboration (multi-user editing)
- Real-time data sources, API connectors, scheduled refresh
- Statistical inference (regression, hypothesis testing) — wrong tool, wrong audience
- Custom infographic editor (templates only in v1)
- Mobile editing (view-only on <768px per Decision #26)
- Mobile-native apps
- Analytics (per Decision #28)
- Dark mode (per Decision #27)

---

## Glossary

| Term | Meaning |
|------|---------|
| **Quick mode** | Default exploratory charts — opinionated Vega-Lite specs auto-chosen from data shape |
| **Infographic mode** | Template-based shareable visuals — parametrized Vega-Lite specs |
| **View-source** | The UI toggle and the surface it exposes — Vega-Lite spec JSON + plain-English rationale. The single canonical label; do not use "pedagogy mode" as a synonym in user-facing copy |
| **CP** | Capability Phase — a coherent, shippable slice of the product |
| **Template** | A parametrized Vega-Lite spec keyed to a detected data shape |
| **Glimpse-PDF** | Future v1.1 product, separate plan, that adds PDF table extraction and inline-number harvesting on top of the Glimpse chart engine |
