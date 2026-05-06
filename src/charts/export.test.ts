import { describe, expect, it, vi, beforeEach } from 'vitest'
import { downloadJson, triggerDownload } from './export'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('downloadJson', () => {
  it('creates a Blob with application/json MIME and pretty-printed content', () => {
    const blobs: Blob[] = []

    const fakeUrl = 'blob:fake'
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const fakeAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(
      fakeAnchor as unknown as HTMLAnchorElement,
    )
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    const originalBlob = globalThis.Blob
    globalThis.Blob = class extends originalBlob {
      constructor(parts?: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts)
        blobs.push(this)
      }
    } as typeof Blob

    const spec = { $schema: 'test', mark: 'bar' }
    downloadJson(spec, 'test.json')

    expect(blobs.length).toBe(1)
    expect(blobs[0].type).toBe('application/json')
    expect(fakeAnchor.download).toBe('test.json')
    expect(fakeAnchor.click).toHaveBeenCalled()

    globalThis.Blob = originalBlob
  })
})

describe('triggerDownload', () => {
  it('creates an anchor, clicks it, and cleans up', () => {
    const fakeUrl = 'blob:fake-url'
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl)
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const fakeAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(
      fakeAnchor as unknown as HTMLAnchorElement,
    )
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    const blob = new Blob(['test'], { type: 'text/plain' })
    triggerDownload(blob, 'test.txt')

    expect(fakeAnchor.href).toBe(fakeUrl)
    expect(fakeAnchor.download).toBe('test.txt')
    expect(fakeAnchor.click).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalledWith(fakeUrl)
  })
})
