import { useRef, useState } from 'react'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
// Excel deferred to CP-2 per the CP-1 risk note — DuckDB-WASM Excel scanner
// requires extension loading and adds bundle weight not justified for v1 scope.
const ACCEPTED_EXTENSIONS = ['csv', 'json'] as const

export type UploadError =
  | { kind: 'too-large'; file: File }
  | { kind: 'unsupported-type'; file: File }

type UploadDropzoneProps = {
  /** Called when a valid file is selected (drop or click). Ingest wiring lands in task 7. */
  onFileSelected?: (file: File) => void
  /** Called when validation rejects a file (too large, unsupported type). */
  onError?: (error: UploadError) => void
  className?: string
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase()
}

function validate(file: File): UploadError | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { kind: 'too-large', file }
  }
  const ext = getExtension(file.name)
  if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return { kind: 'unsupported-type', file }
  }
  return null
}

/**
 * Upload affordance with drag-and-drop, click-to-pick, accept rules, and 50MB
 * size guard (PLAN.md CP-1 plan, tasks 6 + 11). Validation surfaces via the
 * `onError` callback; valid files surface via `onFileSelected`. The actual
 * ingest pipeline (file → DuckDB-WASM table) lands in task 7.
 */
export function UploadDropzone({
  onFileSelected,
  onError,
  className = '',
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const error = validate(file)
    if (error) {
      onError?.(error)
      return
    }
    onFileSelected?.(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a CSV or JSON file"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setIsDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={[
        'group cursor-pointer rounded-md border border-dashed transition-colors duration-fast',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 focus-visible:ring-sage-500',
        isDragOver
          ? 'border-sage-500 bg-sage-50/60'
          : 'border-ink-200 bg-stone-50 hover:bg-sage-50/40 hover:border-ink-300',
        className,
      ].join(' ')}
    >
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <svg
          className="h-7 w-7 text-ink-400 group-hover:text-sage-700 transition-colors duration-fast"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
          />
        </svg>
        <p className="font-serif text-lg text-ink-800">
          Drop a CSV or JSON
        </p>
        <p className="font-sans text-sm text-sage-700">or click to choose</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".csv,.json"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
