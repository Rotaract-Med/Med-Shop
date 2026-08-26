export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: 'title',
  reverse: false,
  title: 'Alphabetical A–Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'priceInUSD', reverse: false, title: 'Price: low to high' }, // asc
  { slug: '-priceInUSD', reverse: true, title: 'Price: high to low' },
]

/**
 * Allow-list for the `?sort=` param. Payload passes `sort` straight to the
 * database, so anything not on this list falls back to the configured default.
 */
export const allowedSortSlugs = new Set(
  sorting.map((item) => item.slug).filter((slug): slug is string => Boolean(slug)),
)
