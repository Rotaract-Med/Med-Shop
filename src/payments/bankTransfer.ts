import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'
import type { Field, GroupField } from 'payload'

import type { Transaction } from '@/payload-types'

export type BankTransferAdapterArgs = PaymentAdapterArgs

type CartsSlug = 'carts'
type OrdersSlug = 'orders'
type TransactionsSlug = 'transactions'

/**
 * Short, human-quotable reference the customer puts on their transfer so
 * incoming payments can be matched to orders.
 */
function generateReference(): string {
  return `BT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/**
 * Bank transfer payment method.
 *
 * Money moves outside the shop: the order is created immediately as
 * `processing` and stays unpaid until someone checks the bank account. The
 * customer is shown the bank details plus a payment reference, and uploads
 * their receipt afterwards for verification.
 */
export const bankTransferAdapter = (props: BankTransferAdapterArgs = {}): PaymentAdapter => {
  const { fields: fieldsOverride, ...groupOverrides } = props.groupOverrides ?? {}

  const defaultFields: Field[] = [
    {
      name: 'reference',
      type: 'text',
      admin: { readOnly: true },
      label: 'Payment reference',
    },
    {
      name: 'paymentVerified',
      type: 'checkbox',
      admin: {
        description: 'Tick once you have confirmed the funds arrived in the bank account.',
      },
      defaultValue: false,
      label: 'Payment verified',
    },
    {
      name: 'verifiedAt',
      type: 'date',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.paymentVerified),
        date: { pickerAppearance: 'dayAndTime' },
      },
      label: 'Verified on',
    },
  ]

  const group: GroupField = {
    name: 'bankTransfer',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'bankTransfer',
    },
    label: 'Bank transfer',
    ...groupOverrides,
    fields: fieldsOverride ? fieldsOverride({ defaultFields }) : defaultFields,
  }

  return {
    name: 'bankTransfer',
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
        throw new Error('Missing payment reference.')
      }

      const { docs } = await payload.find({
        collection: transactionsSlug as TransactionsSlug,
        req,
        where: { 'bankTransfer.reference': { equals: reference } },
      })

      const transaction = docs[0] as Transaction | undefined

      if (!transaction) {
        throw new Error('No pending order found for that reference.')
      }

      const cartID = typeof transaction.cart === 'object' ? transaction.cart?.id : transaction.cart

      if (!cartID) throw new Error('Cart not found for this order.')

      if (!Array.isArray(transaction.items) || transaction.items.length === 0) {
        throw new Error('This order has no items.')
      }

      const order = await payload.create({
        collection: ordersSlug as OrdersSlug,
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          ...(req.user ? { customer: req.user.id } : { customerEmail: data.customerEmail }),
          items: transaction.items,
          paymentReference: reference,
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
        data: { order: order.id },
        req,
      })

      return {
        // Returned so a guest can be given a durable link back to their order
        // (to upload the receipt) without depending on the email arriving.
        accessToken: order.accessToken,
        message: 'Order placed. Please complete your bank transfer and upload the receipt.',
        orderID: order.id,
        reference,
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
          bankTransfer: { paymentVerified: false, reference },
          billingAddress,
          cart: cart.id,
          currency: currency.toUpperCase() as Transaction['currency'],
          items,
          paymentMethod: 'bankTransfer',
          status: 'pending',
        },
        req,
      })

      return {
        amount,
        message: 'Order ready to confirm.',
        reference,
      }
    },
    label: props.label ?? 'Bank transfer',
  }
}
