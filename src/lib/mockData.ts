// Mock data centralizado para toda la aplicación
// Este archivo contiene todos los datos mock utilizados en la aplicación

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Carrier {
  id: string;
  carrierType: "propia" | "tercero";
  commercialName: string;
  legalName: string;
  taxId: string;
  baseCountry: string;
  city: string;
  legalRepresentative: string;
  status: string;
  operationsContact: string;
  phone: string;
  email: string;
  // Fleet
  numVehicles: number;
  numDrivers: number;
  numTrailers: number;
  // Financial
  contractValid: boolean;
  contractExpiration: string;
  policyValid: boolean;
  policyExpiration: string;
  baseCurrency: string;
  paymentTerms: string;
  // Documents
  documentsComplete?: boolean;
  contractUploaded?: boolean;
  policyUploaded?: boolean;
  taxRegistrationUploaded?: boolean;
}

export interface Vehicle {
  id: string;
  unit: string;
  type: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  carrier: string;
  status: string;
  mileage: string;
  numberOfAxles: number;
  assignedDriver: string | null;
  assignedTrailer: string | null;
}

export interface Driver {
  id: string;
  name: string;
  license: string; // License number
  phone: string;
  email: string;
  carrier: string;
  status: string;
  assignedVehicle: string | null;
  assignedTrailer: string | null;
  // Additional fields
  firstName?: string;
  lastName?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  certifications?: string;
}

export interface Trailer {
  id: string;
  unit: string;
  type: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  carrier: string;
  status: string;
  tempRange?: string;
  capacity: string;
  lastInspection: string;
  reeferHours?: string;
  thermalConfiguration?: string;
  // Capacity
  capacityTons?: number;
  volume?: number;
  tareWeight?: number; // Peso Tara (Tn)
  palletsCapacity?: number; // Capacidad en pallets
  measurementUnit?: string; // Unidad de Medida (tn, m3, pallets, cajas, unidades)
  // Internal Dimensions
  insulationThickness?: number; // Espesor Aislamiento (cm)
  length?: number; // Largo (m)
  width?: number; // Ancho (m)
  height?: number; // Alto (m)
  numberOfAxles: number;
}

export interface Compartment {
  id: string;
  tempMin: string; // Temperature minimum (°C)
  tempMax: string; // Temperature maximum (°C)
  thermalProfileIds: string[]; // Thermal profile IDs
  maxWeight: string; // Maximum weight (Tn)
  maxVolume: string; // Maximum volume (m³)
  maxUnits: string; // Maximum units
}

export interface Hardware {
  id: string;
  telematicsProvider: string; // Proveedor de telemática
  connectionId: string; // ID de conexión (IMEI/Serial)
  phone?: string; // Teléfono
  hardwareBrand: string; // Marca de hardware
  model?: string; // Modelo
  serialNumber?: string; // Número de serie
  canReeferData: boolean; // Datos CAN Reefer
  assignedTo: "vehicle" | "trailer"; // Asignado a
  vehicleTrailer: string; // Vehículo o remolque asignado
  trailerType?: "hybrid" | "simple" | null; // Tipo de remolque (solo si assignedTo === "trailer")
}

export interface Location {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  country: string;
  docks: number;
  status: string;
  description?: string;
  locationType?: "point" | "polygon";
  coordinates?: { lat: number; lng: number } | null;
  polygon?: Array<{ lat: number; lng: number }> | null;
  radius?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  thermalProfileIds: string[];
  status: string;
}

export interface ThermalProfile {
  id: string;
  name: string;
  description: string;
  tempMin: number;
  tempMax: number;
  products: string[];
  status: string;
  compatibility: string;
}

export interface Route {
  id: string;
  name: string;
  code?: string;
  origins: string[];
  destinations: string[];
  waypoints?: string[]; // Paradas intermedias opcionales
  distance: string;
  status: string;
  lastUpdate: string;
  routeType: string;
  // Rate configuration
  rateMethod?: string;
  baseRate?: string;
  ratePerKm?: string;
  ratePerHour?: string;
  currency?: string;
  // Operations configuration
  transitTime?: string;
  cycleDuration?: string;
  loadingTime?: string;
  unloadingTime?: string;
  serviceHours?: string;
  refuelingTime?: string;
  operationalMargin?: string;
}

export interface Organization {
  id?: string;
  comercial_name: string;
  legal_name: string;
  full_name?: string;
  email?: string;
  city?: string;
  base_country_id: number;
  status: "ACTIVE" | "INACTIVE";
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  last_access?: string;
  invitation_code?: string;
  invitation_expires_at?: string;
}

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "Activo" | "Inactivo";
  phone: string;
  organizationId?: string;
  lastAccess?: string;
  createdAt?: string;
  invitationCode?: string;
  invitationExpiresAt?: string;
  // Legacy Spanish field names (for backward compatibility during migration)
  nombre?: string;
  apellido?: string;
  correo?: string;
  rol?: string;
  estado?: string;
  telefono?: string;
  ultimoAcceso?: string;
  creado?: string;
  codigoInvitacion?: string;
  fechaExpiracionInvitacion?: string;
}

// Order Status Type
export type OrderStatus =
  | "unassigned"
  | "assigned"
  | "pending"
  | "accepted"
  | "scheduled"
  | "rejected"
  | "expired"
  | "observed"
  | "fail_after_accept"
  | "dispatched"
  | "cancelled"
  | "at-origin"
  | "at-destination";

// Compartment interface for hybrid orders (different from trailer compartments)
export interface OrderCompartment {
  id: string;
  productId: string;
  thermalProfileId: string;
  weight: string;
}

