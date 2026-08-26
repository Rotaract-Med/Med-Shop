import { Banner } from '@payloadcms/ui'
import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

export const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to Rotaract Méditerranéen Shop</h4>
      </Banner>
      Manage your Mediterranean community store:
      <ul className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' with sample products and pages to jump-start your store, then '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">visit the storefront</a>
          {' to see the results.'}
        </li>
        <li>
          {'Add and manage products under '}
          <strong>Products</strong>
          {' — include variants, pricing, and stock levels.'}
        </li>
        <li>
          {'Review incoming orders under '}
          <strong>Orders</strong>
          {' and manage Rotaractors under '}
          <strong>Users</strong>.
        </li>
        <li>
          {'Edit your home page hero and content in '}
          <strong>Pages</strong>
          {' using the block-based editor.'}
        </li>
        <li>
          {'Connect your Stripe account via '}
          <a
            href="https://dashboard.stripe.com/test/apikeys"
            rel="noopener noreferrer"
            target="_blank"
          >
            Stripe API Keys
          </a>
          {' and set them in your environment variables.'}
        </li>
      </ul>
    </div>
  )
}
