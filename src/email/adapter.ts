import type { EmailAdapter, SendEmailOptions } from 'payload'

import nodemailer, { type Transporter } from 'nodemailer'

import type { EmailSetting } from '@/payload-types'

/**
 * Thrown when delivery is switched on but the SMTP settings are unusable.
 * Callers can catch this to show a real error instead of a false success.
 */
export class EmailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailNotConfiguredError'
  }
}

type Delivery = NonNullable<EmailSetting['delivery']>

/**
 * Transports are expensive to build and hold a connection pool, so we cache one
 * per credential set. Changing any credential in the CMS produces a new key and
 * transparently replaces the cached transport.
 */
let cached: { key: string; transporter: Transporter } | null = null

function credentialKey(delivery: Delivery): string {
  return [
    delivery.host,
    delivery.port,
    delivery.secure ? '1' : '0',
    delivery.username,
    delivery.password,
  ].join('|')
}

function getTransporter(delivery: Delivery): Transporter {
  const key = credentialKey(delivery)

  if (cached?.key === key) return cached.transporter

  const transporter = nodemailer.createTransport({
    auth: {
      pass: delivery.password!,
      user: delivery.username!,
    },
    host: delivery.host!,
    port: delivery.port ?? 465,
    secure: delivery.secure ?? true,
  })

  cached = { key, transporter }

  return transporter
}

/** Clears the cached transport. Exposed for the test-send endpoint. */
export function resetTransporter(): void {
  cached = null
}

function describeRecipients(to: SendEmailOptions['to']): string {
  if (!to) return 'unknown recipient'
  if (typeof to === 'string') return to
  if (Array.isArray(to)) return to.map((item) => (typeof item === 'string' ? item : item.address)).join(', ')
  return to.address
}

/**
 * Email adapter backed by the `emailSettings` global rather than by build-time
 * config, so SMTP credentials can be changed in the admin panel without a
 * redeploy. `sendEmail` runs per message, which is what makes this possible.
 */
export const cmsEmailAdapter: EmailAdapter = ({ payload }) => ({
  defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@localhost',
  defaultFromName: process.env.EMAIL_FROM_NAME || 'Shop',
  name: 'cms-nodemailer',
  sendEmail: async (message) => {
    let settings: EmailSetting | null = null

    try {
      settings = (await payload.findGlobal({ slug: 'emailSettings' })) as EmailSetting
    } catch (err) {
      payload.logger.error({ err, msg: 'Could not read email settings' })
    }

    const delivery = settings?.delivery
    const recipients = describeRecipients(message.to)

    // Delivery switched off: log the message so local development still shows
    // what would have been sent, and report it as skipped.
    if (!delivery?.enabled) {
      payload.logger.info(
        `[email] Delivery is disabled — not sending "${message.subject}" to ${recipients}. Enable it in Email Settings.`,
      )
      return { skipped: true }
    }

    const missing = (['host', 'username', 'password'] as const).filter((field) => !delivery[field])

    if (missing.length) {
      throw new EmailNotConfiguredError(
        `Email delivery is enabled but these SMTP settings are missing: ${missing.join(', ')}. Set them in Email Settings.`,
      )
    }

    const fromAddress = delivery.fromAddress || delivery.username!
    const fromName = delivery.fromName || 'Shop'

    try {
      const info = await getTransporter(delivery).sendMail({
        ...message,
        // The CMS value always wins, deliberately. Payload's own auth emails
        // (forgot-password, verification) hardcode `from` from
        // `defaultFromAddress`, which is captured at init and therefore cannot
        // come from the database. Gmail also rejects or silently rewrites any
        // From that is not the authenticated account or a verified alias, so
        // honouring a caller-supplied address would break delivery.
        from: `"${fromName}" <${fromAddress}>`,
        ...(delivery.replyTo ? { replyTo: message.replyTo ?? delivery.replyTo } : {}),
      })

      payload.logger.info(`[email] Sent "${message.subject}" to ${recipients}`)

      return info
    } catch (err) {
      // A bad App Password shows up here — surface it clearly rather than
      // letting nodemailer's terse "Invalid login" reach the UI unexplained.
      payload.logger.error({
        err,
        msg: `[email] Failed to send "${message.subject}" to ${recipients}`,
      })
      throw err
    }
  },
})