// Order interface - Centralized interface for all order-related components
export interface Order {
  id?: string; // Optional for new orders
  configuration: "standard" | "hibrido" | "hybrid";
  status?: OrderStatus;
  routeId: string;
  priority?: "normal" | "high" | "critical"; // Tender priority from Dispatch
  // For Standard configuration
  productId?: string;
  thermalProfileId?: string;
  weight?: string;
  // For Hybrid configuration
  compartments?: OrderCompartment[];
  // Common fields
  quantity?: string;
  expectedDate?: string;
  timeWindow?: string;
  expectedTime?: string;
  notes?: string;
  // Assignment fields
  vehicleId?: string;
  unit?: string;
  trailer?: string;
  driver?: string;
  carrier?: string;
  plate?: string;
  // Trip/Timeline fields
  hasRTA?: boolean;
  rtaDuration?: number;
  dayOffset?: number;
  duration?: number;
  // Legacy Spanish field names (for backward compatibility during migration)
  configuracion?: string;
  ruta?: string;
  cantidad?: string;
  fechaPrevista?: string;
  ventanaTiempo?: string;
  horaPrevista?: string;
  producto?: string;
  perfil?: string;
  peso?: string;
  compartimientos?: OrderCompartment[];
  estado?: string;
  esHibrida?: boolean;
  isHybrid?: boolean;
  // Unit status fields (for Orders display)
  unitStatus?: string; // "En Ruta", "Detenido", "En Planta", "Offline", etc.
  hasActiveTrip?: boolean; // Whether the unit has an active trip
  hasIssue?: boolean; // Whether the unit has an issue/warning
}

// ============================================================================
// DATOS MOCK
// ============================================================================

// Carriers
export const mockCarriers: Carrier[] = [
  {
    id: "CAR-001",
    carrierType: "tercero",
    commercialName: "TransFrío Santa Cruz",
    legalName: "Transporte Frigorífico Santa Cruz S.R.L.",
    taxId: "NIT 1029384756",
    baseCountry: "Bolivia",
    city: "Santa Cruz",
    legalRepresentative: "Juan Pablo Mendoza",
    status: "Activo",
    operationsContact: "Juan Pablo Mendoza",
    phone: "+591 710 12345",
    email: "ops@transfrioscz.bo",
    numVehicles: 1,
    numDrivers: 1,
    numTrailers: 1,
    contractValid: true,
    contractExpiration: "2025-12-31",
    policyValid: true,
    policyExpiration: "2025-06-30",
    baseCurrency: "BOB",
    paymentTerms: "30 días FF",
    documentsComplete: true,
    contractUploaded: true,
    policyUploaded: true,
    taxRegistrationUploaded: true,
  },
  {
    id: "CAR-002",
    carrierType: "propia",
    commercialName: "Logística del Oriente",
    legalName: "Inversiones Logísticas del Oriente S.A.",
    taxId: "NIT 9876543210",
    baseCountry: "Bolivia",
    city: "Santa Cruz",
    legalRepresentative: "Sarah Williams",
    status: "Activo",
    operationsContact: "Sarah Williams",
    phone: "+591 720 23456",
    email: "ops@logisticaoriente.bo",
    numVehicles: 1,
    numDrivers: 1,
    numTrailers: 1,
    contractValid: true,
    contractExpiration: "2026-03-15",
    policyValid: false,
    policyExpiration: "2025-01-15",
    baseCurrency: "BOB",
    paymentTerms: "45 días FF",
    documentsComplete: false,
    contractUploaded: true,
    policyUploaded: false,
    taxRegistrationUploaded: true,
  },
  {
    id: "CAR-003",
    carrierType: "tercero",
    commercialName: "Andino Cold Express",
    legalName: "Andino Cold Express Transporte Internacional",
    taxId: "NIT 4567891234",
    baseCountry: "Bolivia",
    city: "La Paz",
    legalRepresentative: "Roberto Choque",
    status: "Activo",
    operationsContact: "Roberto Choque",
    phone: "+591 730 34567",
    email: "ops@andinocold.bo",
    numVehicles: 1,
    numDrivers: 1,
    numTrailers: 1,
    contractValid: true,
    contractExpiration: "2025-08-20",
    policyValid: true,
    policyExpiration: "2025-12-01",
    baseCurrency: "USD",
    paymentTerms: "Contado",
    documentsComplete: true,
    contractUploaded: true,
    policyUploaded: true,
    taxRegistrationUploaded: true,
  },
  {
    id: "CAR-004",
    carrierType: "propia",
    commercialName: "FrostLine Bolivia",
    legalName: "FrostLine Logistics Bolivia S.R.L.",
    taxId: "NIT 7894561230",
    baseCountry: "Bolivia",
    city: "Cochabamba",
    legalRepresentative: "Lisa Rodriguez",
    status: "Activo",
    operationsContact: "Lisa Rodriguez",
    phone: "+591 740 45678",
    email: "contacto@frostline.bo",
    numVehicles: 1,
    numDrivers: 1,
    numTrailers: 1,
    contractValid: true,
    contractExpiration: "2026-01-10",
    policyValid: true,
    policyExpiration: "2025-09-30",
    baseCurrency: "BOB",
    paymentTerms: "30 días FF",
    documentsComplete: true,
    contractUploaded: true,
    policyUploaded: true,
    taxRegistrationUploaded: true,
  }
];

// Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: "VEH-001",
    unit: "TRK-1024",
    type: "Reefer",
    make: "Freightliner",
    model: "Cascadia",
    year: "2022",
    vin: "1FUJGLDR2NLBV1234",
    licensePlate: "4020-ABC",
    carrier: "TransFrío Santa Cruz",
    status: "Activo",
    mileage: "125.450 km",
    numberOfAxles: 3,
    assignedDriver: "Michael Johnson",
    assignedTrailer: "TRL-5001"
  },
  {
    id: "VEH-002",
    unit: "TRK-2051",
    type: "Reefer",
    make: "Kenworth",
    model: "T680",
    year: "2021",
    vin: "1XKYDP9X5MJ234567",
    licensePlate: "3515-XYZ",
    carrier: "Logística del Oriente",
    status: "Activo",
    mileage: "156.780 km",
    numberOfAxles: 3,
    assignedDriver: "Sarah Williams",
    assignedTrailer: "TRL-5002"
  },
  {
    id: "VEH-003",
    unit: "TRK-3012",
    type: "Dry Van",
    make: "Volvo",
    model: "VNL 760",
    year: "2023",
    vin: "4V4NC9TH7PN345678",
    licensePlate: "2842-IJK",
    carrier: "Andino Cold Express",
    status: "Activo",
    mileage: "89.320 km",
    numberOfAxles: 2,
    assignedDriver: "Roberto Choque",
    assignedTrailer: null
  },
  {
    id: "VEH-004",
    unit: "TRK-4089",
    type: "Reefer",
    make: "Peterbilt",
    model: "579",
    year: "2022",
    vin: "1XPBDP9X6ND456789",
    licensePlate: "5291-LMN",
    carrier: "FrostLine Bolivia",
    status: "Mantenimiento",
    mileage: "142.890 km",
    numberOfAxles: 3,
    assignedDriver: null,
    assignedTrailer: null
  },
  {
    id: "VEH-005",
    unit: "TRK-5123",
    type: "Reefer",
    make: "International",
    model: "LT Series",
    year: "2021",
    vin: "3AKJGLDR9LSJM5678",
    licensePlate: "3388-OPQ",
    carrier: "Glacier Hauling",
    status: "Activo",
    mileage: "178.450 km",
    numberOfAxles: 3,
    assignedDriver: "David Kim",
    assignedTrailer: "TRL-5005"
  },
  {
    id: "VEH-006",
    unit: "TRK-6234",
    type: "Reefer",
    make: "Mack",
    model: "Anthem",
    year: "2020",
    vin: "1M2AX09C8KM678901",
    licensePlate: "4421-RST",
    carrier: "Polar Express",
    status: "Activo",
    mileage: "210.560 km",
    numberOfAxles: 3,
    assignedDriver: "Emma Davis",
    assignedTrailer: "TRL-5006"
  },
  {
    id: "VEH-007",
    unit: "TRK-7145",
    type: "Flatbed",
    make: "Freightliner",
    model: "Cascadia",
    year: "2023",
    vin: "1FUJGLDR1PLBV7890",
    licensePlate: "5582-UVW",
    carrier: "IceRoad Transport",
    status: "Activo",
    mileage: "67.230 km",
    numberOfAxles: 2,
    assignedDriver: "Carlos Martinez",
    assignedTrailer: null
  },
  {
    id: "VEH-008",
    unit: "TRK-8056",
    type: "Reefer",
    make: "Kenworth",
    model: "W990",
    year: "2022",
    vin: "1XKYDP9X1NJ890123",
    licensePlate: "2194-DEF",
    carrier: "FreezeFleet",
    status: "Inactivo",
    mileage: "195.670 km",
    numberOfAxles: 3,
    assignedDriver: null,
    assignedTrailer: null
  }
];

// Drivers
export const mockDrivers: Driver[] = [
  {
    id: "DRV-001",
    name: "Michael Johnson",
    license: "LIC-BO-456789",
    phone: "+591 710 11223",
    email: "mjohnson@transfrioscz.bo",
    carrier: "TransFrío Santa Cruz",
    status: "Disponible",
    assignedVehicle: "TRK-1024",
    assignedTrailer: "TRL-5001"
  },
  {
    id: "DRV-002",
    name: "Sarah Williams",
    license: "LIC-BO-789012",
    phone: "+591 720 22334",
    email: "swilliams@logisticaoriente.bo",
    carrier: "Logística del Oriente",
    status: "En Ruta",
    assignedVehicle: "TRK-2051",
    assignedTrailer: "TRL-5002"
  },
  {
    id: "DRV-003",
    name: "Roberto Choque",
    license: "LIC-BO-345678",
    phone: "+591 730 33445",
    email: "rchoque@andinocold.bo",
    carrier: "Andino Cold Express",
    status: "Disponible",
    assignedVehicle: "TRK-3012",
    assignedTrailer: null
  },
  {
    id: "DRV-004",
    name: "Lisa Rodriguez",
    license: "LIC-BO-901234",
    phone: "+591 740 44556",
    email: "lrodriguez@frostline.bo",
    carrier: "FrostLine Bolivia",
    status: "Descanso",
    assignedVehicle: null,
    assignedTrailer: null
  },
  {
    id: "DRV-005",
    name: "David Kim",
    license: "LIC-BO-567890",
    phone: "+591 750 55667",
    email: "dkim@glacier.bo",
    carrier: "Glacier Hauling",
    status: "En Ruta",
    assignedVehicle: "TRK-5123",
    assignedTrailer: "TRL-5005"
  },
  {
    id: "DRV-006",
    name: "Emma Davis",
    license: "LIC-BO-678901",
    phone: "+591 760 66778",
    email: "edavis@polar.bo",
    carrier: "Polar Express",
    status: "Disponible",
    assignedVehicle: "TRK-6234",
    assignedTrailer: "TRL-5006"
  },
  {
    id: "DRV-007",
    name: "Carlos Martinez",
    license: "LIC-BO-234567",
    phone: "+591 770 77889",
    email: "cmartinez@iceroad.bo",
    carrier: "IceRoad Transport",
    status: "Disponible",
    assignedVehicle: "TRK-7145",
    assignedTrailer: null
  },
  {
    id: "DRV-008",
    name: "Jennifer Lee",
    license: "LIC-BO-890123",
    phone: "+591 780 88990",
    email: "jlee@freeze.bo",
    carrier: "FreezeFleet",
    status: "Inactivo",
    assignedVehicle: null,
    assignedTrailer: null
  }
];

