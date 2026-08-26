'use client'

import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Check, Loader2, Plus } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  className?: string
  productID: number
  productTitle: string
}

/**
 * One-tap add to cart from the grid. Only rendered for products without
 * variants — a product with variants needs a choice, so its card links through
 * to the detail page instead.
 */
export const QuickAddButton: React.FC<Props> = ({ className, productID, productTitle }) => {
  const { addItem, cart, isLoading } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const isInCart = useMemo(
    () =>
      Boolean(
        cart?.items?.some((item) => {
          const id = typeof item.product === 'object' ? item.product?.id : item.product
          return String(id) === String(productID) && !item.variant
        }),
      ),
    [cart?.items, productID],
  )

  const onClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // The card title is a stretched link covering this button's parent.
      event.preventDefault()
      event.stopPropagation()

      setIsAdding(true)

      try {
        await addItem({ product: productID })
        toast.success(`${productTitle} added to cart.`)
      } catch {
        toast.error('Could not add that to your cart. Please try again.')
      } finally {
        setIsAdding(false)
      }
    },
    [addItem, productID, productTitle],
  )

  const busy = isAdding || isLoading

  return (
    <button
      aria-label={isInCart ? `${productTitle} is in your cart` : `Add ${productTitle} to cart`}
      className={cn(
        'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-200 disabled:cursor-wait disabled:opacity-70',
        isInCart
          ? 'bg-success text-white'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
        className,
      )}
      disabled={busy}
      onClick={onClick}
      type="button"
    >
      {busy ? (
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
      ) : isInCart ? (
        <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
      ) : (
        <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
      )}
    </button>
  )
}
