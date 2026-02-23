import { supabase } from '../../lib/supabase'

const today = () => new Date().toISOString().split('T')[0]!

/** Contract is valid today: already started (valid_from <= today) and not ended (valid_to null or >= today). */
const contractValidToday = (validFrom: string, validTo: string | null) => {
  const t = today()
  if (validFrom > t) return false
  return validTo == null || validTo >= t
}

export interface CarrierContractSummary {
  id: string
  contract_number: string
  contract_name: string | null
  valid_from: string
  valid_to: string | null
  status: string
  currency: string
}

export interface RateCardWithCharges {
  id: string
  name: string | null
  carrier_id: number | null
  lane_id: string
  thermal_profile_id: number | null
  rate_card_charges: Array<{
    id: string
    charge_type: string
    rate_basis: string
    value: number
    label: string | null
    is_active: boolean
    sort_order: number
    rate_charge_breaks: Array<{
      min_value: number
      max_value: number | null
      rate_value: number
    }>
  }>
}

export interface PenaltyRuleSummary {
  id: string
  carrier_contract_id: string | null
  rule_type: string
  condition_description: string
  penalty_type: string
  penalty_value: number | null
  is_active: boolean
  priority: number
}

export interface CarrierCommercialRules {
  carrierId: number
  carrierName?: string
  contracts: CarrierContractSummary[]
  rateCards: RateCardWithCharges[]
  penaltyRules: PenaltyRuleSummary[]
}

/**
 * Fetches all commercial rules for a carrier (contracts, rate cards, charges, penalties).
 * Used to log "what commercial rules each carrier has" at assignment time.
 */
export async function getCarrierCommercialRules(
  orgId: string,
  carrierId: number
): Promise<CarrierCommercialRules> {
  // Fetch all active contracts for carrier; filter validity in memory (valid_from <= today, valid_to null or >= today).
  // DB filter valid_from >= today incorrectly excluded contracts that started in the past.
  const contractsRes = await supabase
    .from('carrier_contracts')
    .select('id, contract_number, contract_name, valid_from, valid_to, status, currency')
    .eq('org_id', orgId)
    .eq('carrier_id', carrierId)
    .eq('status', 'ACTIVE')
    .order('valid_from', { ascending: false })

  if (contractsRes.error) throw new Error(`Contracts: ${contractsRes.error.message}`)
  const allActive = (contractsRes.data || []) as CarrierContractSummary[]
  const contracts = allActive.filter((c) => contractValidToday(c.valid_from, c.valid_to))
  const contractIds = contracts.map((c) => c.id)

  const [penaltyRes, rateCardsRes] = await Promise.all([
    contractIds.length > 0
      ? supabase
        .from('penalty_rules')
        .select('id, carrier_contract_id, rule_type, condition_description, penalty_type, penalty_value, is_active, priority')
        .eq('org_id', orgId)
        .in('carrier_contract_id', contractIds)
        .eq('is_active', true)
        .order('priority', { ascending: false })
      : { data: [], error: null },
    supabase
      .from('rate_cards')
      .select(`
        id,
        carrier_id,
        lane_id,
        thermal_profile_id,
        rate_card_charges (
          id,
          charge_type,
          rate_basis,
          value,
          label,
          sort_order,
          is_active,
          rate_charge_breaks (
            min_value,
            max_value,
            rate_value
          )
        )
      `)
      .eq('org_id', orgId)
      .or(`carrier_id.eq.${carrierId},carrier_id.is.null`)
      .eq('is_active', true)
  ])

  if (penaltyRes.error) throw new Error(`Penalties: ${penaltyRes.error.message}`)
  if (rateCardsRes.error) throw new Error(`Rate Cards: ${rateCardsRes.error.message}`)

  return {
    carrierId,
    contracts,
    rateCards: (rateCardsRes.data || []) as RateCardWithCharges[],
    penaltyRules: (penaltyRes.data || []) as PenaltyRuleSummary[],
  }
}
