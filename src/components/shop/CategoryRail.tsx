'use client'

import { ShopIcon } from '@/components/icons/ShopIcon'
import { cn } from '@/utilities/cn'
import { Check } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo, useTransition } from 'react'

export type RailCategory = {
  count?: number
  icon?: null | string
  id: number | string
  title: string
}

type Props = {
  categories: RailCategory[]
  showCounts?: boolean
  totalCount?: number
}

/**
 * Horizontally scrollable, multi-select category filter.
 *
 * Replaces the old vertical sidebar list: it keeps the grid full-width, works
 * with one thumb on mobile, and every pill clears the 44px touch target.
 * Selection lives in `?category=1,2` so filtered views stay linkable.
 */
export const CategoryRail: React.FC<Props> = ({ categories, showCounts = true, totalCount }) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeIds = useMemo(() => {
    const raw = searchParams.get('category')
    if (!raw) return []
    return raw.split(',').filter(Boolean)
  }, [searchParams])

  const buildHref = useCallback(
    (nextIds: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (nextIds.length) {
        params.set('category', nextIds.join(','))
      } else {
        params.delete('category')
      }

      const query = params.toString()
      return query ? `${pathname}?${query}` : pathname
    },
    [pathname, searchParams],
  )

  const toggle = useCallback(
    (id: string) => {
      const nextIds = activeIds.includes(id)
        ? activeIds.filter((activeId) => activeId !== id)
        : [...activeIds, id]

      startTransition(() => {
        router.push(buildHref(nextIds), { scroll: false })
      })
    },
    [activeIds, buildHref, router],
  )

  if (!categories.length) return null

  const pillBase =
    'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

  return (
    <nav aria-label="Filter products by category" className={cn(isPending && 'opacity-70')}>
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <li>
          <button
            aria-pressed={activeIds.length === 0}
            className={cn(
              pillBase,
              activeIds.length === 0
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5',
            )}
            onClick={() => startTransition(() => router.push(buildHref([]), { scroll: false }))}
            type="button"
          >
            All products
            {showCounts && typeof totalCount === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums',
                  activeIds.length === 0 ? 'bg-white/20' : 'bg-muted text-muted-foreground',
                )}
              >
                {totalCount}
              </span>
            ) : null}
          </button>
        </li>

        {categories.map((category) => {
          const id = String(category.id)
          const isActive = activeIds.includes(id)

          return (
            <li key={id}>
              <button
                aria-pressed={isActive}
                className={cn(
                  pillBase,
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5',
                )}
                onClick={() => toggle(id)}
                type="button"
              >
                {isActive ? (
                  <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <ShopIcon
                    className="h-4 w-4 text-muted-foreground transition-colors"
                    name={category.icon}
                  />
                )}
                {category.title}
                {showCounts && typeof category.count === 'number' ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums',
                      isActive ? 'bg-white/20' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {category.count}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
