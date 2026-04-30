import type { Config } from 'tailwindcss'
import { colors, typography, animation, layout, radius } from './src/styles/tokens'

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: colors.ink,
        sage: colors.sage,
        stone: colors.stone,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
      },

      fontFamily: {
        serif: typography.family.serif.split(', '),
        sans: typography.family.sans.split(', '),
        mono: typography.family.mono.split(', '),
      },

      fontSize: {
        xs: [typography.size.xs, { lineHeight: '1.4' }],
        sm: [typography.size.sm, { lineHeight: '1.4' }],
        base: [typography.size.base, { lineHeight: '1.6' }],
        lg: [typography.size.lg, { lineHeight: '1.65' }],
        xl: [typography.size.xl, { lineHeight: '1.35' }],
        '2xl': [typography.size['2xl'], { lineHeight: '1.2' }],
        '3xl': [typography.size['3xl'], { lineHeight: '1.25' }],
        '4xl': [typography.size['4xl'], { lineHeight: '1.1' }],
        '5xl': [typography.size['5xl'], { lineHeight: '1.05' }],
      },

      maxWidth: {
        content: layout.content.maxWidth,
        reading: layout.reading.maxWidth,
        viz: layout.viz.maxWidth,
      },

      transitionDuration: {
        instant: animation.duration.instant,
        fast: animation.duration.fast,
        normal: animation.duration.normal,
        slow: animation.duration.slow,
      },

      transitionTimingFunction: {
        DEFAULT: animation.easing.default,
      },

      borderRadius: radius,

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config
