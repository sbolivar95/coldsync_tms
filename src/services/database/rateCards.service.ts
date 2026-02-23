import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type RateCards = Database['public']['Tables']['rate_cards']['Row']
type RateCardsInsert = Database['public']['Tables']['rate_cards']['Insert']
type RateCardCharges = Database['public']['Tables']['rate_card_charges']['Row']
type RateCardChargesInsert = Database['public']['Tables']['rate_card_charges']['Insert']
type RateChargeBreaks = Database['public']['Tables']['rate_charge_breaks']['Row']
type RateChargeBreaksInsert = Database['public']['Tables']['rate_charge_breaks']['Insert']

/**
 * Rate Cards Service - CRUD operations for rate_cards table
 * Handles nested charges and breaks with transaction-like operations
 */

export interface RateCardWithCharges extends RateCards {
  rate_card_charges: Array<RateCardCharges & {
    rate_charge_breaks?: RateChargeBreaks[]
  }>
}

export interface RateCardFormData {
  name: string | null
  lane_id: string
  carrier_id: number | null
  thermal_profile_id: number | null
  valid_from: string
  valid_to: string | null
  is_active: boolean
  charges: Array<{
    charge_type: string
    rate_basis: string
    value: number
    label: string | null
    sort_order: number
    is_active: boolean
    apply_before_pct: boolean
    weight_source?: string
    breaks?: Array<{
      min_value: number
      max_value: number | null
      rate_value: number
    }>
  }>
}

