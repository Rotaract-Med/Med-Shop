import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // The storefront moved from /shop to the site root. Keep old links,
  // bookmarks and search results working.
  const shopToRoot = {
    destination: '/',
    permanent: true,
    source: '/shop',
  }

  return [internetExplorerRedirect, shopToRoot]
}
