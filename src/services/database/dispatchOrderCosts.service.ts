import { supabase } from '../../lib/supabase'

/**
 * Dispatch Order Costs Service
 * Handles cost calculation and management for dispatch orders
 *
 * Pricing model:
 *   Subtotal = Σ(charge_lines)
 *   Total = Subtotal (or Subtotal * modifier / + fixed, if thermal modifier exists)
 *   No rate-card-level min_charge; use BASE charge type for base pricing.
 *
 * Rate cards: one base per lane+carrier (thermal_profile_id IS NULL).
 * Thermal modifiers adjust cost by profile (MULTIPLIER or FIXED_ADD).
 */

export interface CalculationDetailsItem {
  thermal_profile_id: number | null
  quantity: number
  rate_value: number
  line_cost: number
}

export interface ChargeResult {
  charge_type: string
  rate_basis: string
  amount: number
  label: string | null
  rate_value: number
  break_used?: string
}

export interface CalculationDetails {
  items?: CalculationDetailsItem[] // Legacy support or detailed item breakdown
  charges?: ChargeResult[]
  dimensions?: {
    total_weight_tn: number
    billable_weight_tn?: number
    distance_km: number
    transit_time_hr: number
    stop_count: number
  }
  thermal_modifier_applied?: { modifier_type: string; value: number }
  [k: string]: unknown
}

export interface DispatchOrderCost {
  id: string
  org_id: string
  dispatch_order_id: string
  rate_card_id: string | null
  base_cost: number
  calculation_details?: CalculationDetails
  fuel_surcharge: number
  service_surcharge: number
  additional_charges: number
  modifiers_applied?: Record<string, unknown>
  penalties_applied?: Record<string, unknown>
  total_penalties: number
  subtotal: number
  total_cost: number
  calculated_at?: string
  calculated_by?: string | null
  recalculated_at?: string | null
  status: string
  invoice_number?: string | null
  invoiced_at?: string | null
  paid_at?: string | null
  notes?: string | null
}

export interface CostCalculationInput {
  dispatchOrderId: string
  carrierId: number
  laneId: string
  items: Array<{
    quantity: number
    thermal_profile_id?: number | null
  }>
  userId: string
  billableWeightTn?: number | null
}

export interface RateCard {
  id: string
  carrier_id: number | null
  lane_id: string
  thermal_profile_id: number | null
  name: string | null
  rate_card_charges: RateCardCharge[]
}

export interface RateCardCharge {
  id: string
  charge_type: string
  rate_basis: string
  value: number
  label: string | null
  sort_order: number
  is_active: boolean
  apply_before_pct: boolean
  weight_source?: string | null
  rate_charge_breaks: RateChargeBreak[]
}

export interface RateChargeBreak {
  id: string
  min_value: number
  max_value: number | null
  rate_value: number
}

