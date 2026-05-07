import type { VegaSpec } from './vega'
import { VEGA_CONFIG } from './vega'
import { colors, typography } from '../styles/tokens'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

/**
 * Canvas dimensions every Infographic export ships at. Matches social-share
 * aspect (16:9) and the size baked into ExportPanel's PNG rasterizer. Single
 * source of truth — templates and ExportPanel both import from here so the
 * "1200×675 hardcoded in 8 places" pattern doesn't return.
 */
export const INFOGRAPHIC_CANVAS = { width: 1200, height: 675 } as const

const HEADER_HEIGHT = 200
const FOOTER_HEIGHT = 65
const SPACING = 5

/**
 * The region a template's chart spec occupies inside the wrapped frame.
 * Templates emit their `specBuilder` output sized to these dimensions and
 * stay agnostic of the surrounding shell. Width is the full canvas width;
 * left/right padding lives in `padding.left` / `padding.right` on the chart
 * spec itself when the template needs it.
 */
export const CHART_REGION = {
  width: INFOGRAPHIC_CANVAS.width,
  height: INFOGRAPHIC_CANVAS.height - HEADER_HEIGHT - FOOTER_HEIGHT - 2 * SPACING,
} as const

/**
 * Plain-data view of an Infographic's surrounding chrome. Replaces the
 * narrower `Caption` type for templates so eyebrow/headline/takeaway/source
 * all live in one place — same data renders into the spec (text marks
 * shipped in PNG/SVG export) and the DOM (above-the-chart caption strip).
 */
export type Frame = {
  /** Italic sage 13pt — chart-type or category label */
  eyebrow: string
  /** Source Serif 36pt semibold — single-line scoreboard headline */
  headline: string
  /** Source Serif 22pt regular — narrative takeaway, may wrap to 2-3 lines */
  takeaway: string
  /** Inter 11pt ink-500 — file or dataset name; visible in export only */
  source: string
}

export type VegaSpecWithFrame = VegaSpec & {
  vconcat?: VegaSpec[]
}

const HEADER_PADDING_X = 40
const HEADER_EYEBROW_Y = 38
const HEADER_HEADLINE_Y = 80
const HEADER_TAKEAWAY_Y = 130
const FOOTER_TEXT_Y = 30
const TAKEAWAY_CHAR_LIMIT = 720

function eyebrowLayer(text: string): VegaSpec {
  return {
    mark: {
      type: 'text',
      font: typography.family.serif,
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.sage[700],
      align: 'left',
      baseline: 'top',
    },
    encoding: {
      text: { value: text },
      x: { value: HEADER_PADDING_X },
      y: { value: HEADER_EYEBROW_Y },
    },
  }
}

function headlineLayer(text: string): VegaSpec {
  return {
    mark: {
      type: 'text',
      font: typography.family.serif,
      fontSize: 36,
      fontWeight: 600,
      color: colors.ink[900],
      align: 'left',
      baseline: 'top',
    },
    encoding: {
      text: { value: text },
      x: { value: HEADER_PADDING_X },
      y: { value: HEADER_HEADLINE_Y },
    },
  }
}

function takeawayLayer(text: string): VegaSpec {
  return {
    mark: {
      type: 'text',
      font: typography.family.serif,
      fontSize: 20,
      fontWeight: 400,
      color: colors.ink[700],
      align: 'left',
      baseline: 'top',
      lineHeight: 26,
      limit: TAKEAWAY_CHAR_LIMIT,
    },
    encoding: {
      text: { value: text },
      x: { value: HEADER_PADDING_X },
      y: { value: HEADER_TAKEAWAY_Y },
    },
  }
}

function sourceLayer(text: string): VegaSpec {
  return {
    mark: {
      type: 'text',
      font: typography.family.sans,
      fontSize: 11,
      color: colors.ink[500],
      align: 'left',
      baseline: 'top',
    },
    encoding: {
      text: { value: text },
      x: { value: HEADER_PADDING_X },
      y: { value: FOOTER_TEXT_Y },
    },
  }
}

function wordmarkLayer(width: number): VegaSpec {
  return {
    mark: {
      type: 'text',
      font: typography.family.sans,
      fontSize: 11,
      fontWeight: 600,
      color: colors.sage[700],
      align: 'right',
      baseline: 'top',
    },
    encoding: {
      text: { value: 'Glimpse.' },
      x: { value: width - HEADER_PADDING_X },
      y: { value: FOOTER_TEXT_Y },
    },
  }
}

function buildHeaderSubSpec(frame: Frame, width: number): VegaSpec {
  return {
    width,
    height: HEADER_HEIGHT,
    data: { values: [{}] },
    mark: undefined,
    layer: [
      eyebrowLayer(frame.eyebrow),
      headlineLayer(frame.headline),
      takeawayLayer(frame.takeaway),
    ],
  }
}

function buildFooterSubSpec(frame: Frame, width: number): VegaSpec {
  return {
    width,
    height: FOOTER_HEIGHT,
    data: { values: [{}] },
    mark: undefined,
    layer: [sourceLayer(frame.source), wordmarkLayer(width)],
  }
}

function ensureChartDimensions(
  chartSpec: VegaSpec,
  width: number,
  height: number,
): VegaSpec {
  return { ...chartSpec, width, height }
}

/**
 * Compose a full Infographic spec from a template's chart spec + a Frame.
 * Wraps the chart in a vconcat with header (eyebrow + headline + takeaway)
 * above and footer (source + Glimpse wordmark) below — all rendered as
 * Vega-Lite text marks so they ship in SVG and PNG export through the
 * existing renderer (no html2canvas, no DOM-region capture).
 *
 * Templates emit chart specs sized to `CHART_REGION`; this helper enforces
 * those dimensions even if a template forgets, so every infographic stays
 * 1200×675 regardless of the chart's natural aspect.
 */
export function wrapWithFrame(
  chartSpec: VegaSpec,
  frame: Frame,
  dims: { width: number; height: number } = INFOGRAPHIC_CANVAS,
): VegaSpec {
  const chartHeight = dims.height - HEADER_HEIGHT - FOOTER_HEIGHT - 2 * SPACING

  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    background: 'white',
    spacing: SPACING,
    padding: 0,
    vconcat: [
      buildHeaderSubSpec(frame, dims.width),
      ensureChartDimensions(chartSpec, dims.width, chartHeight),
      buildFooterSubSpec(frame, dims.width),
    ],
  }
}
