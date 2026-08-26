import React from 'react'

/**
 * Mirrors the real card's box model so the grid does not shift when data
 * arrives (CLS). The previous skeleton rendered zero-height divs, which showed
 * nothing at all during loading.
 */
export const ProductCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-white">
    <div className="aspect-[4/5] w-full animate-pulse bg-slate-100" />
    <div className="flex flex-col gap-2.5 px-4 py-4">
      <div className="h-2.5 w-16 animate-pulse rounded-full bg-slate-100" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
      <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="mt-3 h-5 w-20 animate-pulse rounded-full bg-slate-200" />
    </div>
  </div>
)
