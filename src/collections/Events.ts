import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'

/**
 * Events customers can choose to collect and pay at.
 *
 * Used by the "pay at an event" payment method: only published events that are
 * still accepting orders and have not started yet are offered at checkout.
 */
export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'startsAt', 'location', 'acceptOrders', '_status'],
    description: 'Meet-ups where customers can collect and pay for their order in person.',
    group: 'Shop',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Events in the past are never offered at checkout.',
            width: '50%',
          },
          required: true,
        },
        {
          name: 'endsAt',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Shown to the customer at checkout and in their confirmation email.',
        placeholder: 'Palais des Congrès, Marseille',
      },
      required: true,
    },
    {
      name: 'address',
      type: 'textarea',
      admin: { description: 'Optional full address, included in the confirmation email.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional note shown under the event at checkout.' },
    },
    {
      name: 'acceptOrders',
      type: 'checkbox',
      admin: {
        description:
          'Turn off to stop offering this event at checkout without unpublishing it — useful once you have stopped taking collections for it.',
        position: 'sidebar',
      },
      defaultValue: true,
      label: 'Accept orders for this event',
    },
  ],
  versions: {
    drafts: true,
  },
}
