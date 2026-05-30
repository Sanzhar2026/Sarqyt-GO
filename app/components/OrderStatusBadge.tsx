'use client'

import { translations, type Language } from '../../lib/i18n'

interface Props {
  status: string
  lang: Language
}

export default function OrderStatusBadge({ status, lang }: Props) {
  const t = translations[lang]
  
  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: t.statusPending, className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: t.statusConfirmed, className: 'bg-blue-100 text-blue-800' },
    preparing: { label: t.statusPreparing, className: 'bg-purple-100 text-purple-800' },
    ready_for_pickup: { label: t.statusReadyForPickup, className: 'bg-green-100 text-green-800' },
    out_for_delivery: { label: t.statusOutForDelivery, className: 'bg-orange-100 text-orange-800' },
    nearby: { label: t.statusNearby, className: 'bg-indigo-100 text-indigo-800' },
    delivered: { label: t.statusDelivered, className: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: t.statusCancelled, className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}