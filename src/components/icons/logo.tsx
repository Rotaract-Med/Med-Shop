import clsx from 'clsx'
import React from 'react'

export function LogoIcon(props: React.ComponentProps<'img'>) {
  const { className, ...rest } = props
  return (
    <img
      src="/med/blue.png"
      alt="Rotaract Méditerranéen"
      {...rest}
      className={clsx('h-10 w-auto object-contain', className)}
    />
  )
}
