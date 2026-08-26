import type { ShopSetting } from '@/payload-types'

import { ShopIcon } from '@/components/icons/ShopIcon'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

type Props = {
  emptyState?: NonNullable<ShopSetting['emptyState']> | null
  hasActiveFilters: boolean
  searchValue?: string
}

export const ShopEmptyState: React.FC<Props> = ({
  emptyState,
  hasActiveFilters,
  searchValue,
}) => {
  const heading = emptyState?.heading || 'Nothing here — yet'
  const body =
    emptyState?.body ||
    'We could not find products matching those filters. Try a different category or clear your search.'

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
        <ShopIcon className="h-9 w-9 text-primary" name={emptyState?.icon} />
      </div>

      <h2 className="text-xl font-bold text-foreground">{heading}</h2>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {searchValue ? (
          <>
            No products match <span className="font-semibold text-foreground">“{searchValue}”</span>
            . {body}
          </>
        ) : (
          body
        )}
      </p>

      {hasActiveFilters ? (
        <Button asChild className="mt-7 h-11 rounded-full px-6">
          <Link href="/">Clear all filters</Link>
        </Button>
      ) : null}
    </div>
  )
}