export const dispatchOrderCostsService = {
  /**
   * Calculate cost for a dispatch order based on carrier, lane, and items.
   *
   * Resolution order for rate cards:
   *   1. Carrier Specific + Exact Thermal Profile
   *   2. Carrier Specific + Any Thermal Profile (NULL)
   *   3. Org Default + Exact Thermal Profile
   *   4. Org Default + Any Thermal Profile (NULL)
   */
  async calculateCost(input: CostCalculationInput): Promise<DispatchOrderCost> {
    const { dispatchOrderId, carrierId, laneId, items, userId, billableWeightTn } = input

    // 0. Get Context
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', userId)
      .single()

    if (memberError || !memberData) throw new Error('User organization not found')
    const orgId = memberData.org_id

    // 1. Gather Dimensions
    const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0)
    
    // Lane Details (Distance, Time, Stops)
    const { data: lane, error: laneError } = await supabase
      .from('lanes')
      .select(`
        distance,
        transit_time,
        lane_stops (id)
      `)
      .eq('id', laneId)
      .single()

    if (laneError) throw new Error(`Error loading lane details: ${laneError.message}`)
    if (!lane) throw new Error('Lane not found')

    const distance = Number(lane.distance || 0)
    const transitTime = Number(lane.transit_time || 0)
    const stopCount = lane.lane_stops?.length || 0

    // 2. Fetch Base Rate Card (thermal_profile_id IS NULL - one per lane+carrier)
    const targetThermalProfile = items[0]?.thermal_profile_id || null

    const { data: potentialCards, error: cardsError } = await supabase
      .from('rate_cards')
      .select(`
        id,
        carrier_id,
        lane_id,
        thermal_profile_id,
        name,
        rate_card_charges (
          id,
          charge_type,
          rate_basis,
          value,
          label,
          sort_order,
          is_active,
          apply_before_pct,
          weight_source,
          rate_charge_breaks (
            id,
            min_value,
            max_value,
            rate_value
          )
        )
      `)
      .eq('lane_id', laneId)
      .is('thermal_profile_id', null)
      .eq('is_active', true)
      .or(`carrier_id.eq.${carrierId},carrier_id.is.null`)

    if (cardsError) throw new Error(`Error loading rate cards: ${cardsError.message}`)

    // 3. Select Base Rate Card (prefer carrier-specific, else org default)
    const carrierCards = potentialCards?.filter(c => c.carrier_id === carrierId) || []
    const defaultCards = potentialCards?.filter(c => c.carrier_id === null) || []
    const selectedRateCard: RateCard | undefined = carrierCards[0] || defaultCards[0]

    if (!selectedRateCard) {
      throw new Error(`No active base rate card found for Lane ${laneId} (Carrier ${carrierId} or Default)`)
    }

    // Sort charges
    const sortedCharges = (selectedRateCard.rate_card_charges || [])
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)


    // 4. Calculate Charges
    const useTruckCapacity = (charge: RateCardCharge) =>
      (charge.rate_basis === 'PER_TN' || charge.rate_basis === 'PER_TN_KM') &&
      charge.weight_source === 'TRUCK_CAPACITY' &&
      billableWeightTn != null
    const weightForCharge = (charge: RateCardCharge) =>
      useTruckCapacity(charge) ? billableWeightTn! : totalWeight

    let subtotalForPct = 0
    const chargeResults: ChargeResult[] = []

    for (const charge of sortedCharges) {
      let dimensionValue = 0

      switch (charge.rate_basis) {
        case 'FLAT':
          dimensionValue = 1
          break
        case 'PER_TN':
          dimensionValue = weightForCharge(charge)
          break
        case 'PER_KM':
          dimensionValue = distance
          break
        case 'PER_TN_KM':
          dimensionValue = weightForCharge(charge) * distance
          break
        case 'PER_HOUR':
          dimensionValue = transitTime
          break
        case 'PER_STOP':
          dimensionValue = stopCount
          break
        case 'PERCENTAGE':
          dimensionValue = subtotalForPct
          break
      }

      // Check breaks to find effective rate value
      let effectiveRate = charge.value
      let breakUsedStr = ''
      
      if (charge.rate_charge_breaks && charge.rate_charge_breaks.length > 0) {
        const lookupValue = dimensionValue
        const useClosestLower =
          (charge.rate_basis === 'PER_TN' || charge.rate_basis === 'PER_TN_KM') &&
          charge.weight_source === 'TRUCK_CAPACITY'
        const matchedBreak = useClosestLower
          ? charge.rate_charge_breaks
              .filter((b) => lookupValue >= b.min_value)
              .reduce<typeof charge.rate_charge_breaks[0] | null>(
                (best, b) => (!best || b.min_value > best.min_value ? b : best),
                null
              )
          : charge.rate_charge_breaks.find(
              (b) => lookupValue >= b.min_value && (b.max_value === null || lookupValue < b.max_value)
            )

        if (matchedBreak) {
          effectiveRate = matchedBreak.rate_value
          breakUsedStr =
            matchedBreak.min_value === matchedBreak.max_value
              ? `${matchedBreak.min_value}`
              : `${matchedBreak.min_value}-${matchedBreak.max_value ?? '+'}`
        }
      }

      // Calculate Amount
      let amount = 0
      if (charge.rate_basis === 'PERCENTAGE') {
        amount = subtotalForPct * (effectiveRate / 100)
      } else if (charge.rate_basis === 'FLAT') {
        amount = effectiveRate // Flat value
      } else {
        amount = effectiveRate * dimensionValue // Rate * Unit (tn, km, etc)
      }

      // Add to subtotal if applicable
      if (charge.apply_before_pct && charge.rate_basis !== 'PERCENTAGE') {
        subtotalForPct += amount
      }

      chargeResults.push({
        charge_type: charge.charge_type,
        rate_basis: charge.rate_basis,
        amount,
        rate_value: effectiveRate,
        label: charge.label,
        break_used: breakUsedStr || undefined
      })
    }

    // 5. Subtotal (no min_charge - pricing is charge-driven)
    const subtotal = chargeResults.reduce((sum, res) => sum + res.amount, 0)

    // 6. Apply Thermal Modifier (if dispatch has thermal and modifier exists)
    let totalCost = subtotal
    let thermalModifierApplied: { modifier_type: string; value: number } | undefined

    if (targetThermalProfile != null) {
      const { data: modifier } = await supabase
        .from('rate_card_thermal_modifiers')
        .select('modifier_type, value')
        .eq('rate_card_id', selectedRateCard.id)
        .eq('thermal_profile_id', targetThermalProfile)
        .maybeSingle()

      if (modifier) {
        thermalModifierApplied = { modifier_type: modifier.modifier_type, value: Number(modifier.value) }
        if (modifier.modifier_type === 'MULTIPLIER') {
          totalCost = subtotal * Number(modifier.value)
        } else if (modifier.modifier_type === 'FIXED_ADD') {
          totalCost = subtotal + Number(modifier.value)
        }
      }
    }

    // Helper to sum by type (for compatibility/logging)
    const getSumByType = (type: string) => 
      chargeResults.filter(r => r.charge_type === type).reduce((s, r) => s + r.amount, 0)

    const baseCost = getSumByType('BASE')
    const fuelSurcharge = getSumByType('FUEL')
    const serviceSurcharge = getSumByType('REEFER') + getSumByType('HANDLING') 
    const additionalCharges = subtotal - baseCost - fuelSurcharge - serviceSurcharge

    // 7. Return Result
    return {
      id: crypto.randomUUID(),
      org_id: orgId,
      dispatch_order_id: dispatchOrderId,
      rate_card_id: selectedRateCard.id,
      base_cost: baseCost,
      fuel_surcharge: fuelSurcharge,
      service_surcharge: serviceSurcharge,
      additional_charges: additionalCharges,
      subtotal: subtotal,
      total_cost: totalCost,
      total_penalties: 0,
      status: 'DRAFT',
      calculation_details: {
        charges: chargeResults,
        dimensions: {
          total_weight_tn: totalWeight,
          billable_weight_tn: billableWeightTn ?? totalWeight,
          distance_km: distance,
          transit_time_hr: transitTime,
          stop_count: stopCount
        },
        thermal_modifier_applied: thermalModifierApplied
      }
    }
  },

  /**
   * Save the calculated cost to the database
   */
  async saveDispatchOrderCost(cost: DispatchOrderCost): Promise<void> {
    const { error } = await supabase
      .from('dispatch_order_costs')
      .upsert({
         dispatch_order_id: cost.dispatch_order_id,
         org_id: cost.org_id,
         rate_card_id: cost.rate_card_id,
         base_cost: cost.base_cost,
         fuel_surcharge: cost.fuel_surcharge,
         service_surcharge: cost.service_surcharge,
         additional_charges: cost.additional_charges,
         subtotal: cost.subtotal,
         total_cost: cost.total_cost,
         calculation_details: cost.calculation_details as any, // Cast to Json
         total_penalties: cost.total_penalties,
         status: cost.status,
         calculated_at: new Date().toISOString()
      }, { onConflict: 'dispatch_order_id' })

    if (error) throw error
  }
}
