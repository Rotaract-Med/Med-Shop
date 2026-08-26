import { ProductCardSkeleton } from '@/components/shop/ProductCardSkeleton'
import React from 'react'

export default function Loading() {
  return (
    <div>
      {/* Category rail */}
      <div className="flex gap-2.5 overflow-hidden pt-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-slate-100" key={index} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-11 w-full animate-pulse rounded-full bg-slate-100 sm:w-64" />
          <div className="h-11 w-full animate-pulse rounded-full bg-slate-100 sm:w-52" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
