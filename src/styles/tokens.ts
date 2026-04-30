/**
 * Glimpse Design Tokens
 *
 * Mirrored from `opusvita-org/lib/design/tokens.js` to keep Glimpse inside
 * the Opus Vita / Arbiter family identity. See `docs/VISUAL-IDENTITY.md`.
 *
 * Variable-font family names ('… Variable') match the @fontsource-variable
 * packages imported in `src/main.tsx`. Static fallbacks resolve gracefully
 * before fonts hydrate.
 */

export const colors = {
  // Ink — primary text. Near-black with green undertone, not blue.
  ink: {
    950: '#0E1612',
    900: '#1A241E',
    800: '#273228',
    700: '#3A4940',
    600: '#586860',
    500: '#788780',
    400: '#9CAAA3',
    300: '#BFCBC5',
    200: '#DDE4DF',
    100: '#EBF0EC',
    50: '#F4F7F4',
  },

  // Sage — primary accent / brand. Eyebrows, CTAs, primary chart fill.
  sage: {
    950: '#1E2E26',
    900: '#25382E',
    800: '#2E4538',
    700: '#386857',
    600: '#4A7D6B',
    500: '#6A9484',
    400: '#8FAD9F',
    300: '#B6C9BD',
    200: '#D4E0D8',
    100: '#E7EEE9',
    50: '#F1F5F2',
  },

  // Stone — page background. One token.
  stone: {
    50: '#FAFAF7',
  },

  // Semantic
  success: '#1F6F4A',
  warning: '#B8741C',
  danger: '#9B2226',
} as const;

export const typography = {
  family: {
    serif:
      "'Source Serif 4 Variable', 'Source Serif 4', Georgia, 'Times New Roman', serif",
    sans:
      "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono:
      "'JetBrains Mono Variable', 'JetBrains Mono', 'Courier New', monospace",
  },
  size: {
    xs: '0.8125rem', //   13px — UI sm
    sm: '0.875rem', //    14px — UI
    base: '1.0625rem', // 17px — body (Arbiter default)
    lg: '1.3125rem', //   21px — body lg
    xl: '1.5rem', //      24px — h2
    '2xl': '1.75rem', //  28px — h3/feature title
    '3xl': '2rem', //     32px — h1 product
    '4xl': '3.25rem', //  52px — section title
    '5xl': '4.5rem', //   72px — display/hero
  },
} as const;

export const animation = {
  duration: {
    instant: '80ms',
    fast: '120ms',
    normal: '180ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.2, 0.8, 0.2, 1)', // Stripe standard
  },
} as const;

export const layout = {
  content: {
    maxWidth: '1180px',
  },
  reading: {
    maxWidth: '680px',
  },
  viz: {
    maxWidth: '1536px', // infographic canvas
  },
} as const;

export const radius = {
  none: '0',
  sm: '2px', //  marketing buttons — press-like
  md: '8px', //  product UI
  lg: '12px', // cards
} as const;

export const tokens = {
  colors,
  typography,
  animation,
  layout,
  radius,
} as const;

export type Tokens = typeof tokens;
