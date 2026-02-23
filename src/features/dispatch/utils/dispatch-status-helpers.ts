import type { DispatchOrderWithRelations } from '../hooks/useDispatchOrders'

/**
 * Helper para calcular TTL restante para órdenes en estado PENDING
 */
export const getTTLRemaining = (
  tenderCreatedAt: string,
  plannedStartAt: string,
  responseDeadline?: string
): string => {
  const now = new Date()
  let ttlExpiresAt: Date

  if (responseDeadline) {
    ttlExpiresAt = new Date(responseDeadline)
  } else {
    const tenderCreated = new Date(tenderCreatedAt)
    const pickup = new Date(plannedStartAt)

    const pickupDiffMs = pickup.getTime() - tenderCreated.getTime()
    const pickupDiffDays = pickupDiffMs / (1000 * 60 * 60 * 24)

    let ttlDurationMs: number
    if (pickupDiffDays <= 1) {
      ttlDurationMs = 90 * 60 * 1000 // 90 minutos
    } else if (pickupDiffDays <= 3) {
      ttlDurationMs = 24 * 60 * 60 * 1000 // 24 horas
    } else if (pickupDiffDays <= 7) {
      ttlDurationMs = 48 * 60 * 60 * 1000 // 48 horas
    } else {
      ttlDurationMs = 72 * 60 * 60 * 1000 // 72 horas
    }
    ttlExpiresAt = new Date(tenderCreated.getTime() + ttlDurationMs)
  }

  const remainingMs = ttlExpiresAt.getTime() - now.getTime()

  if (remainingMs <= 0) {
    return 'Expirado'
  }

  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

  if (remainingDays > 0) {
    return `${remainingDays}d ${remainingHours}h`
  } else if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}min`
  } else {
    return `${remainingMinutes}min`
  }
}

/**
 * Helper para determinar urgencia basada en TTL
 */
export const getTTLUrgency = (ttlRemaining: string): 'normal' | 'high' | 'critical' => {
  if (ttlRemaining === 'Expirado') return 'critical'

  let totalMinutes = 0

  const dayMatch = ttlRemaining.match(/(\d+)d/)
  const hourMatch = ttlRemaining.match(/(\d+)h/)
  const minMatch = ttlRemaining.match(/(\d+)min/)

  if (dayMatch) totalMinutes += parseInt(dayMatch[1]) * 24 * 60
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60
  if (minMatch) totalMinutes += parseInt(minMatch[1])

  if (totalMinutes <= 120) return 'critical' // < 2 horas
  if (totalMinutes <= 360) return 'high' // < 6 horas
  return 'normal'
}

/**
 * Helper para tiempo desde decisión
 */
export const getTimeSinceDecision = (decisionTimestamp: string): string => {
  const now = new Date()
  const decision = new Date(decisionTimestamp)
  const diffMs = now.getTime() - decision.getTime()

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffDays > 0) {
    return `hace ${diffDays}d`
  } else if (diffHours > 0) {
    return `hace ${diffHours}h`
  } else {
    return `hace ${diffMinutes}min`
  }
}

/**
 * Configuración de estados por substatus
 */
const SUBSTATUS_CONFIG: Record<
  string,
  {
    label: string
    dotColor: string
  }
> = {
  NEW: {
    label: 'Nueva',
    dotColor: '#6b7280', // gray
  },
  UNASSIGNED: {
    label: 'Sin Asignar',
    dotColor: '#6b7280', // gray
  },
  ASSIGNED: {
    label: 'Asignada',
    dotColor: '#6b7280', // gray
  },
  PENDING: {
    label: 'Pendiente',
    dotColor: '#3b82f6', // blue (default, se ajusta por urgencia)
  },
  ACCEPTED: {
    label: 'Aceptada',
    dotColor: '#10b981', // green
  },
  REJECTED: {
    label: 'Rechazada',
    dotColor: '#6b7280', // gray
  },
  EXPIRED: {
    label: 'Expirada',
    dotColor: '#6b7280', // gray
  },
  PROGRAMMED: {
    label: 'Programada',
    dotColor: '#3b82f6', // blue
  },
  DISPATCHED: {
    label: 'Despachada',
    dotColor: '#10b981', // green
  },
  EN_ROUTE_TO_ORIGIN: {
    label: 'En Ruta a Origen',
    dotColor: '#8b5cf6', // purple
  },
  AT_ORIGIN: {
    label: 'En Origen',
    dotColor: '#3b82f6', // blue
  },
  LOADING: {
    label: 'Cargando',
    dotColor: '#3b82f6', // blue
  },
  OBSERVED: {
    label: 'Observada',
    dotColor: '#f59e0b', // amber
  },
  IN_TRANSIT: {
    label: 'En Tránsito',
    dotColor: '#3b82f6', // blue
  },
  AT_DESTINATION: {
    label: 'En Destino',
    dotColor: '#6b7280', // gray
  },
  DELIVERED: {
    label: 'Entregada',
    dotColor: '#10b981', // green
  },
  PENDING_AUDIT: {
    label: 'Pendiente Auditoría',
    dotColor: '#f59e0b', // amber
  },
  UNDER_REVIEW: {
    label: 'En Revisión',
    dotColor: '#f59e0b', // amber
  },
  DISPUTED: {
    label: 'Disputada',
    dotColor: '#ef4444', // red
  },
  APPROVED: {
    label: 'Aprobada',
    dotColor: '#10b981', // green
  },
  CLOSED: {
    label: 'Cerrada',
    dotColor: '#6b7280', // gray
  },
  CANCELED: {
    label: 'Cancelada',
    dotColor: '#6b7280', // gray
  },
}

/**
 * Obtiene la información de display para un substatus de dispatch order
 */
export const getDispatchOrderStatusDisplay = (
  order: DispatchOrderWithRelations,
  tenderCreatedAt?: string,
  decisionTimestamp?: string
): {
  label: string
  timeInfo: string
  urgency: 'normal' | 'high' | 'critical'
  dotColor: string
} => {
  const substatus = order.substatus || 'UNASSIGNED'
  const config = SUBSTATUS_CONFIG[substatus] || SUBSTATUS_CONFIG.UNASSIGNED

  // PENDING: Calcular TTL y urgencia
  if (substatus === 'PENDING' && tenderCreatedAt && order.planned_start_at) {
    const ttlRemaining = getTTLRemaining(
      tenderCreatedAt,
      order.planned_start_at,
      order.response_deadline || undefined
    )
    const urgency = getTTLUrgency(ttlRemaining)

    return {
      label: config.label,
      timeInfo: ttlRemaining === 'Expirado' ? 'Expiró' : `Vence en ${ttlRemaining}`,
      urgency,
      dotColor: urgency === 'critical' ? '#ef4444' : urgency === 'high' ? '#f59e0b' : '#3b82f6',
    }
  }

  // REJECTED, EXPIRED: Mostrar tiempo desde decisión
  if ((substatus === 'REJECTED' || substatus === 'EXPIRED') && decisionTimestamp) {
    return {
      label: config.label,
      timeInfo: getTimeSinceDecision(decisionTimestamp),
      urgency: 'normal',
      dotColor: config.dotColor,
    }
  }

  // OBSERVED: Mostrar tiempo desde observación
  if (substatus === 'OBSERVED' && decisionTimestamp) {
    return {
      label: config.label,
      timeInfo: getTimeSinceDecision(decisionTimestamp),
      urgency: 'normal',
      dotColor: config.dotColor,
    }
  }

  // Resto de estados: Sin información temporal
  return {
    label: config.label,
    timeInfo: '',
    urgency: 'normal',
    dotColor: config.dotColor,
  }
}
