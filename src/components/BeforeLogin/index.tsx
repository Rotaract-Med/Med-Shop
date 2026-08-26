import React from 'react'

export const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Rotaract Méditerranéen Shop — Admin Panel.</b>
        {' Customers should '}
        <a href={`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/login`}>
          log in at the storefront
        </a>
        {' to access their orders and account.'}
      </p>
    </div>
  )
}
