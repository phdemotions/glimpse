import { Button } from './ui/Button'
import { Eyebrow } from './ui/Eyebrow'
import { Wordmark } from './ui/Wordmark'
import { UploadDropzone, type UploadError } from './UploadDropzone'
import { MobileSoftBlock } from './MobileSoftBlock'

const SAMPLES = [
  { id: 'survey-responses', label: 'Survey responses' },
  { id: 'monthly-revenue', label: 'Monthly revenue' },
  { id: 'country-rankings', label: 'Country rankings' },
] as const

export type SampleId = (typeof SAMPLES)[number]['id']

type LandingProps = {
  loading?: boolean
  error?: string | null
  onFileSelected: (file: File) => void
  onSampleSelected: (id: SampleId) => void
  onUploadValidationError?: (err: UploadError) => void
}

export function Landing({
  loading = false,
  error = null,
  onFileSelected,
  onSampleSelected,
  onUploadValidationError,
}: LandingProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-10 lg:px-16 py-5">
        <div className="max-w-content mx-auto flex items-center justify-between">
          <Wordmark />
          <a
            href="https://github.com/phdemotions/glimpse"
            className="hidden sm:inline-block font-sans text-sm text-ink-700 hover:text-sage-700 transition-colors duration-fast"
          >
            about
          </a>
        </div>
      </header>
      <hr />

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-content mx-auto px-6 md:px-10 lg:px-16 pt-16 md:pt-32 pb-24">
          {/* Hero */}
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight text-ink-900">
              Show, don&rsquo;t tell.
            </h1>
            <p className="mt-6 font-serif text-lg md:text-xl text-ink-700">
              Drop a spreadsheet or paste a paper. Get a chart worth sharing.
            </p>
          </div>

          {/* Upload affordance / states — desktop only */}
          <div className="mt-16 hidden md:block">
            {error ? (
              <ErrorPanel message={error} />
            ) : loading ? (
              <LoadingPanel />
            ) : (
              <UploadDropzone
                onFileSelected={onFileSelected}
                onError={onUploadValidationError}
              />
            )}
          </div>

          {/* Sample picker — desktop only */}
          <div className="mt-12 hidden md:block">
            <Eyebrow>or try a sample</Eyebrow>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {SAMPLES.map((s) => (
                <Button
                  key={s.id}
                  onClick={() => onSampleSelected(s.id)}
                  disabled={loading}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile soft-block — replaces upload on <768px */}
          <div className="mt-16 md:hidden">
            <MobileSoftBlock />
          </div>

          {/* Privacy line — visible on every viewport */}
          <p className="mt-16 max-w-xl mx-auto text-center font-sans text-sm text-ink-500">
            Your data never leaves your browser. Everything happens on your
            machine, processed by WebAssembly. No uploads.
          </p>
        </div>
      </main>

      {/* Footer */}
      <hr />
      <footer className="px-6 md:px-10 lg:px-16 py-10">
        <div className="max-w-content mx-auto flex flex-col items-center gap-3 text-center">
          <Eyebrow>an opus vita tool</Eyebrow>
          <p className="font-sans text-xs text-ink-500">
            by the team behind{' '}
            <a
              href="https://claritas-one.vercel.app"
              className="hover:text-sage-700 transition-colors duration-fast"
            >
              Claritas
            </a>{' '}
            and{' '}
            <a
              href="https://arbiter.ac"
              className="hover:text-sage-700 transition-colors duration-fast"
            >
              Arbiter
            </a>
            <span className="mx-2 text-ink-300">·</span>
            <a
              href="https://opusvita.org"
              className="hover:text-sage-700 transition-colors duration-fast"
            >
              opusvita.org
            </a>
            <span className="mx-2 text-ink-300">·</span>
            <a
              href="https://github.com/phdemotions/glimpse"
              className="hover:text-sage-700 transition-colors duration-fast"
            >
              github
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function LoadingPanel() {
  return (
    <div className="rounded-md border border-dashed border-ink-200 bg-stone-50 px-6 py-16 text-center">
      <p className="font-serif text-lg text-ink-800">Reading your file…</p>
      <p className="mt-2 font-sans text-sm text-sage-700">
        Loading data engine if needed
      </p>
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-ink-200 bg-white px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-serif text-lg text-ink-800">
          That didn&rsquo;t work
        </p>
        <p className="font-sans text-sm text-ink-600 max-w-md">{message}</p>
        <p className="mt-2 font-sans text-sm text-sage-700">
          Drop another file or pick a sample to try again.
        </p>
      </div>
    </div>
  )
}
