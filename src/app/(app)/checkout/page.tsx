import type { Metadata } from 'next'
import type { DeliverySetting, PaymentSetting } from '@/payload-types'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import type {
  CheckoutEvent,
  CheckoutPaymentOption,
} from '@/components/checkout/PaymentMethodSelector'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

type MethodKey = 'bankTransfer' | 'cod' | 'payAtEvent' | 'stripe'

const methodOrder: MethodKey[] = ['stripe', 'bankTransfer', 'payAtEvent', 'cod']

const fallbackLabels: Record<MethodKey, string> = {
  bankTransfer: 'Bank transfer',
  cod: 'Cash on delivery',
  payAtEvent: 'Pay & collect at an event',
  stripe: 'Pay by card',
}

export default async function Checkout() {
  const [settings, deliverySettings] = await Promise.all([
    getCachedGlobal('paymentSettings', 0)() as Promise<PaymentSetting>,
    getCachedGlobal('deliverySettings', 0)() as Promise<DeliverySetting>,
  ])

  const options: CheckoutPaymentOption[] = methodOrder
    // A method with no saved settings defaults to enabled only for Stripe, so
    // adding this feature cannot silently switch on a method never configured.
    .filter((name) =>
      settings?.[name] ? settings[name]?.enabled !== false : name === 'stripe',
    )
    .map((name) => ({
      bankDetails:
        name === 'bankTransfer' ? (settings?.bankTransfer?.bankDetails ?? null) : null,
      description: settings?.[name]?.description ?? null,
      label: settings?.[name]?.label || fallbackLabels[name],
      name,
      order: settings?.[name]?.order ?? 10,
      requiresEvent: name === 'payAtEvent',
      // Collection at an event is never shipped, so no delivery is charged.
      skipsDelivery: name === 'payAtEvent',
    }))
    .sort((a, b) => a.order - b.order)

  let events: CheckoutEvent[] = []

  if (options.some((option) => option.requiresEvent)) {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'events',
      depth: 0,
      limit: 50,
      overrideAccess: false,
      sort: 'startsAt',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { acceptOrders: { equals: true } },
          // Never offer an event that has already started.
          { startsAt: { greater_than: new Date().toISOString() } },
        ],
      },
    })

    events = docs.map((event) => ({
      description: event.description ?? null,
      id: event.id,
      location: event.location,
      startsAt: event.startsAt,
      title: event.title,
    }))
  }

  return (
    <div className="container min-h-[90vh] flex">
      <h1 className="sr-only">Checkout</h1>

      <CheckoutPage
        eventFieldLabel={settings?.payAtEvent?.eventFieldLabel || 'Which event will you attend?'}
        events={events}
        noEventsMessage={
          settings?.payAtEvent?.noEventsMessage ||
          'There are no upcoming events to collect at right now.'
        }
        deliverySettings={deliverySettings ?? null}
        paymentHeading={settings?.heading || 'How would you like to pay?'}
        paymentOptions={options}
      />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Checkout.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}