export const rateCardsService = {
  async getAll(orgId: string): Promise<RateCardWithCharges[]> {
    const { data, error } = await supabase
      .from('rate_cards')
      .select(
        `
        *,
        rate_card_charges (
          *,
          rate_charge_breaks (*)
        )
      `
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((card) => ({
      ...card,
      rate_card_charges: (card.rate_card_charges || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((charge: any) => ({
          ...charge,
          rate_charge_breaks: (charge.rate_charge_breaks || []).sort(
            (a: any, b: any) => a.min_value - b.min_value
          ),
        })),
    })) as RateCardWithCharges[]
  },

  async getById(id: string, orgId: string): Promise<RateCardWithCharges | null> {
    const { data, error } = await supabase
      .from('rate_cards')
      .select(
        `
        *,
        rate_card_charges (
          *,
          rate_charge_breaks (*)
        )
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (!data) return null

    return {
      ...data,
      rate_card_charges: (data.rate_card_charges || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((charge: any) => ({
          ...charge,
          rate_charge_breaks: (charge.rate_charge_breaks || []).sort(
            (a: any, b: any) => a.min_value - b.min_value
          ),
        })),
    } as RateCardWithCharges
  },

  async getActive(orgId: string): Promise<RateCardWithCharges[]> {
    const { data, error } = await supabase
      .from('rate_cards')
      .select(
        `
        *,
        rate_card_charges (
          *,
          rate_charge_breaks (*)
        )
      `
      )
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((card) => ({
      ...card,
      rate_card_charges: (card.rate_card_charges || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((charge: any) => ({
          ...charge,
          rate_charge_breaks: (charge.rate_charge_breaks || []).sort(
            (a: any, b: any) => a.min_value - b.min_value
          ),
        })),
    })) as RateCardWithCharges[]
  },

  async create(rateCardData: RateCardFormData & { org_id: string }): Promise<RateCardWithCharges> {
    const { data: cardData, error: cardError } = await supabase
      .from('rate_cards')
      .insert({
        org_id: rateCardData.org_id,
        name: rateCardData.name,
        lane_id: rateCardData.lane_id,
        carrier_id: rateCardData.carrier_id,
        thermal_profile_id: null, // base rate cards only; thermal modifiers used for profiles
        valid_from: rateCardData.valid_from,
        valid_to: rateCardData.valid_to,
        is_active: rateCardData.is_active,
      })
      .select()
      .single()

    if (cardError) throw cardError
    if (!cardData) throw new Error('Failed to create rate card')

    const rateCardId = cardData.id

    if (rateCardData.charges && rateCardData.charges.length > 0) {
      const chargesToInsert: RateCardChargesInsert[] = rateCardData.charges.map((charge) => ({
        rate_card_id: rateCardId,
        charge_type: charge.charge_type,
        rate_basis: charge.rate_basis,
        value: charge.value,
        label: charge.label,
        sort_order: charge.sort_order,
        is_active: charge.is_active,
        apply_before_pct: charge.apply_before_pct,
        weight_source: charge.weight_source ?? 'ACTUAL',
      }))

      const { data: chargesData, error: chargesError } = await supabase
        .from('rate_card_charges')
        .insert(chargesToInsert)
        .select()

      if (chargesError) {
        await this.hardDelete(rateCardId, rateCardData.org_id)
        throw chargesError
      }

      const breaksToInsert: RateChargeBreaksInsert[] = []
      chargesData?.forEach((charge, index) => {
        const chargeFormData = rateCardData.charges[index]
        if (chargeFormData?.breaks && chargeFormData.breaks.length > 0) {
          chargeFormData.breaks.forEach((breakData) => {
            breaksToInsert.push({
              charge_id: charge.id,
              min_value: breakData.min_value,
              max_value: breakData.max_value,
              rate_value: breakData.rate_value,
            })
          })
        }
      })

      if (breaksToInsert.length > 0) {
        const { error: breaksError } = await supabase
          .from('rate_charge_breaks')
          .insert(breaksToInsert)

        if (breaksError) {
          await supabase.from('rate_card_charges').delete().eq('rate_card_id', rateCardId)
          await this.hardDelete(rateCardId, rateCardData.org_id)
          throw breaksError
        }
      }
    }

    const result = await this.getById(rateCardId, rateCardData.org_id)
    if (!result) throw new Error('Failed to retrieve created rate card')
    return result
  },

  async update(
    id: string,
    orgId: string,
    updates: RateCardFormData
  ): Promise<RateCardWithCharges> {
    const { error: updateError } = await supabase
      .from('rate_cards')
      .update({
        name: updates.name,
        lane_id: updates.lane_id,
        carrier_id: updates.carrier_id,
        thermal_profile_id: null, // base rate cards only; thermal modifiers used for profiles
        valid_from: updates.valid_from,
        valid_to: updates.valid_to,
        is_active: updates.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (updateError) throw updateError

    const { data: existingCharges } = await supabase
      .from('rate_card_charges')
      .select('id')
      .eq('rate_card_id', id)

    if (existingCharges && existingCharges.length > 0) {
      const chargeIds = existingCharges.map((c) => c.id)
      await supabase.from('rate_charge_breaks').delete().in('charge_id', chargeIds)
    }

    await supabase.from('rate_card_charges').delete().eq('rate_card_id', id)

    if (updates.charges && updates.charges.length > 0) {
      const chargesToInsert: RateCardChargesInsert[] = updates.charges.map((charge) => ({
        rate_card_id: id,
        charge_type: charge.charge_type,
        rate_basis: charge.rate_basis,
        value: charge.value,
        label: charge.label,
        sort_order: charge.sort_order,
        is_active: charge.is_active,
        apply_before_pct: charge.apply_before_pct,
        weight_source: charge.weight_source ?? 'ACTUAL',
      }))

      const { data: chargesData, error: chargesError } = await supabase
        .from('rate_card_charges')
        .insert(chargesToInsert)
        .select()

      if (chargesError) throw chargesError

      const breaksToInsert: RateChargeBreaksInsert[] = []
      chargesData?.forEach((charge, index) => {
        const chargeFormData = updates.charges[index]
        if (chargeFormData?.breaks && chargeFormData.breaks.length > 0) {
          chargeFormData.breaks.forEach((breakData) => {
            breaksToInsert.push({
              charge_id: charge.id,
              min_value: breakData.min_value,
              max_value: breakData.max_value,
              rate_value: breakData.rate_value,
            })
          })
        }
      })

      if (breaksToInsert.length > 0) {
        const { error: breaksError } = await supabase
          .from('rate_charge_breaks')
          .insert(breaksToInsert)

        if (breaksError) throw breaksError
      }
    }

    const result = await this.getById(id, orgId)
    if (!result) throw new Error('Failed to retrieve updated rate card')
    return result
  },

  async softDelete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('rate_cards')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  async reactivate(id: string, orgId: string): Promise<RateCardWithCharges> {
    const { error } = await supabase
      .from('rate_cards')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error

    const result = await this.getById(id, orgId)
    if (!result) throw new Error('Failed to retrieve reactivated rate card')
    return result
  },

  /**
   * Returns whether this rate card is referenced (e.g. by dispatch_order_costs).
   * Uses dispatch_order_costs.rate_card_id (cost record links order pricing to rate card).
   * If > 0, the rate card cannot be permanently deleted.
   */
  async getDispatchOrderCountForRateCard(rateCardId: string): Promise<number> {
    const { data, error } = await supabase
      .from('dispatch_order_costs')
      .select('id')
      .eq('rate_card_id', rateCardId)
      .limit(1)

    if (error) throw error
    return data?.length ? 1 : 0
  },

  async hardDelete(id: string, orgId: string): Promise<void> {
    const count = await this.getDispatchOrderCountForRateCard(id)
    if (count > 0) {
      throw new Error(
        `No se puede eliminar permanentemente: el tarifario está asociado a ${count} orden(es) de despacho.`
      )
    }

    const { data: charges } = await supabase
      .from('rate_card_charges')
      .select('id')
      .eq('rate_card_id', id)

    if (charges && charges.length > 0) {
      const chargeIds = charges.map((c) => c.id)
      await supabase.from('rate_charge_breaks').delete().in('charge_id', chargeIds)
    }

    await supabase.from('rate_card_charges').delete().eq('rate_card_id', id)
    await supabase.from('rate_card_thermal_modifiers').delete().eq('rate_card_id', id)

    const { error } = await supabase.from('rate_cards').delete().eq('id', id).eq('org_id', orgId)

    if (error) throw error
  },

  async search(orgId: string, searchTerm: string): Promise<RateCardWithCharges[]> {
    const { data, error } = await supabase
      .from('rate_cards')
      .select(
        `
        *,
        rate_card_charges (
          *,
          rate_charge_breaks (*)
        )
      `
      )
      .eq('org_id', orgId)
      .or(`name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((card) => ({
      ...card,
      rate_card_charges: (card.rate_card_charges || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((charge: any) => ({
          ...charge,
          rate_charge_breaks: (charge.rate_charge_breaks || []).sort(
            (a: any, b: any) => a.min_value - b.min_value
          ),
        })),
    })) as RateCardWithCharges[]
  },
}
