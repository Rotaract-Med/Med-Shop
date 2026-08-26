import type { Category, Media as MediaType, Product, Variant } from '@/payload-types'

import { ShopIcon } from '@/components/icons/ShopIcon'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { QuickAddButton } from '@/components/shop/QuickAddButton'
import { cn } from '@/utilities/cn'
import { ArrowRight, ImageOff } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export type CardStyle = 'bordered' | 'editorial' | 'elevated'

type Props = {
  cardStyle?: CardStyle
  enableQuickAdd?: boolean
  /** Eager-load the first row so the LCP image is not lazy. */
  priority?: boolean
  product: Partial<Product>
  showStockHints?: boolean
}

const badgeTones: Record<string, string> = {
  azure: 'bg-primary text-primary-foreground',
  cranberry: 'bg-secondary text-secondary-foreground',
  gold: 'bg-accent text-accent-foreground',
  ink: 'bg-foreground text-background',
}

const cardShells: Record<CardStyle, string> = {
  bordered:
    'rounded-2xl border-2 border-border bg-white transition-colors duration-300 group-hover:border-primary',
  editorial: 'rounded-2xl bg-transparent',
  elevated:
    'rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl',
}

/** Resolves the display price, preferring the cheapest variant when they exist. */
function resolvePrice(product: Partial<Product>): { from: boolean; value: null | number } {
  const variants = product.variants?.docs?.filter(
    (variant): variant is Variant => typeof variant === 'object' && variant !== null,
  )

  if (variants?.length) {
    const prices = variants
      .map((variant) => variant.priceInUSD)
      .filter((price): price is number => typeof price === 'number')

    if (prices.length) return { from: prices.length > 1, value: Math.min(...prices) }
  }

  return { from: false, value: typeof product.priceInUSD === 'number' ? product.priceInUSD : null }
}

/** Total sellable units across the product or its variants. */
function resolveStock(product: Partial<Product>): null | number {
  if (product.enableVariants) {
    const variants = product.variants?.docs?.filter(
      (variant): variant is Variant => typeof variant === 'object' && variant !== null,
    )

    if (!variants?.length) return null
    return variants.reduce((total, variant) => total + (variant.inventory ?? 0), 0)
  }

  return typeof product.inventory === 'number' ? product.inventory : null
}

export const ProductCard: React.FC<Props> = ({
  cardStyle = 'elevated',
  enableQuickAdd = true,
  priority = false,
  product,
  showStockHints = true,
}) => {
  const { featured, merchandising, slug, title } = product

  const images =
    product.gallery
      ?.map((item) => item.image)
      .filter((image): image is MediaType => typeof image === 'object' && image !== null) ?? []

  const [primaryImage, secondaryImage] = images

  const category = product.categories?.find(
    (item): item is Category => typeof item === 'object' && item !== null,
  )

  const { from, value: price } = resolvePrice(product)
  const stock = resolveStock(product)
  const isSoldOut = stock !== null && stock <= 0
  const isLowStock = stock !== null && stock > 0 && stock <= 5

  const badgeLabel = merchandising?.badge?.label
  const highlights = merchandising?.highlights ?? []

  // Variants need a choice, so those cards route to the detail page instead.
  const canQuickAdd =
    enableQuickAdd && !product.enableVariants && !isSoldOut && product.id !== undefined

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col',
        featured && 'sm:col-span-2',
      )}
    >
      <div className={cn('flex h-full flex-col overflow-hidden', cardShells[cardStyle])}>
        {/* ── Image ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100',
            cardStyle === 'editorial' && 'rounded-2xl',
            featured ? 'aspect-[16/10]' : 'aspect-[4/5]',
          )}
        >
          {primaryImage ? (
            <>
              <Media
                className="absolute inset-0 h-full w-full"
                fill
                imgClassName={cn(
                  'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105',
                  secondaryImage && 'group-hover:opacity-0 group-hover:duration-300',
                )}
                priority={priority}
                resource={primaryImage}
                size={featured ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'}
              />

              {/* Second gallery shot fades in behind the first on hover */}
              {secondaryImage ? (
                <Media
                  className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  fill
                  imgClassName="h-full w-full object-cover"
                  resource={secondaryImage}
                  size={
                    featured ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'
                  }
                />
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
              <ImageOff aria-hidden="true" className="h-10 w-10" strokeWidth={1.25} />
              <span className="text-xs font-medium">No image yet</span>
            </div>
          )}

          {/* Badges */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-col items-start gap-1.5">
              {badgeLabel ? (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider shadow-sm',
                    badgeTones[merchandising?.badge?.tone ?? 'azure'] ?? badgeTones.azure,
                  )}
                >
                  {badgeLabel}
                </span>
              ) : null}
              {featured ? (
                <span className="rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm">
                  Featured
                </span>
              ) : null}
            </div>

            {showStockHints && (isSoldOut || isLowStock) ? (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm',
                  isSoldOut ? 'bg-foreground/80 text-background' : 'bg-white/90 text-secondary',
                )}
              >
                {isSoldOut ? 'Sold out' : `${stock} left`}
              </span>
            ) : null}
          </div>

          {/* Quick add — always reachable on touch, revealed on hover for pointers */}
          {canQuickAdd ? (
            <div className="absolute bottom-3 right-3 z-10 opacity-100 transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
              <QuickAddButton
                productID={product.id!}
                productTitle={title ?? 'This product'}
              />
            </div>
          ) : null}
        </div>

        {/* ── Info ──────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex flex-1 flex-col gap-1.5',
            cardStyle === 'editorial' ? 'px-1 pt-4' : 'px-4 py-4',
          )}
        >
          {category ? (
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {category.title}
            </span>
          ) : null}

          <h3 className="text-base font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
            {/* Stretched link: keeps the whole card clickable without nesting
                the quick-add button inside an anchor. */}
            <Link
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              href={`/products/${slug}`}
            >
              {title}
            </Link>
          </h3>

          {merchandising?.shortDescription ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {merchandising.shortDescription}
            </p>
          ) : null}

          {featured && highlights.length ? (
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {highlights.map((highlight, i) => (
                <li
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  key={highlight.id ?? i}
                >
                  <ShopIcon className="h-3.5 w-3.5 text-primary" name={highlight.icon} />
                  {highlight.label}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            {typeof price === 'number' ? (
              <p className="flex items-baseline gap-1">
                {from ? (
                  <span className="text-xs font-medium text-muted-foreground">from</span>
                ) : null}
                <Price
                  amount={price}
                  as="span"
                  className="text-lg font-bold tracking-tight text-foreground"
                />
              </p>
            ) : (
              <span className="text-sm text-muted-foreground">Price on request</span>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Focus ring for keyboard users — the stretched link has no box of its
          own, and `focus-visible` keeps the ring off mouse clicks. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 ring-2 ring-primary transition-opacity group-has-[a:focus-visible]:opacity-100"
      />
    </article>
  )
}
