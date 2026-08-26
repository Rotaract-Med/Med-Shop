import {
  Award,
  BadgeCheck,
  BookOpen,
  Clock,
  CreditCard,
  Crown,
  Flame,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  Heart,
  Leaf,
  Lock,
  type LucideIcon,
  MapPin,
  Package,
  Percent,
  Plane,
  Recycle,
  RefreshCw,
  Ship,
  Shirt,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Truck,
  Users,
} from 'lucide-react'
import React from 'react'

/**
 * Maps the CMS icon vocabulary (`@/fields/iconSelect`) to Lucide components.
 * Keep the keys in sync with `iconOptions`.
 */
const iconMap: Record<string, LucideIcon> = {
  award: Award,
  badgeCheck: BadgeCheck,
  book: BookOpen,
  clock: Clock,
  creditCard: CreditCard,
  crown: Crown,
  flame: Flame,
  gift: Gift,
  globe: Globe,
  graduationCap: GraduationCap,
  handshake: Handshake,
  heart: Heart,
  leaf: Leaf,
  lock: Lock,
  mapPin: MapPin,
  package: Package,
  percent: Percent,
  plane: Plane,
  recycle: Recycle,
  refresh: RefreshCw,
  shield: ShieldCheck,
  shirt: Shirt,
  ship: Ship,
  sparkles: Sparkles,
  star: Star,
  tag: Tag,
  truck: Truck,
  users: Users,
}

type Props = {
  className?: string
  /** Icon key from the CMS. Unknown or empty values fall back to `Sparkles`. */
  name?: null | string
  strokeWidth?: number
}

export const ShopIcon: React.FC<Props> = ({ className, name, strokeWidth = 1.75 }) => {
  const Icon = (name && iconMap[name]) || Sparkles

  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />
}
