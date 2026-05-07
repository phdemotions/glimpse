import { describe, expect, it } from 'vitest'
import {
  CHART_REGION,
  INFOGRAPHIC_CANVAS,
  wrapWithFrame,
  type Frame,
  type VegaSpecWithFrame,
} from './infographic-frame'

const SAMPLE_FRAME: Frame = {
  eyebrow: 'big number',
  headline: '727K',
  takeaway: 'Total revenue across 12 months — January through December.',
  source: 'monthly-revenue.csv',
}

const STUB_CHART_SPEC = {
  data: { values: [{ x: 1, y: 2 }] },
  mark: 'bar',
  encoding: {
    x: { field: 'x', type: 'quantitative' },
    y: { field: 'y', type: 'quantitative' },
  },
  width: CHART_REGION.width,
  height: CHART_REGION.height,
}

describe('INFOGRAPHIC_CANVAS', () => {
  it('exposes the export-target dimensions used by every template', () => {
    expect(INFOGRAPHIC_CANVAS).toEqual({ width: 1200, height: 675 })
  })
})

describe('CHART_REGION', () => {
  it('reserves vertical space for header and footer', () => {
    expect(CHART_REGION.width).toBe(INFOGRAPHIC_CANVAS.width)
    expect(CHART_REGION.height).toBeLessThan(INFOGRAPHIC_CANVAS.height)
    expect(CHART_REGION.height).toBeGreaterThan(300)
  })
})

describe('wrapWithFrame', () => {
  it('returns a vconcat spec with three sub-specs (header, chart, footer)', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    expect(out.vconcat).toBeDefined()
    expect(out.vconcat).toHaveLength(3)
  })

  it('preserves the original chart spec verbatim as the middle sub-spec', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    expect(out.vconcat![1]).toMatchObject({
      mark: 'bar',
      encoding: STUB_CHART_SPEC.encoding,
    })
  })

  it('renders eyebrow, headline, and takeaway text marks in the header sub-spec', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    const headerLayers = (out.vconcat![0] as { layer: unknown[] }).layer
    expect(headerLayers).toBeDefined()
    expect(headerLayers.length).toBeGreaterThanOrEqual(3)

    const headerJson = JSON.stringify(headerLayers)
    expect(headerJson).toContain('big number')
    expect(headerJson).toContain('727K')
    expect(headerJson).toContain('Total revenue across 12 months')
  })

  it('renders the source line and Glimpse wordmark in the footer sub-spec', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    const footerLayers = (out.vconcat![2] as { layer: unknown[] }).layer
    expect(footerLayers).toBeDefined()
    expect(footerLayers.length).toBeGreaterThanOrEqual(2)

    const footerJson = JSON.stringify(footerLayers)
    expect(footerJson).toContain('monthly-revenue.csv')
    expect(footerJson).toContain('Glimpse')
  })

  it('sets a $schema and a brand config at the top level', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    expect(out.$schema).toMatch(/vega-lite/i)
    expect(out.config).toBeDefined()
  })

  it('sub-specs all use the canvas width so they align cleanly', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    const widths = out.vconcat!.map((s) => (s as { width?: number }).width)
    expect(widths.every((w) => w === INFOGRAPHIC_CANVAS.width)).toBe(true)
  })

  it('header + chart + footer heights sum to roughly the canvas height', () => {
    const out = wrapWithFrame(STUB_CHART_SPEC, SAMPLE_FRAME) as VegaSpecWithFrame
    const heights = out.vconcat!.map((s) => (s as { height?: number }).height ?? 0)
    const total = heights.reduce((a, b) => a + b, 0)
    expect(total).toBeGreaterThanOrEqual(INFOGRAPHIC_CANVAS.height - 30)
    expect(total).toBeLessThanOrEqual(INFOGRAPHIC_CANVAS.height + 30)
  })

  it('handles an empty eyebrow string without crashing', () => {
    const frame = { ...SAMPLE_FRAME, eyebrow: '' }
    const out = wrapWithFrame(STUB_CHART_SPEC, frame) as VegaSpecWithFrame
    expect(out.vconcat).toHaveLength(3)
  })

  it('handles a long takeaway by enabling word-wrap (text mark with limit/lineBreak)', () => {
    const longTakeaway =
      'Revenue grew steadily from January through November, with a peak in November at $82K and a brief dip in April that recovered the following month.'
    const frame = { ...SAMPLE_FRAME, takeaway: longTakeaway }
    const out = wrapWithFrame(STUB_CHART_SPEC, frame) as VegaSpecWithFrame
    const headerJson = JSON.stringify(out.vconcat![0])
    // The full takeaway text is preserved (we don't truncate at the spec layer).
    expect(headerJson).toContain('Revenue grew steadily')
  })

  it('uses the override dimensions when explicit dims are passed', () => {
    const customDims = { width: 800, height: 450 }
    const customChartRegion = { width: 800, height: 250 }
    const customChartSpec = { ...STUB_CHART_SPEC, ...customChartRegion }
    const out = wrapWithFrame(customChartSpec, SAMPLE_FRAME, customDims) as VegaSpecWithFrame
    const widths = out.vconcat!.map((s) => (s as { width?: number }).width)
    expect(widths.every((w) => w === customDims.width)).toBe(true)
  })
})
