import type { ShopSetting } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { ShopHero } from '@/components/shop/ShopHero'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

/**
 * Chrome that does not depend on search params lives here so filtering never
 * re-renders the hero or the CMS sections beneath the grid.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = (await getCachedGlobal('shopSettings', 2)()) as ShopSetting

  return (
    <>
      <ShopHero hero={settings?.hero} />

      <div className="container pb-16">{children}</div>

      {settings?.belowGrid?.length ? (
        <div className="border-t border-border bg-card">
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore - block union differs per collection but renders identically */}
          <RenderBlocks blocks={settings.belowGrid} />
        </div>
      ) : null}
    </>
  )
}
