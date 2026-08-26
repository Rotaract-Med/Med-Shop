import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'

const revalidateEmailSettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating email settings')
    revalidateTag('global_emailSettings', 'max')
  }

  return doc
}

/**
 * Placeholders available inside every template field. Rendered by
 * `@/email/renderEmail`; anything unknown is left untouched rather than being
 * replaced with an empty string, so a typo is visible instead of silent.
 */
const placeholderHelp = (tokens: string[]) =>
  `Available placeholders: ${tokens.map((token) => `{{${token}}}`).join(', ')}`

const orderTokens = [
  'orderId',
  'customerName',
  'orderTotal',
  'orderUrl',
  'orderDate',
  'siteName',
]

export const EmailSettings: GlobalConfig = {
  slug: 'emailSettings',
  access: {
    // Contains SMTP credentials — never expose this global publicly.
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    description: 'SMTP delivery settings and the content of every transactional email.',
    group: 'Settings',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          description:
            'Gmail requires an App Password — your normal Google password will be rejected. Generate one at Google Account → Security → 2-Step Verification → App passwords.',
          fields: [
            {
              name: 'delivery',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  admin: {
                    description:
                      'When off, emails are logged to the server console instead of being sent. Useful for local development.',
                  },
                  defaultValue: false,
                  label: 'Send emails',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'host',
                      type: 'text',
                      admin: { width: '50%' },
                      defaultValue: 'smtp.gmail.com',
                      label: 'SMTP host',
                    },
                    {
                      name: 'port',
                      type: 'number',
                      admin: {
                        description: '465 for SSL, 587 for STARTTLS.',
                        width: '25%',
                      },
                      defaultValue: 465,
                      label: 'Port',
                    },
                    {
                      name: 'secure',
                      type: 'checkbox',
                      admin: {
                        description: 'On for port 465, off for 587.',
                        width: '25%',
                      },
                      defaultValue: true,
                      label: 'Use SSL',
                    },
                  ],
                },
                {
                  name: 'username',
                  type: 'text',
                  admin: {
                    description: 'Your full Gmail address, e.g. shop@yourdomain.com',
                    placeholder: 'you@gmail.com',
                  },
                  label: 'SMTP username',
                },
                {
                  name: 'password',
                  type: 'text',
                  access: {
                    // Readable only by admins, even through the REST/GraphQL API.
                    read: adminOnlyFieldAccess,
                    update: adminOnlyFieldAccess,
                  },
                  admin: {
                    description:
                      'Gmail App Password (16 characters). Stored in your database — treat it like any other secret.',
                  },
                  label: 'SMTP password / App Password',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fromName',
                      type: 'text',
                      admin: { width: '50%' },
                      defaultValue: 'Rotaract Méditerranéen Shop',
                      label: 'From name',
                    },
                    {
                      name: 'fromAddress',
                      type: 'text',
                      admin: {
                        description: 'Gmail will rewrite this to your account address unless it is a verified alias.',
                        width: '50%',
                      },
                      label: 'From address',
                    },
                  ],
                },
                {
                  name: 'replyTo',
                  type: 'text',
                  admin: { description: 'Optional. Where customer replies should go.' },
                  label: 'Reply-to address',
                },
                {
                  name: 'testRecipient',
                  type: 'text',
                  admin: {
                    description:
                      'Save your settings first, then send a test email to this address to verify the credentials work.',
                  },
                  label: 'Send a test email to',
                },
                {
                  name: 'testSend',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '@/components/admin/TestEmailButton#TestEmailButton',
                    },
                  },
                },
              ],
              label: false,
            },
          ],
          label: 'Delivery (SMTP)',
        },
        {
          description: 'Shared header, colours and footer applied to every email.',
          fields: [
            {
              name: 'branding',
              type: 'group',
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  admin: {
                    description:
                      'Shown at the top of every email. Use a PNG with a transparent or light background — email clients do not support dark mode reliably.',
                  },
                  relationTo: 'media',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'headerColor',
                      type: 'select',
                      admin: { width: '50%' },
                      defaultValue: 'azure',
                      label: 'Header colour',
                      options: [
                        { label: 'Azure (brand blue)', value: 'azure' },
                        { label: 'Cranberry', value: 'cranberry' },
                        { label: 'Midnight', value: 'midnight' },
                      ],
                    },
                    {
                      name: 'buttonColor',
                      type: 'select',
                      admin: { width: '50%' },
                      defaultValue: 'azure',
                      label: 'Button colour',
                      options: [
                        { label: 'Azure (brand blue)', value: 'azure' },
                        { label: 'Cranberry', value: 'cranberry' },
                        { label: 'Gold', value: 'gold' },
                      ],
                    },
                  ],
                },
                {
                  name: 'footerText',
                  type: 'textarea',
                  defaultValue:
                    'Rotaract Méditerranéen — connecting Rotaractors across the Mediterranean.',
                  label: 'Footer text',
                },
                {
                  name: 'supportEmail',
                  type: 'text',
                  admin: { description: 'Shown in the footer so customers know where to ask for help.' },
                  label: 'Support email',
                },
              ],
              label: false,
            },
          ],
          label: 'Branding',
        },
        {
          description: 'Sent automatically as soon as a payment succeeds and the order is created.',
          fields: [
            {
              name: 'orderConfirmation',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Send an order confirmation',
                },
                {
                  name: 'subject',
                  type: 'text',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue: 'Order #{{orderId}} confirmed — thank you!',
                },
                {
                  name: 'heading',
                  type: 'text',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue: 'Thank you for your order',
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue:
                    'Hi {{customerName}}, we have received your order and are getting it ready. Here is what you bought.',
                },
                {
                  name: 'showItems',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Include the itemised order summary',
                },
                {
                  name: 'eventNotice',
                  type: 'textarea',
                  admin: {
                    description: `Added only when the customer chose to pay at an event. ${placeholderHelp([...orderTokens, 'eventName', 'eventDate', 'eventLocation'])}`,
                  },
                  defaultValue:
                    'You chose to pay when you collect. Bring order #{{orderId}} to {{eventName}} on {{eventDate}} at {{eventLocation}}, and we will have it ready for you.',
                  label: 'Pay-at-event notice',
                },
                {
                  name: 'bankTransferNotice',
                  type: 'textarea',
                  admin: {
                    description: `Added only for bank transfer orders. The bank details come from Payment Settings. ${placeholderHelp([...orderTokens, 'paymentReference', 'bankDetails'])}`,
                  },
                  defaultValue:
                    'Please transfer {{orderTotal}} quoting reference {{paymentReference}} to: {{bankDetails}} — then upload your receipt from your order page so we can verify it.',
                  label: 'Bank transfer instructions',
                },
                {
                  name: 'buttonLabel',
                  type: 'text',
                  admin: { description: 'Leave empty to hide the button.' },
                  defaultValue: 'View your order',
                },
                {
                  name: 'outro',
                  type: 'textarea',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue:
                    'We will email you again as soon as your order ships. Every purchase supports Rotaract clubs across the Mediterranean — thank you for being part of it.',
                },
              ],
              label: false,
            },
          ],
          label: 'Order confirmation',
        },
        {
          description:
            'Sent when a customer uses the "Find my order" form to request a link to their order.',
          fields: [
            {
              name: 'orderAccess',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Send order access links',
                },
                {
                  name: 'subject',
                  type: 'text',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue: 'Access your order #{{orderId}}',
                },
                {
                  name: 'heading',
                  type: 'text',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue: 'View your order',
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  admin: { description: placeholderHelp(orderTokens) },
                  defaultValue:
                    'Use the button below to view the details of order #{{orderId}}. Do not share this link — anyone who has it can see your order.',
                },
                {
                  name: 'buttonLabel',
                  type: 'text',
                  defaultValue: 'View my order',
                },
              ],
              label: false,
            },
          ],
          label: 'Order access link',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateEmailSettings],
  },
  label: 'Email Settings',
}
