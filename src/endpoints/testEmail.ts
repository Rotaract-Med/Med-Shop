import type { Endpoint } from 'payload'

import type { EmailSetting } from '@/payload-types'

import { checkRole } from '@/access/utilities'
import { resetTransporter } from '@/email/adapter'
import { renderEmailShell, renderPlainText } from '@/email/renderEmail'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * POST /api/email/test
 *
 * Sends a sample email using whatever is currently saved in Email Settings, so
 * SMTP credentials can be verified without placing a real order. Admin only —
 * this endpoint causes outbound mail.
 */
export const testEmailEndpoint: Endpoint = {
  handler: async (req) => {
    if (!req.user || !checkRole(['admin'], req.user)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = (await req.payload.findGlobal({ slug: 'emailSettings', req })) as EmailSetting
    const delivery = settings?.delivery

    const recipient = delivery?.testRecipient || req.user.email

    if (!recipient) {
      return Response.json(
        { error: 'Set a "Send a test email to" address first.' },
        { status: 400 },
      )
    }

    if (!delivery?.enabled) {
      return Response.json(
        { error: 'Turn on "Send emails" and save before testing.' },
        { status: 400 },
      )
    }

    // Credentials may have just been edited — drop the pooled transport so the
    // test genuinely exercises the newly saved values.
    resetTransporter()

    const serverURL = getServerSideURL()
    const siteName = delivery.fromName || process.env.SITE_NAME || 'Shop'

    const heading = 'Your email settings work'
    const bodyParagraphs = [
      'This is a test message sent from your shop admin panel.',
      `If you are reading this, SMTP delivery through <strong>${delivery.host ?? 'your host'}</strong> is configured correctly and order confirmations will reach your customers.`,
    ]

    try {
      await req.payload.sendEmail({
        html: renderEmailShell({
          bodyParagraphs,
          branding: settings?.branding,
          heading,
          previewText: 'Test email from your shop',
          serverURL,
          siteName,
        }),
        subject: `Test email from ${siteName}`,
        text: renderPlainText({ bodyParagraphs, heading }),
        to: recipient,
      })

      return Response.json({ message: `Test email sent to ${recipient}.`, success: true })
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Unknown error'

      req.payload.logger.error({ err, msg: '[email] Test send failed' })

      return Response.json({ error: detail, success: false }, { status: 502 })
    }
  },
  method: 'post',
  path: '/email/test',
}
