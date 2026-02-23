/**
 * Rate Card Utility Functions
 * Helper functions for formatting and validation
 */

export interface RateCardCharge {
  charge_type: string
  rate_basis: string
  value: number
  label: string | null
}

export interface RateChargeBreak {
  min_value: number
  max_value: number | null
  rate_value: number
}

/**
 * Format charge type for display
 */
export function formatChargeType(type: string): string {
  const typeMap: Record<string, string> = {
    BASE: 'Base',
    FREIGHT: 'Flete',
    DISTANCE: 'Distancia',
    FUEL: 'Combustible',
    HYBRID: 'Híbrido',
  }
  return typeMap[type] || type
}

/**
 * Format rate basis for display
 */
export function formatRateBasis(basis: string): string {
  const basisMap: Record<string, string> = {
    FLAT: 'Fijo',
    PER_TN: 'Por Tonelada',
    PER_KM: 'Por Kilómetro',
    PERCENTAGE: 'Porcentaje',
  }
  return basisMap[basis] || basis
}

/**
 * Format charge for display
 */
export function formatRateCardCharge(charge: RateCardCharge): string {
  const type = formatChargeType(charge.charge_type)
  const basis = formatRateBasis(charge.rate_basis)
  const label = charge.label || basis

  if (charge.rate_basis === 'PERCENTAGE') {
    return `${type} - ${label}: ${charge.value}%`
  }
  return `${type} - ${label}: $${charge.value.toFixed(2)}`
}

/**
 * Validate charge breaks don't overlap
 */
export function validateChargeBreaks(breaks: RateChargeBreak[]): {
  valid: boolean
  error?: string
} {
  if (breaks.length === 0) {
    return { valid: true }
  }

  // Sort by min_value
  const sorted = [...breaks].sort((a, b) => a.min_value - b.min_value)

  // Check for overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    const currentMax = current.max_value ?? Infinity

    if (currentMax >= next.min_value) {
      return {
        valid: false,
        error: `Los rangos se solapan: ${current.min_value}-${currentMax ?? '∞'} y ${next.min_value}-${next.max_value ?? '∞'}`,
      }
    }
  }

  // Check each break is valid
  for (const breakItem of sorted) {
    if (breakItem.max_value !== null && breakItem.max_value <= breakItem.min_value) {
      return {
        valid: false,
        error: `Rango inválido: ${breakItem.min_value}-${breakItem.max_value}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Calculate next sort_order for charges
 */
export function calculateChargeSortOrder(charges: Array<{ sort_order: number }>): number {
  if (charges.length === 0) return 0
  const maxOrder = Math.max(...charges.map((c) => c.sort_order))
  return maxOrder + 1
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Format date range for display
 */
export function formatDateRange(validFrom: string, validTo: string | null): string {
  const from = new Date(validFrom).toLocaleDateString('es-ES')
  if (!validTo) {
    return `Desde ${from}`
  }
  const to = new Date(validTo).toLocaleDateString('es-ES')
  return `${from} - ${to}`
}

/** Charge shape used by the simulator (matches form charges + breaks). */
export interface SimulatorCharge {
  charge_type: string
  rate_basis: string
  value: number
  label?: string | null
  sort_order: number
  is_active: boolean
  apply_before_pct: boolean
  weight_source?: string | null
  breaks?: Array<{ min_value: number; max_value: number | null; rate_value: number }>
}

export interface SimulatorScenario {
  weightTn: number
  distanceKm: number
}

export interface SimulatorLineItem {
  charge_type: string
  label: string | null
  amount: number
  rate_value: number
  break_used?: string
}

export interface SimulatorResult {
  lineItems: SimulatorLineItem[]
  subtotal: number
}

/**
 * Simulate rate card cost from charges and scenario (mirrors dispatchOrderCosts.service logic).
 * Used by the rate card detail simulator; no DB or async.
 */
export function simulateRateCardCharges(
  charges: SimulatorCharge[],
  scenario: SimulatorScenario
): SimulatorResult {
  const { weightTn, distanceKm } = scenario
  const sorted = [...charges]
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  const weightForCharge = (charge: SimulatorCharge) => weightTn
  let subtotalForPct = 0
  const lineItems: SimulatorLineItem[] = []

  for (const charge of sorted) {
    let dimensionValue = 0
    switch (charge.rate_basis) {
      case 'FLAT':
        dimensionValue = 1
        break
      case 'PER_TN':
        dimensionValue = weightForCharge(charge)
        break
      case 'PER_KM':
        dimensionValue = distanceKm
        break
      case 'PERCENTAGE':
        dimensionValue = subtotalForPct
        break
      default:
        dimensionValue = 0
    }

    let effectiveRate = charge.value
    let breakUsedStr = ''
    const breaks = charge.breaks ?? []

    if (breaks.length > 0) {
      const lookupValue = dimensionValue
      const useClosestLower =
        charge.rate_basis === 'PER_TN' && charge.weight_source === 'TRUCK_CAPACITY'
      const matchedBreak = useClosestLower
        ? breaks
            .filter((b) => lookupValue >= b.min_value)
            .reduce<typeof breaks[0] | null>(
              (best, b) => (!best || b.min_value > best.min_value ? b : best),
              null
            )
        : breaks.find(
            (b) =>
              lookupValue >= b.min_value &&
              (b.max_value === null || lookupValue < b.max_value)
          )

      if (matchedBreak) {
        effectiveRate = matchedBreak.rate_value
        breakUsedStr =
          matchedBreak.min_value === matchedBreak.max_value
            ? `${matchedBreak.min_value}`
            : `${matchedBreak.min_value}-${matchedBreak.max_value ?? '+'}`
      }
    }

    let amount = 0
    if (charge.rate_basis === 'PERCENTAGE') {
      amount = subtotalForPct * (effectiveRate / 100)
    } else if (charge.rate_basis === 'FLAT') {
      amount = effectiveRate
    } else {
      amount = effectiveRate * dimensionValue
    }

    if (charge.apply_before_pct && charge.rate_basis !== 'PERCENTAGE') {
      subtotalForPct += amount
    }

    lineItems.push({
      charge_type: charge.charge_type,
      label: charge.label ?? null,
      amount,
      rate_value: effectiveRate,
      break_used: breakUsedStr || undefined,
    })
  }

  const subtotal = lineItems.reduce((sum, r) => sum + r.amount, 0)
  return { lineItems, subtotal }
}
