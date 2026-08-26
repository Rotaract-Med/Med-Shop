import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { PayloadRequest } from 'payload'

import type { DeliverySetting, Order, Product, Variant } from '@/payload-types'

import { calculateDeliveryFee } from '@/utilities/deliveryFee'

export { calculateDeliveryFee }

export async function getDeliverySettings(req: PayloadRequest): Promise<DeliverySetting | null> {
  try {
    return (await req.payload.findGlobal({ slug: 'deliverySettings', req })) as DeliverySetting
  } catch (err) {
    req.payload.logger.error({ err, msg: '[delivery] Could not read delivery settings' })
    return null
  }
}

/** Unit price for a line, preferring the variant when the line refers to one. */
export function resolveUnitPrice(item: {
  product?: null | number | Product
  variant?: null | number | Variant
}): null | number {
  const variant = typeof item.variant === 'object' ? item.variant : null
  const product = typeof item.product === 'object' ? item.product : null

  return variant?.priceInUSD ?? product?.priceInUSD ?? null
}

/**
 * Sums an order's line items from populated products/variants.
 *
 * Requires the order to have been fetched with enough depth to populate them;
 * lines that cannot be priced are skipped rather than counted as zero.
 */
export function sumOrderItems(order: Order): number {
  let total = 0

  for (const item of order.items ?? []) {
    const unit = resolveUnitPrice(item)
    if (typeof unit === 'number') total += unit * item.quantity
  }

  return total
}

/**
 * Adds delivery to the amount a payment method charges, and records the fee on
 * the resulting order.
 *
 * The fee is injected by increasing `cart.subtotal` before delegating, which is
 * the single value every adapter derives its charge from — so Stripe bills the
 * right total and COD applies its service charge to the delivered amount.
 *
 * Wrap only methods that actually ship. Collection at an event must not be
 * wrapped: nothing is dispatched, so no carrier cost applies.
 */
export function withDelivery(adapter: PaymentAdapter): PaymentAdapter {
  return {
    ...adapter,
    confirmOrder: async (args) => {
      const result = await adapter.confirmOrder(args)

      // Recorded after the fact because the adapter owns order creation. The
      // fee is recomputed from the order's own address and items, so the stored
      // breakdown matches what was charged at initiate.
      try {
        const order = (await args.req.payload.findByID({
          id: result.orderID,
          collection: 'orders',
          depth: 2,
          req: args.req,
        })) as Order

        const settings = await getDeliverySettings(args.req)
        const itemsSubtotal = sumOrderItems(order)
        const fee = calculateDeliveryFee(settings, {
          countryCode: order.shippingAddress?.country,
          itemsSubtotal,
        })

        if (fee > 0) {
          await args.req.payload.update({
            id: result.orderID,
            collection: 'orders',
            data: { deliveryFee: fee },
            req: args.req,
          })
        }
      } catch (err) {
        // The customer has already been charged — a bookkeeping failure must
        // not turn a successful payment into a failed checkout.
        args.req.payload.logger.error({
          err,
          msg: `[delivery] Could not record delivery fee on order ${result.orderID}`,
        })
      }

      return result
    },
    initiatePayment: async (args) => {
      const settings = await getDeliverySettings(args.req)
      const itemsSubtotal = args.data.cart?.subtotal ?? 0

      const fee = calculateDeliveryFee(settings, {
        countryCode: args.data.shippingAddress?.country ?? args.data.billingAddress?.country,
        itemsSubtotal,
      })

      if (fee <= 0) return adapter.initiatePayment(args)

      return adapter.initiatePayment({
        ...args,
        data: {
          ...args.data,
          cart: { ...args.data.cart, subtotal: itemsSubtotal + fee },
        },
      })
    },
  }
}
