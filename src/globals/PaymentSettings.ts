import type { Field, GlobalAfterChangeHook, GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'

const revalidatePaymentSettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating payment settings')
    revalidateTag('global_paymentSettings', 'max')
  }

  return doc
}

/**
 * Payment adapters are registered at build time and cannot be added or removed
 * from the CMS. What an editor controls here is whether each one is *offered* —
 * enforced both in the checkout UI and, more importantly, server-side in
 * `gatePaymentMethod` before any payment is initiated.
 */
const methodGroup = ({
  defaultLabel,
  description,
  enabledByDefault,
  extraFields = [],
  label,
  name,
}: {
  defaultLabel: string
  description: string
  enabledByDefault: boolean
  extraFields?: Field[]
  label: string
  name: string
}): Field => ({
  name,
  type: 'group',
  admin: { description },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: enabledByDefault,
      label: 'Offer this payment method at checkout',
    },
    {
      type: 'row',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: { width: '50%' },
          defaultValue: defaultLabel,
          label: 'Label shown to customers',
        },
        {
          name: 'order',
          type: 'number',
          admin: {
            description: 'Lower numbers appear first.',
            width: '50%',
          },
          defaultValue: 10,
          label: 'Sort order',
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
      label: 'Short explanation shown under the label',
    },
    ...extraFields,
  ],
  label,
})

export const PaymentSettings: GlobalConfig = {
  slug: 'paymentSettings',
  access: {
    // Contains no secrets — only which methods are offered and how they are
    // labelled. The checkout page reads this.
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description: 'Turn payment methods on or off and control how they appear at checkout.',
    group: 'Shop',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'How would you like to pay?',
      label: 'Heading for the payment step',
    },
    methodGroup({
      defaultLabel: 'Pay by card',
      description: 'Online card payment handled by Stripe.',
      enabledByDefault: true,
      label: 'Card (Stripe)',
      name: 'stripe',
    }),
    methodGroup({
      defaultLabel: 'Bank transfer',
      description:
        'Customer transfers the money themselves, then uploads a receipt. The bank details below are shown at checkout and repeated in their confirmation email.',
      enabledByDefault: false,
      extraFields: [
        {
          name: 'bankDetails',
          type: 'group',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'accountHolder',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Account holder',
                },
                {
                  name: 'bankName',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Bank name',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'iban',
                  type: 'text',
                  admin: { width: '60%' },
                  label: 'IBAN / account number',
                },
                {
                  name: 'swift',
                  type: 'text',
                  admin: { width: '40%' },
                  label: 'SWIFT / BIC',
                },
              ],
            },
            {
              name: 'instructions',
              type: 'textarea',
              admin: {
                description:
                  'Extra guidance shown under the bank details, e.g. how long verification takes.',
              },
              defaultValue:
                'Please quote your payment reference on the transfer, then upload your receipt so we can verify it. Your order ships once payment is confirmed.',
            },
          ],
          label: 'Bank details shown to the customer',
        },
        {
          name: 'requireReceipt',
          type: 'checkbox',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description:
              'Prompts the customer to upload proof of payment after placing the order.',
          },
          defaultValue: true,
          label: 'Ask for a receipt upload',
        },
      ],
      label: 'Bank transfer',
      name: 'bankTransfer',
    }),
    methodGroup({
      defaultLabel: 'Cash on delivery',
      description: 'Customer pays the courier when the order arrives.',
      enabledByDefault: false,
      label: 'Cash on Delivery',
      name: 'cod',
    }),
    methodGroup({
      defaultLabel: 'Pay & collect at an event',
      description:
        'Order is placed immediately and paid in person at an event the customer selects. Requires at least one published, upcoming event that is accepting orders.',
      enabledByDefault: false,
      extraFields: [
        {
          name: 'eventFieldLabel',
          type: 'text',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
          defaultValue: 'Which event will you attend?',
          label: 'Label for the event picker',
        },
        {
          name: 'noEventsMessage',
          type: 'text',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: 'Shown when no upcoming events are available.',
          },
          defaultValue: 'There are no upcoming events to collect at right now.',
        },
      ],
      label: 'Pay at an event',
      name: 'payAtEvent',
    }),
  ],
  hooks: {
    afterChange: [revalidatePaymentSettings],
  },
  label: 'Payment Settings',
}