// Trailers
export const mockTrailers: Trailer[] = [
  {
    id: "TRL-001",
    unit: "TRL-5001",
    type: "Reefer 53'",
    make: "Utility",
    model: "3000R",
    year: "2021",
    vin: "1UYVS25328M123456",
    licensePlate: "4201-TRC",
    carrier: "TransFrío Santa Cruz",
    status: "Activo",
    tempRange: "-30°C a +30°C",
    capacity: "3,000 cu ft",
    lastInspection: "2024-01-12",
    reeferHours: "8,450 hrs",
    thermalConfiguration: "hibrido",
    capacityTons: 24,
    volume: 70,
    tareWeight: 6.5,
    palletsCapacity: 26,
    measurementUnit: "pallets",
    insulationThickness: 10,
    length: 13.6,
    width: 2.6,
    height: 2.7,
    numberOfAxles: 2
  },
  {
    id: "TRL-002",
    unit: "TRL-5002",
    type: "Reefer 53'",
    make: "Great Dane",
    model: "Everest",
    year: "2022",
    vin: "1GRAA06289W234567",
    licensePlate: "3516-TRB",
    carrier: "Logística del Oriente",
    status: "Activo",
    tempRange: "-35°C a +25°C",
    capacity: "3,040 cu ft",
    lastInspection: "2024-01-10",
    reeferHours: "6,230 hrs",
    thermalConfiguration: "estandar",
    capacityTons: 26,
    volume: 72,
    tareWeight: 7.0,
    palletsCapacity: 28,
    measurementUnit: "pallets",
    insulationThickness: 12,
    length: 13.6,
    width: 2.6,
    height: 2.7,
    numberOfAxles: 2
  },
  {
    id: "TRL-003",
    unit: "TRL-5003",
    type: "Dry Van 53'",
    make: "Wabash",
    model: "DuraPlate",
    year: "2023",
    vin: "1JJV532B6NL345678",
    licensePlate: "2843-TRD",
    carrier: "Andino Cold Express",
    status: "Activo",
    tempRange: "N/A",
    capacity: "3,850 cu ft",
    lastInspection: "2024-01-14",
    reeferHours: "N/A",
    capacityTons: 28,
    volume: 85,
    tareWeight: 5.8,
    palletsCapacity: 30,
    measurementUnit: "pallets",
    length: 13.6,
    width: 2.6,
    height: 2.7,
    numberOfAxles: 2
  },
  {
    id: "TRL-004",
    unit: "TRL-5004",
    type: "Reefer 48'",
    make: "Utility",
    model: "3000R",
    year: "2020",
    vin: "1UYVS25327M456789",
    licensePlate: "5292-TRF",
    carrier: "FrostLine Bolivia",
    status: "Mantenimiento",
    tempRange: "-25°C a +20°C",
    capacity: "2,700 cu ft",
    lastInspection: "2024-01-05",
    reeferHours: "12,890 hrs",
    capacityTons: 20,
    volume: 60,
    tareWeight: 5.5,
    palletsCapacity: 22,
    measurementUnit: "pallets",
    insulationThickness: 10,
    length: 12.2,
    width: 2.4,
    height: 2.6,
    numberOfAxles: 2
  },
  {
    id: "TRL-005",
    unit: "TRL-5005",
    type: "Reefer 53'",
    make: "Thermo King",
    model: "SB-410",
    year: "2021",
    vin: "1GRAA06288W567890",
    licensePlate: "3389-TRG",
    carrier: "Glacier Hauling",
    status: "Activo",
    tempRange: "-30°C a +30°C",
    capacity: "3,100 cu ft",
    lastInspection: "2024-01-08",
    reeferHours: "9,670 hrs",
    capacityTons: 25,
    volume: 75,
    tareWeight: 6.8,
    palletsCapacity: 27,
    measurementUnit: "pallets",
    insulationThickness: 11,
    length: 13.6,
    width: 2.6,
    height: 2.7,
    numberOfAxles: 2
  },
  {
    id: "TRL-006",
    unit: "TRL-5006",
    type: "Reefer 53'",
    make: "Great Dane",
    model: "Everest",
    year: "2019",
    vin: "1GRAA06287W678901",
    licensePlate: "4422-TRH",
    carrier: "Polar Express",
    status: "Activo",
    tempRange: "-28°C a +25°C",
    capacity: "3,020 cu ft",
    lastInspection: "2024-01-03",
    reeferHours: "15,340 hrs",
    capacityTons: 24,
    volume: 71,
    tareWeight: 6.6,
    palletsCapacity: 26,
    measurementUnit: "pallets",
    insulationThickness: 10,
    length: 13.6,
    width: 2.6,
    height: 2.7,
    numberOfAxles: 2
  },
  {
    id: "TRL-007",
    unit: "TRL-5007",
    type: "Flatbed 48'",
    make: "Fontaine",
    model: "Revolution",
    year: "2022",
    vin: "4FMCU13237J789012",
    licensePlate: "2195-TRJ",
    carrier: "IceRoad Transport",
    status: "Activo",
    tempRange: "N/A",
    capacity: "20.5 Tn",
    lastInspection: "2024-01-15",
    reeferHours: "N/A",
    capacityTons: 20.5,
    tareWeight: 4.5,
    palletsCapacity: 24,
    measurementUnit: "pallets",
    length: 12.2,
    width: 2.4,
    height: 2.5,
    numberOfAxles: 2
  },
  {
    id: "TRL-008",
    unit: "TRL-5008",
    type: "Reefer 53'",
    make: "Utility",
    model: "4000D-X",
    year: "2021",
    vin: "1UYVS25329M890123",
    licensePlate: "5583-TRK",
    carrier: "FreezeFleet",
    status: "Inactivo",
    tempRange: "-20°C a +15°C",
    capacity: "83 m³",
    lastInspection: "2023-12-20",
    reeferHours: "10,560 hrs",
    capacityTons: 23,
    volume: 83,
    tareWeight: 6.3,
    palletsCapacity: 25,
    measurementUnit: "pallets",
    insulationThickness: 9,
    length: 13.6,
    width: 2.6,
    height: 2.7,
    numberOfAxles: 2
  }
];

