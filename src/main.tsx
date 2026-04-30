import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Self-hosted variable fonts via @fontsource (bundled into dist, no CDN).
// Family stack: Source Serif 4 (display + body), Inter (UI), JetBrains Mono (numerics).
// `opsz` builds carry both weight + optical-size axes for serif + sans display quality.
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import '@fontsource-variable/inter/opsz.css'
import '@fontsource-variable/inter/opsz-italic.css'
import '@fontsource-variable/jetbrains-mono/wght.css'

import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
