import { supabase } from '../lib/supabase'
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ThermalProfile,
  ThermalProfileInsert,
  ThermalProfileUpdate,
  ProductThermalProfile,
} from '../types/database.types'

/**
 * Products Service - CRUD operations for products table
 */

export const productsService = {
  /**
   * Get all products for an organization
   */
  async getAll(orgId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single product by ID
   */
  async getById(id: number, orgId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get product with its thermal profiles
   */
  async getWithThermalProfiles(id: number, orgId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_thermal_profiles (
          thermal_profile (*)
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
    return data
  },

  /**
   * Get all products with their thermal profiles
   */
  async getAllWithThermalProfiles(orgId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_thermal_profiles (
          thermal_profile (*)
        )
      `
      )
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get active products
   */
  async getActive(orgId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new product
   */
  async create(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a product
   */
  async update(
    id: number,
    orgId: string,
    updates: ProductUpdate
  ): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Soft delete a product
   */
  async softDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Hard delete a product
   */
  async hardDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search products by name
   */
  async search(orgId: string, searchTerm: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', orgId)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}

/**
 * Thermal Profiles Service - CRUD operations for thermal_profile table
 */

export const thermalProfilesService = {
  /**
   * Get all thermal profiles for an organization
   */
  async getAll(orgId: string): Promise<ThermalProfile[]> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single thermal profile by ID
   */
  async getById(id: number, orgId: string): Promise<ThermalProfile | null> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get active thermal profiles
   */
  async getActive(orgId: string): Promise<ThermalProfile[]> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new thermal profile
   */
  async create(profile: ThermalProfileInsert): Promise<ThermalProfile> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a thermal profile
   */
  async update(
    id: number,
    orgId: string,
    updates: ThermalProfileUpdate
  ): Promise<ThermalProfile> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Soft delete a thermal profile
   */
  async softDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('thermal_profile')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Hard delete a thermal profile
   */
  async hardDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('thermal_profile')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search thermal profiles by name
   */
  async search(orgId: string, searchTerm: string): Promise<ThermalProfile[]> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('org_id', orgId)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}

/**
 * Product Thermal Profiles Service - Link products to thermal profiles
 */

export const productThermalProfilesService = {
  /**
   * Get thermal profiles for a product
   */
  async getByProductId(productId: number, orgId: string) {
    const { data, error } = await supabase
      .from('product_thermal_profiles')
      .select(
        `
        *,
        thermal_profile (*)
      `
      )
      .eq('product_id', productId)
      .eq('org_id', orgId)

    if (error) throw error
    return data || []
  },

  /**
   * Get products for a thermal profile
   */
  async getByThermalProfileId(thermalProfileId: number, orgId: string) {
    const { data, error } = await supabase
      .from('product_thermal_profiles')
      .select(
        `
        *,
        products (*)
      `
      )
      .eq('thermal_profile_id', thermalProfileId)
      .eq('org_id', orgId)

    if (error) throw error
    return data || []
  },

  /**
   * Link a product to a thermal profile
   */
  async link(
    productId: number,
    thermalProfileId: number,
    orgId: string
  ): Promise<ProductThermalProfile> {
    const { data, error } = await supabase
      .from('product_thermal_profiles')
      .insert({
        product_id: productId,
        thermal_profile_id: thermalProfileId,
        org_id: orgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Unlink a product from a thermal profile
   */
  async unlink(
    productId: number,
    thermalProfileId: number,
    orgId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('product_thermal_profiles')
      .delete()
      .eq('product_id', productId)
      .eq('thermal_profile_id', thermalProfileId)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Replace all thermal profiles for a product
   */
  async replaceForProduct(
    productId: number,
    orgId: string,
    thermalProfileIds: number[]
  ): Promise<void> {
    // First, remove all existing links
    const { error: deleteError } = await supabase
      .from('product_thermal_profiles')
      .delete()
      .eq('product_id', productId)
      .eq('org_id', orgId)

    if (deleteError) throw deleteError

    // Then, add new links
    if (thermalProfileIds.length > 0) {
      const links = thermalProfileIds.map((thermalProfileId) => ({
        product_id: productId,
        thermal_profile_id: thermalProfileId,
        org_id: orgId,
      }))

      const { error: insertError } = await supabase
        .from('product_thermal_profiles')
        .insert(links)

      if (insertError) throw insertError
    }
  },
}
