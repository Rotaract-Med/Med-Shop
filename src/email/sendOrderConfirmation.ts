import type {
  EmailSetting,
  Order,
  PaymentSetting,
  Product,
  User,
  Variant,
  VariantOption,
} from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

import {
  type EmailLineItem,
  escapeHtml,
  formatAmount,
  interpolate,
  renderEmailShell,
  renderPlainText,
} from './renderEmail'

type Args = {
  orderID: number | string
  payload: Payload
  req?: PayloadRequest
}

/** Human label for a variant, built from its selected options. */
function describeVariant(variant: Variant): string | undefined {
  const options = variant.options?.filter(
    (option): option is VariantOption => typeof option === 'object' && option !== null,
  )

  if (options?.length) {
    return options.map((option) => option.label).filter(Boolean).join(' · ')
  }

  return variant.title ?? undefined
}

function buildLineItems(order: Order): { items: EmailLineItem[] } {
  const items: EmailLineItem[] = []

  for (const item of order.items ?? []) {
    const product = typeof item.product === 'object' ? (item.product as Product) : null
    const variant = typeof item.variant === 'object' ? (item.variant as Variant) : null

    // Variant price wins when the line refers to one, matching how the
    // storefront and the payment intent price the cart.
    const unitPrice = variant?.priceInUSD ?? product?.priceInUSD ?? null

    items.push({
      meta: variant ? describeVariant(variant) : undefined,
      quantity: item.quantity,
      title: product?.title ?? 'Item',
      total:
        typeof unitPrice === 'number'
          ? formatAmount(unitPrice * item.quantity, order.currency ?? 'USD')
          : undefined,
    })
  }

  return { items }
}

function resolveRecipient(order: Order): { email: null | string; name: string } {
  const customer = typeof order.customer === 'object' ? (order.customer as User) : null

  const email = order.customerEmail || customer?.email || null

  const name =
    order.shippingAddress?.firstName ||
    [customer?.name].filter(Boolean).join(' ') ||
    'there'

  return { email, name }
}

/**
 * Sends the order confirmation for a single order.
 *
 * Reads its copy from the `emailSettings` global so an editor can change the
 * wording without a deploy. Never throws — a failed email must not roll back a
 * paid order — but returns the reason so callers can log it.
 */
export async function sendOrderConfirmation({
  orderID,
  payload,
  req,
}: Args): Promise<{ reason?: string; sent: boolean }> {
  let settings: EmailSetting

  try {
    settings = (await payload.findGlobal({ slug: 'emailSettings', req })) as EmailSetting
  } catch (err) {
    payload.logger.error({ err, msg: '[email] Could not load email settings' })
    return { reason: 'settings-unavailable', sent: false }
  }

  const template = settings?.orderConfirmation

  if (template?.enabled === false) {
    return { reason: 'template-disabled', sent: false }
  }

  // depth 2 populates products and variants so the summary can show real names.
  const order = (await payload.findByID({
    id: orderID,
    collection: 'orders',
    depth: 2,
    req,
  })) as Order

  const { email, name } = resolveRecipient(order)

  if (!email) {
    payload.logger.warn(`[email] Order ${order.id} has no email address — confirmation not sent.`)
    return { reason: 'no-recipient', sent: false }
  }

  const serverURL = getServerSideURL()
  const siteName = settings?.delivery?.fromName || process.env.SITE_NAME || 'Shop'
  const total = typeof order.amount === 'number' ? formatAmount(order.amount, order.currency ?? 'USD') : null

  const orderUrl = order.accessToken
    ? `${serverURL}/orders/${order.id}?email=${encodeURIComponent(email)}&accessToken=${order.accessToken}`
    : `${serverURL}/orders/${order.id}`

  const vars: Record<string, string> = {
    customerName: name,
    orderDate: new Date(order.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    orderId: String(order.id),
    orderTotal: total ?? '',
    orderUrl,
    siteName,
  }

  // Populated at depth 2 when the customer chose to pay at an event.
  const event = typeof order.event === 'object' ? order.event : null

  if (event) {
    vars.eventName = event.title
    vars.eventLocation = [event.location, event.address].filter(Boolean).join(', ')
    vars.eventDate = new Date(event.startsAt).toLocaleString('en-GB', {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    })
  }

  // Bank transfer orders carry a reference; pull the bank details so the
  // customer has everything needed to pay without returning to the site.
  const isBankTransfer = Boolean(order.paymentReference)

  if (isBankTransfer) {
    vars.paymentReference = order.paymentReference!

    try {
      const paymentSettings = (await payload.findGlobal({
        slug: 'paymentSettings',
        req,
      })) as PaymentSetting

      const bank = paymentSettings?.bankTransfer?.bankDetails

      vars.bankDetails = [
        bank?.accountHolder,
        bank?.bankName,
        bank?.iban,
        bank?.swift ? `SWIFT ${bank.swift}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    } catch (err) {
      payload.logger.error({ err, msg: '[email] Could not read bank details' })
      vars.bankDetails = ''
    }
  }

  const { items } = buildLineItems(order)
  const showItems = template?.showItems !== false

  // The event notice sits between the intro and the sign-off so the collection
  // details are the first thing read after the summary.
  const paragraphSources = [
    template?.intro,
    event ? template?.eventNotice : null,
    isBankTransfer ? template?.bankTransferNotice : null,
    template?.outro,
  ].filter((text): text is string => Boolean(text))

  const bodyParagraphs = paragraphSources.map((text) => escapeHtml(interpolate(text, vars)))

  const buttonLabel = template?.buttonLabel
  const button = buttonLabel ? { label: interpolate(buttonLabel, vars), url: orderUrl } : null

  const heading = interpolate(template?.heading || 'Thank you for your order', vars)
  const subject = interpolate(template?.subject || 'Order #{{orderId}} confirmed', vars)

  const shellArgs = {
    bodyParagraphs,
    branding: settings?.branding,
    button,
    heading,
    items: showItems ? items : undefined,
    previewText: subject,
    serverURL,
    siteName,
    total: showItems ? total : null,
  }

  try {
    await payload.sendEmail({
      html: renderEmailShell(shellArgs),
      subject,
      text: renderPlainText({
        bodyParagraphs: paragraphSources.map((text) => interpolate(text, vars)),
        button,
        heading,
        items: showItems ? items : undefined,
        total: showItems ? total : null,
      }),
      to: email,
    })

    return { sent: true }
  } catch (err) {
    payload.logger.error({ err, msg: `[email] Order ${order.id} confirmation failed` })
    return { reason: err instanceof Error ? err.message : 'send-failed', sent: false }
  }
}
