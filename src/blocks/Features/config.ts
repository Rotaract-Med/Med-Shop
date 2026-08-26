import type { Block } from 'payload'

export const Features: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  labels: {
    singular: 'Features Section',
    plural: 'Features Sections',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Section heading',
      defaultValue: 'Why Shop With Us',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section subtitle',
      defaultValue: 'Rotaract merchandise with purpose',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Feature cards',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          defaultValue: 'globe',
          options: [
            { label: '🌊 Globe / Mediterranean', value: 'globe' },
            { label: '✅ Shield / Quality', value: 'shield' },
            { label: '🚢 Truck / Shipping', value: 'truck' },
            { label: '🤝 Users / Community', value: 'users' },
            { label: '⭐ Star / Excellence', value: 'star' },
            { label: '📦 Package / Products', value: 'package' },
            { label: '🏆 Award / Achievement', value: 'award' },
            { label: '❤️ Heart / Care', value: 'heart' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          label: 'Card title',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Card description',
          required: true,
        },
      ],
    },
  ],
}
