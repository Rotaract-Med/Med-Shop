'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { CheckCircle2, Upload } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  /** Guests must supply the order's access token; signed-in customers do not. */
  accessToken?: string
  className?: string
  /** Set when a receipt is already attached. */
  initiallyUploaded?: boolean
  orderID: number | string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,application/pdf'

/**
 * Attaches proof of a bank transfer to an order. Posts to the ownership-checked
 * `/api/order-receipt` endpoint rather than to `media`, which is admin-only.
 */
export const ReceiptUpload: React.FC<Props> = ({
  accessToken,
  className,
  initiallyUploaded = false,
  orderID,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploaded, setUploaded] = useState(initiallyUploaded)
  const [error, setError] = useState<null | string>(null)

  const onFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setError(null)

      const body = new FormData()
      body.append('file', file)
      body.append('orderID', String(orderID))
      if (accessToken) body.append('accessToken', accessToken)

      try {
        const res = await fetch('/api/order-receipt', {
          body,
          credentials: 'include',
          method: 'POST',
        })

        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          errors?: { message?: string }[]
          message?: string
        }

        if (res.ok) {
          setUploaded(true)
          toast.success(data.message ?? 'Receipt uploaded.')
        } else {
          // Payload's own failures use `message` or `errors[].message`; only our
          // endpoint uses `error`. Reading all three means a misrouted request
          // reports why instead of a bare "Upload failed".
          const reason =
            data.error ??
            data.errors?.[0]?.message ??
            data.message ??
            `Upload failed (HTTP ${res.status}).`

          setError(reason)
          toast.error(reason)
        }
      } catch {
        setError('We could not reach the server. Please try again.')
      } finally {
        setIsUploading(false)
      }
    },
    [accessToken, orderID],
  )

  if (uploaded) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-4 text-sm',
          className,
        )}
      >
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-success" />
        <span>Receipt received — we will verify your payment shortly.</span>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border p-4', className)}>
      <p className="mb-1 font-medium">Upload your transfer receipt</p>
      <p className="mb-4 text-sm text-muted-foreground">
        A screenshot or PDF from your bank. JPG, PNG, WEBP, HEIC or PDF, up to 8MB.
      </p>

      <input
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onFile(file)
        }}
        ref={inputRef}
        type="file"
      />

      <Button
        disabled={isUploading}
        onClick={(e) => {
          e.preventDefault()
          inputRef.current?.click()
        }}
        type="button"
        variant="outline"
      >
        <Upload aria-hidden="true" className="h-4 w-4" />
        {isUploading ? 'Uploading…' : 'Choose file'}
      </Button>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </div>
  )
}
