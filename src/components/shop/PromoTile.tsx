import type { ShopSetting } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/cn'
import { ArrowRight } from 'lucide-react'
import React from 'react'

type Promo = NonNullable<ShopSetting['promo']>

type Props = {
  promo: Promo
}

const colorways: Record<string, string> = {
  azure: 'linear-gradient(145deg, var(--primary) 0%, var(--brand-deep) 100%)',
  cranberry: 'linear-gradient(145deg, var(--secondary) 0%, oklch(35% 0.16 351deg) 100%)',
  gold: 'linear-gradient(145deg, var(--accent) 0%, oklch(62% 0.15 62deg) 100%)',
}

const textTone: Record<string, string> = {
  azure: 'text-white',
  cranberry: 'text-white',
  gold: 'text-accent-foreground',
}

/**
 * Editorial break inside the product grid. Editors control its slot, width,
 * colour and destination from Shop Settings.
 */
export const PromoTile: React.FC<Props> = ({ promo }) => {
  const { colorway, description, eyebrow, image, link, span, title } = promo
  const tone = colorway ?? 'cranberry'
  const imageResource = typeof image === 'object' ? image : undefined

  if (!title && !description) return null

  return (
    <div
      className={cn(
        'group relative isolate flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-2xl p-6',
        textTone[tone] ?? textTone.cranberry,
        span === '2' && 'sm:col-span-2',
      )}
      style={{ background: colorways[tone] ?? colorways.cranberry }}
    >
      {imageResource ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-25 mix-blend-luminosity">
          <Media
            className="h-full w-full"
            fill
            imgClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            resource={imageResource}
            size="(max-width: 640px) 100vw, 33vw"
          />
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
      />

      {eyebrow ? (
        <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] opacity-75">
          {eyebrow}
        </p>
      ) : null}

      {title ? (
        <h3 className="text-2xl font-extrabold leading-tight tracking-tight">{title}</h3>
      ) : null}

      {description ? (
        <p className="mt-2 max-w-xs text-sm leading-relaxed opacity-85">{description}</p>
      ) : null}

      {link?.label ? (
        <CMSLink
          {...link}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </CMSLink>
      ) : null}
    </div>
  )
}
