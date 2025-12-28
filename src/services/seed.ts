import { supabase } from '../lib/supabase'

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
    }

    const countryId = boliviaCountry?.id || 1

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
    // 3. SEED CARRIERS
    // ========================================================================
    console.log('🚚 Seeding carriers...')

    const carriersData = CARRIERS.map((c) => ({
      ...c,
      org_id: orgId,
      is_active: true,
    }))

    const { data: carriers, error: carrError } = await supabase
      .from('carriers')
      .insert(carriersData)
      .select()

    if (carrError) throw new Error(`Carriers error: ${carrError.message}`)
    console.log(`✅ Created ${carriers?.length || 0} carriers`)

    // ========================================================================
    // 4. SEED DRIVERS (3 per carrier)
    // ========================================================================
    console.log('👤 Seeding drivers...')

    const driversData: any[] = []
    let driverIndex = 0

    carriers?.forEach((carrier, carrierIdx) => {
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
          notes: null,
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
          vehicle_code: `VEH-${String(vehicleIndex + 1).padStart(3, '0')}`,
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
          notes: null,
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

    // Seed trailer reefer specs
    const reeferSpecsData =
      trailers?.map((trailer) => ({
        trailer_id: trailer.id,
        org_id: orgId,
        power_type: randomElement(['DIESEL', 'ELECTRIC', 'HYBRID']),
        reefer_hours: randomBetween(1000, 20000),
        diesel_capacity_l: randomElement([200, 250, 300]),
        consumption_lph: randomElement([2.5, 3.0, 3.5]),
        refrigeration_brand: randomElement(REEFER_BRANDS),
        model: `Model-${randomBetween(100, 999)}`,
        model_year: randomBetween(2018, 2024),
        temp_min_c: -25,
        temp_max_c: 25,
        brand: randomElement(TRAILER_BRANDS),
        year: String(randomBetween(2018, 2024)),
      })) || []

    if (reeferSpecsData.length > 0) {
      const { error: reeferError } = await supabase
        .from('trailer_reefer_specs')
        .insert(reeferSpecsData)

      if (reeferError)
        throw new Error(`Reefer specs error: ${reeferError.message}`)
      console.log(`✅ Created ${reeferSpecsData.length} trailer reefer specs`)
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

    const routesData = ROUTES.map((r) => ({
      route_id: r.route_id,
      name: r.name,
      distance: r.distance,
      base_rate: r.base_rate,
      transit_time: r.transit_time,
      service_cycle: randomBetween(1, 7),
      km_rate: randomElement([0.5, 0.8, 1.0, 1.2]),
      hourly_rate: randomElement([15, 20, 25, 30]),
      loading_time: randomElement([0.5, 1, 1.5]),
      unloading_time: randomElement([0.5, 1, 1.5]),
      hoos_hour: randomElement([1, 2, 3]),
      refuel_time: randomElement([0.5, 1]),
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

    // Seed route stops (2-4 stops per route)
    const routeStopsData: any[] = []

    routes?.forEach((route) => {
      const numStops = randomBetween(2, 4)
      const shuffledLocations = [...(locations || [])].sort(
        () => Math.random() - 0.5
      )

      for (let i = 0; i < numStops && i < shuffledLocations.length; i++) {
        routeStopsData.push({
          route_id: route.id,
          location_id: shuffledLocations[i].id,
          stop_order: i + 1,
          stop_type: i === 0 ? 'PICKUP' : 'DELIVERY',
          notes: null,
          org_id: orgId,
        })
      }
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
          notes: `Fleet set ${i + 1} for ${carrier.commercial_name}`,
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
      'route_stops',
      'routes',
      'route_types',
      'locations',
      'location_types',
      'trailer_reefer_specs',
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
