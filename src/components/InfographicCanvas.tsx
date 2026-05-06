import type { ReactNode } from 'react'

type InfographicCanvasProps = {
  children: ReactNode
}

export function InfographicCanvas({ children }: InfographicCanvasProps) {
  return (
    <div
      className="w-full mx-auto bg-white border border-ink-200 rounded-md overflow-hidden"
      style={{
        maxWidth: '1200px',
        aspectRatio: '1200 / 675',
      }}
      data-testid="infographic-canvas"
    >
      {children}
    </div>
  )
}
