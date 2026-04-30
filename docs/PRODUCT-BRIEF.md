# Glimpse Product Brief

## The problem

Most people who need to communicate data to non-experts are stuck choosing between two bad options:

1. **Spreadsheets and screenshots** — fast, but the result looks unprofessional and rarely communicates the point
2. **Heavyweight tools** (Tableau, Datawrapper, Adobe) — capable, but require a learning curve, a subscription, and often a cloud upload

Students learning data literacy face a third problem: they have no way to *see* the rationale behind a chart choice. The chart appears, but the reasoning that produced it stays hidden.

## The opportunity

A browser-based tool can do everything a non-expert needs without a server, without a subscription, and without sending the user's data anywhere. WebAssembly has matured enough (DuckDB-WASM, PDF.js, Vega-Lite) that the entire pipeline — ingest → analyze → visualize → export — can run client-side at native-ish speed. GitHub Pages can host it for free.

The win comes from doing one thing well: turning a file into a clear visual that a non-expert can understand at a glance.

## The product

**Glimpse** is a static web tool with two modes and one input class in v1.

### Input (v1)
- **Tabular files** — CSV, Excel, JSON

PDF input is moved to **Glimpse-PDF v1.1**, a separate product (PLAN.md Decision #31). Custom row/column clustering on academic PDFs is months of unfalsifiable engineering — pulling it out of v1 cuts ~6 weeks and concentrates v1 on the moat.

### Modes
- **Quick mode** — opinionated default charts for fast exploration (Vega-Lite specs auto-chosen from data shape)
- **Infographic mode** — 8 hand-crafted templates for shareable, social-ready visuals (parametrized Vega-Lite specs)

Both modes use the same renderer: **Vega-Lite**. One spec language, one mental model. View-source pedagogy (below) stays consistent across modes.

### View-source (the wedge)
- Toggle reveals the Vega-Lite spec JSON and a plain-English explanation of *why* the chart looks the way it does
- The durable differentiator: ChatGPT code interpreter does Quick-mode at 80% quality, but does not naturally produce a "here is the spec, here is why" pedagogy layer
- Templates + view-source ship together in the same CP — pedagogy is the spine, not a polish layer

### Privacy posture
- Data never leaves the browser
- **No analytics in v1** (PLAN.md Decision #28) — not even page-view counters
- No telemetry of uploaded files
- Self-hosted fonts, no Google Fonts CDN, no third-party JS
- Service worker so the tool keeps working offline after first load

## Audience

**Lead audience (v1):** **students learning data literacy.** Every feature, every copy decision, every UI choice serves a student first (PLAN.md Decision #29).

**Also works for:**

| Audience | Job-to-be-done |
|----------|----------------|
| **Student learning data literacy** *(LEAD)* | "Show me what good chart choices look like, let me try, and explain why" |
| Industry communicator | "Give me a polished visual I can drop into a deck or social post" |
| Researcher with a survey export | "Make this CSV legible without spending an hour in Excel" |
| Journalist with tabular numbers | "Quickly chart the numbers from this dataset" |

The "read others' data" pathway exists primarily as a learning step toward "publish data clearly." Lead audience drives v1 roadmap; secondary audiences benefit from the same surface but do not get features carved for them.

## Differentiator

The wedge is **pedagogy** — view-source mode. ChatGPT code interpreter already does Quick-mode at 80% quality conversationally; the durable answer is "here is the spec, here is why this chart was chosen, here is what changes if you swap the encoding." LLMs do not naturally produce that. Local-first and opinionated templates are supporting trust signals.

| Tool | What it does | What Glimpse does instead |
|------|--------------|---------------------------|
| ChatGPT / Claude code interpreter | Capable, opaque, sends your data to OpenAI/Anthropic | Local, transparent, **shows you the spec and explains the choice** |
| Tableau / Looker | Server-backed BI dashboards | Static, browser-only, no upload |
| Datawrapper | Server-side chart maker, free tier limits | Local, unlimited, no account |
| Excel + screenshot | Free, ubiquitous, ugly | Brand-styled, share-ready, view-source pedagogy |
| Flourish | Beautiful infographics, paid for advanced features | Beautiful templates, free, local, learnable |

The combination — *pedagogy as headline, local-first as trust signal, opinionated templates as floor* — does not exist in another tool today.

**Brand position:** Glimpse is the free, no-account on-ramp into the Opus Vita research suite. The footer carries "by the team behind Claritas and Arbiter." Earns research-product brand equity by serving the audience just upstream (students learning data literacy → researchers in training → researchers in practice).

## Success metrics (post-v1, CP-5)

Note: Decision #28 locks "no analytics in v1," so the metrics below are aspirational targets that inform internal QA and qualitative interviews — not server-side measurements. If a metric becomes load-bearing, revisit Decision #28 with explicit privacy-policy update.

| Metric | Target | Measured how |
|--------|--------|--------------|
| **Time-to-first-chart** for a new user | < 30s on a fresh visit | Manual user testing |
| **First-paint LCP** | < 1.5s on cable broadband | Lighthouse run, internal CI |
| **DuckDB-WASM warm at click time** | yes (idle prefetch worked) | Internal `console.timeStamp` markers in dev only |
| **Infographic export size** | <200KB SVG, <1MB PNG | Static QA against test corpus |
| **Lead-audience fit** (student users complete first chart) | qualitative interviews ≥ 5 | Direct outreach |
| **Wedge proof** (users discover and use view-source) | qualitative interviews ≥ 3 say "I didn't know I could see why" | Direct outreach |

## What this is not

- Not a server-side data tool (Tableau, Looker, Datawrapper)
- Not a data warehouse or BI platform
- Not a research-grade statistical package — no regression, no inference
- Not a custom infographic editor — templates only in v1
- **Not a PDF tool in v1** — that's Glimpse-PDF v1.1 (separate product, PLAN.md Decision #31)
- **Not an AI summary tool** — dropped v1 due to CORS + UX walls (PLAN.md Decision #21)
- Not Claritas (lit review) or Sententia (evidence search)
