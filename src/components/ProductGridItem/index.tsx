import type { Product } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { ShoppingBag } from 'lucide-react'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, priceInUSD, title } = product

  let price = priceInUSD

  const variants = product.variants?.docs
  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      price = variant.priceInUSD
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link className="group block" href={`/products/${product.slug}`}>
      {/* Card */}
      <div className="rounded-2xl overflow-hidden bg-white border border-border shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 ease-out">
        {/* Image container */}
        <div className="relative overflow-hidden bg-slate-50 aspect-square">
          {image ? (
            <Media
              className="absolute inset-0 h-full w-full"
              imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              resource={image}
              fill
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <ShoppingBag className="w-14 h-14 text-muted-foreground/20" />
            </div>
          )}

          {/* Subtle blue tint on hover */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Price badge — slides up on hover on mobile, always visible on hover */}
          <div className="absolute top-3 right-3">
            {typeof price === 'number' && (
              <span className="bg-white/90 backdrop-blur-sm text-primary font-bold text-xs px-3 py-1.5 rounded-full shadow-md border border-border">
                <Price amount={price} />
              </span>
            )}
          </div>

          {/* "Shop Now" pill — rises on hover */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-5 py-2 rounded-full shadow-lg tracking-wide">
              Shop Now
            </span>
          </div>
        </div>

        {/* Info row */}
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-border/60">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate leading-snug text-sm flex-1 min-w-0">
            {title}
          </h3>

          {/* Accent dot — Mediterranean gold */}
          <span
            aria-hidden="true"
            className="shrink-0 w-2 h-2 rounded-full bg-accent opacity-80"
          />
        </div>
      </div>
    </Link>
  )
}
