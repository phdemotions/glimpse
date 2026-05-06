import { describe, expect, it, vi, beforeEach } from 'vitest'
import { inlineFonts, getFontCss, _resetCache } from './font-inline'

vi.mock(
  '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2?url',
  () => ({ default: '/fonts/source-serif.woff2' }),
)
vi.mock(
  '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url',
  () => ({ default: '/fonts/inter.woff2' }),
)

function fakeBlob(text: string): Blob {
  return new Blob([text], { type: 'font/woff2' })
}

beforeEach(() => {
  _resetCache()
  vi.restoreAllMocks()
})

describe('getFontCss', () => {
  it('returns a string containing @font-face rules for both families', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(fakeBlob('fake-font-data')),
    })
    vi.stubGlobal('fetch', mockFetch)

    const css = await getFontCss()

    expect(css).toContain("font-family: 'Source Serif 4 Variable'")
    expect(css).toContain("font-family: 'Inter Variable'")
    expect(css).toContain('@font-face')
    expect(css).toContain("format('woff2')")
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('caches the result on subsequent calls', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(fakeBlob('fake-font-data')),
    })
    vi.stubGlobal('fetch', mockFetch)

    const first = await getFontCss()
    const second = await getFontCss()

    expect(first).toBe(second)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

describe('inlineFonts', () => {
  it('inserts <defs><style>@font-face after opening <svg> tag', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(fakeBlob('fake-font-data')),
    })
    vi.stubGlobal('fetch', mockFetch)

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect/></svg>'
    const result = await inlineFonts(svg)

    expect(result).toMatch(/^<svg[^>]*><defs><style>/)
    expect(result).toContain('@font-face')
    expect(result).toContain('<rect/></svg>')
  })

  it('preserves existing svg attributes', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(fakeBlob('fake-font-data')),
    })
    vi.stubGlobal('fetch', mockFetch)

    const svg = '<svg viewBox="0 0 100 50" class="test"><text>hi</text></svg>'
    const result = await inlineFonts(svg)

    expect(result).toContain('viewBox="0 0 100 50"')
    expect(result).toContain('class="test"')
    expect(result).toContain('<text>hi</text>')
  })
})
