import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'The official shop of Rotaract Méditerranéen — connecting Rotaractors across the Mediterranean.',
  images: [
    {
      url: '/med/med.png',
    },
  ],
  siteName: 'Rotaract Méditerranéen Shop',
  title: 'Rotaract Méditerranéen Shop',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
