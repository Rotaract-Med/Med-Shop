import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { iconSelect } from '@/fields/iconSelect'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'icon'],
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
    iconSelect({
      admin: {
        description: 'Shown on the category filter pill in the shop.',
      },
      defaultValue: 'tag',
    }),
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Optional. Displayed under the shop heading when this category is selected.',
      },
      maxLength: 160,
    },
  ],
}