// Locations
export const mockLocations: Location[] = [
  {
    id: "FAE",
    name: "Planta-FAE",
    type: "Planta de faenado",
    address: "La Enconada, camino entre Cotoca y Puerto Pailas",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 4,
    status: "Activo",
    description: "Faenado y beneficio de pollo fresco refrigerado"
  },
  {
    id: "FC",
    name: "Planta-FC",
    type: "Planta de faenado",
    address: "Carretera al Norte km 14, Warnes",
    city: "Warnes",
    country: "Bolivia",
    docks: 3,
    status: "Activo",
    description: "Faenado y beneficio de cerdo entero (ganchero)"
  },
  {
    id: "PI",
    name: "Planta-PI",
    type: "Planta industrial",
    address: "Parque Industrial km 11, Av. Virgen de Luján, Santa Cruz",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 6,
    status: "Activo",
    description: "Producción de embutidos y productos procesados refrigerados"
  },
  {
    id: "FAB.5",
    name: "FAB-5",
    type: "Fábrica",
    address: "Parque Industrial km 9, Av. Virgen de Luján, Santa Cruz",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 5,
    status: "Activo",
    description: "Producción de podium, conservas y granel seco"
  },
  {
    id: "NCD",
    name: "NCD",
    type: "Centro de distribución",
    address: "Parque Industrial km 9.5, Av. Virgen de Luján, Santa Cruz",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 10,
    status: "Activo",
    description: "Almacén y centro de distribución de producto seco y congelado paletizado"
  },
  {
    id: "GRANJA",
    name: "Granja",
    type: "Granja avícola",
    address: "Zona Las Brechas – Lagunas, carretera a Cotoca",
    city: "Cotoca",
    country: "Bolivia",
    docks: 2,
    status: "Activo",
    description: "Producción y recojo de huevo comercial"
  },
  {
    id: "NCD-LPZ",
    name: "NCD-LPZ",
    type: "Centro de distribución",
    address: "Av. Chacaltaya esq. Los Andes, zona Villa Dolores, El Alto – La Paz",
    city: "La Paz",
    country: "Bolivia",
    docks: 8,
    status: "Activo",
    description: "Centro de recepción y distribución final de todo producto (pollo, embutido, cerdo, podium, huevo y congelado) en La Paz"
  },
  {
    id: "CD-SCZ-NORTE",
    name: "CD Santa Cruz Norte",
    type: "Centro de distribución",
    address: "Zona Industrial Norte, Av. Cristo Redentor km 8",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 12,
    status: "Activo",
    description: "Centro de distribución principal zona norte"
  },
  {
    id: "FRIGORIFICO-CBBA",
    name: "Frigorífico Cochabamba",
    type: "Frigorífico",
    address: "Av. Blanco Galindo km 12, Quillacollo",
    city: "Cochabamba",
    country: "Bolivia",
    docks: 6,
    status: "Activo",
    description: "Frigorífico y centro de almacenamiento refrigerado"
  },
  {
    id: "KETAL-LPZ",
    name: "Ketal La Paz",
    type: "Supermercado",
    address: "Av. Arce 2631, zona San Jorge",
    city: "La Paz",
    country: "Bolivia",
    docks: 4,
    status: "Activo",
    description: "Supermercado Ketal - punto de entrega"
  },
  {
    id: "PIL-ANDINA",
    name: "Planta PIL Andina",
    type: "Planta industrial",
    address: "Carretera a Oruro km 7, El Alto",
    city: "La Paz",
    country: "Bolivia",
    docks: 8,
    status: "Activo",
    description: "Planta industrial PIL Andina"
  },
  {
    id: "HOSPITAL-JAPONES",
    name: "Hospital Japonés",
    type: "Hospital",
    address: "Av. Japón entre 3er y 4to anillo",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 2,
    status: "Activo",
    description: "Hospital Japonés - entrega de insumos médicos"
  },
  {
    id: "PLANTA-DELIZIA",
    name: "Planta Delizia",
    type: "Planta industrial",
    address: "Parque Industrial Sur, Manzana 15",
    city: "Santa Cruz",
    country: "Bolivia",
    docks: 5,
    status: "Activo",
    description: "Planta de producción Delizia"
  },
  {
    id: "PLANTA-SOFIA",
    name: "Planta Sofía",
    type: "Planta industrial",
    address: "Zona Industrial Warnes km 3",
    city: "Warnes",
    country: "Bolivia",
    docks: 4,
    status: "Activo",
    description: "Planta de producción Sofía"
  }
];

// Products
export const mockProducts: Product[] = [
  {
    id: "PROD-001",
    name: "Pollo",
    description: "Pollo fresco refrigerado para distribución",
    thermalProfileIds: ["PT-001"],
    status: "Activo"
  },
  {
    id: "PROD-002",
    name: "Embutido",
    description: "Embutidos y productos cárnicos refrigerados",
    thermalProfileIds: ["PT-001"],
    status: "Activo"
  },
  {
    id: "PROD-003",
    name: "Seco",
    description: "Productos secos sin refrigeración",
    thermalProfileIds: ["PT-003"],
    status: "Activo"
  },
  {
    id: "PROD-004",
    name: "Procesado",
    description: "Productos procesados congelados",
    thermalProfileIds: ["PT-002"],
    status: "Activo"
  }
];

// Thermal Profiles
export const mockThermalProfiles: ThermalProfile[] = [
  {
    id: "PT-001",
    name: "Refrigerado",
    description: "Perfil para productos que requieren refrigeración estándar",
    tempMin: 0,
    tempMax: 5,
    products: ["Pollo", "Embutido"],
    status: "Activo",
    compatibility: "Alta"
  },
  {
    id: "PT-002",
    name: "Congelado",
    description: "Perfil para productos congelados",
    tempMin: -24,
    tempMax: -18,
    products: ["Procesado"],
    status: "Activo",
    compatibility: "Alta"
  },
  {
    id: "PT-003",
    name: "Seco",
    description: "Perfil para productos que no requieren refrigeración",
    tempMin: 15,
    tempMax: 25,
    products: ["Seco"],
    status: "Activo",
    compatibility: "Media"
  }
];

