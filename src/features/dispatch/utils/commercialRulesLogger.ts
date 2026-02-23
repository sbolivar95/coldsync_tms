import type { CarrierCommercialRules } from '../../../services/database/commercialRules.service'
import type { DispatchOrderCost } from '../../../services/database/dispatchOrderCosts.service'

const PREFIX = '[Reglas comerciales]'

// 🔧 Toggle para activar/desactivar logs de reglas comerciales en desarrollo
const ENABLE_COMMERCIAL_RULES_LOGGING = true // Enabled by default now for debugging

/**
 * Logs carrier commercial rules and cost detail when assigning an order to a unit (dev only).
 */
export function logCommercialRulesForAssignment(
  rules: CarrierCommercialRules,
  context: {
    dispatchOrderId: string
    fleetSetId: string
    carrierName?: string
  }
): void {
  if (!import.meta.env.DEV || !ENABLE_COMMERCIAL_RULES_LOGGING) return

  const { dispatchOrderId, fleetSetId, carrierName } = context
  const label = carrierName ? `Transportista ${carrierName} (id: ${rules.carrierId})` : `Transportista id ${rules.carrierId}`

  // eslint-disable-next-line no-console
  console.group(`${PREFIX} Asignación — ${label}`)
  // eslint-disable-next-line no-console
  console.log(`Orden: ${dispatchOrderId}  |  Unidad: ${fleetSetId}`)
  // eslint-disable-next-line no-console
  console.log('—')

  // eslint-disable-next-line no-console
  console.group(`${PREFIX} Contratos (activos, vigentes hoy)`)
  if (rules.contracts.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Ninguno')
  } else {
    rules.contracts.forEach((c) => {
      // eslint-disable-next-line no-console
      console.log(
        `• ${c.contract_number} ${c.contract_name ? `(${c.contract_name})` : ''} | ${c.valid_from} → ${c.valid_to ?? 'abierto'} | ${c.currency}`
      )
    })
  }
  // eslint-disable-next-line no-console
  console.groupEnd()

  // eslint-disable-next-line no-console
  console.group(`${PREFIX} Tarifas (por carril + perfil térmico)`)
  if (rules.rateCards.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Ninguna')
  } else {
    rules.rateCards.forEach((rc) => {
      const chargeLines = (rc.rate_card_charges || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => {
          let desc = `[${c.charge_type}] ${c.label || c.rate_basis}: ${c.value}`
          if (c.rate_charge_breaks && c.rate_charge_breaks.length > 0) {
            const breaks = c.rate_charge_breaks
               .sort((a,b) => a.min_value - b.min_value)
               .map(b => `${b.min_value}-${b.max_value ?? '∞'}→${b.rate_value}`)
               .join(', ')
            desc += ` {Escalones: ${breaks}}`
          }
          return desc
        })
        .join(' + ')

      // eslint-disable-next-line no-console
      console.log(
        `• Carrier ${rc.carrier_id ?? 'default'} | Carril ${rc.lane_id.slice(0, 8)}… | Perfil ${rc.thermal_profile_id ?? 'cualquiera'} | Cargos: ${chargeLines || 'ninguno'}`
      )
    })
  }
  // eslint-disable-next-line no-console
  console.groupEnd()

  // eslint-disable-next-line no-console
  console.group(`${PREFIX} Reglas de penalidad`)
  if (rules.penaltyRules.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Ninguna')
  } else {
    rules.penaltyRules.forEach((p) => {
      // eslint-disable-next-line no-console
      console.log(
        `• [${p.rule_type}] ${p.condition_description} | ${p.penalty_type} ${p.penalty_value != null ? p.penalty_value : '–'} | prioridad ${p.priority}`
      )
    })
  }
  // eslint-disable-next-line no-console
  console.groupEnd()
  
  // eslint-disable-next-line no-console
  console.groupEnd()
}

/**
 * Logs the detailed cost calculation for a dispatch order (dev only).
 */
export function logCostCalculation(cost: DispatchOrderCost): void {
  if (!import.meta.env.DEV || !ENABLE_COMMERCIAL_RULES_LOGGING) return

  // eslint-disable-next-line no-console
  console.group(`${PREFIX} Cálculo de Costo — Orden ${cost.dispatch_order_id}`)
  
  if (cost.rate_card_id) {
     // eslint-disable-next-line no-console
     console.log(`Tarifa usada ID: ${cost.rate_card_id}`)
  } else {
     // eslint-disable-next-line no-console
     console.warn('⚠️ Sin tarifa asignada (fallback o error)')
  }

  if (cost.calculation_details?.charges) {
    // eslint-disable-next-line no-console
    console.table(cost.calculation_details.charges)
  } else {
    // eslint-disable-next-line no-console
    console.log('Detalle de cargos no disponible')
  }

  // eslint-disable-next-line no-console
  console.log(`Subtotal: ${cost.subtotal}`)
  // eslint-disable-next-line no-console
  console.log(`Total Final: ${cost.total_cost}`)
  
  // eslint-disable-next-line no-console
  console.groupEnd()
}
