import { Button } from './ui/Button'
import { Eyebrow } from './ui/Eyebrow'
import { Wordmark } from './ui/Wordmark'
import { UploadDropzone } from './UploadDropzone'
import { MobileSoftBlock } from './MobileSoftBlock'

const SAMPLES = [
  { id: 'survey', label: 'Survey responses' },
  { id: 'revenue', label: 'Monthly revenue' },
  { id: 'rankings', label: 'Country rankings' },
] as const

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-10 lg:px-16 py-5">
        <div className="max-w-content mx-auto flex items-center justify-between">
          <Wordmark />
          <a
            href="#about"
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

          {/* Upload affordance — desktop only */}
          <div className="mt-16 hidden md:block">
            <UploadDropzone />
          </div>

          {/* Sample picker — desktop only */}
          <div className="mt-12 hidden md:block">
            <Eyebrow>or try a sample</Eyebrow>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {SAMPLES.map((s) => (
                <Button key={s.id}>{s.label}</Button>
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
