'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText, tagline }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <div className="relative overflow-hidden min-h-[88vh] flex items-center" data-theme="dark">
      {/* CMS-uploaded background image */}
      {media && typeof media === 'object' && (
        <div className="absolute inset-0">
          <Media
            fill
            imgClassName="h-full w-full object-cover object-center"
            priority
            resource={media}
          />
        </div>
      )}

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 65% 50%, oklch(38.2% 0.154 255deg / 0.6) 0%, oklch(22.8% 0.126 265deg / 0.95) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Decorative gold circle */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'oklch(78.8% 0.174 80deg)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="container relative z-10 py-24 md:py-32">
        <div className="max-w-2xl">
          {/* Tagline eyebrow */}
          {tagline && (
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-5 text-white/60">
              {tagline}
            </p>
          )}

          {/* Main heading */}
          {richText && (
            <div
              className="text-white
                [&_h1]:text-5xl [&_h1]:md:text-6xl [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:mb-4
                [&_h2]:text-4xl [&_h2]:font-bold [&_h2]:mb-4
                [&_p]:text-white/75 [&_p]:text-lg [&_p]:leading-relaxed [&_p]:mt-4"
            >
              <RichText data={richText} enableGutter={false} />
            </div>
          )}

          {/* CTA links */}
          {Array.isArray(links) && links.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-10">
              {links.map(({ link }, i) =>
                i === 0 ? (
                  <span
                    key={i}
                    className="inline-flex rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    style={{
                      background:
                        'linear-gradient(135deg, oklch(51.5% 0.221 351deg) 0%, oklch(38.2% 0.154 255deg) 100%)',
                    }}
                  >
                    <CMSLink
                      {...link}
                      appearance="inline"
                      className="inline-flex items-center justify-center h-12 px-8 font-semibold text-sm tracking-wide text-white"
                    />
                  </span>
                ) : (
                  <CMSLink
                    key={i}
                    {...link}
                    appearance="inline"
                    className="inline-flex items-center justify-center h-12 px-8 rounded-xl font-semibold text-sm tracking-wide border-2 border-white/40 text-white hover:bg-white/10 transition-all duration-200"
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 z-10" aria-hidden="true">
        <svg
          viewBox="0 0 1440 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
          style={{ height: '3.5rem' }}
        >
          <path
            d="M0 56L60 46.7C120 37.3 240 18.7 360 14C480 9.3 600 18.7 720 23.3C840 28 960 28 1080 25.7C1200 23.3 1320 18.7 1380 16.3L1440 14V56H1380C1320 56 1200 56 1080 56C960 56 840 56 720 56C600 56 480 56 360 56C240 56 120 56 60 56H0Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  )
}
