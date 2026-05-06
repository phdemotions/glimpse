import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Vercel sets VERCEL=1 during deploys; serve from root there. Everywhere else
// (GitHub Pages prod target per PLAN.md Decision #2, local dev/preview)
// keeps the /glimpse/ subpath. Override via GLIMPSE_BASE if needed.
const base = process.env.GLIMPSE_BASE ?? (process.env.VERCEL ? '/' : '/glimpse/')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
