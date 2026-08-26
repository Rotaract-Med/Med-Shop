import type { FeaturesBlock as FeaturesBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

const iconMap: Record<string, React.ReactNode> = {
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <rect x="1" y="3" width="15" height="13" />
      <path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
}

/* Tri-color icon background cycles through primary / secondary / accent */
const iconBg = [
  'oklch(38.2% 0.154 255deg / 0.12)',
  'oklch(51.5% 0.221 351deg / 0.12)',
  'oklch(78.8% 0.174 80deg / 0.2)',
]
const iconColor = [
  'oklch(38.2% 0.154 255deg)',
  'oklch(51.5% 0.221 351deg)',
  'oklch(65% 0.14 75deg)',
]

export const FeaturesBlock: React.FC<
  FeaturesBlockProps & { id?: DefaultDocumentIDType; className?: string }
> = ({ heading, subtitle, features }) => {
  if (!features?.length) return null

  return (
    <section className="container py-4">
      {/* Section header */}
      {(heading || subtitle) && (
        <div className="text-center mb-12">
          {heading && (
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{heading}</h2>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-base max-w-xl mx-auto">{subtitle}</p>
          )}
          {/* Tri-color accent bar */}
          <div className="flex justify-center gap-1.5 mt-5" aria-hidden="true">
            <span className="w-8 h-1 rounded-full" style={{ background: 'oklch(38.2% 0.154 255deg)' }} />
            <span className="w-8 h-1 rounded-full" style={{ background: 'oklch(51.5% 0.221 351deg)' }} />
            <span className="w-8 h-1 rounded-full" style={{ background: 'oklch(78.8% 0.174 80deg)' }} />
          </div>
        </div>
      )}

      {/* Feature cards grid */}
      <div
        className={`grid gap-6 ${
          features.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
            : features.length === 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {features.map((feature, i) => (
          <div
            key={feature.id ?? i}
            className="group flex flex-col gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            {/* Icon circle */}
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{
                background: iconBg[i % iconBg.length],
                color: iconColor[i % iconColor.length],
              }}
            >
              {iconMap[feature.icon ?? 'globe']}
            </div>

            <div>
              <h3 className="font-bold text-foreground text-base mb-1.5 group-hover:text-primary transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
