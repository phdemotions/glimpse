# Glimpse Technical Architecture

> Stack, data flow, and the reasoning behind each choice.

## Constraints (locked)

- **Static deploy** — GitHub Pages, no server, no edge functions
- **Offline-first** — works fully after first visit
- **Data sovereignty** — no upload of user content to any server, ever
- **Privacy-preserving** — no analytics that capture file content, no third-party CDNs that phone home
- **Fast cold start** — first paint <1.5s, time-to-first-chart <30s

These constraints rule out: Next.js API routes, Vercel functions, server-side PDF parsers, cloud DBs, OAuth, Google Fonts CDN, content analytics.

## Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Vite + React 19 + TypeScript** | SPA shape, ~50KB shell, native GitHub Pages SPA fit (vs ~250KB Next.js static-export overhead for a tool that has no marketing pages). Plays cleanly with Tailwind + design tokens |
| Styling | **Tailwind CSS 3** | Match family stack. Defer v4 migration until family migrates |
| Data engine | **DuckDB-WASM** | 10–100× faster than Arquero or SQLite-WASM. Mature 2024+. Reads CSV/Excel/JSON natively (Parquet support deferred to post-v1). Standard 2026 in-browser analytics |
| Charts (Quick + Infographic) | **Vega-Lite** (single renderer) | Declarative JSON spec, brand defaults via Vega config, SVG output. Quick mode = opinionated default specs auto-chosen from data shape; Infographic mode = parametrized template specs. View-source pedagogy stays consistent across modes. Replaces the Mosaic + Observable Plot pairing per 2026-04-30 doc-review |
| Hand-drawn aesthetic (opt) | **Rough.js** | Sketchy SVG filter. Stale-but-stable upstream — isolate behind a renderer interface so it can be swapped |
| Storage | **Dexie.js** (IndexedDB wrapper) | Saved sessions, cached parsed data; raw IDB API too hostile |
| Offline | **vite-plugin-pwa** (Workbox) | Standard 2026 service-worker tooling, zero-config in production builds |

**Removed from v1 (PLAN.md decisions #21, #31):**
- ~~Mosaic + Observable Plot~~ — collapsed into Vega-Lite to avoid three viz layers for ~5 chart types
- ~~PDF.js + custom clusterer~~ — moved to Glimpse-PDF v1.1 (separate product); custom row/col clusterer was unfalsifiable scope risk
- ~~Inline-number regex extraction~~ — lives with Glimpse-PDF

## Data flow

```
┌─────────────────────────────────────────────────────────────┐
│  User                                                       │
│  ├─ drops CSV/Excel/JSON                                    │
│  └─ pastes CSV text                                         │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Ingest                                                     │
│  └─ Tabular → DuckDB-WASM `read_csv_auto()` / `read_xlsx()` │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Analyze                                                    │
│  ├─ Schema inference (types, cardinality, null counts)      │
│  ├─ Type-detection helpers (date, categorical, ordinal,     │
│  │   numeric, geographic)                                   │
│  └─ Query layer — arbitrary SELECT for chart data           │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Render — Vega-Lite (single renderer)                       │
│  ├─ Quick mode → opinionated default spec → vega-embed → SVG│
│  ├─ Infographic mode → parametrized template spec → SVG     │
│  └─ Optional Rough.js post-filter on SVG                    │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Export                                                     │
│  ├─ SVG download                                            │
│  ├─ PNG (canvas raster of the SVG)                          │
│  ├─ Spec JSON (for view-source / sharing)                   │
│  └─ Optional Dexie save → resume later                      │
└─────────────────────────────────────────────────────────────┘
```

PDF input is **not** part of v1's data flow. Glimpse-PDF v1.1 will reuse the Analyze + Render + Export stages and add a PDF.js + clusterer + extraction-review stage upstream of Ingest.

## Lazy loading strategy

The cold-start budget is tight. Defer heavy WASM until needed.

| Asset | When loaded | Size |
|-------|-------------|------|
| Vite + React shell + Tailwind CSS | Initial paint | ~50KB |
| Self-hosted fonts (Source Serif 4, Inter, JetBrains Mono) | Initial paint | ~120KB |
| **DuckDB-WASM** | **`requestIdleCallback` after landing paint** (NOT on click) | ~3–5MB |
| Vega-Lite + Vega runtime + vega-embed | First chart render | ~700KB |
| Rough.js | First "sketchy" toggle | ~9KB |

Initial paint budget: <250KB. DuckDB-WASM prefetches in idle so the user's first click finds it warm — mitigates the "5MB on dorm wifi blocks first chart" risk surfaced in 2026-04-30 doc-review. Vega-Lite loads on first chart render (still on demand because the landing surface itself does not render charts).

## State management

CP-1: `useState` and a small `<DataContext>` are enough. Add **Zustand** in CP-2 only if the state graph grows past a handful of related fields. Avoid Redux. Avoid context-stacking.

## Routing

CP-1 ships single-page. CP-3 introduces route-level segmentation:

| Route | Surface |
|-------|---------|
| `/` | Landing — upload, sample picker |
| `/data` | Schema view + quick mode |
| `/infographic` | Template picker + infographic editor |
| `/source` | View-source — Vega-Lite spec JSON + plain-English why for the active chart |

PDF route deferred with Glimpse-PDF v1.1. GitHub Pages SPA routing requires a `404.html` redirect trick — document and verify in CP-5.

## Service worker (CP-4)

`vite-plugin-pwa` configured with:

- **Strategy:** `injectManifest` for full control
- **Caching:** app shell (HTML/JS/CSS/fonts) precached on install; WASM modules cached on first use; user data lives in IndexedDB, never touched by the SW
- **Update policy:** prompt user on new version available, do not auto-skip-waiting

Service worker is **disabled in dev** to avoid cache staleness during iteration.

## Storage model (Dexie, CP-4)

```ts
// Pseudo-schema
db.version(1).stores({
  sessions: '++id, createdAt, lastOpenedAt, name',
  datasets: '++id, sessionId, sourceType, mimeType, size, parsedAt',
  charts: '++id, sessionId, mode, specJson, createdAt',
  pdfExtractions: '++id, sessionId, fileName, pageCount, tablesExtracted'
});
```

User opts in to "save this session" — not implicit. Default behavior is ephemeral (closing the tab clears state).

## Privacy details

| Vector | Handling |
|--------|----------|
| Analytics | **None in v1** — locked by PLAN.md Decision #28. Even page-view counters can leak referrer + UA fingerprints. Revisit only with explicit decision row + privacy-policy update |
| Error reporting | Sentry-like tools send file content via stack traces — **do not enable**. Accept slower bug-fix cycle as a cost of the privacy stance |
| Fonts | Self-hosted, never CDN-loaded |
| External assets | None loaded at runtime — Vite bundles everything |
| LLM calls | **Dropped from v1** per PLAN.md Decision #21 (CORS + UX walls). Revisit only with proxy architecture decision |
| Service worker scope | Limited to app shell; never caches user file content |

## Accessibility

- Keyboard-first navigation throughout
- Focus rings always visible (sage-500, 2px)
- Charts include text-table fallback below the SVG (CP-5)
- Color is never the sole encoding — patterns/labels reinforce
- All charts pass WCAG AA contrast on default fills

## Build + deploy

```bash
pnpm build         # produces ./dist with hashed assets
# GitHub Pages deploy via gh-pages branch or Pages → main /docs
```

Vite base path configured for the GitHub Pages subpath (`/glimpse/` until/unless a custom domain is set up).
