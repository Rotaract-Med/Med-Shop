import { ShoppingCart } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
  [key: string]: unknown
}) {
  return (
    <button
      aria-label={`Cart${quantity ? ` (${quantity} items)` : ''}`}
      className="relative flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
      {...rest}
    >
      <ShoppingCart className="h-5 w-5" />
      {quantity ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
          {quantity > 9 ? '9+' : quantity}
        </span>
      ) : null}
    </button>
  )
}