// Routes
export const mockRoutes: Route[] = [
  {
    id: "RUT-001",
    name: "Planta-FAE → NCD-LPZ",
    origins: ["Planta-FAE"],
    destinations: ["NCD-LPZ"],
    distance: "578",
    status: "Activa",
    lastUpdate: "2025-11-27",
    routeType: "S-Nacional",
    rateMethod: "por-kilometro"
  },
  {
    id: "RUT-002",
    name: "Planta-PI → NCD-LPZ",
    origins: ["Planta-PI"],
    destinations: ["NCD-LPZ"],
    distance: "562",
    status: "Activa",
    lastUpdate: "2025-11-27",
    routeType: "S-Nacional",
    rateMethod: "por-kilometro"
  },
  {
    id: "RUT-003",
    name: "CD Santa Cruz Norte → Hospital Japonés → Planta PIL Andina",
    origins: ["CD Santa Cruz Norte"],
    destinations: ["Planta PIL Andina"],
    waypoints: ["Hospital Japonés"],
    distance: "245",
    status: "Activa",
    lastUpdate: "2025-11-27",
    routeType: "S-Nacional",
    rateMethod: "por-kilometro"
  },
  {
    id: "RUT-004",
    name: "Planta Delizia → Planta Sofía → CD Santa Cruz Norte",
    origins: ["Planta Delizia"],
    destinations: ["CD Santa Cruz Norte"],
    waypoints: ["Planta Sofía"],
    distance: "189",
    status: "Activa",
    lastUpdate: "2025-11-27",
    routeType: "S-Nacional",
    rateMethod: "por-kilometro"
  },
  {
    id: "RUT-005",
    name: "CD Santa Cruz Norte → Frigorífico Cochabamba → Ketal La Paz → Planta PIL Andina",
    origins: ["CD Santa Cruz Norte"],
    destinations: ["Planta PIL Andina"],
    waypoints: ["Frigorífico Cochabamba", "Ketal La Paz"],
    distance: "612",
    status: "Activa",
    lastUpdate: "2025-11-27",
    routeType: "S-Nacional",
    rateMethod: "por-kilometro"
  }
];

// ============================================================================
// HELPERS Y UTILIDADES
// ============================================================================

// Opciones para dropdowns (formato { value, label })
export const carrierOptions = mockCarriers.map(carrier => ({
  value: carrier.commercialName,
  label: carrier.commercialName
}));

// Trailer Configurations
export const trailerConfigurations = [
  { value: "refrigerado", label: "Refrigerado" },
  { value: "congelado", label: "Congelado" },
  { value: "hibrido", label: "Híbrido" },
  { value: "seco", label: "Seco" },
  { value: "ganchero", label: "Ganchero" }
];

// Measurement Units for Capacity
export const measurementUnits = [
  { value: "tn", label: "Tn" },
  { value: "m3", label: "m³" },
  { value: "pallets", label: "Pallets" },
  { value: "cajas", label: "Cajas" },
  { value: "unidades", label: "Unids" }
];

// ============================================================================
// FUNCIONES HELPER (opcional, para futuras consultas)
// ============================================================================

/**
 * Gets a carrier by ID
 */
export function getCarrierById(id: string): Carrier | undefined {
  return mockCarriers.find(c => c.id === id);
}

/**
 * Gets a vehicle by ID
 */
export function getVehicleById(id: string): Vehicle | undefined {
  return mockVehicles.find(v => v.id === id);
}

/**
 * Gets a driver by ID
 */
export function getDriverById(id: string): Driver | undefined {
  return mockDrivers.find(d => d.id === id);
}

/**
 * Gets a trailer by ID
 */
export function getTrailerById(id: string): Trailer | undefined {
  return mockTrailers.find(t => t.id === id);
}

// Hardware/IoT
export const mockHardware: Hardware[] = [
  {
    id: "HW-001",
    telematicsProvider: "Geotab",
    connectionId: "356938035643809",
    phone: "+591 710 44556",
    hardwareBrand: "CalAmp",
    model: "LMU-4230",
    serialNumber: "SN-CAL-123456",
    canReeferData: true,
    assignedTo: "vehicle",
    vehicleTrailer: "TRK-1024",
    trailerType: null
  },
  {
    id: "HW-002",
    telematicsProvider: "Samsara",
    connectionId: "867698048532184",
    phone: "+591 720 55667",
    hardwareBrand: "Queclink",
    model: "GV500",
    serialNumber: "SN-QUE-234567",
    canReeferData: false,
    assignedTo: "vehicle",
    vehicleTrailer: "TRK-2051",
    trailerType: null
  },
  {
    id: "HW-003",
    telematicsProvider: "TracKing",
    connectionId: "359633103456782",
    phone: "+591 730 66778",
    hardwareBrand: "Teltonika",
    model: "FMB920",
    serialNumber: "SN-TEL-345678",
    canReeferData: true,
    assignedTo: "trailer",
    vehicleTrailer: "TRL-5001",
    trailerType: "hybrid"
  },
  {
    id: "HW-004",
    telematicsProvider: "Omnitracs",
    connectionId: "862173051234567",
    phone: "+591 740 77889",
    hardwareBrand: "CalAmp",
    model: "LMU-5530",
    serialNumber: "SN-CAL-456789",
    canReeferData: false,
    assignedTo: "vehicle",
    vehicleTrailer: "TRK-4089",
    trailerType: null
  },
  {
    id: "HW-005",
    telematicsProvider: "Verizon Connect",
    connectionId: "354678092345671",
    phone: "+591 750 88990",
    hardwareBrand: "Sierra Wireless",
    model: "RV50X",
    serialNumber: "SN-SIE-567890",
    canReeferData: true,
    assignedTo: "trailer",
    vehicleTrailer: "TRL-5002",
    trailerType: "simple"
  }
];

/**
 * Gets hardware by ID
 */
export function getHardwareById(id: string): Hardware | undefined {
  return mockHardware.find(h => h.id === id);
}

/**
 * Gets a location by ID
 */
export function getLocationById(id: string): Location | undefined {
  return mockLocations.find(l => l.id === id);
}

/**
 * Gets vehicles by carrier
 */
export function getVehiclesByCarrier(carrierName: string): Vehicle[] {
  return mockVehicles.filter(v => v.carrier === carrierName);
}

/**
 * Gets drivers by carrier
 */
export function getDriversByCarrier(carrierName: string): Driver[] {
  return mockDrivers.filter(d => d.carrier === carrierName);
}

