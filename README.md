# Glimpse

> Make data speak. Locally.

A static, offline-first browser tool that turns raw data files and academic article PDFs into clear, shareable infographics. Hosted on GitHub Pages. Nothing the user uploads ever leaves their browser.

## What it does

- **Quick mode** — drop a CSV, see opinionated default charts (bar, line, scatter, distribution, pie)
- **Infographic mode** — generate shareable, social-ready visuals from 8 hand-crafted templates
- **View-source** — see the Vega-Lite spec for any chart, plus a plain-English explanation of why this chart shape

PDF parsing is moved to **Glimpse-PDF**, a separate v1.1 product.

## Privacy

Data never leaves your browser. There is no server. No analytics. All processing happens locally via WebAssembly.

## Stack

- Vite + React + TypeScript + Tailwind 3
- DuckDB-WASM (data engine)
- Vega-Lite (single chart renderer for both modes)
- Dexie.js (saved sessions)
- vite-plugin-pwa (offline-first)

## Run locally

```bash
pnpm install
pnpm dev
```

## Status

Pre-CP-1. See [STATUS.md](STATUS.md) and [docs/plans/PLAN.md](docs/plans/PLAN.md).

## Part of [Opus Vita](https://opusvita.org)

> "We build tools that make researchers extraordinary."
