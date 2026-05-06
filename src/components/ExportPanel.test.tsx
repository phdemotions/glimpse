import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { ExportPanel } from './ExportPanel'

const spec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  mark: 'bar',
}

describe('ExportPanel', () => {
  it('renders three buttons: SVG, PNG, JSON', () => {
    const ref = createRef<SVGSVGElement>()
    const { getByRole } = render(
      <ExportPanel svgRef={ref} spec={spec} filename="test" />,
    )
    expect(getByRole('button', { name: 'SVG' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'PNG' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'JSON' })).toBeInTheDocument()
  })

  it('disables SVG and PNG when svgRef.current is null', () => {
    const ref = createRef<SVGSVGElement>()
    const { getByRole } = render(
      <ExportPanel svgRef={ref} spec={spec} filename="test" />,
    )
    expect(getByRole('button', { name: 'SVG' })).toBeDisabled()
    expect(getByRole('button', { name: 'PNG' })).toBeDisabled()
  })

  it('disables all buttons when spec is null', () => {
    const ref = createRef<SVGSVGElement>()
    const { getByRole } = render(
      <ExportPanel svgRef={ref} spec={null} filename="test" />,
    )
    expect(getByRole('button', { name: 'SVG' })).toBeDisabled()
    expect(getByRole('button', { name: 'PNG' })).toBeDisabled()
    expect(getByRole('button', { name: 'JSON' })).toBeDisabled()
  })

  it('enables JSON when spec exists even without SVG element', () => {
    const ref = createRef<SVGSVGElement>()
    const { getByRole } = render(
      <ExportPanel svgRef={ref} spec={spec} filename="test" />,
    )
    expect(getByRole('button', { name: 'JSON' })).not.toBeDisabled()
  })

  it('has data-testid for integration targeting', () => {
    const ref = createRef<SVGSVGElement>()
    const { getByTestId } = render(
      <ExportPanel svgRef={ref} spec={spec} filename="test" />,
    )
    expect(getByTestId('export-panel')).toBeInTheDocument()
  })
})
