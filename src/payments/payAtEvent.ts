import type {
  PaymentAdapter,
  PaymentAdapterArgs,
} from '@payloadcms/plugin-ecommerce/types'
import type { Field, GroupField } from 'payload'

import type { Event, Transaction } from '@/payload-types'

export type PayAtEventAdapterArgs = PaymentAdapterArgs

/**
 * The plugin passes collection slugs in as configurable strings, which widens
 * Payload's `collection` parameter to a union of every slug and erases the
 * document types. These aliases pin them back to the collections this adapter
 * actually works with, so `data` and query results stay type-checked.
 */
type CartsSlug = 'carts'
type OrdersSlug = 'orders'
type TransactionsSlug = 'transactions'

/** Reference stored on the transaction so `confirmOrder` can find it again. */
function generateReference(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`
}

/**
 * Loads the chosen event and rejects anything a customer should not be able to
 * pick. The client only ever shows valid options, but the endpoint is public,
 * so every rule is re-checked here.
 */
async function loadSelectableEvent(
  req: Parameters<PaymentAdapter['confirmOrder']>[0]['req'],
  eventID: unknown,
): Promise<Event> {
  if (!eventID || (typeof eventID !== 'string' && typeof eventID !== 'number')) {
    throw new Error('Please choose the event you will attend.')
  }

  let event: Event

  try {
    event = (await req.payload.findByID({
      id: eventID,
      collection: 'events',
      depth: 0,
      req,
    })) as Event
  } catch {
    throw new Error('That event could not be found.')
  }

  if (event._status !== 'published') {
    throw new Error('That event is not available.')
  }

  if (event.acceptOrders === false) {
    throw new Error(`${event.title} is no longer accepting orders.`)
  }

  if (event.startsAt && new Date(event.startsAt).getTime() < Date.now()) {
    throw new Error(`${event.title} has already taken place.`)
  }

  return event
}

/**
 * "Pay & collect at an event" payment method.
 *
 * Takes no money online: the order is created immediately with status
 * `processing`, and the customer pays in person at the event they select. The
 * transaction records which event, so staff can see who is collecting where.
 */
export const payAtEventAdapter = (props: PayAtEventAdapterArgs = {}): PaymentAdapter => {
  const { fields: fieldsOverride, ...groupOverrides } = props.groupOverrides ?? {}

  const defaultFields: Field[] = [
    {
      name: 'reference',
      type: 'text',
      admin: { readOnly: true },
      label: 'Collection reference',
    },
    {
      name: 'event',
      type: 'relationship',
      label: 'Collecting at',
      relationTo: 'events',
    },
    {
      name: 'paymentCollected',
      type: 'checkbox',
      defaultValue: false,
      label: 'Payment collected in person',
    },
    {
      name: 'collectedAt',
      type: 'date',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.paymentCollected),
        date: { pickerAppearance: 'dayAndTime' },
      },
      label: 'Collected on',
    },
  ]

  const group: GroupField = {
    name: 'payAtEvent',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'payAtEvent',
    },
    label: 'Pay at event',
    ...groupOverrides,
    fields: fieldsOverride ? fieldsOverride({ defaultFields }) : defaultFields,
  }

  return {
    name: 'payAtEvent',
    confirmOrder: async ({
      cartsSlug = 'carts',
      data,
      ordersSlug = 'orders',
      req,
      transactionsSlug = 'transactions',
    }) => {
      const { payload } = req
      const reference = data.reference

      if (!reference) {
        throw new Error('Missing collection reference.')
      }

      // The event arrives here rather than at initiate: the plugin's initiate
      // endpoint builds a fixed `data` object and drops extra client fields,
      // whereas confirm-order spreads them through.
      const event = await loadSelectableEvent(req, data.eventID)

      const { docs: transactions } = await payload.find({
        collection: transactionsSlug as TransactionsSlug,
        req,
        where: { 'payAtEvent.reference': { equals: reference } },
      })

      const transaction = transactions[0] as Transaction | undefined

      if (!transaction) {
        throw new Error('No pending order found for that reference.')
      }

      const cartID = typeof transaction.cart === 'object' ? transaction.cart?.id : transaction.cart

      if (!cartID) {
        throw new Error('Cart not found for this order.')
      }

      if (!Array.isArray(transaction.items) || transaction.items.length === 0) {
        throw new Error('This order has no items.')
      }

      const order = await payload.create({
        collection: ordersSlug as OrdersSlug,
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          ...(req.user ? { customer: req.user.id } : { customerEmail: data.customerEmail }),
          event: event.id,
          items: transaction.items,
          shippingAddress: transaction.billingAddress,
          status: 'processing',
          transactions: [transaction.id],
        },
        req,
      })

      await payload.update({
        id: cartID,
        collection: cartsSlug as CartsSlug,
        data: { purchasedAt: new Date().toISOString() },
        req,
      })

      await payload.update({
        id: transaction.id,
        collection: transactionsSlug as TransactionsSlug,
        data: {
          order: order.id,
          payAtEvent: {
            ...(transaction.payAtEvent ?? {}),
            event: event.id,
            reference,
          },
        },
        req,
      })

      return {
        accessToken: order.accessToken,
        message: `Order confirmed. Pay when you collect at ${event.title}.`,
        orderID: order.id,
        transactionID: transaction.id,
      }
    },
    group,
    initiatePayment: async ({ data, req, transactionsSlug }) => {
      const { payload } = req
      const { billingAddress, cart, currency, customerEmail } = data

      if (!currency) throw new Error('Currency is required.')
      if (!cart?.items?.length) throw new Error('Your cart is empty.')
      if (!customerEmail || typeof customerEmail !== 'string') {
        throw new Error('A valid email address is required to place an order.')
      }

      const amount = cart.subtotal

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('A valid order amount is required.')
      }

      // Flattened to IDs so the snapshot survives later product edits, matching
      // how the Stripe and COD adapters store cart contents.
      const items = cart.items.map((item) => {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined

        return {
          product: productID,
          quantity: item.quantity,
          ...(variantID ? { variant: variantID } : {}),
        }
      })

      const reference = generateReference()

      await payload.create({
        collection: transactionsSlug as TransactionsSlug,
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          billingAddress,
          cart: cart.id,
          currency: currency.toUpperCase() as Transaction['currency'],
          items,
          paymentMethod: 'payAtEvent',
          payAtEvent: { paymentCollected: false, reference },
          status: 'pending',
        },
        req,
      })

      return {
        message: 'Order ready to confirm.',
        reference,
      }
    },
    label: props.label ?? 'Pay & collect at an event',
  }
}