/**
 * Gets trailers by carrier
 */
export function getTrailersByCarrier(carrierName: string): Trailer[] {
  return mockTrailers.filter(t => t.carrier === carrierName);
}

// ============================================================================
// ORDER HELPERS (para dispatch)
// ============================================================================

/**
 * Gets product name by ID
 */
export function getProductNameById(id: string): string {
  if (!id) return "-";
  const product = mockProducts.find((p) => p.id === id);
  return product?.name || id;
}

/**
 * Gets thermal profile name by ID
 */
export function getThermalProfileNameById(id: string): string {
  if (!id) return "-";
  const profile = mockThermalProfiles.find((p) => p.id === id);
  return profile?.name || id;
}

/**
 * Gets route name by ID
 */
export function getRouteNameById(id: string): string {
  if (!id) return "-";
  const route = mockRoutes.find((r) => r.id === id);
  return route?.name || id;
}

/**
 * Maps Spanish status to English OrderStatus
 */
export function mapStatusToEnglish(status: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    "sin-asignar": "unassigned",
    "asignada": "assigned",
    "pendiente": "pending",
    "programada": "scheduled",
    "rechazada": "rejected",
    "observada": "observed",
    "despachada": "dispatched",
    "cancelada": "cancelled",
    "en-origen": "at-origin",
    "en-destino": "at-destination",
  };
  return statusMap[status] || "unassigned";
}

/**
 * Formats weight in tons
 */
export function formatWeight(weight: string | number | undefined): string {
  if (!weight) return "-";
  const weightNum = typeof weight === "string" ? parseFloat(weight) : weight;
  if (isNaN(weightNum)) return "-";
  return `${weightNum.toFixed(2)} Tn`;
}

// ============================================================================
// ORDER CONSTANTS (para formularios)
// ============================================================================

/**
 * Time window options for orders
 */
export const timeWindowOptions = [
  { value: "sin-preferencia", label: "Sin preferencia" },
  { value: "manana", label: "Mañana (08:00 - 12:00)" },
  { value: "tarde", label: "Tarde (13:00 - 18:00)" },
  { value: "noche", label: "Noche (19:00 - 23:59)" },
  { value: "hora-especifica", label: "Hora específica" },
];

/**
 * Gets time window option label by value
 */
export function getTimeWindowLabel(value: string): string {
  return timeWindowOptions.find((opt) => opt.value === value)?.label || value;
}

/**
 * Order configuration options
 */
export const orderConfigurationOptions = [
  { value: "standard", label: "Standard" },
  { value: "hibrido", label: "Híbrido" },
];

/**
 * Product options for dropdowns (filtered by status)
 */
export const productOptions = mockProducts
  .filter((p) => p.status === "Activo")
  .map((p) => ({
    value: p.id,
    label: p.name,
  }));

/**
 * Route options for dropdowns (filtered by status)
 */
export const routeOptions = mockRoutes
  .filter((r) => r.status === "Activa")
  .map((r) => ({
    value: r.id,
    label: r.name,
  }));

/**
 * Thermal profile options for dropdowns (filtered by status)
 */
export const thermalProfileOptions = mockThermalProfiles
  .filter((p) => p.status === "Activo")
  .map((p) => ({
    value: p.id,
    label: `${p.name} (${p.tempMin}°C a ${p.tempMax}°C)`,
  }));

// ============================================================================
// ASSIGNMENT OPTIONS (para dispatch AssignmentTab)
// ============================================================================

/**
 * Vehicle options for dropdowns (filtered by status)
 */
export const vehicleOptions = mockVehicles
  .filter((v) => v.status === "Activo")
  .map((v) => ({
    value: v.unit,
    label: v.unit,
  }));

/**
 * Trailer options for dropdowns (filtered by status)
 */
export const trailerOptions = mockTrailers
  .filter((t) => t.status === "Activo")
  .map((t) => ({
    value: t.unit,
    label: t.unit,
  }));

/**
 * Driver options for dropdowns (filtered by status)
 */
export const driverOptions = mockDrivers
  .filter((d) => d.status === "Disponible" || d.status === "En Ruta")
  .map((d) => ({
    value: d.name,
    label: d.name,
  }));

// ============================================================================
// USER DATA (para settings)
// ============================================================================

// Users
export const mockUsers: User[] = [
  {
    id: "USR-001",
    firstName: "Carlos",
    lastName: "Rodríguez",
    email: "carlos.rodriguez@coldsync.com",
    role: "Administrador",
    status: "Activo",
    phone: "+56 9 8765 4321",
    lastAccess: "2024-11-24T10:30:00Z",
    createdAt: "2024-01-15T08:00:00Z",
    invitationCode: undefined, // No code for Activo
    invitationExpiresAt: undefined,
  },
  {
    id: "USR-002",
    firstName: "María",
    lastName: "González",
    email: "maria.gonzalez@coldsync.com",
    role: "Operador",
    status: "Activo",
    phone: "+56 9 7654 3210",
    lastAccess: "2024-11-24T09:15:00Z",
    createdAt: "2024-02-20T10:30:00Z",
    invitationCode: undefined, // No code for Activo
    invitationExpiresAt: undefined,
  },
  {
    id: "USR-003",
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan.perez@coldsync.com",
    role: "Conductor",
    status: "Inactivo",
    phone: "+56 9 6543 2109",
    lastAccess: "2024-11-23T18:45:00Z",
    createdAt: "2024-03-10T14:20:00Z",
    invitationCode: "M3RT8Q5X",
    invitationExpiresAt: "2026-01-20T23:59:59Z",
  },
  {
    id: "USR-004",
    firstName: "Ana",
    lastName: "Martínez",
    email: "ana.martinez@coldsync.com",
    role: "Supervisor",
    status: "Inactivo",
    phone: "+56 9 5432 1098",
    lastAccess: undefined,
    createdAt: "2024-01-25T12:00:00Z",
    invitationCode: "P9LK3M7N",
    invitationExpiresAt: "2026-02-15T23:59:59Z",
  },
  {
    id: "USR-006",
    firstName: "Patricia",
    lastName: "Silva",
    email: "patricia.silva@coldsync.com",
    role: "Analista",
    status: "Activo",
    phone: "+56 9 3210 9876",
    lastAccess: "2024-11-24T11:20:00Z",
    createdAt: "2024-02-15T16:45:00Z",
    invitationCode: undefined, // No code for Activo
    invitationExpiresAt: undefined,
  },
  {
    id: "USR-008",
    firstName: "Isabel",
    lastName: "Torres",
    email: "isabel.torres@coldsync.com",
    role: "Cliente",
    status: "Inactivo",
    phone: "+56 9 1098 7654",
    lastAccess: "2024-10-15T09:30:00Z",
    createdAt: "2024-03-05T11:15:00Z",
    invitationCode: "R5TY9W2E",
    invitationExpiresAt: "2024-11-30T23:59:59Z", // Expired date
  },
];

