import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { PayloadRequest } from 'payload'

import type { PaymentSetting } from '@/payload-types'

export type GatedMethodKey = 'bankTransfer' | 'cod' | 'payAtEvent' | 'stripe'

/**
 * Reads the CMS switch for a payment method.
 *
 * Defaults to enabled when the global has never been saved, so installing this
 * feature does not silently disable an already-working checkout.
 */
export async function isMethodEnabled(
  req: PayloadRequest,
  key: GatedMethodKey,
): Promise<boolean> {
  try {
    const settings = (await req.payload.findGlobal({
      slug: 'paymentSettings',
      req,
    })) as PaymentSetting

    return settings?.[key]?.enabled !== false
  } catch (err) {
    req.payload.logger.error({ err, msg: `[payments] Could not read payment settings for ${key}` })
    return true
  }
}

/**
 * Wraps a payment adapter so a method disabled in the CMS cannot be used.
 *
 * Hiding a method in the checkout UI is presentation, not enforcement — the
 * `/api/payments/{name}/initiate` and `/confirm-order` endpoints are public, so
 * the check has to live here too.
 */
export function gatePaymentMethod(adapter: PaymentAdapter, key: GatedMethodKey): PaymentAdapter {
  return {
    ...adapter,
    confirmOrder: async (args) => {
      if (!(await isMethodEnabled(args.req, key))) {
        throw new Error(`The "${adapter.label ?? key}" payment method is not currently available.`)
      }

      return adapter.confirmOrder(args)
    },
    initiatePayment: async (args) => {
      if (!(await isMethodEnabled(args.req, key))) {
        throw new Error(`The "${adapter.label ?? key}" payment method is not currently available.`)
      }

      return adapter.initiatePayment(args)
    },
  }
}
