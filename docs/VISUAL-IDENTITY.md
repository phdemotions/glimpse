# Glimpse Visual Identity

> Glimpse shares the Opus Vita / Arbiter family identity. Same palette, typography, and aesthetic principles as Claritas, Arbiter, and opusvita-org.

## Principles

1. **Restraint over decoration.** Typography carries the design.
2. **Whitespace is a feature**, not empty space waiting to be filled.
3. **Hairlines, not shadows.** 1px ink-200 rules instead of card borders or drop shadows.
4. **Calm before clever.** No animations that draw attention to themselves.
5. **iA Writer feel** — a tool that respects the user's focus.

## Typography

| Use | Family | Weight | Notes |
|-----|--------|--------|-------|
| Page titles, infographic headlines | **Source Serif 4** | 600 | The character actor |
| Body prose | Source Serif 4 | 400 | Line-height 1.6–1.65 |
| UI chrome — nav, buttons, labels | **Inter** | 500–600 | All sentence case, no uppercase tracked caps |
| Eyebrows | Source Serif 4 | 400 *italic* | sage-700, lowercase |
| Numeric accents in charts | **JetBrains Mono** | 400 | Rare, only when precision matters |

Self-host all three families in `public/fonts/`. Never load from a CDN.

### Font delivery (locked: @fontsource-variable, self-hosted via npm)

Variable fonts ship via `@fontsource-variable` npm packages — bundled into `dist/` at build time. Equivalent to manual `public/fonts/` self-hosting on every privacy axis (no CDN, no phone-home, no Google Fonts) and removes the need to download and version-control WOFF2 files manually.

| Family | Package | Family name (CSS) | License | Source |
|--------|---------|-------------------|---------|--------|
| **Source Serif 4** | `@fontsource-variable/source-serif-4` (+ `/italic`) | `'Source Serif 4 Variable'` | **SIL OFL 1.1** | [github.com/adobe-fonts/source-serif](https://github.com/adobe-fonts/source-serif) |
| **Inter** | `@fontsource-variable/inter` | `'Inter Variable'` | **SIL OFL 1.1** | [github.com/rsms/inter](https://github.com/rsms/inter) |
| **JetBrains Mono** | `@fontsource-variable/jetbrains-mono` | `'JetBrains Mono Variable'` | **Apache 2.0** | [github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) |

**Format:** WOFF2 variable. One file covers the full weight range.

**Imports** live in `src/main.tsx` ahead of `globals.css`:
```ts
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/source-serif-4/italic.css'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
```

**License compliance:** each `@fontsource-variable` package ships its `LICENSE` file inside `node_modules/@fontsource-variable/<family>/`. Vite bundles the WOFF2 files into the production build; the LICENSE files live alongside in source. No additional copy step needed.

**`font-display: swap`** is set by `@fontsource` defaults so first paint is never blocked on font load. Sage eyebrow italic styling falls back gracefully to system serif italic until Source Serif loads.

## Palette

### Brand
| Token | Hex | Use |
|-------|-----|-----|
| `ink` | `#1A241E` | Primary text |
| `sage` | `#386857` | Brand accent — eyebrows, CTAs, primary chart fill |
| `stone` | `#FAFAF7` | Page background |

### Ramps
Build full 50→950 ramps for ink, sage, stone using HSL interpolation. Tokens live in `src/styles/tokens.ts`.

### Semantic
| Token | Hex | Use |
|-------|-----|-----|
| `success` | `#22C55E` | Success state, positive deltas |
| `warning` | `#EAB308` | Caution, mixed evidence |
| `danger` | `#EF4444` | Error, destructive action |

### Chart palette (sequence)
| Slot | Hex | Use |
|------|-----|-----|
| 1 | `#386857` (sage) | Primary brand |
| 2 | `#1A241E` (ink) | Secondary |
| 3 | `#A88B6A` | Earth/warm contrast |
| 4 | `#5B6B7A` | Cool neutral |
| 5 | `#C97A5C` | Accent warm |

Sequential and diverging ramps generated from these anchors at runtime.

## Layout

| Token | Value | Use |
|-------|-------|-----|
| `content-max` | 72rem (1152px) | Default content column |
| `reading-max` | 42rem (672px) | Long-form prose |
| `viz-max` | 96rem (1536px) | Infographic canvas |

## Components

### Buttons
- **Primary** — sage bg, stone text, 6px radius, no shadow
- **Secondary** — 1px ink-200 border, ink text, transparent bg
- **Ghost** — no border, sage text, hover sage-50 bg
- Marketing buttons get a 2px radius for a press-like feel

### Inputs
- 1px ink-200 border, 12px × 16px padding
- Focus — sage-500 border, no glow

### Cards
- No shadows
- 1px ink-200 border or background shift to stone-100
- 8px radius max
- 24px padding minimum

### Eyebrows
- Source Serif 4, italic, lowercase, sage-700
- Letter-spacing 0
- Used to label sections and identify the product family

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `duration.instant` | 60ms | Hover state changes |
| `duration.fast` | 180ms | Tooltips, focus rings |
| `duration.normal` | 300ms | Drawer open, modal enter |
| `duration.slow` | 500ms | Major surface transitions (rare) |
| `easing.default` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Stripe easing |

Keyframes for `fade-in` and `fade-in-up` per opusvita-org's tokens. No bounce, no overshoot.

## Anti-patterns

Never:

- Drop shadows
- Pill buttons (`rounded-full`)
- Gradient text or gradient buttons
- Centered text blocks for body content
- Heavy borders (>1px)
- Uppercase tracked smallcaps
- Confetti, particles, decorative motion
- Dashboard metric grids (rectangles full of vanity numbers)
- Purple gradients (LinkedIn-AI aesthetic)

If a screen feels like a generic SaaS dashboard, it is wrong.

## Chart styling defaults

| Element | Style |
|---------|-------|
| Title | Source Serif 4, 18px, ink-900 |
| Axis labels | Inter, 12px, ink-600 |
| Tick numbers | JetBrains Mono, 11px, ink-500 |
| Grid lines | 1px ink-100 |
| Bar fill | sage-600 |
| Line stroke | sage-700, 2px |
| Plot background | transparent (let stone-50 show through) |

Brand-styled defaults for Plot live in `src/charts/plot.ts`. Vega-Lite specs reference the same tokens via Vega config.

## Reference siblings

- `~/developer/opusvita-org/lib/design/tokens.js` — canonical design tokens
- `~/developer/opusvita-org/CLAUDE.md` — family identity definition
- `~/developer/claritas/CLAUDE.md` — full visual system in production
- `~/developer/sententia/CLAUDE.md` — sister product visual identity
