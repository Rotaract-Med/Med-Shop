import type { Endpoint } from 'payload'

import type { Order } from '@/payload-types'

const MAX_BYTES = 8 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/heic',
  'image/jpeg',
  'image/png',
  'image/webp',
])

/**
 * POST /api/order-receipt  (multipart/form-data)
 *
 * Fields: `file`, `orderID`, and — for guests — `accessToken`.
 *
 * Lets a customer attach proof of a bank transfer to their own order. The
 * media collection is admin-only for good reason, so this endpoint verifies
 * ownership first and then creates the upload with elevated access rather than
 * loosening `media` for everyone.
 */
export const uploadReceiptEndpoint: Endpoint = {
  handler: async (req) => {
    if (!req.formData) {
      return Response.json({ error: 'Expected a multipart form upload.' }, { status: 400 })
    }

    const form = await req.formData()
    const orderID = form.get('orderID')
    const accessToken = form.get('accessToken')
    const file = form.get('file')

    if (!orderID || typeof orderID !== 'string') {
      return Response.json({ error: 'Missing order.' }, { status: 400 })
    }

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file was uploaded.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: 'That file is larger than 8MB. Please upload a smaller image or PDF.' },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Please upload a JPG, PNG, WEBP, HEIC or PDF.' },
        { status: 400 },
      )
    }

    // Ownership: the signed-in customer, or a guest holding the order's token.
    let order: Order | undefined

    try {
      const { docs } = await req.payload.find({
        collection: 'orders',
        depth: 0,
        limit: 1,
        req,
        where: {
          and: [
            { id: { equals: orderID } },
            req.user
              ? { customer: { equals: req.user.id } }
              : { accessToken: { equals: typeof accessToken === 'string' ? accessToken : '' } },
          ],
        },
      })

      order = docs[0] as Order | undefined
    } catch (err) {
      req.payload.logger.error({ err, msg: '[receipt] Order lookup failed' })
    }

    if (!order) {
      return Response.json({ error: 'Order not found.' }, { status: 404 })
    }

    if (order.paymentVerified) {
      return Response.json(
        { error: 'This payment has already been verified — no receipt is needed.' },
        { status: 409 },
      )
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer())

      const media = await req.payload.create({
        collection: 'media',
        data: { alt: `Payment receipt for order #${order.id}` },
        file: {
          data: buffer,
          mimetype: file.type,
          name: file.name || `receipt-${order.id}`,
          size: file.size,
        },
        // The customer is not an admin; ownership was verified above.
        overrideAccess: true,
        req,
      })

      await req.payload.update({
        id: order.id,
        collection: 'orders',
        data: { paymentReceipt: media.id },
        overrideAccess: true,
        req,
      })

      req.payload.logger.info(`[receipt] Receipt attached to order ${order.id}`)

      return Response.json({ message: 'Receipt uploaded. We will verify your payment shortly.', success: true })
    } catch (err) {
      req.payload.logger.error({ err, msg: `[receipt] Upload failed for order ${orderID}` })

      return Response.json(
        { error: 'We could not save that file. Please try again.' },
        { status: 500 },
      )
    }
  },
  method: 'post',
  // Must NOT begin with a collection slug. Payload resolves `/api/{first}` to a
  // collection when one matches and then only searches *that collection's*
  // endpoints — a root endpoint at `/orders/...` is unreachable.
  path: '/order-receipt',
}
