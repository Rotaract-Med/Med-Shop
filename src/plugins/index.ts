import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { s3Storage } from '@payloadcms/storage-s3'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
import { codAdapter } from '@wtree/payload-ecommerce-cod'

import { bankTransferAdapter } from '@/payments/bankTransfer'
import { withDelivery } from '@/payments/delivery'
import { gatePaymentMethod } from '@/payments/gatePaymentMethod'
import { payAtEventAdapter } from '@/payments/payAtEvent'

import { Page, Product } from '@/payload-types'
import { sendOrderConfirmation } from '@/email/sendOrderConfirmation'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

/**
 * Uploads are stored in MinIO (S3-compatible) rather than on the local disk.
 *
 * Vercel's filesystem is ephemeral and `public/media` is gitignored, so
 * disk-backed uploads vanish on every deploy — leaving media rows in the
 * database pointing at files that no longer exist.
 *
 * Only enabled when a bucket is configured, so a checkout without S3
 * credentials still runs against the local filesystem.
 */
const storagePlugins: Plugin[] = process.env.S3_BUCKET
  ? [
      s3Storage({
        bucket: process.env.S3_BUCKET,
        collections: {
          media: true,
        },
        config: {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          },
          endpoint: process.env.S3_ENDPOINT,
          // MinIO serves buckets as a path (`host/bucket/key`), not as a
          // subdomain (`bucket.host`) the way AWS does. Without this the SDK
          // builds unreachable hostnames.
          forcePathStyle: true,
          region: process.env.S3_REGION || 'us-east-1',
        },
      }),
    ]
  : []

export const plugins: Plugin[] = [
  ...storagePlugins,
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...defaultCollection.hooks,
          afterChange: [
            ...(defaultCollection.hooks?.afterChange ?? []),
            // The plugin creates the order only once Stripe reports the payment
            // succeeded, so `create` is the moment to confirm it to the buyer.
            async ({ doc, operation, req }) => {
              if (operation !== 'create') return doc

              try {
                const result = await sendOrderConfirmation({
                  orderID: doc.id,
                  payload: req.payload,
                  req,
                })

                if (!result.sent) {
                  req.payload.logger.warn(
                    `[email] No confirmation sent for order ${doc.id}: ${result.reason}`,
                  )
                }
              } catch (err) {
                // Never let email trouble surface as a failed checkout — the
                // customer has already been charged at this point.
                req.payload.logger.error({
                  err,
                  msg: `[email] Unexpected error confirming order ${doc.id}`,
                })
              }

              return doc
            },
          ],
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'deliveryFee',
            type: 'number',
            admin: {
              description:
                'In cents, already included in the order amount. Zero for orders collected at an event.',
              readOnly: true,
            },
            defaultValue: 0,
            label: 'Delivery charged',
          },
          {
            name: 'paymentReference',
            type: 'text',
            admin: {
              description: 'Reference the customer quotes on their bank transfer.',
              position: 'sidebar',
              readOnly: true,
            },
            index: true,
          },
          {
            name: 'paymentReceipt',
            type: 'upload',
            admin: {
              description: 'Proof of payment uploaded by the customer.',
            },
            label: 'Bank transfer receipt',
            relationTo: 'media',
          },
          {
            name: 'paymentVerified',
            type: 'checkbox',
            admin: {
              description: 'Tick once the funds have been confirmed in the bank account.',
              position: 'sidebar',
            },
            defaultValue: false,
            label: 'Payment verified',
          },
          {
            name: 'event',
            type: 'relationship',
            admin: {
              description:
                'Set when the customer chose to pay and collect at an event. Filter by this to see who is collecting where.',
              position: 'sidebar',
            },
            index: true,
            label: 'Collecting at event',
            relationTo: 'events',
          },
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
        ],
      }),
    },
    payments: {
      // Every adapter is registered at build time; `gatePaymentMethod` is what
      // makes each one switchable from Payment Settings in the admin panel.
      paymentMethods: [
        gatePaymentMethod(
          withDelivery(
            stripeAdapter({
              secretKey: process.env.STRIPE_SECRET_KEY!,
              publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
              webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
            }),
          ),
          'stripe',
        ),
        gatePaymentMethod(withDelivery(bankTransferAdapter()), 'bankTransfer'),
        // Deliberately not wrapped in `withDelivery`: the customer collects in
        // person, so no carrier cost is incurred.
        gatePaymentMethod(payAtEventAdapter(), 'payAtEvent'),
        gatePaymentMethod(
          withDelivery(
            codAdapter({
            label: 'Cash on Delivery',
            // Amounts are in minor units, matching the rest of the shop.
            minimumOrder: 100, // $1.00
            maximumOrder: 50000, // $500.00
            // Only USD is configured in this shop, so listing others would
            // offer COD for a currency that can never be selected.
            supportedCurrencies: ['USD'],
            // `allowedRegions` is intentionally omitted: when absent, COD is
            // offered everywhere. Set it to ISO 3166-1 alpha-2 codes to
            // restrict COD to the countries you actually deliver to.
              serviceChargePercentage: 2, // 2%
              fixedServiceCharge: 50, // $0.50
            }),
          ),
          'cod',
        ),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
  }),
]
