import type { EmailSetting, Media } from '@/payload-types'

type Branding = NonNullable<EmailSetting['branding']>

/**
 * Brand palette as literal hex. Email clients do not support CSS custom
 * properties or `oklch()`, so the tokens in `globals.css` cannot be reused here.
 * Keep these in sync with `:root` in `src/app/(app)/globals.css`.
 */
const palette = {
  azure: '#0050a2',
  cranberry: '#d41367',
  gold: '#f7a81b',
  ink: '#111827',
  midnight: '#0b1b3d',
  muted: '#6b7280',
  page: '#f4f6f9',
  rule: '#e5e7eb',
} as const

const headerColors: Record<string, string> = {
  azure: palette.azure,
  cranberry: palette.cranberry,
  midnight: palette.midnight,
}

const buttonColors: Record<string, { bg: string; text: string }> = {
  azure: { bg: palette.azure, text: '#ffffff' },
  cranberry: { bg: palette.cranberry, text: '#ffffff' },
  gold: { bg: palette.gold, text: '#241a00' },
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Substitutes `{{token}}` placeholders. Unknown tokens are deliberately left
 * in place — a visible `{{oderId}}` in a test send is far easier to debug than
 * a silently empty string in a live email.
 */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token: string) =>
    token in vars ? vars[token]! : match,
  )
}

/** Formats a minor-unit amount (Stripe cents) as a currency string. */
export function formatAmount(minorUnits: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { currency, style: 'currency' }).format(minorUnits / 100)
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`
  }
}

export type EmailLineItem = {
  meta?: string
  quantity: number
  title: string
  total?: string
}

type ShellArgs = {
  branding?: Branding | null
  bodyParagraphs: string[]
  button?: { label: string; url: string } | null
  heading: string
  items?: EmailLineItem[]
  previewText?: string
  serverURL: string
  siteName: string
  total?: null | string
}

function resolveLogoURL(branding: Branding | null | undefined, serverURL: string): null | string {
  const logo = branding?.logo
  if (!logo || typeof logo !== 'object') return null

  const media = logo as Media
  if (!media.url) return null

  // Email clients need an absolute URL — relative paths render as broken images.
  return media.url.startsWith('http') ? media.url : `${serverURL}${media.url}`
}

/**
 * Renders the branded HTML shell.
 *
 * Table-based with inline styles on purpose: Outlook's Word rendering engine
 * ignores flexbox, grid, and most `<style>` rules, so this is the only layout
 * that survives across clients.
 */
export function renderEmailShell(args: ShellArgs): string {
  const {
    bodyParagraphs,
    branding,
    button,
    heading,
    items,
    previewText,
    serverURL,
    siteName,
    total,
  } = args

  const headerColor = headerColors[branding?.headerColor ?? 'azure'] ?? palette.azure
  const buttonColor = buttonColors[branding?.buttonColor ?? 'azure'] ?? buttonColors.azure!
  const logoURL = resolveLogoURL(branding, serverURL)

  const paragraphs = bodyParagraphs
    .filter(Boolean)
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${palette.ink};">${text}</p>`,
    )
    .join('')

  const itemRows = (items ?? [])
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${palette.rule};font-size:14px;color:${palette.ink};">
            <strong style="font-weight:600;">${escapeHtml(item.title)}</strong>
            ${item.meta ? `<br /><span style="font-size:13px;color:${palette.muted};">${escapeHtml(item.meta)}</span>` : ''}
          </td>
          <td align="center" style="padding:12px 8px;border-bottom:1px solid ${palette.rule};font-size:14px;color:${palette.muted};white-space:nowrap;">
            &times;${item.quantity}
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${palette.rule};font-size:14px;color:${palette.ink};white-space:nowrap;">
            ${item.total ? escapeHtml(item.total) : ''}
          </td>
        </tr>`,
    )
    .join('')

  const itemsTable = itemRows
    ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px;border-collapse:collapse;">
        ${itemRows}
        ${
          total
            ? `<tr>
                 <td colspan="2" style="padding:16px 0 0;font-size:15px;font-weight:700;color:${palette.ink};">Total</td>
                 <td align="right" style="padding:16px 0 0;font-size:15px;font-weight:700;color:${palette.ink};white-space:nowrap;">${escapeHtml(total)}</td>
               </tr>`
            : ''
        }
      </table>`
    : ''

  // "Bulletproof" button: a table cell with a background colour, so it renders
  // in clients that strip padding or background from anchors.
  const buttonHtml = button
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
        <tr>
          <td align="center" bgcolor="${buttonColor.bg}" style="border-radius:9999px;">
            <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:${buttonColor.text};text-decoration:none;border-radius:9999px;">${escapeHtml(button.label)}</a>
          </td>
        </tr>
      </table>`
    : ''

  const footerBits = [
    branding?.footerText ? escapeHtml(branding.footerText) : '',
    branding?.supportEmail
      ? `Questions? Write to <a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:${palette.azure};">${escapeHtml(branding.supportEmail)}</a>.`
      : '',
  ].filter(Boolean)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${palette.page};-webkit-font-smoothing:antialiased;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>` : ''}
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${palette.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr>
          <td align="center" bgcolor="${headerColor}" style="padding:28px 24px;">
            ${
              logoURL
                ? `<img src="${escapeHtml(logoURL)}" alt="${escapeHtml(siteName)}" height="40" style="display:block;height:40px;width:auto;border:0;" />`
                : `<span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">${escapeHtml(siteName)}</span>`
            }
          </td>
        </tr>
        <tr>
          <td style="height:4px;background-color:${palette.gold};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:800;color:${palette.ink};">${escapeHtml(heading)}</h1>
            ${paragraphs}
            ${itemsTable}
            ${buttonHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 32px;">
            <div style="border-top:1px solid ${palette.rule};padding-top:20px;font-size:12px;line-height:1.6;color:${palette.muted};">
              ${footerBits.join('<br />')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

/** Plain-text alternative. Improves deliverability and serves text-only clients. */
export function renderPlainText(args: {
  bodyParagraphs: string[]
  button?: { label: string; url: string } | null
  heading: string
  items?: EmailLineItem[]
  total?: null | string
}): string {
  const lines: string[] = [args.heading, '']

  for (const paragraph of args.bodyParagraphs.filter(Boolean)) {
    lines.push(paragraph.replace(/<[^>]+>/g, ''), '')
  }

  if (args.items?.length) {
    for (const item of args.items) {
      lines.push(
        `- ${item.title}${item.meta ? ` (${item.meta})` : ''} x${item.quantity}${item.total ? ` — ${item.total}` : ''}`,
      )
    }
    lines.push('')
  }

  if (args.total) lines.push(`Total: ${args.total}`, '')
  if (args.button) lines.push(`${args.button.label}: ${args.button.url}`, '')

  return lines.join('\n')
}
