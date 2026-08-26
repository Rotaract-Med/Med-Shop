import type { Footer } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { LogoIcon } from '@/components/icons/logo'

const { COMPANY_NAME, SITE_NAME } = process.env

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []
  const currentYear = new Date().getFullYear()
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : '')
  const skeleton = 'w-full h-4 animate-pulse rounded bg-slate-200'
  const copyrightName = COMPANY_NAME || SITE_NAME || ''

  return (
    <footer className="bg-slate-50 border-t border-border text-sm text-muted-foreground">
      {/* Mediterranean accent bar */}
      <div
        className="h-1.5"
        style={{
          background:
            'linear-gradient(90deg, oklch(38.2% 0.154 255deg) 0%, oklch(42% 0.18 230deg) 35%, oklch(51.5% 0.221 351deg) 70%, oklch(78.8% 0.174 80deg) 100%)',
        }}
      />

      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {/* Brand column */}
          <div className="flex flex-col gap-5 md:col-span-1">
            <Link href="/" aria-label={SITE_NAME}>
              <LogoIcon className="h-14 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              The official shop of Rotaract Méditerranéen — connecting Rotaractors across the
              Mediterranean since 2023.
            </p>

            {/* Social links */}
            <div className="flex gap-3 mt-1">
              {[
                {
                  href: 'https://www.instagram.com/rotaract_mediterraneen',
                  label: 'Instagram',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  ),
                },
                {
                  href: 'https://www.facebook.com/RotaractMediterraneen',
                  label: 'Facebook',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
              ].map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav links column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
              Quick links
            </h3>
            <Suspense
              fallback={
                <div className="flex flex-col gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={skeleton} />
                  ))}
                </div>
              }
            >
              <FooterMenu menu={menu} />
            </Suspense>
          </div>

          {/* Contact / Info column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
              Rotaract Méditerranéen
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-primary">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                Mediterranean region
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-primary">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <a
                  href="mailto:shop@rotaractmed.org"
                  className="hover:text-primary transition-colors"
                >
                  shop@rotaractmed.org
                </a>
              </li>
            </ul>

            {/* Mission statement */}
            <div
              className="mt-2 p-4 rounded-xl text-xs leading-relaxed"
              style={{ background: 'oklch(38.2% 0.154 255deg / 0.06)' }}
            >
              <span className="font-semibold" style={{ color: 'oklch(38.2% 0.154 255deg)' }}>
                Our mission:
              </span>{' '}
              Uniting Rotaractors across borders through shared values, service, and community.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-5">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span>Connecting communities across the Mediterranean.</span>
            {/* Tri-color dots */}
            <span className="flex gap-1 items-center" aria-hidden="true">
              <span className="w-2 h-2 rounded-full" style={{ background: 'oklch(38.2% 0.154 255deg)' }} />
              <span className="w-2 h-2 rounded-full" style={{ background: 'oklch(51.5% 0.221 351deg)' }} />
              <span className="w-2 h-2 rounded-full" style={{ background: 'oklch(78.8% 0.174 80deg)' }} />
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
