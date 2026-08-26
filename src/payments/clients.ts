import type { PaymentAdapterClient, PaymentAdapterClientArgs } from '@payloadcms/plugin-ecommerce/types'

/**
 * Client-side descriptors for the custom payment methods.
 *
 * `EcommerceProvider` keeps its own registry, and `usePayments()` refuses to
 * call `/api/payments/{name}/…` for a method missing from it — that is the
 * "Payment method with ID … not found" error. These must stay in sync with the
 * server adapters registered in `@/plugins`.
 *
 * Deliberately free of server imports so nothing from the adapters is pulled
 * into the client bundle. Whether a method is actually *offered* is decided by
 * Payment Settings, enforced server-side in `gatePaymentMethod`.
 */

export const payAtEventAdapterClient = (
  props?: PaymentAdapterClientArgs,
): PaymentAdapterClient => ({
  name: 'payAtEvent',
  confirmOrder: true,
  initiatePayment: true,
  label: props?.label || 'Pay & collect at an event',
})

export const bankTransferAdapterClient = (
  props?: PaymentAdapterClientArgs,
): PaymentAdapterClient => ({
  name: 'bankTransfer',
  confirmOrder: true,
  initiatePayment: true,
  label: props?.label || 'Bank transfer',
})
