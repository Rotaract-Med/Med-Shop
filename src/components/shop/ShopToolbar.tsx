'use client'

import type { SortFilterItem } from '@/lib/constants'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utilities/cn'
import { SearchIcon, SlidersHorizontal, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo, useTransition } from 'react'

export type ActiveFilter = {
  id: string
  label: string
  /** Which search param this chip removes when dismissed. */
  param: 'category' | 'q'
}

type Props = {
  activeFilters: ActiveFilter[]
  defaultSort: string
  resultCount: number
  showSearch?: boolean
  showSortControl?: boolean
  sortOptions: SortFilterItem[]
}

/**
 * Sticky browse bar: result count, search, sort and dismissible filter chips.
 *
 * Sticks only from `md` up — below that the site header's announcement ribbon
 * can wrap to two lines, so a fixed offset would leave a gap or overlap.
 */
export const ShopToolbar: React.FC<Props> = ({
  activeFilters,
  defaultSort,
  resultCount,
  showSearch = true,
  showSortControl = true,
  sortOptions,
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSort = searchParams.get('sort') ?? defaultSort

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const query = params.toString()

      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
      })
    },
    [pathname, router, searchParams],
  )

  const onSort = useCallback(
    (value: string) => {
      pushParams((params) => {
        if (value === defaultSort) params.delete('sort')
        else params.set('sort', value)
      })
    },
    [defaultSort, pushParams],
  )

  const onSearch = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const form = event.currentTarget
      const value = (form.elements.namedItem('search') as HTMLInputElement)?.value?.trim()

      pushParams((params) => {
        if (value) params.set('q', value)
        else params.delete('q')
      })
    },
    [pushParams],
  )

  const removeFilter = useCallback(
    (filter: ActiveFilter) => {
      pushParams((params) => {
        if (filter.param === 'q') {
          params.delete('q')
          return
        }

        const remaining = (params.get('category') ?? '')
          .split(',')
          .filter((id) => id && id !== filter.id)

        if (remaining.length) params.set('category', remaining.join(','))
        else params.delete('category')
      })
    },
    [pushParams],
  )

  const clearAll = useCallback(() => {
    pushParams((params) => {
      params.delete('category')
      params.delete('q')
    })
  }, [pushParams])

  const activeSortLabel = useMemo(
    () => sortOptions.find((option) => (option.slug ?? defaultSort) === currentSort)?.title,
    [currentSort, defaultSort, sortOptions],
  )

  return (
    // Negative margins cancel the parent container's gutter so the sticky bar's
    // backdrop spans the full content width instead of letting cards scroll
    // through the padding either side of it.
    <div className="-mx-4 border-b border-border bg-background/85 px-4 backdrop-blur-md md:sticky md:top-[var(--header-height)] md:z-20 md:-mx-8 md:px-8">
      <div className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{resultCount}</span>{' '}
            {resultCount === 1 ? 'product' : 'products'}
            {activeSortLabel ? (
              <span className="hidden sm:inline"> · sorted by {activeSortLabel.toLowerCase()}</span>
            ) : null}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {showSearch ? (
              <form className="relative" onSubmit={onSearch} role="search">
                <label className="sr-only" htmlFor="shop-search">
                  Search products
                </label>
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  autoComplete="off"
                  className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:w-64"
                  defaultValue={searchParams.get('q') ?? ''}
                  id="shop-search"
                  key={searchParams.get('q')}
                  name="search"
                  placeholder="Search products…"
                  type="search"
                />
              </form>
            ) : null}

            {showSortControl ? (
              <Select onValueChange={onSort} value={currentSort}>
                <SelectTrigger
                  aria-label="Sort products"
                  className="h-11 min-h-11 w-full cursor-pointer rounded-full border-border bg-white px-4 sm:w-52"
                >
                  <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem
                      className="cursor-pointer"
                      key={option.title}
                      value={option.slug ?? defaultSort}
                    >
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        {activeFilters.length ? (
          <div className={cn('flex flex-wrap items-center gap-2', isPending && 'opacity-70')}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Filtered by
            </span>
            {activeFilters.map((filter) => (
              <button
                className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                key={`${filter.param}-${filter.id}`}
                onClick={() => removeFilter(filter)}
                type="button"
              >
                {filter.label}
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            <button
              className="cursor-pointer text-xs font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              onClick={clearAll}
              type="button"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
