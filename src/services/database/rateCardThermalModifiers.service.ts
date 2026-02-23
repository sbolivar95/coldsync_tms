import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type Row = Database['public']['Tables']['rate_card_thermal_modifiers']['Row']
type Insert = Database['public']['Tables']['rate_card_thermal_modifiers']['Insert']
type Update = Database['public']['Tables']['rate_card_thermal_modifiers']['Update']

export type ThermalModifierType = 'MULTIPLIER' | 'FIXED_ADD'

export interface RateCardThermalModifierWithProfile extends Row {
  thermal_profile?: { id: number; name: string } | null
}

export const rateCardThermalModifiersService = {
  async getByRateCardId(rateCardId: string): Promise<Row[]> {
    const { data, error } = await supabase
      .from('rate_card_thermal_modifiers')
      .select('*')
      .eq('rate_card_id', rateCardId)
      .order('thermal_profile_id', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getByRateCardIdWithProfiles(rateCardId: string): Promise<RateCardThermalModifierWithProfile[]> {
    const { data, error } = await supabase
      .from('rate_card_thermal_modifiers')
      .select(
        `
        *,
        thermal_profile:thermal_profile_id (id, name)
      `
      )
      .eq('rate_card_id', rateCardId)
      .order('thermal_profile_id', { ascending: true })

    if (error) throw error
    return (data || []) as RateCardThermalModifierWithProfile[]
  },

  async getByRateCardAndThermal(
    rateCardId: string,
    thermalProfileId: number
  ): Promise<Row | null> {
    const { data, error } = await supabase
      .from('rate_card_thermal_modifiers')
      .select('*')
      .eq('rate_card_id', rateCardId)
      .eq('thermal_profile_id', thermalProfileId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async upsert(payload: Insert): Promise<Row> {
    const { data, error } = await supabase
      .from('rate_card_thermal_modifiers')
      .upsert(
        {
          rate_card_id: payload.rate_card_id,
          thermal_profile_id: payload.thermal_profile_id,
          modifier_type: payload.modifier_type,
          value: payload.value,
        },
        { onConflict: 'rate_card_id,thermal_profile_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(rateCardId: string, thermalProfileId: number): Promise<void> {
    const { error } = await supabase
      .from('rate_card_thermal_modifiers')
      .delete()
      .eq('rate_card_id', rateCardId)
      .eq('thermal_profile_id', thermalProfileId)

    if (error) throw error
  },

  async deleteAllForRateCard(rateCardId: string): Promise<void> {
    const { error } = await supabase
      .from('rate_card_thermal_modifiers')
      .delete()
      .eq('rate_card_id', rateCardId)

    if (error) throw error
  },
}
