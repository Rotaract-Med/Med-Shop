import type { ActiveFilter } from '@/components/shop/ShopToolbar'
import type { RailCategory } from '@/components/shop/CategoryRail'
import type { CardStyle } from '@/components/shop/ProductCard'
import type { ShopSetting } from '@/payload-types'
import type { Where } from 'payload'

import { CategoryRail } from '@/components/shop/CategoryRail'
import { ProductCard } from '@/components/shop/ProductCard'
import { PromoTile } from '@/components/shop/PromoTile'
import { ShopEmptyState } from '@/components/shop/ShopEmptyState'
import { ShopPagination } from '@/components/shop/ShopPagination'
import { ShopToolbar } from '@/components/shop/ShopToolbar'
import { allowedSortSlugs, sorting } from '@/lib/constants'
import { cn } from '@/utilities/cn'
import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const metadata = {
  description: 'Browse the official Rotaract Méditerranéen collection.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

const PAGE_SIZE = 24

const gridColumns: Record<string, string> = {
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

/** Reads a search param that may arrive as a repeated key. */
function firstValue(value: SearchParams[string]): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams

  const searchValue = firstValue(params.q)?.trim() || undefined
  // Postgres IDs are numeric; keep only well-formed values so a hand-edited URL
  // cannot push junk into the query.
  const categoryIds = (firstValue(params.category) ?? '')
    .split(',')
    .filter((id) => id && /^\d+$/.test(id))
  const requestedPage = Number(firstValue(params.page))
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const settings = (await getCachedGlobal('shopSettings', 2)()) as ShopSetting
  const browse = settings?.browse
  const columns = browse?.columns ?? '3'
  const cardStyle = (browse?.cardStyle ?? 'elevated') as CardStyle
  const showCategoryFilter = browse?.showCategoryFilter !== false
  const showCategoryCounts = browse?.showCategoryCounts !== false
  const enableQuickAdd = browse?.enableQuickAdd !== false
  const showStockHints = browse?.showStockHints !== false

  const defaultSort = browse?.defaultSort ?? 'title'
  const requestedSort = firstValue(params.sort)
  const sort = requestedSort && allowedSortSlugs.has(requestedSort) ? requestedSort : defaultSort

  const payload = await getPayload({ config: configPromise })

  const where: Where = {
    and: [
      { _status: { equals: 'published' } },
      ...(searchValue
        ? [
            {
              or: [
                { title: { like: searchValue } },
                { 'merchandising.shortDescription': { like: searchValue } },
              ],
            },
          ]
        : []),
      ...(categoryIds.length ? [{ categories: { in: categoryIds.map(Number) } }] : []),
    ],
  }

  const [categoriesResult, catalogue, products] = await Promise.all([
    showCategoryFilter
      ? payload.find({ collection: 'categories', depth: 0, limit: 100, sort: 'title' })
      : null,
    // One lightweight pass over the catalogue gives every category badge its
    // count without an N+1 of per-category `count()` calls.
    showCategoryFilter && showCategoryCounts
      ? payload.find({
          collection: 'products',
          depth: 0,
          draft: false,
          overrideAccess: false,
          pagination: false,
          select: { categories: true },
          where: { _status: { equals: 'published' } },
        })
      : null,
    payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: PAGE_SIZE,
      overrideAccess: false,
      page: currentPage,
      select: {
        title: true,
        slug: true,
        gallery: true,
        categories: true,
        priceInUSD: true,
        inventory: true,
        enableVariants: true,
        featured: true,
        merchandising: true,
      },
      sort,
      where,
    }),
  ])

  const counts = new Map<string, number>()
  for (const product of catalogue?.docs ?? []) {
    for (const category of product.categories ?? []) {
      const id = String(typeof category === 'object' ? category.id : category)
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  const railCategories: RailCategory[] =
    categoriesResult?.docs.map((category) => ({
      count: showCategoryCounts ? (counts.get(String(category.id)) ?? 0) : undefined,
      icon: category.icon,
      id: category.id,
      title: category.title,
    })) ?? []

  const selectedCategories = railCategories.filter((category) =>
    categoryIds.includes(String(category.id)),
  )

  const activeFilters: ActiveFilter[] = [
    ...(searchValue ? [{ id: 'q', label: `“${searchValue}”`, param: 'q' as const }] : []),
    ...selectedCategories.map((category) => ({
      id: String(category.id),
      label: category.title,
      param: 'category' as const,
    })),
  ]

  const promo = settings?.promo
  const showPromo = Boolean(promo?.enabled && (promo?.title || promo?.description))

  const cards = products.docs.map((product, index) => (
    <ProductCard
      cardStyle={cardStyle}
      enableQuickAdd={enableQuickAdd}
      key={product.id}
      priority={index < Number(columns)}
      product={product}
      showStockHints={showStockHints}
    />
  ))

  if (showPromo && promo) {
    // `position` is 1-based and clamped so an out-of-range value still lands.
    const slot = Math.min(Math.max((promo.position ?? 3) - 1, 0), cards.length)
    cards.splice(slot, 0, <PromoTile key="shop-promo" promo={promo} />)
  }

  // Preserved on pagination links so filters survive a page change.
  const carriedParams: Record<string, string> = {
    ...(searchValue ? { q: searchValue } : {}),
    ...(categoryIds.length ? { category: categoryIds.join(',') } : {}),
    ...(requestedSort && allowedSortSlugs.has(requestedSort) ? { sort: requestedSort } : {}),
  }

  return (
    <div>
      {showCategoryFilter && railCategories.length ? (
        <div className="pt-8">
          <CategoryRail
            categories={railCategories}
            showCounts={showCategoryCounts}
            totalCount={showCategoryCounts ? (catalogue?.docs.length ?? undefined) : undefined}
          />
        </div>
      ) : null}

      <ShopToolbar
        activeFilters={activeFilters}
        defaultSort={defaultSort}
        resultCount={products.totalDocs}
        showSearch={browse?.showSearch !== false}
        showSortControl={browse?.showSortControl !== false}
        sortOptions={sorting}
      />

      {selectedCategories.length === 1 && selectedCategories[0] ? (
        <CategoryIntro categoryID={selectedCategories[0].id} categories={categoriesResult?.docs} />
      ) : null}

      <div className="pt-8">
        {products.docs.length ? (
          <>
            <div className={cn('grid gap-6', gridColumns[columns] ?? gridColumns['3'])}>{cards}</div>

            <ShopPagination
              currentPage={products.page ?? 1}
              searchParams={carriedParams}
              totalPages={products.totalPages}
            />
          </>
        ) : (
          <ShopEmptyState
            emptyState={settings?.emptyState}
            hasActiveFilters={activeFilters.length > 0}
            searchValue={searchValue}
          />
        )}
      </div>
    </div>
  )
}

/** Optional editor-written blurb shown when exactly one category is selected. */
function CategoryIntro({
  categories,
  categoryID,
}: {
  categories?: { description?: null | string; id: number | string }[]
  categoryID: number | string
}) {
  const description = categories?.find(
    (category) => String(category.id) === String(categoryID),
  )?.description

  if (!description) return null

  return <p className="max-w-2xl pt-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
}
