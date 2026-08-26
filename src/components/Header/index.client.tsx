'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

import { LogoIcon } from '@/components/icons/logo'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'
import { useAuth } from '@/providers/Auth'
import { User } from 'lucide-react'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30">
      {/* ── Announcement ribbon ──────────────────────────────────────── */}
      <div
        className="text-white text-xs text-center py-2 font-medium tracking-wide"
        style={{
          background:
            'linear-gradient(90deg, oklch(38.2% 0.154 255deg) 0%, oklch(42% 0.18 230deg) 40%, oklch(51.5% 0.221 351deg) 100%)',
        }}
      >
        Official Rotaract Méditerranéen merchandise&nbsp;·&nbsp;Connecting communities since 2023
      </div>

      {/* ── Main nav ─────────────────────────────────────────────────── */}
      <nav className="bg-white/96 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex items-center justify-between container h-16 gap-4">
          {/* Mobile menu toggle */}
          <div className="block flex-none md:hidden">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>
          </div>

          {/* Logo */}
          <Link
            className="flex items-center shrink-0"
            href=""
            aria-label="Rotaract Méditerranéen Shop"
          >
            <LogoIcon className="h-24 w-auto" />
          </Link>

          {/* Desktop nav */}
          {menu.length ? (
            <ul className="hidden gap-1 md:flex items-center flex-1 ml-4">
              {menu.map((item) => {
                const isActive =
                  item.link.url && item.link.url !== '/' && pathname.includes(item.link.url)
                return (
                  <li key={item.id}>
                    <CMSLink
                      {...item.link}
                      size="clear"
                      className={cn(
                        'relative text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200',
                        isActive
                          ? 'text-primary bg-primary/8 font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                      appearance="nav"
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex-1" />
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Account icon */}
            <Link
              href={user ? '/account' : '/login'}
              aria-label={user ? 'My account' : 'Log in'}
              className="hidden md:flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        </div>
      </nav>
    </header>
  )
}