/**
 * Role options for user dropdowns
 * Uses enum values (OWNER, ADMIN, STAFF, DRIVER) with Spanish labels for display
 */
export const roleOptions = [
  { value: "OWNER", label: "Propietario" },
  { value: "ADMIN", label: "Administrador" },
  { value: "STAFF", label: "Personal" },
  { value: "DRIVER", label: "Conductor" },
];

/**
 * User status options for dropdowns
 */
export const userStatusOptions = [
  { value: "Activo", label: "Activo" },
  { value: "Inactivo", label: "Inactivo" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Expirado", label: "Expirado" },
];

/**
 * Organization status options for dropdowns
 * Database status: 'ACTIVE' | 'INACTIVE'
 * According to organizations-users.md documentation
 */
export const organizationStatusOptions = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
];

/**
 * Country options for dropdowns
 */
export const countryOptions = [
  { value: 1, label: "Bolivia" },
  { value: 2, label: "Chile" },
  { value: 3, label: "Perú" },
  { value: 4, label: "Argentina" },
  { value: 5, label: "Colombia" },
  { value: 6, label: "Ecuador" },
];

/**
 * Mock organizations data
 */
export const mockOrganizations: Organization[] = [
  {
    id: "6aa2a43c-1234-5678-9abc-def012345678",
    comercial_name: "Avicola Sofia",
    legal_name: "Sofia LTDA",
    city: "Santa Cruz",
    base_country_id: 1, // Bolivia
    status: "ACTIVE",
    created_at: "2024-01-15T10:00:00Z",
    last_access: "2024-11-24T14:30:00Z",
    invitation_code: undefined, // No code for ACTIVE
    invitation_expires_at: undefined,
  },
  {
    id: "e853f41d-5678-9abc-def0-123456789abc",
    comercial_name: "ColdChain Logistics",
    legal_name: "Zentag SRL.",
    city: "Santa Cruz de la Sierra",
    base_country_id: 1, // Bolivia
    status: "INACTIVE",
    created_at: "2024-02-20T14:30:00Z",
    last_access: undefined,
    invitation_code: "A7K9M2X5",
    invitation_expires_at: "2026-01-10T23:59:59Z",
  },
  {
    id: "ddc67755-9abc-def0-1234-56789abcdef0",
    comercial_name: "Fridosa",
    legal_name: "SA",
    city: "Santa",
    base_country_id: 1, // Bolivia
    status: "INACTIVE",
    created_at: "2024-03-10T09:15:00Z",
    last_access: undefined,
    invitation_code: "XK9P2H4T",
    invitation_expires_at: "2026-01-15T23:59:59Z",
  },
  {
    id: "abc12345-def0-1234-5678-9abcdef01234",
    comercial_name: "Transportes Bolivar",
    legal_name: "Transportes Bolivar S.A.",
    city: "La Paz",
    base_country_id: 1, // Bolivia
    status: "INACTIVE",
    created_at: "2024-01-05T08:00:00Z",
    last_access: "2024-10-15T16:20:00Z",
    invitation_code: undefined, // No code for SUSPENDED
    invitation_expires_at: undefined,
  },
  {
    id: "def67890-1234-5678-9abc-def012345678",
    comercial_name: "Logística Andina",
    legal_name: "Logística Andina LTDA",
    city: "Cochabamba",
    base_country_id: 1, // Bolivia
    status: "INACTIVE",
    created_at: "2024-02-28T12:30:00Z",
    last_access: "2024-09-20T10:45:00Z",
    invitation_code: undefined, // No code for INACTIVE
    invitation_expires_at: undefined,
  },
  {
    id: "ghi01234-5678-9abc-def0-123456789abc",
    comercial_name: "Frigorífico del Sur",
    legal_name: "Frigorífico del Sur S.R.L.",
    city: "Tarija",
    base_country_id: 1, // Bolivia
    status: "INACTIVE",
    created_at: "2024-03-15T14:00:00Z",
    last_access: "2024-08-10T09:30:00Z",
    invitation_code: "WB4L8N3Q",
    invitation_expires_at: "2024-12-20T23:59:59Z", // Expired date
  },
];

/**
 * Gets a user by ID
 */
export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

/**
 * Gets an organization by ID
 */
export function getOrganizationById(id: string): Organization | undefined {
  return mockOrganizations.find((o) => o.id === id);
}
/**
 * Helper functions for status badges
 */

// User status badge helpers
export const getUserStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Activo":
      return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
    case "Inactivo":
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
    case "Pendiente":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs";
    case "Expirado":
      return "bg-red-100 text-red-700 hover:bg-red-100 text-xs";
    default:
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
  }
};

export const getUserStatusLabel = (status: string) => {
  return status; // Ya están en español
};

// Organization status badge helpers
export const getOrganizationStatusBadgeClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
    case "INACTIVE":
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
    default:
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
  }
};

export const getOrganizationStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "INACTIVE":
      return "Inactivo";
    default:
      return status;
  }
};

/**
 * Format date helper
 */
export const formatDate = (dateString?: string) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return "-";
  }
};

/**
 * Format datetime helper
 */
export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "-";
  }
};