import { canUseDOM } from './canUseDOM'

export const getServerSideURL = () => {
  const configured = process.env.NEXT_PUBLIC_SERVER_URL
  const vercelURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined

  // A localhost value left behind in a deployed environment is always a
  // mistake: it yields unreachable links in emails and broken OG images. When
  // we can tell we are deployed, prefer the real host over it.
  const configuredIsLocal = Boolean(configured && /localhost|127\.0\.0\.1/.test(configured))

  if (configured && !(configuredIsLocal && vercelURL)) return configured
  if (vercelURL) return vercelURL

  return 'http://localhost:3000'
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
