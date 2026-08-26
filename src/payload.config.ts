import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Events } from '@/collections/Events'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { cmsEmailAdapter } from '@/email/adapter'
import { testEmailEndpoint } from '@/endpoints/testEmail'
import { uploadReceiptEndpoint } from '@/endpoints/uploadReceipt'
import { DeliverySettings } from '@/globals/DeliverySettings'
import { EmailSettings } from '@/globals/EmailSettings'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { PaymentSettings } from '@/globals/PaymentSettings'
import { ShopSettings } from '@/globals/ShopSettings'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [Users, Pages, Categories, Media, Events],
  db: postgresAdapter({
    // Tuned for serverless: each function instance gets its own pool, so the
    // defaults (10 connections held open per instance) exhaust Postgres under
    // even light concurrency.
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Small enough that many concurrent instances cannot saturate the server,
      // large enough for the parallel queries a single page render issues.
      max: 5,
      // Frozen lambdas should not sit on idle connections.
      idleTimeoutMillis: 10_000,
      // A cold start has to complete TCP, auth and TLS before the first query.
      // The default 0 (no timeout) turns a slow connect into a hung request;
      // anything too tight turns it into an intermittent 500.
      connectionTimeoutMillis: 15_000,
      // Let the process exit once connections go idle instead of holding the
      // instance open.
      allowExitOnIdle: true,
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  // Credentials live in the `emailSettings` global rather than in env vars, so
  // they can be changed from the admin panel without a redeploy.
  email: cmsEmailAdapter,
  endpoints: [testEmailEndpoint, uploadReceiptEndpoint],
  globals: [Header, Footer, ShopSettings, PaymentSettings, DeliverySettings, EmailSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
