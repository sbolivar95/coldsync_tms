import { supabase } from '../../lib/supabase'

/**
 * Seed Database with Test Data
 *
 * This function seeds the database with comprehensive test data for:
 * - Thermal Profiles
 * - Products (linked to thermal profiles)
 * - Carriers
 * - Drivers (linked to carriers)
 * - Vehicles (linked to carriers)
 * - Trailers (linked to carriers, with reefer specs)
 * - Location Types
 * - Locations
 * - Route Types
 * - Routes (with stops)
 * - Fleet Sets (combining carrier, driver, vehicle, trailer)
 *
 * Usage:
 * ```tsx
 * import { seedDatabase } from './seed'
 *
 * // In a component or console:
 * await seedDatabase(orgId)
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

interface SeedResult {
  success: boolean
  message: string
  data?: {
    thermalProfiles: number
    products: number
    carriers: number
    drivers: number
    vehicles: number
    trailers: number
    locationTypes: number
    locations: number
    routeTypes: number
    routes: number
    fleetSets: number
    carrierContracts: number
    accessorialChargeTypes: number
    rateCards: number
    rateTiers: number
  }
  error?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  return (
    randomElement(letters.split('')) +
    randomElement(letters.split('')) +
    randomElement(letters.split('')) +
    '-' +
    randomElement(numbers.split('')) +
    randomElement(numbers.split('')) +
    randomElement(numbers.split(''))
  )
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  return Array.from({ length: 17 }, () => randomElement(chars.split(''))).join(
    ''
  )
}

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const THERMAL_PROFILES = [
  {
    name: 'Congelado Profundo',
    description: 'Para productos que requieren congelación profunda',
    temp_min_c: -25,
    temp_max_c: -18,
  },
  {
    name: 'Congelado Estándar',
    description: 'Para productos congelados regulares',
    temp_min_c: -18,
    temp_max_c: -12,
  },
  {
    name: 'Refrigerado Frío',
    description: 'Para productos que requieren refrigeración fría',
    temp_min_c: -5,
    temp_max_c: 0,
  },
  {
    name: 'Refrigerado Estándar',
    description: 'Para productos lácteos y carnes frescas',
    temp_min_c: 0,
    temp_max_c: 4,
  },
  {
    name: 'Refrigerado Templado',
    description: 'Para frutas y verduras frescas',
    temp_min_c: 4,
    temp_max_c: 8,
  },
  {
    name: 'Fresco',
    description: 'Para productos que requieren temperatura controlada',
    temp_min_c: 8,
    temp_max_c: 15,
  },
  {
    name: 'Ambiente Controlado',
    description: 'Para productos sensibles a temperatura ambiente',
    temp_min_c: 15,
    temp_max_c: 25,
  },
]

const PRODUCTS = [
  {
    name: 'Helados Premium',
    description: 'Helados artesanales de alta calidad',
    profiles: ['Congelado Profundo'],
  },
  {
    name: 'Helados Industriales',
    description: 'Helados de producción masiva',
    profiles: ['Congelado Profundo', 'Congelado Estándar'],
  },
  {
    name: 'Pescado Fresco',
    description: 'Pescado y mariscos frescos del día',
    profiles: ['Refrigerado Frío'],
  },
  {
    name: 'Carne de Res',
    description: 'Cortes de carne de res premium',
    profiles: ['Refrigerado Frío', 'Refrigerado Estándar'],
  },
  {
    name: 'Carne de Cerdo',
    description: 'Cortes de carne de cerdo',
    profiles: ['Refrigerado Estándar'],
  },
  {
    name: 'Pollo Fresco',
    description: 'Pollo entero y en piezas',
    profiles: ['Refrigerado Estándar'],
  },
  {
    name: 'Leche Pasteurizada',
    description: 'Leche fresca pasteurizada',
    profiles: ['Refrigerado Estándar'],
  },
  {
    name: 'Yogurt Natural',
    description: 'Yogurt y productos lácteos fermentados',
    profiles: ['Refrigerado Estándar'],
  },
  {
    name: 'Quesos Madurados',
    description: 'Quesos de maduración controlada',
    profiles: ['Refrigerado Estándar', 'Refrigerado Templado'],
  },
  {
    name: 'Frutas Tropicales',
    description: 'Mangos, papayas, piñas y más',
    profiles: ['Refrigerado Templado'],
  },
  {
    name: 'Verduras de Hoja',
    description: 'Lechugas, espinacas y verduras frescas',
    profiles: ['Refrigerado Templado'],
  },
  {
    name: 'Manzanas y Peras',
    description: 'Frutas de clima templado',
    profiles: ['Refrigerado Templado', 'Fresco'],
  },
  {
    name: 'Flores Cortadas',
    description: 'Flores frescas para decoración',
    profiles: ['Refrigerado Templado'],
  },
  {
    name: 'Chocolates Finos',
    description: 'Chocolates artesanales premium',
    profiles: ['Fresco', 'Ambiente Controlado'],
  },
  {
    name: 'Vinos Premium',
    description: 'Vinos que requieren temperatura controlada',
    profiles: ['Fresco', 'Ambiente Controlado'],
  },
  {
    name: 'Medicamentos Refrigerados',
    description: 'Vacunas y medicamentos termo-sensibles',
    profiles: ['Refrigerado Estándar', 'Refrigerado Templado'],
  },
  {
    name: 'Pizza Congelada',
    description: 'Pizzas y comidas preparadas congeladas',
    profiles: ['Congelado Estándar'],
  },
  {
    name: 'Vegetales Congelados',
    description: 'Mix de vegetales y frutas congeladas',
    profiles: ['Congelado Estándar'],
  },
  {
    name: 'Mariscos Congelados',
    description: 'Camarones, langostinos y mariscos',
    profiles: ['Congelado Estándar', 'Congelado Profundo'],
  },
  {
    name: 'Embutidos',
    description: 'Jamones, salchichas y embutidos',
    profiles: ['Refrigerado Estándar'],
  },
]

const CARRIERS = [
  {
    carrier_id: 'CAR-001',
    commercial_name: 'FríoExpress Bolivia',
    legal_name: 'Transporte Refrigerado FríoExpress S.A.',
    carrier_type: 'OWNER' as const,
    tax_id: '1234567890',
    legal_representative: 'Carlos Mendoza García',
    country: 'Bolivia',
    city: 'Santa Cruz',
    fiscal_address: 'Av. Cristo Redentor #1500, Zona Norte',
    contact_name: 'María López',
    contact_phone: '+591 70123456',
    contact_email: 'operaciones@frioexpress.bo',
    ops_phone_24_7: '+591 70123457',
    finance_email: 'finanzas@frioexpress.bo',
    payment_terms: 30,
    currency: 'USD',
  },
  {
    carrier_id: 'CAR-002',
    commercial_name: 'ColdChain Logística',
    legal_name: 'ColdChain Logística Internacional S.R.L.',
    carrier_type: 'THIRD PARTY' as const,
    tax_id: '2345678901',
    legal_representative: 'Roberto Fernández',
    country: 'Bolivia',
    city: 'La Paz',
    fiscal_address: 'Calle Comercio #789, Zona Sur',
    contact_name: 'Ana Martínez',
    contact_phone: '+591 71234567',
    contact_email: 'contacto@coldchain.bo',
    ops_phone_24_7: '+591 71234568',
    finance_email: 'pagos@coldchain.bo',
    payment_terms: 45,
    currency: 'BOB',
  },
  {
    carrier_id: 'CAR-003',
    commercial_name: 'TransFrío Andino',
    legal_name: 'Transportes Refrigerados Andinos S.A.',
    carrier_type: 'THIRD PARTY' as const,
    tax_id: '3456789012',
    legal_representative: 'José Villanueva',
    country: 'Bolivia',
    city: 'Cochabamba',
    fiscal_address: 'Av. Blanco Galindo Km 5',
    contact_name: 'Patricia Rojas',
    contact_phone: '+591 72345678',
    contact_email: 'info@transfrio.bo',
    ops_phone_24_7: '+591 72345679',
    finance_email: 'contabilidad@transfrio.bo',
    payment_terms: 30,
    currency: 'USD',
  },
  {
    carrier_id: 'CAR-004',
    commercial_name: 'Polar Transport',
    legal_name: 'Polar Transport Bolivia S.A.',
    carrier_type: 'OWNER' as const,
    tax_id: '4567890123',
    legal_representative: 'Miguel Ángel Sánchez',
    country: 'Bolivia',
    city: 'Santa Cruz',
    fiscal_address: 'Parque Industrial Norte, Lote 45',
    contact_name: 'Carmen Gutiérrez',
    contact_phone: '+591 73456789',
    contact_email: 'operaciones@polartransport.bo',
    ops_phone_24_7: '+591 73456780',
    finance_email: 'finanzas@polartransport.bo',
    payment_terms: 15,
    currency: 'USD',
  },
  {
    carrier_id: 'CAR-005',
    commercial_name: 'IceLine Cargo',
    legal_name: 'IceLine Cargo Solutions S.R.L.',
    carrier_type: 'THIRD PARTY' as const,
    tax_id: '5678901234',
    legal_representative: 'Fernando Castro',
    country: 'Bolivia',
    city: 'Tarija',
    fiscal_address: 'Av. La Paz #234',
    contact_name: 'Lucía Vargas',
    contact_phone: '+591 74567890',
    contact_email: 'ventas@iceline.bo',
    ops_phone_24_7: '+591 74567891',
    finance_email: 'cobranzas@iceline.bo',
    payment_terms: 60,
    currency: 'BOB',
  },
]

const DRIVER_NAMES = [
  { name: 'Juan Carlos Pérez', city: 'Santa Cruz' },
  { name: 'Pedro Antonio López', city: 'Santa Cruz' },
  { name: 'Miguel Ángel Rodríguez', city: 'La Paz' },
  { name: 'José Luis Martínez', city: 'Cochabamba' },
  { name: 'Roberto Carlos Fernández', city: 'Santa Cruz' },
  { name: 'Luis Alberto Sánchez', city: 'La Paz' },
  { name: 'Carlos Eduardo Ramírez', city: 'Tarija' },
  { name: 'Jorge Andrés Castro', city: 'Santa Cruz' },
  { name: 'Mario Fernando Morales', city: 'Cochabamba' },
  { name: 'Oscar René Gutiérrez', city: 'Santa Cruz' },
  { name: 'Héctor David Vargas', city: 'La Paz' },
  { name: 'Ricardo José Mendoza', city: 'Santa Cruz' },
  { name: 'Sergio Antonio Flores', city: 'Cochabamba' },
  { name: 'Eduardo Pablo Ríos', city: 'Santa Cruz' },
  { name: 'Francisco Javier Díaz', city: 'Tarija' },
]

const VEHICLE_BRANDS = [
  'Volvo',
  'Scania',
  'Mercedes-Benz',
  'MAN',
  'Kenworth',
  'Freightliner',
  'International',
  'Hino',
]
const VEHICLE_MODELS = [
  'FH16',
  'R450',
  'Actros',
  'TGX',
  'T680',
  'Cascadia',
  'LT',
  '500',
]
const VEHICLE_TYPES = ['Tractocamión', 'Camión Rígido', 'Furgón Refrigerado']

const TRAILER_BRANDS = [
  'Utility',
  'Great Dane',
  'Wabash',
  'Hyundai',
  'Carrier',
  'Thermo King',
]
const REEFER_BRANDS = ['Carrier', 'Thermo King', 'Daikin', 'Zanotti']

const LOCATION_TYPES = [
  {
    name: 'Centro de Distribución',
    description: 'Centro principal de distribución y almacenamiento',
  },
  {
    name: 'Almacén Frigorífico',
    description: 'Almacén con capacidad de refrigeración',
  },
  { name: 'Punto de Venta', description: 'Tienda o supermercado' },
  { name: 'Planta de Producción', description: 'Fábrica o planta procesadora' },
  { name: 'Puerto', description: 'Terminal portuaria' },
  { name: 'Aeropuerto', description: 'Terminal de carga aérea' },
  { name: 'Cliente Final', description: 'Punto de entrega a cliente' },
]

const LOCATIONS = [
  {
    name: 'CD Santa Cruz Norte',
    code: 'CDSCN-001',
    city: 'Santa Cruz',
    address: 'Parque Industrial Norte, Lote 100',
    type: 'Centro de Distribución',
    docks: 12,
  },
  {
    name: 'CD Santa Cruz Sur',
    code: 'CDSCS-001',
    city: 'Santa Cruz',
    address: 'Av. Santos Dumont Km 8',
    type: 'Centro de Distribución',
    docks: 8,
  },
  {
    name: 'Frigorífico La Paz',
    code: 'FRILP-001',
    city: 'La Paz',
    address: 'Zona Industrial El Alto',
    type: 'Almacén Frigorífico',
    docks: 6,
  },
  {
    name: 'Frigorífico Cochabamba',
    code: 'FRICB-001',
    city: 'Cochabamba',
    address: 'Av. Blanco Galindo Km 12',
    type: 'Almacén Frigorífico',
    docks: 4,
  },
  {
    name: 'Supermercado Hipermaxi Central',
    code: 'SMHMC-001',
    city: 'Santa Cruz',
    address: 'Av. Monseñor Rivero #200',
    type: 'Punto de Venta',
    docks: 3,
  },
  {
    name: 'Supermercado Hipermaxi Norte',
    code: 'SMHMN-001',
    city: 'Santa Cruz',
    address: 'Av. Banzer Km 6',
    type: 'Punto de Venta',
    docks: 2,
  },
  {
    name: 'Supermercado Fidalga',
    code: 'SMFID-001',
    city: 'Santa Cruz',
    address: 'Av. San Martín #500',
    type: 'Punto de Venta',
    docks: 2,
  },
  {
    name: 'Planta PIL Andina',
    code: 'PLPIL-001',
    city: 'Cochabamba',
    address: 'Zona Industrial Santivañez',
    type: 'Planta de Producción',
    docks: 8,
  },
  {
    name: 'Planta Delizia',
    code: 'PLDEL-001',
    city: 'Santa Cruz',
    address: 'Parque Industrial Latinoamericano',
    type: 'Planta de Producción',
    docks: 6,
  },
  {
    name: 'Planta Sofía',
    code: 'PLSOF-001',
    city: 'Santa Cruz',
    address: 'Carretera al Norte Km 25',
    type: 'Planta de Producción',
    docks: 10,
  },
  {
    name: 'Terminal Aérea Viru Viru',
    code: 'TAVVR-001',
    city: 'Santa Cruz',
    address: 'Aeropuerto Internacional Viru Viru',
    type: 'Aeropuerto',
    docks: 4,
  },
  {
    name: 'Mercado Abasto',
    code: 'MERAB-001',
    city: 'Santa Cruz',
    address: 'Av. Grigotá, Zona Abasto',
    type: 'Cliente Final',
    docks: 1,
  },
  {
    name: 'Hotel Los Tajibos',
    code: 'CLTAJ-001',
    city: 'Santa Cruz',
    address: 'Av. San Martín #455',
    type: 'Cliente Final',
    docks: 1,
  },
  {
    name: 'Hospital Japonés',
    code: 'CLHJA-001',
    city: 'Santa Cruz',
    address: 'Tercer Anillo Interno',
    type: 'Cliente Final',
    docks: 2,
  },
  {
    name: 'Ketal La Paz',
    code: 'SMKET-001',
    city: 'La Paz',
    address: 'Av. Arce #2500',
    type: 'Punto de Venta',
    docks: 2,
  },
]

const ROUTE_TYPES = [
  { name: 'Distribución Local' },
  { name: 'Distribución Regional' },
  { name: 'Larga Distancia' },
  { name: 'Express' },
  { name: 'Ruta Fija' },
]

const ROUTES = [
  {
    route_id: 'RUT-001',
    name: 'SCZ Norte - CD a Supermercados',
    distance: 45,
    base_rate: 150,
    transit_time: 3,
    type: 'Distribución Local',
  },
  {
    route_id: 'RUT-002',
    name: 'SCZ Sur - CD a Clientes',
    distance: 35,
    base_rate: 120,
    transit_time: 2.5,
    type: 'Distribución Local',
  },
  {
    route_id: 'RUT-003',
    name: 'SCZ - La Paz Express',
    distance: 550,
    base_rate: 800,
    transit_time: 12,
    type: 'Larga Distancia',
  },
  {
    route_id: 'RUT-004',
    name: 'SCZ - Cochabamba',
    distance: 470,
    base_rate: 650,
    transit_time: 10,
    type: 'Larga Distancia',
  },
  {
    route_id: 'RUT-005',
    name: 'Plantas - CD Norte',
    distance: 60,
    base_rate: 200,
    transit_time: 2,
    type: 'Ruta Fija',
  },
  {
    route_id: 'RUT-006',
    name: 'Cochabamba - La Paz',
    distance: 380,
    base_rate: 550,
    transit_time: 8,
    type: 'Distribución Regional',
  },
  {
    route_id: 'RUT-007',
    name: 'SCZ Aeropuerto - CD',
    distance: 25,
    base_rate: 100,
    transit_time: 1,
    type: 'Express',
  },
  {
    route_id: 'RUT-008',
    name: 'Ruta Hospitales SCZ',
    distance: 40,
    base_rate: 180,
    transit_time: 3,
    type: 'Express',
  },
  {
    route_id: 'RUT-009',
    name: 'SCZ - Tarija',
    distance: 650,
    base_rate: 900,
    transit_time: 14,
    type: 'Larga Distancia',
  },
  {
    route_id: 'RUT-010',
    name: 'Circuito Supermercados SCZ',
    distance: 55,
    base_rate: 160,
    transit_time: 4,
    type: 'Distribución Local',
  },
]

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedDatabase(orgId: string): Promise<SeedResult> {
  console.log('🌱 Starting database seed for org:', orgId)

  try {
    // Get Bolivia country ID (assuming it exists)
    const { data: boliviaCountry, error: countryError } = await supabase
      .from('countries')
      .select('id')
      .eq('name', 'Bolivia')
      .single()

    let countryId = boliviaCountry?.id

    if (countryError || !boliviaCountry) {
      // Try to create Bolivia if it doesn't exist
      const { data: newCountry, error: createCountryError } = await supabase
        .from('countries')
        .insert({ name: 'Bolivia', iso_code: 'BO' })
        .select()
        .single()

      if (createCountryError) {
        throw new Error(
          `Failed to get/create Bolivia country: ${createCountryError.message}`
        )
      }

      if (newCountry) {
        countryId = newCountry.id
      }
    }

    // Default to 1 if something went wrong but didn't throw
    countryId = countryId || 1

    // ========================================================================
    // 1. SEED THERMAL PROFILES
    // ========================================================================
    console.log('📊 Seeding thermal profiles...')

    const thermalProfilesData = THERMAL_PROFILES.map((tp) => ({
      ...tp,
      org_id: orgId,
      is_active: true,
    }))

    const { data: thermalProfiles, error: tpError } = await supabase
      .from('thermal_profile')
      .insert(thermalProfilesData)
      .select()

    if (tpError) throw new Error(`Thermal profiles error: ${tpError.message}`)
    console.log(`✅ Created ${thermalProfiles?.length || 0} thermal profiles`)

    // Create a map for easy lookup
    const thermalProfileMap = new Map(
      thermalProfiles?.map((tp) => [tp.name, tp.id]) || []
    )

    // ========================================================================
    // 2. SEED PRODUCTS
    // ========================================================================
    console.log('📦 Seeding products...')

    const productsData = PRODUCTS.map((p) => ({
      name: p.name,
      description: p.description,
      org_id: orgId,
      is_active: true,
    }))

    const { data: products, error: prodError } = await supabase
      .from('products')
      .insert(productsData)
      .select()

    if (prodError) throw new Error(`Products error: ${prodError.message}`)
    console.log(`✅ Created ${products?.length || 0} products`)

    // Link products to thermal profiles
    const productThermalLinks: {
      product_id: number
      thermal_profile_id: number
      org_id: string
    }[] = []

    products?.forEach((product, index) => {
      const productDef = PRODUCTS[index]
      productDef.profiles.forEach((profileName) => {
        const profileId = thermalProfileMap.get(profileName)
        if (profileId) {
          productThermalLinks.push({
            product_id: product.id,
            thermal_profile_id: profileId,
            org_id: orgId,
          })
        }
      })
    })

    if (productThermalLinks.length > 0) {
      const { error: linkError } = await supabase
        .from('product_thermal_profiles')
        .insert(productThermalLinks)

      if (linkError)
        throw new Error(`Product-thermal links error: ${linkError.message}`)
      console.log(
        `✅ Created ${productThermalLinks.length} product-thermal profile links`
      )
    }

    // ========================================================================
    // 3. SEED CARRIERS (idempotent - upsert on org_id + carrier_id)
    // ========================================================================
    console.log('🚚 Seeding carriers...')

    const carriersData = CARRIERS.map((c) => ({
      ...c,
      org_id: orgId,
      is_active: true,
    }))

    // Check for existing carriers to make seeding idempotent
    const { data: existingCarriers } = await supabase
      .from('carriers')
      .select('carrier_id, id, commercial_name')
      .eq('org_id', orgId)

    const existingCarrierIds = new Set(existingCarriers?.map((c) => c.carrier_id) || [])

    // Filter out carriers that already exist
    const newCarriersData = carriersData.filter(
      (c) => !existingCarrierIds.has(c.carrier_id)
    )

    let carriers: any[] = existingCarriers || []

    if (newCarriersData.length > 0) {
      const { data: insertedCarriers, error: carrError } = await supabase
        .from('carriers')
        .insert(newCarriersData)
        .select()

      if (carrError) throw new Error(`Carriers error: ${carrError.message}`)
      
      // Combine existing and new carriers
      carriers = [...carriers, ...(insertedCarriers || [])]
      console.log(`✅ Created ${insertedCarriers?.length || 0} new carriers (${carriers.length} total)`)
    } else {
      console.log(`✅ Using existing ${carriers.length} carriers`)
    }

    // ========================================================================
    // 4. SEED DRIVERS (3 per carrier)
    // ========================================================================
    console.log('👤 Seeding drivers...')

    const driversData: any[] = []
    let driverIndex = 0

    carriers?.forEach((carrier) => {
      for (let i = 0; i < 3; i++) {
        const driverInfo = DRIVER_NAMES[driverIndex % DRIVER_NAMES.length]
        driversData.push({
          driver_id: `DRV-${String(driverIndex + 1).padStart(3, '0')}`,
          name: driverInfo.name,
          license_number: `LIC-${randomBetween(100000, 999999)}`,
          phone_number: `+591 7${randomBetween(0, 9)}${randomBetween(
            100000,
            999999
          )}`,
          email: `${driverInfo.name
            .toLowerCase()
            .replace(/\s+/g, '.')}@${carrier.commercial_name
              .toLowerCase()
              .replace(/\s+/g, '')}.bo`,
          birth_date: `${randomBetween(1970, 1995)}-${String(
            randomBetween(1, 12)
          ).padStart(2, '0')}-${String(randomBetween(1, 28)).padStart(2, '0')}`,
          nationality: countryId,
          address: `Calle ${randomBetween(1, 100)} #${randomBetween(100, 999)}`,
          city: driverInfo.city,
          status: randomElement([
            'AVAILABLE',
            'AVAILABLE',
            'AVAILABLE',
            'DRIVING',
          ]),
          contract_date: `202${randomBetween(0, 4)}-${String(
            randomBetween(1, 12)
          ).padStart(2, '0')}-01`,
          org_id: orgId,
          carrier_id: carrier.id,
        })
        driverIndex++
      }
    })

    const { data: drivers, error: drvError } = await supabase
      .from('drivers')
      .insert(driversData)
      .select()

    if (drvError) throw new Error(`Drivers error: ${drvError.message}`)
    console.log(`✅ Created ${drivers?.length || 0} drivers`)

    // ========================================================================
    // 5. SEED VEHICLES (2 per carrier)
    // ========================================================================
    console.log('🚛 Seeding vehicles...')

    const vehiclesData: any[] = []
    let vehicleIndex = 0

    carriers?.forEach((carrier) => {
      for (let i = 0; i < 2; i++) {
        const brand = randomElement(VEHICLE_BRANDS)
        const model = randomElement(VEHICLE_MODELS)
        vehiclesData.push({
          unit_code: `UNIT-${String(vehicleIndex + 1).padStart(3, '0')}`,
          vehicle_type: randomElement(VEHICLE_TYPES),
          plate: generatePlate(),
          brand: brand,
          model: model,
          year: randomBetween(2018, 2024),
          vin: generateVIN(),
          odometer_value: randomBetween(10000, 500000),
          odometer_unit: 'km',
          additional_info: `${brand} ${model} - Unidad ${vehicleIndex + 1}`,
          org_id: orgId,
          carrier_id: carrier.id,
          operational_status: randomElement([
            'ACTIVE',
            'ACTIVE',
            'ACTIVE',
            'IN_MAINTENANCE',
          ]),
        })
        vehicleIndex++
      }
    })

    const { data: vehicles, error: vehError } = await supabase
      .from('vehicles')
      .insert(vehiclesData)
      .select()

    if (vehError) throw new Error(`Vehicles error: ${vehError.message}`)
    console.log(`✅ Created ${vehicles?.length || 0} vehicles`)

    // ========================================================================
    // 6. SEED TRAILERS (2 per carrier) - NOW WITH carrier_id
    // ========================================================================
    console.log('🚃 Seeding trailers...')

    const trailersData: any[] = []
    let trailerIndex = 0

    carriers?.forEach((carrier) => {
      for (let i = 0; i < 2; i++) {
        trailersData.push({
          code: `TRL-${String(trailerIndex + 1).padStart(3, '0')}`,
          plate: generatePlate(),
          transport_capacity_weight_tn: randomElement([20, 22, 25, 28, 30]),
          volume_m3: randomElement([60, 70, 80, 90]),
          tare_weight_tn: randomElement([6, 7, 8]),
          length_m: randomElement([12.5, 13.6, 14.6]),
          width_m: 2.5,
          height_m: randomElement([2.6, 2.7, 2.8]),
          supports_multi_zone: randomElement([true, false]),
          compartments: randomElement([1, 2, 3]),
          insulation_thickness_cm: randomElement([8, 10, 12]),
          org_id: orgId,
          carrier_id: carrier.id, // <-- NOW LINKED TO CARRIER
          operational_status: randomElement([
            'ACTIVE',
            'ACTIVE',
            'ACTIVE',
            'IN_MAINTENANCE',
          ]),
        })
        trailerIndex++
      }
    })

    const { data: trailers, error: trlError } = await supabase
      .from('trailers')
      .insert(trailersData)
      .select()

    if (trlError) throw new Error(`Trailers error: ${trlError.message}`)
    console.log(`✅ Created ${trailers?.length || 0} trailers`)

    // Seed trailer reefer equipment (using new unified table)
    const reeferEquipmentData =
      trailers?.map((trailer) => ({
        org_id: orgId,
        owner_type: 'TRAILER' as const,
        owner_id: trailer.id,
        brand: randomElement(REEFER_BRANDS),
        model: `Model-${randomBetween(100, 999)}`,
        year: randomBetween(2018, 2024),
        power_type: randomElement(['DIESEL', 'ELECTRIC', 'HYBRID'] as const),
        reefer_hours: randomBetween(1000, 20000),
        diesel_capacity_l: randomElement([200, 250, 300]),
        consumption_lph: randomElement([2.5, 3.0, 3.5]),
        temp_min_c: -25,
        temp_max_c: 25,
      })) || []

    if (reeferEquipmentData.length > 0) {
      const { error: reeferError } = await supabase
        .from('reefer_equipments')
        .insert(reeferEquipmentData)

      if (reeferError)
        throw new Error(`Reefer equipment error: ${reeferError.message}`)
      console.log(`✅ Created ${reeferEquipmentData.length} reefer equipment records`)
    }

    // ========================================================================
    // 7. SEED LOCATION TYPES
    // ========================================================================
    console.log('📍 Seeding location types...')

    const locationTypesData = LOCATION_TYPES.map((lt) => ({
      ...lt,
      org_id: orgId,
    }))

    const { data: locationTypes, error: ltError } = await supabase
      .from('location_types')
      .insert(locationTypesData)
      .select()

    if (ltError) throw new Error(`Location types error: ${ltError.message}`)
    console.log(`✅ Created ${locationTypes?.length || 0} location types`)

    // Create a map for easy lookup
    const locationTypeMap = new Map(
      locationTypes?.map((lt) => [lt.name, lt.id]) || []
    )

    // ========================================================================
    // 8. SEED LOCATIONS
    // ========================================================================
    console.log('🏢 Seeding locations...')

    const locationsData = LOCATIONS.map((loc) => ({
      name: loc.name,
      code: loc.code,
      city: loc.city,
      address: loc.address,
      type_location_id: locationTypeMap.get(loc.type) || null,
      num_docks: loc.docks,
      geofence_type: 'circular',
      geofence_data: {
        radius: 100,
        center: {
          lat: -17.78 + Math.random() * 0.1,
          lng: -63.18 + Math.random() * 0.1,
        },
      },
      org_id: orgId,
      country_id: countryId,
      is_active: true,
    }))

    const { data: locations, error: locError } = await supabase
      .from('locations')
      .insert(locationsData)
      .select()

    if (locError) throw new Error(`Locations error: ${locError.message}`)
    console.log(`✅ Created ${locations?.length || 0} locations`)

    // ========================================================================
    // 9. SEED ROUTE TYPES
    // ========================================================================
    console.log('🛤️ Seeding route types...')

    const routeTypesData = ROUTE_TYPES.map((rt) => ({
      ...rt,
      org_id: orgId,
    }))

    const { data: routeTypes, error: rtError } = await supabase
      .from('route_types')
      .insert(routeTypesData)
      .select()

    if (rtError) throw new Error(`Route types error: ${rtError.message}`)
    console.log(`✅ Created ${routeTypes?.length || 0} route types`)

    // Create a map for easy lookup
    const routeTypeMap = new Map(
      routeTypes?.map((rt) => [rt.name, rt.id]) || []
    )

    // ========================================================================
    // 10. SEED ROUTES
    // ========================================================================
    console.log('🗺️ Seeding routes...')

    // Note: Pricing fields (base_rate, km_rate, hourly_rate, etc.) were moved to rate_cards table
    // Routes now only contain geographic and timing information
    // Actual columns: id, route_id, name, distance, is_active, org_id, route_type_id, transit_time, operational_buffer, currency, supersedes_route_id
    const routesData = ROUTES.map((r) => ({
      route_id: r.route_id,
      name: r.name,
      distance: r.distance,
      transit_time: r.transit_time,
      operational_buffer: randomElement([0.5, 1, 1.5]),
      route_type_id: routeTypeMap.get(r.type) || null,
      org_id: orgId,
      is_active: true,
    }))

    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .insert(routesData)
      .select()

    if (routesError) throw new Error(`Routes error: ${routesError.message}`)
    console.log(`✅ Created ${routes?.length || 0} routes`)

    // Seed route stops with logical sequences
    const routeStopsData: any[] = []
    
    // Create location maps for easier lookup
    const locationMap = new Map(
      locations?.map((loc) => [loc.code, loc]) || []
    )

    routes?.forEach((route) => {
      let routeStops: any[] = []
      
      // Define logical stop sequences based on route name/type
      if (route.route_id === 'RUT-001') {
        // SCZ Norte - CD a Supermercados
        const cdNorte = locationMap.get('CDSCN-001')
        const hipermaxiCentral = locationMap.get('SMHMC-001')
        const hipermaxiNorte = locationMap.get('SMHMN-001')
        const fidalga = locationMap.get('SMFID-001')
        if (cdNorte && hipermaxiCentral) routeStops.push({ loc: cdNorte, type: 'PICKUP' })
        if (hipermaxiCentral) routeStops.push({ loc: hipermaxiCentral, type: 'DELIVERY' })
        if (hipermaxiNorte) routeStops.push({ loc: hipermaxiNorte, type: 'DELIVERY' })
        if (fidalga) routeStops.push({ loc: fidalga, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-002') {
        // SCZ Sur - CD a Clientes
        const cdSur = locationMap.get('CDSCS-001')
        const mercadoAbasto = locationMap.get('MERAB-001')
        const hotelTajibos = locationMap.get('CLTAJ-001')
        const hospitalJapones = locationMap.get('CLHJA-001')
        if (cdSur) routeStops.push({ loc: cdSur, type: 'PICKUP' })
        if (mercadoAbasto) routeStops.push({ loc: mercadoAbasto, type: 'DELIVERY' })
        if (hotelTajibos) routeStops.push({ loc: hotelTajibos, type: 'DELIVERY' })
        if (hospitalJapones) routeStops.push({ loc: hospitalJapones, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-003') {
        // SCZ - La Paz Express
        const cdNorte = locationMap.get('CDSCN-001')
        const frigorificoLaPaz = locationMap.get('FRILP-001')
        const ketalLaPaz = locationMap.get('SMKET-001')
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'PICKUP' })
        if (frigorificoLaPaz) routeStops.push({ loc: frigorificoLaPaz, type: 'DELIVERY' })
        if (ketalLaPaz) routeStops.push({ loc: ketalLaPaz, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-004') {
        // SCZ - Cochabamba
        const cdNorte = locationMap.get('CDSCN-001')
        const frigorificoCochabamba = locationMap.get('FRICB-001')
        const plantaPIL = locationMap.get('PLPIL-001')
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'PICKUP' })
        if (frigorificoCochabamba) routeStops.push({ loc: frigorificoCochabamba, type: 'DELIVERY' })
        if (plantaPIL) routeStops.push({ loc: plantaPIL, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-005') {
        // Plantas - CD Norte
        const plantaDelizia = locationMap.get('PLDEL-001')
        const plantaSofia = locationMap.get('PLSOF-001')
        const cdNorte = locationMap.get('CDSCN-001')
        if (plantaDelizia) routeStops.push({ loc: plantaDelizia, type: 'PICKUP' })
        if (plantaSofia) routeStops.push({ loc: plantaSofia, type: 'PICKUP' })
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-006') {
        // Cochabamba - La Paz
        const frigorificoCochabamba = locationMap.get('FRICB-001')
        const frigorificoLaPaz = locationMap.get('FRILP-001')
        if (frigorificoCochabamba) routeStops.push({ loc: frigorificoCochabamba, type: 'PICKUP' })
        if (frigorificoLaPaz) routeStops.push({ loc: frigorificoLaPaz, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-007') {
        // SCZ Aeropuerto - CD
        const aeropuerto = locationMap.get('TAVVR-001')
        const cdNorte = locationMap.get('CDSCN-001')
        if (aeropuerto) routeStops.push({ loc: aeropuerto, type: 'PICKUP' })
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-008') {
        // Ruta Hospitales SCZ
        const cdNorte = locationMap.get('CDSCN-001')
        const hospitalJapones = locationMap.get('CLHJA-001')
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'PICKUP' })
        if (hospitalJapones) routeStops.push({ loc: hospitalJapones, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-009') {
        // SCZ - Tarija
        const cdNorte = locationMap.get('CDSCN-001')
        // No Tarija locations in seed, use random
        const randomLoc = locations?.[randomBetween(0, locations.length - 1)]
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'PICKUP' })
        if (randomLoc) routeStops.push({ loc: randomLoc, type: 'DELIVERY' })
      } else if (route.route_id === 'RUT-010') {
        // Circuito Supermercados SCZ
        const cdNorte = locationMap.get('CDSCN-001')
        const hipermaxiCentral = locationMap.get('SMHMC-001')
        const hipermaxiNorte = locationMap.get('SMHMN-001')
        const fidalga = locationMap.get('SMFID-001')
        if (cdNorte) routeStops.push({ loc: cdNorte, type: 'PICKUP' })
        if (hipermaxiCentral) routeStops.push({ loc: hipermaxiCentral, type: 'DELIVERY' })
        if (hipermaxiNorte) routeStops.push({ loc: hipermaxiNorte, type: 'DELIVERY' })
        if (fidalga) routeStops.push({ loc: fidalga, type: 'DELIVERY' })
      } else {
        // Fallback: random stops for any other routes
        const numStops = randomBetween(2, 4)
        const shuffledLocations = [...(locations || [])].sort(
          () => Math.random() - 0.5
        )
        for (let i = 0; i < numStops && i < shuffledLocations.length; i++) {
          routeStops.push({
            loc: shuffledLocations[i],
            type: i === 0 ? 'PICKUP' : 'DELIVERY',
          })
        }
      }

      // Create route stops data
      routeStops.forEach((stop, index) => {
        if (stop.loc) {
          routeStopsData.push({
            route_id: route.id,
            location_id: stop.loc.id,
            stop_order: index + 1,
            stop_type: stop.type,
            org_id: orgId,
          })
        }
      })
    })

    if (routeStopsData.length > 0) {
      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(routeStopsData)

      if (stopsError)
        throw new Error(`Route stops error: ${stopsError.message}`)
      console.log(`✅ Created ${routeStopsData.length} route stops`)
    }

    // ========================================================================
    // 11. SEED FLEET SETS (combine carrier, driver, vehicle, trailer)
    // ========================================================================
    console.log('🔗 Seeding fleet sets...')

    const fleetSetsData: any[] = []

    carriers?.forEach((carrier) => {
      // Get drivers, vehicles, trailers for this carrier
      const carrierDrivers =
        drivers?.filter((d) => d.carrier_id === carrier.id) || []
      const carrierVehicles =
        vehicles?.filter((v) => v.carrier_id === carrier.id) || []
      const carrierTrailers =
        trailers?.filter((t) => t.carrier_id === carrier.id) || []

      // Create 1-2 fleet sets per carrier
      const numSets = Math.min(
        carrierDrivers.length,
        carrierVehicles.length,
        carrierTrailers.length,
        2
      )

      for (let i = 0; i < numSets; i++) {
        fleetSetsData.push({
          org_id: orgId,
          carrier_id: carrier.id,
          driver_id: carrierDrivers[i].id,
          vehicle_id: carrierVehicles[i].id,
          trailer_id: carrierTrailers[i].id,
          starts_at: new Date().toISOString(),
          ends_at: null,
          is_active: true,
        })
      }
    })

    let fleetSetsCount = 0
    if (fleetSetsData.length > 0) {
      const { data: fleetSets, error: fsError } = await supabase
        .from('fleet_sets')
        .insert(fleetSetsData)
        .select()

      if (fsError) throw new Error(`Fleet sets error: ${fsError.message}`)
      fleetSetsCount = fleetSets?.length || 0
      console.log(`✅ Created ${fleetSetsCount} fleet sets`)
    }

    // ========================================================================
    // 12. SEED CARRIER CONTRACTS (one per carrier)
    // ========================================================================
    console.log('📄 Seeding carrier contracts...')

    const contractsData = carriers?.map((carrier, index) => ({
      org_id: orgId,
      carrier_id: carrier.id,
      contract_number: `CONTRACT-${String(index + 1).padStart(3, '0')}`,
      contract_name: `Contrato ${carrier.commercial_name}`,
      valid_from: new Date().toISOString().split('T')[0], // Today
      valid_to: null, // No expiration
      payment_terms: carrier.payment_terms || 30,
      currency: carrier.currency || 'USD',
      min_commitment_type: 'ORDERS',
      min_commitment_value: randomBetween(10, 50),
      status: 'ACTIVE',
      notes: `Contrato activo con ${carrier.commercial_name}`,
    })) || []

    const { data: contracts, error: contractsError } = await supabase
      .from('carrier_contracts')
      .insert(contractsData)
      .select()

    if (contractsError) throw new Error(`Carrier contracts error: ${contractsError.message}`)
    console.log(`✅ Created ${contracts?.length || 0} carrier contracts`)

    // Create a map for easy lookup
    const contractMap = new Map(
      contracts?.map((c) => [c.carrier_id, c]) || []
    )

    // ========================================================================
    // 13. SEED ACCESSORIAL CHARGE TYPES
    // ========================================================================
    console.log('💰 Seeding accessorial charge types...')

    const accessorialTypesData = [
      {
        code: 'PEAJE',
        name: 'Peaje',
        description: 'Costo de peajes en ruta',
        charge_type: 'FIXED',
      },
      {
        code: 'SEGURO',
        name: 'Seguro de Carga',
        description: 'Seguro adicional para carga de alto valor',
        charge_type: 'PERCENTAGE',
      },
      {
        code: 'ESPERA',
        name: 'Tiempo de Espera',
        description: 'Cargo por tiempo de espera excedente',
        charge_type: 'HOURLY',
      },
      {
        code: 'DESCARGA',
        name: 'Descarga Manual',
        description: 'Cargo por descarga manual sin muelle',
        charge_type: 'FIXED',
      },
      {
        code: 'REEMBALAJE',
        name: 'Reembalaje',
        description: 'Costo de reembalaje de productos',
        charge_type: 'FIXED',
      },
      {
        code: 'DOCUMENTACION',
        name: 'Documentación Adicional',
        description: 'Cargo por documentación especial',
        charge_type: 'FIXED',
      },
    ].map((a) => ({
      ...a,
      org_id: orgId,
      is_active: true,
    }))

    const { data: accessorialTypes, error: accessorialError } = await supabase
      .from('accessorial_charge_types')
      .insert(accessorialTypesData)
      .select()

    if (accessorialError)
      throw new Error(`Accessorial charge types error: ${accessorialError.message}`)
    console.log(`✅ Created ${accessorialTypes?.length || 0} accessorial charge types`)

    // ========================================================================
    // 14. SEED CARRIER CONTRACT ACCESSORIALS (link accessorials to contracts)
    // ========================================================================
    console.log('🔗 Seeding carrier contract accessorials...')

    const contractAccessorialsData: any[] = []
    contracts?.forEach((contract) => {
      // Add 2-4 accessorials per contract
      const numAccessorials = randomBetween(2, 4)
      const shuffledAccessorials = [...(accessorialTypes || [])].sort(
        () => Math.random() - 0.5
      )

      for (let i = 0; i < numAccessorials && i < shuffledAccessorials.length; i++) {
        const accessorial = shuffledAccessorials[i]
        contractAccessorialsData.push({
          org_id: orgId,
          carrier_contract_id: contract.id,
          accessorial_charge_type_id: accessorial.id,
          value:
            accessorial.charge_type === 'PERCENTAGE'
              ? randomBetween(5, 15) // Percentage
              : accessorial.charge_type === 'HOURLY'
                ? randomBetween(20, 50) // Per hour
                : randomBetween(50, 200), // Fixed amount
          conditions: {
            min_hours: accessorial.charge_type === 'HOURLY' ? 2 : null,
            applies_to: ['ALL'],
          },
        })
      }
    })

    if (contractAccessorialsData.length > 0) {
      const { error: contractAccessorialsError } = await supabase
        .from('carrier_contract_accessorials')
        .insert(contractAccessorialsData)

      if (contractAccessorialsError)
        throw new Error(
          `Carrier contract accessorials error: ${contractAccessorialsError.message}`
        )
      console.log(`✅ Created ${contractAccessorialsData.length} carrier contract accessorials`)
    }

    // ========================================================================
    // 15. SEED RATE CARDS (one per contract + route + thermal profile combination)
    // ========================================================================
    console.log('💳 Seeding rate cards...')

    const rateCardsData: any[] = []
    const today = new Date()
    const validFrom = today.toISOString().split('T')[0]
    const validTo = null // No expiration

    contracts?.forEach((contract) => {
      routes?.forEach((route) => {
        // Create rate cards for different thermal profiles
        // Use first 3 thermal profiles (most common)
        const selectedProfiles = thermalProfiles?.slice(0, 3) || []

        selectedProfiles.forEach((profile) => {
          // Calculate base value based on distance and profile
          const baseMultiplier =
            profile.temp_min_c < 0 ? 1.5 : profile.temp_min_c < 4 ? 1.2 : 1.0 // Frozen = more expensive
          const baseValue = Math.round(route.distance * baseMultiplier * 2)

          rateCardsData.push({
            org_id: orgId,
            carrier_contract_id: contract.id,
            route_id: route.id,
            thermal_profile_id: profile.id,
            service_type: 'STANDARD',
            calculation_method: 'DISTANCE_BASED',
            base_value: baseValue,
            min_weight_tn: 0,
            max_weight_tn: 30,
            fuel_surcharge_pct: randomBetween(5, 12),
            additional_charges: {
              notes: `Tarifa para ${profile.name} en ruta ${route.name}`,
            },
            valid_from: validFrom,
            valid_to: validTo,
            is_active: true,
          })
        })
      })
    })

    const { data: rateCards, error: rateCardsError } = await supabase
      .from('rate_cards')
      .insert(rateCardsData)
      .select()

    if (rateCardsError) throw new Error(`Rate cards error: ${rateCardsError.message}`)
    console.log(`✅ Created ${rateCards?.length || 0} rate cards`)

    // ========================================================================
    // 16. SEED RATE TIERS (weight-based pricing tiers for each rate card)
    // ========================================================================
    console.log('📊 Seeding rate tiers...')

    const rateTiersData: any[] = []

    rateCards?.forEach((rateCard) => {
      // Create 2-3 weight tiers per rate card
      const numTiers = randomBetween(2, 3)
      const baseValue = rateCard.base_value

      for (let i = 0; i < numTiers; i++) {
        const minWeight = i * 10 // 0-10, 10-20, 20-30
        const maxWeight = i === numTiers - 1 ? null : (i + 1) * 10 // Last tier has no max

        // Lower rate per ton for higher weight tiers (economies of scale)
        const tierMultiplier = 1 - i * 0.1 // 100%, 90%, 80% of base
        const rateValue = Math.round((baseValue / 10) * tierMultiplier) // Rate per ton

        rateTiersData.push({
          org_id: orgId,
          rate_card_id: rateCard.id,
          min_weight_tn: minWeight,
          max_weight_tn: maxWeight,
          rate_value: rateValue,
        })
      }
    })

    if (rateTiersData.length > 0) {
      const { error: rateTiersError } = await supabase
        .from('rate_tiers')
        .insert(rateTiersData)

      if (rateTiersError)
        throw new Error(`Rate tiers error: ${rateTiersError.message}`)
      console.log(`✅ Created ${rateTiersData.length} rate tiers`)
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    const result: SeedResult = {
      success: true,
      message: '🎉 Database seeded successfully!',
      data: {
        thermalProfiles: thermalProfiles?.length || 0,
        products: products?.length || 0,
        carriers: carriers?.length || 0,
        drivers: drivers?.length || 0,
        vehicles: vehicles?.length || 0,
        trailers: trailers?.length || 0,
        locationTypes: locationTypes?.length || 0,
        locations: locations?.length || 0,
        routeTypes: routeTypes?.length || 0,
        routes: routes?.length || 0,
        fleetSets: fleetSetsCount,
        carrierContracts: contracts?.length || 0,
        accessorialChargeTypes: accessorialTypes?.length || 0,
        rateCards: rateCards?.length || 0,
        rateTiers: rateTiersData.length,
      },
    }

    console.log('\n📊 Seed Summary:')
    console.log(`   Thermal Profiles: ${result.data?.thermalProfiles}`)
    console.log(`   Products: ${result.data?.products}`)
    console.log(`   Carriers: ${result.data?.carriers}`)
    console.log(`   Drivers: ${result.data?.drivers}`)
    console.log(`   Vehicles: ${result.data?.vehicles}`)
    console.log(`   Trailers: ${result.data?.trailers}`)
    console.log(`   Location Types: ${result.data?.locationTypes}`)
    console.log(`   Locations: ${result.data?.locations}`)
    console.log(`   Route Types: ${result.data?.routeTypes}`)
    console.log(`   Routes: ${result.data?.routes}`)
    console.log(`   Fleet Sets: ${result.data?.fleetSets}`)
    console.log(`   Carrier Contracts: ${result.data?.carrierContracts}`)
    console.log(`   Accessorial Charge Types: ${result.data?.accessorialChargeTypes}`)
    console.log(`   Rate Cards: ${result.data?.rateCards}`)
    console.log(`   Rate Tiers: ${result.data?.rateTiers}`)
    console.log('\n✅ All done!')

    return result
  } catch (error: any) {
    console.error('❌ Seed failed:', error)
    return {
      success: false,
      message: 'Database seed failed',
      error: error.message || String(error),
    }
  }
}

/**
 * Clear all seeded data for an organization
 * Use with caution - this will delete all data!
 */
export async function clearSeedData(
  orgId: string
): Promise<{ success: boolean; message: string }> {
  console.log('🗑️ Clearing seed data for org:', orgId)

  try {
    // Delete in reverse order of dependencies
    const tables = [
      'fleet_sets',
      'rate_tiers',
      'rate_cards',
      'carrier_contract_accessorials',
      'accessorial_charge_types',
      'carrier_contracts',
      'route_stops',
      'routes',
      'route_types',
      'locations',
      'location_types',
      'reefer_equipments', // Unified table for reefer equipment
      'trailers',
      'vehicles',
      'drivers',
      'carriers',
      'product_thermal_profiles',
      'products',
      'thermal_profile',
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('org_id', orgId)

      if (error) {
        console.warn(`Warning: Failed to clear ${table}:`, error.message)
      } else {
        console.log(`✅ Cleared ${table}`)
      }
    }

    return { success: true, message: 'Seed data cleared successfully' }
  } catch (error: any) {
    return { success: false, message: error.message || String(error) }
  }
}
