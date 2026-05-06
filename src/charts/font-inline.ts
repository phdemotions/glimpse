import sourceSerifUrl from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2?url'
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'

let cachedFontCss: string | null = null

async function loadFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function getFontCss(): Promise<string> {
  if (cachedFontCss) return cachedFontCss

  const [serifDataUrl, interDataUrl] = await Promise.all([
    loadFontAsBase64(sourceSerifUrl),
    loadFontAsBase64(interUrl),
  ])

  cachedFontCss = [
    '@font-face {',
    "  font-family: 'Source Serif 4 Variable';",
    `  src: url(${serifDataUrl}) format('woff2');`,
    '  font-weight: 200 900;',
    '  font-display: swap;',
    '}',
    '@font-face {',
    "  font-family: 'Inter Variable';",
    `  src: url(${interDataUrl}) format('woff2');`,
    '  font-weight: 100 900;',
    '  font-display: swap;',
    '}',
  ].join('\n')

  return cachedFontCss
}

export async function inlineFonts(svgString: string): Promise<string> {
  const fontCss = await getFontCss()
  const defsContent = `<defs><style>${fontCss}</style></defs>`
  return svgString.replace(/(<svg[^>]*>)/, `$1${defsContent}`)
}

export function _resetCache(): void {
  cachedFontCss = null
}
