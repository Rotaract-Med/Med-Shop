'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useState } from 'react'

import { cssVariables } from '@/cssVariables'
import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Address } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  type CheckoutEvent,
  type CheckoutPaymentOption,
  PaymentMethodSelector,
} from '@/components/checkout/PaymentMethodSelector'
import { ReceiptUpload } from '@/components/checkout/ReceiptUpload'
import { calculateDeliveryFee } from '@/utilities/deliveryFee'
import type { DeliverySetting } from '@/payload-types'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

type Props = {
  deliverySettings: DeliverySetting | null
  eventFieldLabel: string
  events: CheckoutEvent[]
  noEventsMessage: string
  paymentHeading: string
  paymentOptions: CheckoutPaymentOption[]
}

export const CheckoutPage: React.FC<Props> = ({
  deliverySettings,
  eventFieldLabel,
  events,
  noEventsMessage,
  paymentHeading,
  paymentOptions,
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart } = useCart()
  const [error, setError] = useState<null | string>(null)
  const { theme } = useTheme()
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const { confirmOrder, initiatePayment } = usePayments()
  const [selectedMethod, setSelectedMethod] = useState<CheckoutPaymentOption['name'] | null>(
    paymentOptions[0]?.name ?? null,
  )
  const [selectedEventID, setSelectedEventID] = useState<null | number>(null)
  const [placedOrder, setPlacedOrder] = useState<null | {
    accessToken?: string
    id: number | string
    message: string
    method: CheckoutPaymentOption['name']
    reference?: string
  }>(null)
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      try {
        const paymentData = (await initiatePayment(paymentID, {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress,
            shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
          },
        })) as Record<string, unknown>

        if (paymentData) {
          setPaymentData(paymentData)
        }
      } catch (error) {
        const errorData = error instanceof Error ? JSON.parse(error.message) : {}
        let errorMessage = 'An error occurred while initiating payment.'

        if (errorData?.cause?.code === 'OutOfStock') {
          errorMessage = 'One or more items in your cart are out of stock.'
        }

        setError(errorMessage)
        toast.error(errorMessage)
      }
    },
    [billingAddress, billingAddressSameAsShipping, shippingAddress],
  )

  /**
   * Methods that take no money online (cash on delivery, pay at an event)
   * initiate and confirm back-to-back, producing the order immediately.
   */
  const placeDirectOrder = useCallback(
    async (methodName: CheckoutPaymentOption['name']) => {
      setProcessingPayment(true)
      setError(null)

      const addressData = {
        ...(email ? { customerEmail: email } : {}),
        billingAddress,
        shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
      }

      try {
        const initiated = (await initiatePayment(methodName, {
          additionalData: addressData,
        })) as Record<string, unknown>

        // Each adapter hands back its own reference for the pending
        // transaction: `reference` for pay-at-event, `orderID` for COD.
        const confirmData: Record<string, unknown> =
          methodName === 'payAtEvent'
            ? { eventID: selectedEventID, reference: initiated?.reference }
            : methodName === 'bankTransfer'
              ? { reference: initiated?.reference }
              : { orderID: initiated?.orderID }

        const confirmed = (await confirmOrder(methodName, {
          additionalData: { ...confirmData, ...(email ? { customerEmail: email } : {}) },
        })) as {
          accessToken?: string
          message?: string
          orderID: number | string
          reference?: string
        }

        setPlacedOrder({
          accessToken: confirmed.accessToken,
          id: confirmed.orderID,
          message: confirmed.message ?? 'Your order has been placed.',
          method: methodName,
          reference: confirmed.reference,
        })
        toast.success('Order placed.')
      } catch (err) {
        // The plugin throws with the raw response body, which is JSON for
        // adapter errors and plain text otherwise.
        let message = 'We could not place your order. Please try again.'

        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message)
            message = parsed?.message ?? parsed?.error ?? message
          } catch {
            if (err.message) message = err.message
          }
        }

        setError(message)
        toast.error(message)
      } finally {
        setProcessingPayment(false)
      }
    },
    [
      billingAddress,
      billingAddressSameAsShipping,
      confirmOrder,
      email,
      initiatePayment,
      selectedEventID,
      shippingAddress,
    ],
  )

  const activeOption = paymentOptions.find((option) => option.name === selectedMethod) ?? null
  const needsEvent = Boolean(activeOption?.requiresEvent)

  const shippingCountry = (billingAddressSameAsShipping ? billingAddress : shippingAddress)?.country
  const itemsSubtotal = cart?.subtotal ?? 0

  // Event collection is never shipped, so it is never charged delivery.
  const deliveryFee = activeOption?.skipsDelivery
    ? 0
    : calculateDeliveryFee(deliverySettings, {
        countryCode: shippingCountry,
        itemsSubtotal,
      })

  const orderTotal = itemsSubtotal + deliveryFee
  const canPlaceOrder = canGoToPayment && Boolean(selectedMethod) && (!needsEvent || Boolean(selectedEventID))

  if (placedOrder) {
    const orderLink = placedOrder.accessToken
      ? `/orders/${placedOrder.id}?email=${encodeURIComponent(email || user?.email || '')}&accessToken=${placedOrder.accessToken}`
      : `/orders/${placedOrder.id}`

    return (
      <div className="prose dark:prose-invert w-full max-w-none py-16 text-center">
        <h2>Thank you — your order is confirmed</h2>
        <p>{placedOrder.message}</p>
        <p>
          Your order number is <strong>#{placedOrder.id}</strong>. We have emailed your
          confirmation and a link to view it.
        </p>

        {placedOrder.method === 'bankTransfer' ? (
          <div className="not-prose mx-auto mt-8 max-w-md text-left">
            {placedOrder.reference ? (
              <p className="mb-4 rounded-lg bg-muted/60 p-4 text-sm">
                Quote this reference on your transfer:{' '}
                <strong className="font-mono">{placedOrder.reference}</strong>
              </p>
            ) : null}
            <ReceiptUpload
              accessToken={placedOrder.accessToken}
              orderID={placedOrder.id}
            />
          </div>
        ) : null}

        {/* A durable way back. Guests get a tokenised link they can bookmark,
            so closing this tab does not strand them — the confirmation email
            carries the same link, but this does not depend on email working. */}
        <div className="not-prose mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
          <Button asChild>
            <Link href={orderLink}>View your order</Link>
          </Button>

          {!user ? (
            <p className="text-sm text-muted-foreground">
              Bookmark that link to come back to this order. You can also{' '}
              <Link className="underline" href="/find-order">
                find your order
              </Link>{' '}
              later using your order number and email.
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  if (!stripe) return null

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-12 w-full items-center justify-center">
        <div className="prose dark:prose-invert text-center max-w-none self-center mb-8">
          <p>Processing your payment...</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-12 w-full items-center">
        <p>Your cart is empty.</p>
        <Link href="/search">Continue shopping?</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <h2 className="font-medium text-3xl">Contact</h2>
        {!user && (
          <div className=" bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
            <div className="prose dark:prose-invert">
              <Button asChild className="no-underline text-inherit" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <p className="mt-0">
                <span className="mx-2">or</span>
                <Link href="/create-account">create an account</Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="bg-accent dark:bg-card rounded-lg p-4 ">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                Not you?{' '}
                <Link className="underline" href="/logout">
                  Log out
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent dark:bg-black rounded-lg p-4 ">
            <div>
              <p className="mb-4">Enter your email to checkout as a guest.</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                }}
                variant="default"
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}

        <h2 className="font-medium text-3xl">Address</h2>

        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={'outline'}
                  disabled={Boolean(paymentData)}
                  onClick={(e) => {
                    e.preventDefault()
                    setBillingAddress(undefined)
                  }}
                >
                  Remove
                </Button>
              }
              address={billingAddress}
            />
          </div>
        ) : user ? (
          <CheckoutAddresses heading="Billing address" setAddress={setBillingAddress} />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address)
            }}
            skipSubmission={true}
          />
        )}

        <div className="flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={Boolean(paymentData || (!user && (!email || Boolean(emailEditable))))}
            onCheckedChange={(state) => {
              setBillingAddressSameAsShipping(state as boolean)
            }}
          />
          <Label htmlFor="shippingTheSameAsBilling">Shipping is the same as billing</Label>
        </div>

        {!billingAddressSameAsShipping && (
          <>
            {shippingAddress ? (
              <div>
                <AddressItem
                  actions={
                    <Button
                      variant={'outline'}
                      disabled={Boolean(paymentData)}
                      onClick={(e) => {
                        e.preventDefault()
                        setShippingAddress(undefined)
                      }}
                    >
                      Remove
                    </Button>
                  }
                  address={shippingAddress}
                />
              </div>
            ) : user ? (
              <CheckoutAddresses
                heading="Shipping address"
                description="Please select a shipping address."
                setAddress={setShippingAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address)
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}

        {!paymentData && (
          <>
            <PaymentMethodSelector
              disabled={!canGoToPayment || isProcessingPayment}
              eventFieldLabel={eventFieldLabel}
              events={events}
              heading={paymentHeading}
              noEventsMessage={noEventsMessage}
              onSelectEvent={setSelectedEventID}
              onSelectMethod={(name) => {
                setSelectedMethod(name)
                setError(null)
              }}
              options={paymentOptions}
              selectedEventID={selectedEventID}
              selectedMethod={selectedMethod}
            />

            <Button
              className="self-start"
              disabled={!canPlaceOrder || isProcessingPayment}
              onClick={(e) => {
                e.preventDefault()

                if (selectedMethod === 'stripe') {
                  void initiatePaymentIntent('stripe')
                } else if (selectedMethod) {
                  void placeDirectOrder(selectedMethod)
                }
              }}
            >
              {isProcessingPayment
                ? 'Placing order…'
                : selectedMethod === 'stripe'
                  ? 'Go to payment'
                  : 'Place order'}
            </Button>
          </>
        )}

        {!paymentData?.['clientSecret'] && error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
              }}
              variant="default"
            >
              Try again
            </Button>
          </div>
        )}

        <Suspense fallback={<React.Fragment />}>
          {/* @ts-ignore */}
          {paymentData && paymentData?.['clientSecret'] && (
            <div className="pb-16">
              <h2 className="font-medium text-3xl">Payment</h2>
              {error && <p>{`Error: ${error}`}</p>}
              <Elements
                options={{
                  appearance: {
                    theme: theme === 'dark' ? 'night' : 'stripe',
                    variables: {
                      borderRadius: '6px',
                      colorPrimary: theme === 'dark' ? '#a0a0a0' : '#858585',
                      gridColumnSpacing: '20px',
                      gridRowSpacing: '20px',
                      colorBackground: theme === 'dark' ? '#1a1a1a' : cssVariables.colors.base0,
                      colorDanger: cssVariables.colors.error500,
                      colorDangerText: cssVariables.colors.error500,
                      colorIcon:
                        theme === 'dark' ? cssVariables.colors.base0 : cssVariables.colors.base1000,
                      colorText: theme === 'dark' ? '#e0e0e0' : cssVariables.colors.base1000,
                      colorTextPlaceholder: theme === 'dark' ? '#6b6b6b' : '#858585',
                      fontFamily: 'Geist, sans-serif',
                      fontSizeBase: '16px',
                      fontWeightBold: '600',
                      fontWeightNormal: '500',
                      spacingUnit: '4px',
                    },
                  },
                  clientSecret: paymentData['clientSecret'] as string,
                }}
                stripe={stripe}
              >
                <div className="flex flex-col gap-8">
                  <CheckoutForm
                    customerEmail={email}
                    billingAddress={billingAddress}
                    setProcessingPayment={setProcessingPayment}
                  />
                  <Button
                    variant="ghost"
                    className="self-start"
                    onClick={() => setPaymentData(null)}
                  >
                    Cancel payment
                  </Button>
                </div>
              </Elements>
            </div>
          )}
        </Suspense>
      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
          <h2 className="text-3xl font-medium">Your cart</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              let price = product?.priceInUSD

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = variant?.priceInUSD

                const imageVariant = product.gallery?.find((item) => {
                  if (!item.variantOption) return false
                  const variantOptionID =
                    typeof item.variantOption === 'object'
                      ? item.variantOption.id
                      : item.variantOption

                  const hasMatch = variant?.options?.some((option) => {
                    if (typeof option === 'object') return option.id === variantOptionID
                    else return option === variantOptionID
                  })

                  return hasMatch
                })

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {image && typeof image !== 'string' && (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {variant && typeof variant === 'object' && (
                        <p className="text-sm font-mono text-primary/50 tracking-widest">
                          {variant.options
                            ?.map((option) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === 'number' && <Price amount={price} />}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />

          <div className="flex justify-between items-center gap-2 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <Price amount={itemsSubtotal} />
          </div>

          {activeOption?.skipsDelivery ? (
            <p className="text-sm text-muted-foreground">
              {deliverySettings?.eventNotice ||
                'No delivery charge — you collect your order at the event.'}
            </p>
          ) : (
            <div className="flex justify-between items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {deliverySettings?.label || 'Delivery'}
              </span>
              {deliveryFee > 0 ? (
                <Price amount={deliveryFee} />
              ) : (
                <span className="font-medium text-success">Free</span>
              )}
            </div>
          )}

          {!activeOption?.skipsDelivery && deliverySettings?.notice ? (
            <p className="text-xs text-muted-foreground">{deliverySettings.notice}</p>
          ) : null}

          <hr />

          <div className="flex justify-between items-center gap-2">
            <span className="uppercase">Total</span>{' '}
            <Price className="text-3xl font-medium" amount={orderTotal} />
          </div>
        </div>
      )}
    </div>
  )
}
