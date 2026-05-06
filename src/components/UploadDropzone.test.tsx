import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { UploadDropzone, type UploadError } from './UploadDropzone'

function dataTransfer(files: File[]): DataTransfer {
  // jsdom DataTransfer is incomplete; build the minimum surface used by the
  // dropzone's onDrop handler.
  return { files: files as unknown as FileList } as DataTransfer
}

function csvFile(name = 'a.csv', size = 8): File {
  return new File([new Uint8Array(size)], name, { type: 'text/csv' })
}

describe('UploadDropzone', () => {
  it('exposes accept=".csv,.json,.xlsx" on the file input', () => {
    const { container } = render(<UploadDropzone />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.accept).toBe('.csv,.json,.xlsx')
  })

  it('renders the three-format primary line + sage subline', () => {
    const { getByText } = render(<UploadDropzone />)
    expect(getByText('Drop a CSV, Excel, or JSON file')).toBeInTheDocument()
    expect(getByText('or click to choose')).toBeInTheDocument()
  })

  it('exposes a three-format aria-label on the dropzone button', () => {
    const { getByRole } = render(<UploadDropzone />)
    expect(getByRole('button')).toHaveAttribute(
      'aria-label',
      'Upload a CSV, Excel, or JSON file',
    )
  })

  it('fires onFileSelected when a .xlsx file is dropped', () => {
    const onFileSelected = vi.fn()
    const onError = vi.fn()
    const { getByRole } = render(
      <UploadDropzone onFileSelected={onFileSelected} onError={onError} />,
    )
    const file = new File([new Uint8Array(16)], 'workbook.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    fireEvent.drop(getByRole('button'), {
      dataTransfer: dataTransfer([file]),
    })

    expect(onFileSelected).toHaveBeenCalledTimes(1)
    expect(onFileSelected.mock.calls[0][0].name).toBe('workbook.xlsx')
    expect(onError).not.toHaveBeenCalled()
  })

  it('fires onError with unsupported-type for a .xls (legacy) file', () => {
    const onFileSelected = vi.fn()
    const onError = vi.fn()
    const { getByRole } = render(
      <UploadDropzone onFileSelected={onFileSelected} onError={onError} />,
    )
    const file = new File([new Uint8Array(8)], 'legacy.xls')

    fireEvent.drop(getByRole('button'), {
      dataTransfer: dataTransfer([file]),
    })

    expect(onError).toHaveBeenCalledTimes(1)
    const err: UploadError = onError.mock.calls[0][0]
    expect(err.kind).toBe('unsupported-type')
    expect(onFileSelected).not.toHaveBeenCalled()
  })

  it('fires onError with too-large for a .xlsx over the 50MB ceiling', () => {
    const onFileSelected = vi.fn()
    const onError = vi.fn()
    const { getByRole } = render(
      <UploadDropzone onFileSelected={onFileSelected} onError={onError} />,
    )
    const oversized = new File([new Uint8Array(51 * 1024 * 1024)], 'big.xlsx')

    fireEvent.drop(getByRole('button'), {
      dataTransfer: dataTransfer([oversized]),
    })

    expect(onError).toHaveBeenCalledTimes(1)
    const err: UploadError = onError.mock.calls[0][0]
    expect(err.kind).toBe('too-large')
    expect(onFileSelected).not.toHaveBeenCalled()
  })

  it('still accepts CSV (regression check)', () => {
    const onFileSelected = vi.fn()
    const { getByRole } = render(<UploadDropzone onFileSelected={onFileSelected} />)

    fireEvent.drop(getByRole('button'), {
      dataTransfer: dataTransfer([csvFile()]),
    })

    expect(onFileSelected).toHaveBeenCalledTimes(1)
  })
})
