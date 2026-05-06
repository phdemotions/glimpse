import { inlineFonts } from './font-inline'

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadSvg(
  svgEl: SVGSVGElement,
  filename: string,
): Promise<void> {
  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgEl)
  svgString = await inlineFonts(svgString)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  triggerDownload(blob, filename)
}

export async function downloadPng(
  svgEl: SVGSVGElement,
  dimensions: { width: number; height: number },
  filename: string,
): Promise<void> {
  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgEl)
  svgString = await inlineFonts(svgString)

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width * pixelRatio
  canvas.height = dimensions.height * pixelRatio
  const ctx = canvas.getContext('2d')!
  ctx.scale(pixelRatio, pixelRatio)

  const img = new Image()
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            triggerDownload(blob, filename)
            resolve()
          } else {
            reject(new Error('Canvas toBlob failed'))
          }
        },
        'image/png',
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG image load failed'))
    }
    img.src = url
  })
}

export function downloadJson(
  spec: Record<string, unknown>,
  filename: string,
): void {
  const json = JSON.stringify(spec, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  triggerDownload(blob, filename)
}
