import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'
import { RichText } from '@/components/RichText'
import { CMSLink } from '@/components/Link'

export const CallToActionBlock: React.FC<
  CTABlockProps & {
    id?: string | number
    className?: string
  }
> = ({ links, richText }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl mx-4 md:mx-8">
      {/* Cranberry → azure gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, oklch(51.5% 0.221 351deg) 0%, oklch(44% 0.19 330deg) 40%, oklch(38.2% 0.154 255deg) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Decorative circles */}
      <div
        className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: 'oklch(78.8% 0.174 80deg)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-20 blur-xl pointer-events-none"
        style={{ background: 'white' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 container py-14 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        {/* Text */}
        <div className="max-w-xl">
          {richText && (
            <div
              className="text-white [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-extrabold [&_h1]:mb-3 [&_h1]:leading-tight
                         [&_h2]:text-3xl [&_h2]:md:text-4xl [&_h2]:font-extrabold [&_h2]:mb-3 [&_h2]:leading-tight
                         [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-3
                         [&_p]:text-white/80 [&_p]:text-base [&_p]:leading-relaxed [&_p]:mt-2"
            >
              <RichText className="mb-0" data={richText} enableGutter={false} />
            </div>
          )}
        </div>

        {/* CTA buttons */}
        {(links || []).length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {(links || []).map(({ link }, i) => (
              <CMSLink
                key={i}
                size="lg"
                {...link}
                className={
                  i === 0
                    ? 'inline-flex items-center justify-center h-12 px-8 rounded-xl font-semibold text-sm tracking-wide bg-white text-foreground hover:bg-white/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200'
                    : 'inline-flex items-center justify-center h-12 px-8 rounded-xl font-semibold text-sm tracking-wide border-2 border-white/40 text-white hover:bg-white/10 transition-all duration-200'
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
