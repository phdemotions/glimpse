import type { ReactElement } from 'react'
import type { TemplateId } from '../templates/types'
import { colors } from '../styles/tokens'

const THUMBNAILS: Record<TemplateId, () => ReactElement> = {
  'big-number': () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <text
        x="40"
        y="35"
        textAnchor="middle"
        fontSize="24"
        fontWeight="600"
        fill={colors.ink[700]}
      >
        42
      </text>
    </svg>
  ),
  'top-n': () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      {[50, 42, 35, 28, 20].map((w, i) => (
        <rect
          key={i}
          x="10"
          y={5 + i * 11}
          width={w}
          height={8}
          rx="1"
          fill={i < 3 ? colors.sage[700] : colors.sage[300]}
        />
      ))}
    </svg>
  ),
  'before-after': () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="10" y="10" width="12" height="40" rx="1" fill={colors.sage[300]} />
      <rect x="24" y="20" width="12" height="30" rx="1" fill={colors.sage[700]} />
      <rect x="46" y="5" width="12" height="45" rx="1" fill={colors.sage[300]} />
      <rect x="60" y="15" width="12" height="35" rx="1" fill={colors.sage[700]} />
    </svg>
  ),
  'trend-story': () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <polyline
        points="8,45 20,30 35,35 50,15 65,25 75,20"
        fill="none"
        stroke={colors.sage[700]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="15" r="3" fill={colors.sage[700]} />
    </svg>
  ),
  distribution: () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      {[
        { x: 8, h: 12 },
        { x: 18, h: 22 },
        { x: 28, h: 38 },
        { x: 38, h: 44 },
        { x: 48, h: 32 },
        { x: 58, h: 18 },
        { x: 68, h: 8 },
      ].map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={55 - bar.h}
          width={8}
          height={bar.h}
          rx="1"
          fill={colors.sage[500]}
        />
      ))}
    </svg>
  ),
  'part-to-whole': () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="5" y="22" width="30" height="16" rx="1" fill={colors.sage[700]} />
      <rect x="35" y="22" width="20" height="16" rx="1" fill={colors.sage[500]} />
      <rect x="55" y="22" width="12" height="16" rx="1" fill={colors.sage[300]} />
      <rect x="67" y="22" width="8" height="16" rx="1" fill={colors.ink[200]} />
    </svg>
  ),
  geographic: () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      {[50, 42, 35, 28, 20].map((w, i) => (
        <rect
          key={i}
          x="10"
          y={5 + i * 11}
          width={w}
          height={8}
          rx="1"
          fill={i < 3 ? colors.sage[700] : colors.sage[300]}
        />
      ))}
    </svg>
  ),
  'survey-likert': () => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      {[
        { left: 18, right: 22 },
        { left: 25, right: 15 },
        { left: 10, right: 30 },
        { left: 20, right: 20 },
      ].map((bar, i) => (
        <g key={i}>
          <rect
            x={40 - bar.left}
            y={8 + i * 13}
            width={bar.left}
            height={9}
            rx="1"
            fill={colors.sage[700]}
          />
          <rect
            x="40"
            y={8 + i * 13}
            width={bar.right}
            height={9}
            rx="1"
            fill={colors.sage[300]}
          />
        </g>
      ))}
    </svg>
  ),
}

type Props = { templateId: TemplateId }

export function TemplateThumbnail({ templateId }: Props) {
  const Thumb = THUMBNAILS[templateId]
  return (
    <div className="w-20 h-[60px]">
      <Thumb />
    </div>
  )
}
