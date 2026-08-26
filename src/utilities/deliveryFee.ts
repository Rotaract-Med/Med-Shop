import type { DeliverySetting } from '@/payload-types'

export type DeliveryInputs = {
  countryCode?: null | string
  /** Order value before delivery, in minor units. */
  itemsSubtotal: number
}

/**
 * Delivery fee in minor units.
 *
 * Deliberately pure and free of Payload imports so the checkout can render the
 * same number the payment adapters will charge, from the same settings object.
 */
export function calculateDeliveryFee(
  settings: DeliverySetting | null | undefined,
  { countryCode, itemsSubtotal }: DeliveryInputs,
): number {
  if (!settings?.enabled) return 0

  const freeOver = settings.freeOver ?? 0
  if (freeOver > 0 && itemsSubtotal >= freeOver) return 0

  const country = countryCode?.trim().toUpperCase()

  if (country) {
    for (const rate of settings.rates ?? []) {
      const codes = (rate.countries ?? '')
        .split(',')
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean)

      if (codes.includes(country)) return Math.max(0, rate.fee ?? 0)
    }
  }

  return Math.max(0, settings.flatFee ?? 0)
}
