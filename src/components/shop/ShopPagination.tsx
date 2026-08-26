import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import React from 'react'

type Props = {
  currentPage: number
  /** Current search params, minus `page`, preserved across page links. */
  searchParams: Record<string, string>
  totalPages: number
}

/** Compact page list: first, last, current ±1, with ellipses between gaps. */
function buildPageList(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  const visible = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  return visible.reduce<(number | 'gap')[]>((acc, page, index) => {
    if (index > 0 && page - (visible[index - 1] as number) > 1) acc.push('gap')
    acc.push(page)
    return acc
  }, [])
}

export const ShopPagination: React.FC<Props> = ({ currentPage, searchParams, totalPages }) => {
  if (totalPages <= 1) return null

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams)
    if (page > 1) params.set('page', String(page))
    else params.delete('page')
    const query = params.toString()
    return query ? `/?${query}` : '/'
  }

  const pages = buildPageList(currentPage, totalPages)

  return (
    <Pagination className="mt-14">
      <PaginationContent>
        {/* Boundary controls are omitted rather than disabled — a
            `pointer-events-none` anchor is still reachable by keyboard. */}
        {currentPage > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={hrefFor(currentPage - 1)} />
          </PaginationItem>
        ) : null}

        {pages.map((page, index) => (
          <PaginationItem key={page === 'gap' ? `gap-${index}` : page}>
            {page === 'gap' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={hrefFor(page)} isActive={page === currentPage}>
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {currentPage < totalPages ? (
          <PaginationItem>
            <PaginationNext href={hrefFor(currentPage + 1)} />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  )
}
