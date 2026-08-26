'use client'

import { cn } from '@/utilities/cn'
import { CalendarDays, Check, MapPin } from 'lucide-react'
import React from 'react'

export type CheckoutBankDetails = {
  accountHolder?: null | string
  bankName?: null | string
  iban?: null | string
  instructions?: null | string
  swift?: null | string
}

export type CheckoutPaymentOption = {
  bankDetails?: CheckoutBankDetails | null
  description?: null | string
  label: string
  name: 'bankTransfer' | 'cod' | 'payAtEvent' | 'stripe'
  order: number
  requiresEvent?: boolean
  skipsDelivery?: boolean
}

export type CheckoutEvent = {
  description?: null | string
  id: number
  location: string
  startsAt: string
  title: string
}

type Props = {
  disabled?: boolean
  eventFieldLabel: string
  events: CheckoutEvent[]
  heading: string
  noEventsMessage: string
  onSelectEvent: (id: number) => void
  onSelectMethod: (name: CheckoutPaymentOption['name']) => void
  options: CheckoutPaymentOption[]
  selectedEventID: null | number
  selectedMethod: CheckoutPaymentOption['name'] | null
}

function formatEventDate(value: string): string {
  const date = new Date(value)

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    weekday: 'short',
  })
}

export const PaymentMethodSelector: React.FC<Props> = ({
  disabled = false,
  eventFieldLabel,
  events,
  heading,
  noEventsMessage,
  onSelectEvent,
  onSelectMethod,
  options,
  selectedEventID,
  selectedMethod,
}) => {
  if (!options.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No payment methods are currently available. Please contact us to complete your order.
      </div>
    )
  }

  return (
    <fieldset disabled={disabled} className={cn(disabled && 'opacity-60')}>
      <legend className="mb-4 text-3xl font-medium">{heading}</legend>

      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const isSelected = selectedMethod === option.name
          const showEvents = isSelected && option.requiresEvent
          const bank = option.bankDetails
          const showBank =
            isSelected &&
            option.name === 'bankTransfer' &&
            Boolean(bank?.accountHolder || bank?.iban || bank?.bankName)

          return (
            <div key={option.name}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <input
                  checked={isSelected}
                  className="mt-1 h-4 w-4 cursor-pointer accent-[var(--primary)]"
                  name="paymentMethod"
                  onChange={() => onSelectMethod(option.name)}
                  type="radio"
                  value={option.name}
                />
                <span className="flex-1">
                  <span className="block font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </label>

              {showBank ? (
                <div className="mt-3 ml-4 border-l-2 border-primary/20 pl-4">
                  <p className="mb-3 text-sm font-medium">Transfer to these details</p>
                  <dl className="flex flex-col gap-2 rounded-lg bg-muted/60 p-4 text-sm">
                    {[
                      { label: 'Account holder', value: bank?.accountHolder },
                      { label: 'Bank', value: bank?.bankName },
                      { label: 'IBAN / account', value: bank?.iban },
                      { label: 'SWIFT / BIC', value: bank?.swift },
                    ]
                      .filter((row) => Boolean(row.value))
                      .map((row) => (
                        <div className="flex flex-wrap justify-between gap-2" key={row.label}>
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className="font-mono font-medium">{row.value}</dd>
                        </div>
                      ))}
                  </dl>
                  {bank?.instructions ? (
                    <p className="mt-3 text-sm text-muted-foreground">{bank.instructions}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-muted-foreground">
                    You will get a payment reference to quote on the transfer once you place the
                    order.
                  </p>
                </div>
              ) : null}

              {showEvents ? (
                <div className="mt-3 ml-4 border-l-2 border-primary/20 pl-4">
                  <p className="mb-3 text-sm font-medium">{eventFieldLabel}</p>

                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{noEventsMessage}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {events.map((event) => {
                        const isEventSelected = selectedEventID === event.id

                        return (
                          <label
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                              isEventSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/40',
                            )}
                            key={event.id}
                          >
                            <input
                              checked={isEventSelected}
                              className="mt-1 h-4 w-4 cursor-pointer accent-[var(--primary)]"
                              name="event"
                              onChange={() => onSelectEvent(event.id)}
                              type="radio"
                              value={event.id}
                            />
                            <span className="flex-1">
                              <span className="flex items-center gap-1.5 font-medium">
                                {isEventSelected ? (
                                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                                ) : null}
                                {event.title}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                                  {formatEventDate(event.startsAt)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                                  {event.location}
                                </span>
                              </span>
                              {event.description ? (
                                <span className="mt-1 block text-muted-foreground">
                                  {event.description}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
