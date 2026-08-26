'use client'

import React, { useCallback, useState } from 'react'

type Status = { message: string; tone: 'error' | 'success' } | null

/**
 * Renders inside the Email Settings global as a `ui` field. Posts to
 * `/api/email/test`, which sends a sample email using the saved SMTP settings.
 */
export const TestEmailButton: React.FC = () => {
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const onClick = useCallback(async () => {
    setIsSending(true)
    setStatus(null)

    try {
      const res = await fetch('/api/email/test', {
        credentials: 'include',
        method: 'POST',
      })

      const data = (await res.json()) as { error?: string; message?: string }

      if (res.ok) {
        setStatus({ message: data.message ?? 'Test email sent.', tone: 'success' })
      } else {
        setStatus({ message: data.error ?? 'Could not send the test email.', tone: 'error' })
      }
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Could not reach the server.',
        tone: 'error',
      })
    } finally {
      setIsSending(false)
    }
  }, [])

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <button
        className="btn btn--style-secondary btn--size-small"
        disabled={isSending}
        onClick={onClick}
        style={{ margin: 0 }}
        type="button"
      >
        {isSending ? 'Sending…' : 'Send test email'}
      </button>

      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>
        Save your changes first — the test uses the settings stored in the database, not the
        unsaved values on screen.
      </p>

      {status ? (
        <p
          style={{
            color: status.tone === 'success' ? 'var(--theme-success-500)' : 'var(--theme-error-500)',
            fontSize: '0.85rem',
            margin: '0.5rem 0 0',
          }}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  )
}
