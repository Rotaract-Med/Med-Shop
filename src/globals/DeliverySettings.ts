import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'

const revalidateDeliverySettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating delivery settings')
    revalidateTag('global_deliverySettings', 'max')
  }

  return doc
}

/**
 * Delivery pricing.
 *
 * All amounts are in minor units (cents), matching product prices and order
 * totals everywhere else in the shop.
 *
 * Not applied to the "pay & collect at an event" method — nothing is shipped,
 * so no carrier cost is incurred.
 */
export const DeliverySettings: GlobalConfig = {
  slug: 'deliverySettings',
  access: {
    // The checkout reads this to show the delivery line before payment.
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description:
      'Delivery charges added to the order total. Orders collected at an event are never charged delivery.',
    group: 'Shop',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      admin: { description: 'When off, no delivery charge is added to any order.' },
      defaultValue: true,
      label: 'Charge for delivery',
    },
    {
      type: 'row',
      admin: { condition: (data) => Boolean(data?.enabled) },
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: { width: '50%' },
          defaultValue: 'Delivery',
          label: 'Label shown at checkout',
        },
        {
          name: 'flatFee',
          type: 'number',
          admin: {
            description: 'In cents — 500 = $5.00. Used when no country rate matches.',
            width: '50%',
          },
          defaultValue: 0,
          label: 'Standard delivery fee',
          min: 0,
        },
      ],
    },
    {
      name: 'freeOver',
      type: 'number',
      admin: {
        condition: (data) => Boolean(data?.enabled),
        description:
          'In cents. Orders at or above this amount get free delivery. Leave at 0 to always charge.',
      },
      defaultValue: 0,
      label: 'Free delivery over',
      min: 0,
    },
    {
      name: 'rates',
      type: 'array',
      admin: {
        condition: (data) => Boolean(data?.enabled),
        description:
          'Per-country overrides. The first row matching the delivery address wins; otherwise the standard fee applies.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'countries',
              type: 'text',
              admin: {
                description: 'ISO country codes, comma separated. e.g. FR, ES, IT',
                width: '50%',
              },
              required: true,
            },
            {
              name: 'fee',
              type: 'number',
              admin: {
                description: 'In cents.',
                width: '25%',
              },
              min: 0,
              required: true,
            },
            {
              name: 'label',
              type: 'text',
              admin: {
                placeholder: 'Mediterranean zone',
                width: '25%',
              },
            },
          ],
        },
      ],
      labels: { plural: 'Country rates', singular: 'Country rate' },
    },
    {
      name: 'notice',
      type: 'textarea',
      admin: {
        condition: (data) => Boolean(data?.enabled),
        description: 'Optional line shown under the delivery charge at checkout.',
      },
      label: 'Delivery note',
    },
    {
      name: 'eventNotice',
      type: 'text',
      admin: {
        description: 'Shown instead of a delivery charge when collecting at an event.',
      },
      defaultValue: 'No delivery charge — you collect your order at the event.',
      label: 'Collection note',
    },
  ],
  hooks: {
    afterChange: [revalidateDeliverySettings],
  },
  label: 'Delivery Settings',
}
