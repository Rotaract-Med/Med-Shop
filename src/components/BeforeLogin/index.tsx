import React from 'react'

export const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Rotaract Méditerranéen Shop — Admin Panel.</b>
        {' Customers should '}
        {/* Relative on purpose: the storefront is served from this same origin,
            so no environment variable is needed to build the link. */}
        <a href="/login">log in at the storefront</a>
        {' to access their orders and account.'}
      </p>
    </div>
  )
}
