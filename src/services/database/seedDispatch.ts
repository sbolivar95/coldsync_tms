import { supabase } from '../../lib/supabase'

/**
 * seedDispatchData
 * 
 * Specialized seed function for Dispatch testing.
 * Creates: 
 * - 4-5 Thermal Profiles
 * - 5 Products (linked to profiles)
 * - 2 Carriers
 * - 5 Drivers
 * - 5 Vehicles
 * - 5 Trailers (with reefer equipment)
 * - 5 Fleet Sets (Assignments)
 */

interface SeedResult {
  success: boolean
  message: string
  error?: string
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  return `${letters[randomBetween(0, 25)]}${letters[randomBetween(0, 25)]}${letters[randomBetween(0, 25)]}-${numbers[randomBetween(0, 9)]}${numbers[randomBetween(0, 9)]}${numbers[randomBetween(0, 9)]}`
}

export async function seedDispatchData(orgId: string): Promise<SeedResult> {
  console.log('🚀 Starting Robust Dispatch Seeding for Org:', orgId)

  try {
    // 1. Get Country ID (Bolivia or fallback)
    const { data: country } = await supabase.from('countries').select('id').limit(1).single()
    const countryId = country?.id || 1

    // 2. Thermal Profiles
    const { data: existingProfiles } = await supabase
      .from('thermal_profile')
      .select('id, name')
      .eq('org_id', orgId)
    
    const profileToCreate = [
      { name: 'Ultra-Frozen (-25°C)', temp_min_c: -30, temp_max_c: -20, description: 'Deep freeze specs' },
      { name: 'Standard Frozen (-18°C)', temp_min_c: -22, temp_max_c: -15, description: 'Ice cream and meats' },
      { name: 'Cold Refrigerated (2°C)', temp_min_c: 1, temp_max_c: 5, description: 'Dairy and poultry' },
      { name: 'Pharma Cold (5°C)', temp_min_c: 2, temp_max_c: 8, description: 'Vaccines and medicine' },
      { name: 'Ambient Control (20°C)', temp_min_c: 15, temp_max_c: 25, description: 'Sensitive dry goods' },
    ]

    const profileMap = new Map<string, number>(existingProfiles?.map(p => [p.name, p.id]) || [])
    const missingProfiles = profileToCreate.filter(p => !profileMap.has(p.name))

    if (missingProfiles.length > 0) {
      const { data: newProfiles, error: tpError } = await supabase
        .from('thermal_profile')
        .insert(missingProfiles.map(p => ({ ...p, org_id: orgId, is_active: true })))
        .select()
      if (tpError) throw tpError
      newProfiles?.forEach(p => profileMap.set(p.name, p.id))
    }

    // 3. Products
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name')
      .eq('org_id', orgId)
    
    const productsToCreate = [
      { name: 'Premium Vanilla Ice Cream', profile: 'Ultra-Frozen (-25°C)' },
      { name: 'Fresh Atlantic Salmon', profile: 'Cold Refrigerated (2°C)' },
      { name: 'Organic Red Bananas', profile: 'Ambient Control (20°C)' },
      { name: 'Critical Vaccines (Batch A)', profile: 'Pharma Cold (5°C)' },
      { name: 'Frozen Berries Mix', profile: 'Standard Frozen (-18°C)' },
    ]

    const productMap = new Map<string, number>(existingProducts?.map(p => [p.name, p.id]) || [])
    const missingProducts = productsToCreate.filter(p => !productMap.has(p.name))

    if (missingProducts.length > 0) {
      const { data: newProducts, error: prodError } = await supabase
        .from('products')
        .insert(missingProducts.map(p => ({
          name: p.name,
          org_id: orgId,
          is_active: true,
          description: `Seeded product for ${p.profile}`
        })))
        .select()
      if (prodError) throw prodError
      newProducts?.forEach(p => productMap.set(p.name, p.id))

      // Link products to thermal profiles
      const productLinks = newProducts?.map(p => {
        const profileName = productsToCreate.find(pc => pc.name === p.name)?.profile
        const profileId = profileMap.get(profileName!)
        return {
          product_id: p.id,
          thermal_profile_id: profileId,
          org_id: orgId
        }
      })
      if (productLinks && productLinks.length > 0) {
        await supabase.from('product_thermal_profiles').insert(productLinks)
      }
    }

    // 4. Carriers
    const { data: existingCarriers } = await supabase
      .from('carriers')
      .select('id, carrier_id')
      .eq('org_id', orgId)
    
    const carrierDefs = [
      { carrier_id: 'C-ARCTIC', commercial_name: 'Arctic Trans' },
      { carrier_id: 'C-SUNNY', commercial_name: 'Sunny Logistics' }
    ]

    const carrierIdMap = new Map<string, number>(existingCarriers?.map(c => [c.carrier_id, c.id]) || [])
    const missingCarriers = carrierDefs.filter(c => !carrierIdMap.has(c.carrier_id))

    if (missingCarriers.length > 0) {
      const carriersInsert = missingCarriers.map(c => ({
        carrier_id: c.carrier_id,
        commercial_name: c.commercial_name,
        legal_name: `${c.commercial_name} Solutions`,
        tax_id: `TAX-${c.carrier_id}`,
        country: 'Bolivia',
        city: 'Santa Cruz',
        contact_name: 'Seeded Contact',
        contact_email: `ops@${c.carrier_id.toLowerCase()}.test`,
        contact_phone: '+591000',
        legal_representative: 'Seeded Rep',
        fiscal_address: 'Seeded Address',
        ops_phone_24_7: '+591111',
        finance_email: `billing@${c.carrier_id.toLowerCase()}.test`,
        payment_terms: 30,
        org_id: orgId,
      }))
      const { data: newCarriers, error: carrError } = await supabase
        .from('carriers')
        .insert(carriersInsert)
        .select()
      if (carrError) throw carrError
      newCarriers?.forEach(c => carrierIdMap.set(c.carrier_id, c.id))
    }

    const carrierIdsForSeeding = [carrierIdMap.get('C-ARCTIC')!, carrierIdMap.get('C-SUNNY')!]

    // 5. Drivers (5)
    const { data: existingDrivers } = await supabase
      .from('drivers')
      .select('id, driver_id')
      .eq('org_id', orgId)
    
    const driverIdMap = new Map<string, number>(existingDrivers?.map(d => [d.driver_id, d.id]) || [])
    const driverNames = ['Mario Bros', 'Luigi Bros', 'Peach Toadstool', 'Bowser King', 'Yoshi Dino']
    const missingDrivers = driverNames.filter((_, idx) => !driverIdMap.has(`D-${idx + 100}`))

    if (missingDrivers.length > 0) {
      const driversInsert = driverNames
        .map((name, idx) => ({ name, idx }))
        .filter(({ idx }) => !driverIdMap.has(`D-${idx + 100}`))
        .map(({ name, idx }) => ({
          driver_id: `D-${idx + 100}`,
          name,
          license_number: `LIC-${idx}${randomBetween(1000, 9999)}`,
          phone_number: `+591${randomBetween(7000, 7999)}${randomBetween(1000, 9999)}`,
          birth_date: '1990-01-01',
          contract_date: new Date().toISOString().split('T')[0],
          nationality: countryId,
          address: 'Driver Way 1',
          city: 'Santa Cruz',
          org_id: orgId,
          carrier_id: carrierIdsForSeeding[idx % 2],
          status: 'AVAILABLE' as const
        }))
      const { data: newDrivers, error: drvError } = await supabase.from('drivers').insert(driversInsert).select()
      if (drvError) throw drvError
      newDrivers?.forEach(d => driverIdMap.set(d.driver_id, d.id))
    }

    // 6. Vehicles (5)
    const { data: existingVehicles } = await supabase
      .from('vehicles')
      .select('id, unit_code')
      .eq('org_id', orgId)
    
    const vehicleIdMap = new Map<string, number>(existingVehicles?.map(v => [v.unit_code, v.id]) || [])
    const missingVehiclesCount = Array.from({ length: 5 }).filter((_, idx) => !vehicleIdMap.has(`V-${idx + 200}`)).length

    if (missingVehiclesCount > 0) {
      const vehicleBrands = ['Volvo', 'Scania', 'Kenworth']
      const vehiclesInsert = Array.from({ length: 5 })
        .map((_, idx) => idx)
        .filter(idx => !vehicleIdMap.has(`V-${idx + 200}`))
        .map(idx => ({
          unit_code: `V-${idx + 200}`,
          vehicle_type: 'Heavy Truck',
          plate: generatePlate(),
          brand: randomElement(vehicleBrands),
          model: 'T-Series',
          year: 2022,
          vin: `VIN-${idx}${randomBetween(100000, 999999)}`,
          org_id: orgId,
          carrier_id: carrierIdsForSeeding[idx % 2],
          operational_status: 'ACTIVE' as const,
          additional_info: 'Seeded for test',
          odometer_unit: 'KM',
          odometer_value: randomBetween(10000, 50000)
        }))
      const { data: newVehicles, error: vehError } = await supabase.from('vehicles').insert(vehiclesInsert).select()
      if (vehError) throw vehError
      newVehicles?.forEach(v => vehicleIdMap.set(v.unit_code, v.id))
    }

    // 7. Trailers (5)
    const { data: existingTrailers } = await supabase
      .from('trailers')
      .select('id, code')
      .eq('org_id', orgId)
    
    const trailerIdMap = new Map<string, number>(existingTrailers?.map(t => [t.code, t.id]) || [])
    const missingTrailersCount = Array.from({ length: 5 }).filter((_, idx) => !trailerIdMap.has(`T-${idx + 300}`)).length

    if (missingTrailersCount > 0) {
      const trailersInsert = Array.from({ length: 5 })
        .map((_, idx) => idx)
        .filter(idx => !trailerIdMap.has(`T-${idx + 300}`))
        .map(idx => ({
          code: `T-${idx + 300}`,
          plate: generatePlate(),
          transport_capacity_weight_tn: 25,
          volume_m3: 80,
          tare_weight_tn: 8,
          length_m: 13.6,
          width_m: 2.5,
          height_m: 2.7,
          supports_multi_zone: idx % 2 === 0,
          compartments: idx % 2 === 0 ? 2 : 1,
          org_id: orgId,
          carrier_id: carrierIdsForSeeding[idx % 2],
          operational_status: 'ACTIVE' as const
        }))
      const { data: newTrailers, error: trlError } = await supabase.from('trailers').insert(trailersInsert).select()
      if (trlError) throw trlError
      newTrailers?.forEach(t => trailerIdMap.set(t.code, t.id))

      // Reefer Equip
      const reefers = newTrailers?.map(t => ({
        org_id: orgId,
        owner_type: 'TRAILER' as const,
        owner_id: t.id,
        brand: 'Thermo King',
        model: 'SLX-400',
        year: 2023,
        power_type: 'DIESEL' as const,
        temp_min_c: -30,
        temp_max_c: 30
      }))
      if (reefers && reefers.length > 0) {
        await supabase.from('reefer_equipments').insert(reefers)
      }
    }

    // 8. Fleet Sets
    // For simplicity, we only create fleet sets if any driver/vehicle/trailer was newly created,
    // or we can just try to create them and ignore conflicts if they exist (or use manual check)
    const { data: existingFleetSets } = await supabase
      .from('fleet_sets')
      .select('id, vehicle_id, driver_id, trailer_id')
      .eq('org_id', orgId)
    
    const fleetSetsInsert = Array.from({ length: 5 })
      .map((_, idx) => {
        const dId = driverIdMap.get(`D-${idx + 100}`)
        const vId = vehicleIdMap.get(`V-${idx + 200}`)
        const tId = trailerIdMap.get(`T-${idx + 300}`)
        
        const exists = existingFleetSets?.some(fs => fs.vehicle_id === vId && fs.driver_id === dId && fs.trailer_id === tId)
        
        if (!exists && dId && vId && tId) {
          return {
            org_id: orgId,
            carrier_id: carrierIdsForSeeding[idx % 2],
            driver_id: dId,
            vehicle_id: vId,
            trailer_id: tId,
            is_active: true,
            starts_at: new Date().toISOString()
          }
        }
        return null
      })
      .filter((fs): fs is NonNullable<typeof fs> => fs !== null)

    if (fleetSetsInsert.length > 0) {
      const { error: fsError } = await supabase.from('fleet_sets').insert(fleetSetsInsert)
      if (fsError) throw fsError
    }

    return { success: true, message: '🎉 Dispatch data seeded successfully!' }
  } catch (error: any) {
    console.error('❌ Seeding failed:', error)
    return { success: false, message: 'Failed to seed data', error: error.message }
  }
}
