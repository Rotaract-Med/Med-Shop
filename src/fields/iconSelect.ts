import type { Field, SelectField } from 'payload'

/**
 * Shared icon vocabulary for CMS-driven UI.
 *
 * Values map 1:1 to the keys in `@/components/icons/ShopIcon`, which renders the
 * matching Lucide SVG. Labels stay plain text — the admin `select` renders them
 * as strings, so an emoji here would only be decoration in the editor and would
 * tempt us back toward emoji-as-icons on the frontend.
 */
export const iconOptions: SelectField['options'] = [
  { label: 'Truck — Shipping & delivery', value: 'truck' },
  { label: 'Ship — Maritime / Mediterranean', value: 'ship' },
  { label: 'Plane — International', value: 'plane' },
  { label: 'Globe — Worldwide', value: 'globe' },
  { label: 'Map pin — Location', value: 'mapPin' },
  { label: 'Shield — Quality & trust', value: 'shield' },
  { label: 'Badge check — Verified / authentic', value: 'badgeCheck' },
  { label: 'Lock — Secure payment', value: 'lock' },
  { label: 'Credit card — Payment', value: 'creditCard' },
  { label: 'Refresh — Easy returns', value: 'refresh' },
  { label: 'Clock — Fast turnaround', value: 'clock' },
  { label: 'Users — Community', value: 'users' },
  { label: 'Handshake — Partnership', value: 'handshake' },
  { label: 'Heart — Care & impact', value: 'heart' },
  { label: 'Sparkles — New', value: 'sparkles' },
  { label: 'Flame — Trending', value: 'flame' },
  { label: 'Star — Excellence', value: 'star' },
  { label: 'Award — Achievement', value: 'award' },
  { label: 'Crown — Premium', value: 'crown' },
  { label: 'Gift — Gifting', value: 'gift' },
  { label: 'Tag — Offer', value: 'tag' },
  { label: 'Percent — Discount', value: 'percent' },
  { label: 'Package — Products', value: 'package' },
  { label: 'Shirt — Apparel', value: 'shirt' },
  { label: 'Leaf — Sustainable', value: 'leaf' },
  { label: 'Recycle — Eco-friendly', value: 'recycle' },
  { label: 'Graduation cap — Education', value: 'graduationCap' },
  { label: 'Book — Resources', value: 'book' },
]

type IconSelectArgs = {
  /** Field name. Defaults to `icon`. */
  name?: string
  label?: string
  defaultValue?: string
  required?: boolean
  admin?: SelectField['admin']
}

/**
 * Reusable icon picker. Use everywhere an editor needs to attach a glyph to
 * content so the frontend can render a real SVG instead of an emoji.
 */
export const iconSelect = ({
  name = 'icon',
  label = 'Icon',
  defaultValue,
  required = false,
  admin,
}: IconSelectArgs = {}): Field => ({
  name,
  type: 'select',
  admin: {
    description: 'Rendered as an SVG icon on the storefront.',
    ...admin,
  },
  defaultValue,
  label,
  options: iconOptions,
  required,
})
