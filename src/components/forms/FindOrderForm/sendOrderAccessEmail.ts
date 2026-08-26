'use server'

import type { EmailSetting } from '@/payload-types'

import {
  escapeHtml,
  interpolate,
  renderEmailShell,
  renderPlainText,
} from '@/email/renderEmail'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type SendOrderAccessEmailArgs = {
  email: string
  orderID: string
}

type SendOrderAccessEmailResult = {
  error?: string
  success: boolean
}

export async function sendOrderAccessEmail({
  email,
  orderID,
}: SendOrderAccessEmailArgs): Promise<SendOrderAccessEmailResult> {
  const payload = await getPayload({ config: configPromise })

  try {
    const { docs: orders } = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      where: {
        and: [{ id: { equals: orderID } }, { customerEmail: { equals: email } }],
      },
    })

    const order = orders[0]

    // Deliberately reported as success: telling a stranger that an order does
    // not exist would let them probe for valid order/email pairs.
    if (!order || !order.accessToken) {
      return { success: true }
    }

    const settings = (await payload.findGlobal({ slug: 'emailSettings' })) as EmailSetting
    const template = settings?.orderAccess

    if (template?.enabled === false) {
      return { error: 'Order access emails are currently disabled.', success: false }
    }

    const serverURL = getServerSideURL()
    const siteName = settings?.delivery?.fromName || process.env.SITE_NAME || 'Shop'
    const orderUrl = `${serverURL}/orders/${order.id}?email=${encodeURIComponent(email)}&accessToken=${order.accessToken}`

    const vars: Record<string, string> = {
      customerName: order.shippingAddress?.firstName || 'there',
      orderId: String(order.id),
      orderUrl,
      siteName,
    }

    const heading = interpolate(template?.heading || 'View your order', vars)
    const subject = interpolate(template?.subject || 'Access your order #{{orderId}}', vars)
    const intro = template?.intro || 'Use the button below to view your order details.'
    const buttonLabel = interpolate(template?.buttonLabel || 'View my order', vars)

    const button = { label: buttonLabel, url: orderUrl }

    await payload.sendEmail({
      html: renderEmailShell({
        bodyParagraphs: [escapeHtml(interpolate(intro, vars))],
        branding: settings?.branding,
        button,
        heading,
        previewText: subject,
        serverURL,
        siteName,
      }),
      subject,
      text: renderPlainText({
        bodyParagraphs: [interpolate(intro, vars)],
        button,
        heading,
      }),
      to: email,
    })

    return { success: true }
  } catch (err) {
    // Previously this returned success regardless, so the form told customers
    // to check an inbox that would never receive anything.
    payload.logger.error({ err, msg: 'Failed to send order access email' })

    return {
      error: 'We could not send that email right now. Please try again shortly.',
      success: false,
    }
  }
}
