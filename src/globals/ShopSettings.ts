import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'
import { Banner } from '@/blocks/Banner/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Carousel } from '@/blocks/Carousel/config'
import { Content } from '@/blocks/Content/config'
import { Features } from '@/blocks/Features/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { iconSelect } from '@/fields/iconSelect'
import { link } from '@/fields/link'

/**
 * `getCachedGlobal` keys its `unstable_cache` entry on `global_<slug>`, so the
 * storefront would otherwise serve stale settings until the next deploy.
 */
const revalidateShopSettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating shop settings')
    revalidateTag('global_shopSettings', 'max')
  }

  return doc
}

export const ShopSettings: GlobalConfig = {
  slug: 'shopSettings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description: 'Controls the layout, copy and merchandising of the /shop browse experience.',
    group: 'Shop',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          description: 'The full-bleed banner at the top of the shop.',
          fields: [
            {
              name: 'hero',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Show the hero banner',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      admin: {
                        description: 'Small uppercase line above the headline.',
                        width: '50%',
                      },
                      defaultValue: 'Rotaract Méditerranéen — Official Store',
                    },
                    {
                      name: 'colorway',
                      type: 'select',
                      admin: { width: '50%' },
                      defaultValue: 'azure',
                      label: 'Colour treatment',
                      options: [
                        { label: 'Azure (brand blue)', value: 'azure' },
                        { label: 'Midnight (deep navy)', value: 'midnight' },
                        { label: 'Cranberry', value: 'cranberry' },
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'headline',
                      type: 'text',
                      admin: { width: '60%' },
                      defaultValue: 'Our',
                    },
                    {
                      name: 'headlineAccent',
                      type: 'text',
                      admin: {
                        description: 'Rendered in gold with an underline swash.',
                        width: '40%',
                      },
                      defaultValue: 'Collection',
                    },
                  ],
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  defaultValue:
                    'Wear your values. Every purchase supports Rotaractor communities across the Mediterranean.',
                },
                {
                  name: 'backgroundImage',
                  type: 'upload',
                  admin: {
                    description: 'Sits behind the gradient at low opacity. Landscape works best.',
                  },
                  relationTo: 'media',
                },
                {
                  name: 'badges',
                  type: 'array',
                  admin: {
                    description: 'Trust pills shown under the intro.',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        iconSelect({
                          admin: { width: '40%' },
                          defaultValue: 'ship',
                        }),
                        {
                          name: 'label',
                          type: 'text',
                          admin: { width: '60%' },
                          required: true,
                        },
                      ],
                    },
                  ],
                  labels: { plural: 'Trust badges', singular: 'Trust badge' },
                  maxRows: 4,
                },
                {
                  name: 'stats',
                  type: 'array',
                  admin: {
                    description: 'Optional impact figures shown beside the headline on desktop.',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'value',
                          type: 'text',
                          admin: { placeholder: '12', width: '35%' },
                          required: true,
                        },
                        {
                          name: 'label',
                          type: 'text',
                          admin: { placeholder: 'Countries served', width: '65%' },
                          required: true,
                        },
                      ],
                    },
                  ],
                  labels: { plural: 'Stats', singular: 'Stat' },
                  maxRows: 3,
                },
              ],
              label: false,
            },
          ],
          label: 'Hero',
        },
        {
          description: 'How products are filtered, sorted and displayed.',
          fields: [
            {
              name: 'browse',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'columns',
                      type: 'select',
                      admin: { width: '50%' },
                      defaultValue: '3',
                      label: 'Grid columns (desktop)',
                      options: [
                        { label: '3 — larger cards', value: '3' },
                        { label: '4 — denser grid', value: '4' },
                      ],
                    },
                    {
                      name: 'cardStyle',
                      type: 'select',
                      admin: { width: '50%' },
                      defaultValue: 'elevated',
                      label: 'Product card style',
                      options: [
                        { label: 'Elevated — soft shadow, lifts on hover', value: 'elevated' },
                        { label: 'Bordered — flat with a crisp outline', value: 'bordered' },
                        { label: 'Editorial — borderless, image-led', value: 'editorial' },
                      ],
                    },
                  ],
                },
                {
                  name: 'defaultSort',
                  type: 'select',
                  defaultValue: 'title',
                  label: 'Default sort order',
                  options: [
                    { label: 'Alphabetical A–Z', value: 'title' },
                    { label: 'Latest arrivals', value: '-createdAt' },
                    { label: 'Price: low to high', value: 'priceInUSD' },
                    { label: 'Price: high to low', value: '-priceInUSD' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'showSearch',
                      type: 'checkbox',
                      admin: { width: '50%' },
                      defaultValue: true,
                      label: 'Show search',
                    },
                    {
                      name: 'showSortControl',
                      type: 'checkbox',
                      admin: { width: '50%' },
                      defaultValue: true,
                      label: 'Show sort control',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'showCategoryFilter',
                      type: 'checkbox',
                      admin: { width: '50%' },
                      defaultValue: true,
                      label: 'Show category filter',
                    },
                    {
                      name: 'showCategoryCounts',
                      type: 'checkbox',
                      admin: {
                        condition: (_, siblingData) => Boolean(siblingData?.showCategoryFilter),
                        width: '50%',
                      },
                      defaultValue: true,
                      label: 'Show product counts on categories',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'enableQuickAdd',
                      type: 'checkbox',
                      admin: {
                        description: 'Add-to-cart button directly on the product card.',
                        width: '50%',
                      },
                      defaultValue: true,
                      label: 'Enable quick add to cart',
                    },
                    {
                      name: 'showStockHints',
                      type: 'checkbox',
                      admin: {
                        description: 'Surfaces "Only 3 left" / "Sold out" on cards.',
                        width: '50%',
                      },
                      defaultValue: true,
                      label: 'Show stock hints',
                    },
                  ],
                },
              ],
              label: false,
            },
          ],
          label: 'Browse',
        },
        {
          description: 'A promotional tile placed inside the product grid.',
          fields: [
            {
              name: 'promo',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Show a promo tile in the grid',
                },
                {
                  type: 'row',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                  fields: [
                    {
                      name: 'position',
                      type: 'number',
                      admin: {
                        description: 'Grid slot to occupy. 3 = after the second product.',
                        width: '33%',
                      },
                      defaultValue: 3,
                      min: 1,
                    },
                    {
                      name: 'span',
                      type: 'select',
                      admin: { width: '33%' },
                      defaultValue: '1',
                      label: 'Width',
                      options: [
                        { label: 'One column', value: '1' },
                        { label: 'Two columns', value: '2' },
                      ],
                    },
                    {
                      name: 'colorway',
                      type: 'select',
                      admin: { width: '34%' },
                      defaultValue: 'cranberry',
                      options: [
                        { label: 'Cranberry', value: 'cranberry' },
                        { label: 'Gold', value: 'gold' },
                        { label: 'Azure', value: 'azure' },
                      ],
                    },
                  ],
                },
                {
                  name: 'eyebrow',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
                {
                  name: 'image',
                  type: 'upload',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                    description: 'Optional. Blended into the tile background.',
                  },
                  relationTo: 'media',
                },
                link({
                  appearances: false,
                  overrides: {
                    admin: {
                      condition: (_: unknown, siblingData: Record<string, unknown>) =>
                        Boolean(siblingData?.enabled),
                    },
                  },
                }),
              ],
              label: false,
            },
          ],
          label: 'Promo tile',
        },
        {
          description: 'Shown when a search or filter returns nothing.',
          fields: [
            {
              name: 'emptyState',
              type: 'group',
              fields: [
                iconSelect({ defaultValue: 'package' }),
                {
                  name: 'heading',
                  type: 'text',
                  defaultValue: 'Nothing here — yet',
                },
                {
                  name: 'body',
                  type: 'textarea',
                  defaultValue:
                    'We could not find products matching those filters. Try a different category or clear your search.',
                },
              ],
              label: false,
            },
          ],
          label: 'Empty state',
        },
        {
          description: 'Free-form sections rendered underneath the product grid.',
          fields: [
            {
              name: 'belowGrid',
              type: 'blocks',
              blocks: [Features, CallToAction, Content, Carousel, MediaBlock, Banner],
              label: 'Sections below the grid',
            },
          ],
          label: 'Below the grid',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateShopSettings],
  },
  label: 'Shop Settings',
}
