import type { ShopSetting } from '@/payload-types'

import { ShopIcon } from '@/components/icons/ShopIcon'
import { Media } from '@/components/Media'
import React from 'react'

type Hero = NonNullable<ShopSetting['hero']>

type Props = {
  hero?: Hero | null
}

/**
 * Gradient grounds per colourway. Values reference the brand tokens declared in
 * `globals.css` so a palette change flows through without touching components.
 */
const colorways: Record<string, string> = {
  azure:
    'radial-gradient(ellipse at 75% 15%, color-mix(in oklab, var(--brand-sky) 55%, transparent) 0%, transparent 55%), linear-gradient(155deg, var(--primary) 0%, var(--brand-deep) 100%)',
  cranberry:
    'radial-gradient(ellipse at 75% 15%, color-mix(in oklab, var(--secondary) 60%, transparent) 0%, transparent 55%), linear-gradient(155deg, var(--secondary) 0%, var(--brand-deep) 100%)',
  midnight:
    'radial-gradient(ellipse at 75% 15%, color-mix(in oklab, var(--primary) 65%, transparent) 0%, transparent 60%), linear-gradient(155deg, var(--brand-deep) 0%, oklch(15% 0.08 265deg) 100%)',
}

/**
 * Mirrors the `defaultValue`s in the Shop Settings global. A global that has
 * never been saved comes back empty, so without these the shop would render a
 * headless banner until someone opens the admin panel.
 */
const fallbacks = {
  badges: [
    { icon: 'ship', label: 'Mediterranean shipping' },
    { icon: 'badgeCheck', label: 'Authentic merchandise' },
    { icon: 'handshake', label: 'Community impact' },
  ],
  eyebrow: 'Rotaract Méditerranéen — Official Store',
  headline: 'Our',
  headlineAccent: 'Collection',
  intro:
    'Wear your values. Every purchase supports Rotaractor communities across the Mediterranean.',
}

export const ShopHero: React.FC<Props> = ({ hero }) => {
  if (hero?.enabled === false) return null

  const { backgroundImage, colorway, stats } = hero ?? {}

  const eyebrow = hero?.eyebrow ?? fallbacks.eyebrow
  const headline = hero?.headline ?? fallbacks.headline
  const headlineAccent = hero?.headlineAccent ?? fallbacks.headlineAccent
  const intro = hero?.intro ?? fallbacks.intro
  const badges = hero?.badges?.length ? hero.badges : fallbacks.badges

  const hasHeading = Boolean(headline || headlineAccent)
  const backgroundResource = typeof backgroundImage === 'object' ? backgroundImage : undefined

  return (
    <section className="relative isolate overflow-hidden text-white">
      {/* Colour ground */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30"
        style={{ background: colorways[colorway ?? 'azure'] ?? colorways.azure }}
      />

      {/* Editor-supplied artwork, dialled back so type stays legible */}
      {backgroundResource ? (
        <div aria-hidden="true" className="absolute inset-0 -z-20 opacity-[0.14]">
          <Media
            className="h-full w-full"
            fill
            imgClassName="h-full w-full object-cover"
            priority
            resource={backgroundResource}
          />
        </div>
      ) : null}

      {/* Soft brand orbs for depth */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-accent/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-24 right-56 -z-10 hidden h-56 w-56 rounded-full bg-secondary/25 blur-3xl lg:block"
      />

      <div className="container relative py-16 md:py-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white/65">
                {eyebrow}
              </p>
            ) : null}

            {hasHeading ? (
              <h1 className="text-[2.75rem] font-extrabold leading-[1.05] tracking-tight md:text-6xl">
                {headline ? <span>{headline} </span> : null}
                {headlineAccent ? (
                  <span className="relative inline-block text-accent">
                    {headlineAccent}
                    {/* Hand-drawn swash under the accent word */}
                    <svg
                      aria-hidden="true"
                      className="absolute -bottom-2 left-0 w-full"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 200 12"
                    >
                      <path
                        d="M2 8.5C40 3.5 78 2.5 118 4.5C142 5.7 172 8 198 5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                  </span>
                ) : null}
              </h1>
            ) : null}

            {intro ? (
              <p className="mt-7 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
                {intro}
              </p>
            ) : null}

            {badges?.length ? (
              <ul className="mt-9 flex flex-wrap gap-2.5">
                {badges.map((badge, i) => (
                  <li
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-sm"
                    key={i}
                  >
                    <ShopIcon className="h-4 w-4 text-accent" name={badge.icon} />
                    {badge.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {stats?.length ? (
            <dl className="hidden shrink-0 gap-4 lg:flex">
              {stats.map((stat, i) => (
                <div
                  className="min-w-[7.5rem] rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm"
                  key={stat.id ?? i}
                  /* Slight vertical offset per card — deliberate asymmetry */
                  style={{ transform: `translateY(${i % 2 === 0 ? '0' : '-0.75rem'})` }}
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-3xl font-extrabold leading-none text-accent">
                      {stat.value}
                    </span>
                    <span className="mt-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-white/60">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      {/* Layered wave — the back wave peeks through for depth */}
      <div aria-hidden="true" className="relative -mb-px">
        <svg
          className="block h-10 w-full md:h-14"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 1440 56"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 40L80 33.6C160 27.2 320 14.4 480 12.8C640 11.2 800 20.8 960 25.6C1120 30.4 1280 30.4 1360 30.4L1440 30.4V56H0V40Z"
            fill="currentColor"
            className="text-white/15"
          />
          <path
            d="M0 56L60 46.7C120 37.3 240 18.7 360 14C480 9.3 600 18.7 720 23.3C840 28 960 28 1080 25.7C1200 23.3 1320 18.7 1380 16.3L1440 14V56H0Z"
            fill="currentColor"
            className="text-background"
          />
        </svg>
      </div>
    </section>
  )
}
