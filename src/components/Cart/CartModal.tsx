'use client'

import { Price } from '@/components/Price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingBag, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'
import { Product } from '@/payload-types'

export function CartModal() {
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  const hasItems = cart && cart.items && cart.items.length > 0

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </SheetTrigger>

      <SheetContent className="flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">My Cart</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {hasItems
                  ? `${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} in your cart`
                  : 'Your cart is empty'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {!hasItems ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div
              className="flex items-center justify-center w-24 h-24 rounded-full"
              style={{ background: 'oklch(38.2% 0.154 255deg / 0.08)' }}
            >
              <ShoppingBag className="w-10 h-10" style={{ color: 'oklch(38.2% 0.154 255deg)' }} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Nothing here yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse our collection and add something you love.
              </p>
            </div>
            <Button
              asChild
              className="mt-2 w-full"
              style={{
                background: 'oklch(51.5% 0.221 351deg)',
                color: 'white',
              }}
            >
              <Link href="/">Browse Collection</Link>
            </Button>
          </div>
        ) : (
          /* ── Cart items ─────────────────────────────────────────────── */
          <div className="flex flex-col flex-1 overflow-hidden">
            <ul className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {cart?.items?.map((item, i) => {
                const product = item.product
                const variant = item.variant

                if (typeof product !== 'object' || !item || !product || !product.slug)
                  return <React.Fragment key={i} />

                const metaImage =
                  product.meta?.image && typeof product.meta?.image === 'object'
                    ? product.meta.image
                    : undefined

                const firstGalleryImage =
                  typeof product.gallery?.[0]?.image === 'object'
                    ? product.gallery?.[0]?.image
                    : undefined

                let image = firstGalleryImage || metaImage
                let price = product.priceInUSD

                const isVariant = Boolean(variant) && typeof variant === 'object'

                if (isVariant) {
                  price = variant?.priceInUSD

                  const imageVariant = product.gallery?.find((galleryItem) => {
                    if (!galleryItem.variantOption) return false
                    const variantOptionID =
                      typeof galleryItem.variantOption === 'object'
                        ? galleryItem.variantOption.id
                        : galleryItem.variantOption

                    const hasMatch = variant?.options?.some((option) => {
                      if (typeof option === 'object') return option.id === variantOptionID
                      else return option === variantOptionID
                    })

                    return hasMatch
                  })

                  if (imageVariant && typeof imageVariant.image === 'object') {
                    image = imageVariant.image
                  }
                }

                return (
                  <li
                    key={i}
                    className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-border relative"
                  >
                    {/* Product image */}
                    <Link
                      href={`/products/${(item.product as Product)?.slug}`}
                      className="shrink-0"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-white">
                        {image?.url && (
                          <Image
                            alt={image?.alt || product?.title || ''}
                            className="h-full w-full object-cover"
                            height={64}
                            src={image.url}
                            width={64}
                          />
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${(item.product as Product)?.slug}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate leading-snug"
                        >
                          {product?.title}
                        </Link>
                        <DeleteItemButton item={item} />
                      </div>

                      {isVariant && variant ? (
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {variant.options
                            ?.map((option) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between mt-2">
                        {typeof price === 'number' && (
                          <span className="text-sm font-bold text-primary">
                            <Price amount={price} />
                          </span>
                        )}
                        <div className="flex items-center rounded-lg border border-border bg-white overflow-hidden">
                          <EditItemQuantityButton item={item} type="minus" />
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <EditItemQuantityButton item={item} type="plus" />
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Checkout footer */}
            <div className="border-t border-border px-6 py-5 flex flex-col gap-4 bg-white">
              {typeof cart?.subtotal === 'number' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <Price
                    amount={cart.subtotal}
                    className="text-base font-bold text-foreground"
                  />
                </div>
              )}

              <Button
                asChild
                className="w-full h-11 font-semibold text-sm tracking-wide"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(51.5% 0.221 351deg) 0%, oklch(45% 0.2 340deg) 100%)',
                  color: 'white',
                }}
              >
                <Link href="/checkout">Proceed to Checkout →</Link>
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Free shipping on orders over $50
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
