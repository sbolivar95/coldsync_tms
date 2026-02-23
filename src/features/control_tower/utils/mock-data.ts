
export type ReEerErrorSeverity = "warning" | "critical";

export interface TrackingUnit {
    id: string;
    unit: string;
    trailer: string;
    trailerEsHibrido?: boolean;
    driver: string;
    location: string;
    coordinates: { lat: number; lng: number };
    status: string;
    speed: string;
    temperature: string;
    lastUpdate: string;
    carrier: string;
    reeferMode: string;
    reeferSetpoint: string;
    hasActiveTrip: boolean;
    reeferError?: {
        code: string;
        severity: ReEerErrorSeverity;
    };
}

// Mock data de unidades en tiempo real
export const mockTrackingUnits: TrackingUnit[] = [
    {
        id: "VEH-001",
        unit: "TRK-1024",
        trailer: "RMQ-456",
        driver: "Michael Johnson",
        location: "Santa Cruz, BO",
        coordinates: { lat: -17.7833, lng: -63.1821 },
        status: "En Ruta",
        speed: "65 km/h",
        temperature: "-18°C",
        lastUpdate: "2 min",
        carrier: "ColdChain Express",
        reeferMode: "Start/Stop",
        reeferSetpoint: "-18°C",
        hasActiveTrip: true,
    },
    {
        id: "VEH-002",
        unit: "TRK-2051",
        trailer: "RMQ-789",
        driver: "Sarah Williams",
        location: "Cochabamba, BO",
        coordinates: { lat: -17.3895, lng: -66.1568 },
        status: "En Ruta",
        speed: "72 km/h",
        temperature: "-20°C",
        lastUpdate: "1 min",
        carrier: "FrostLine Logistics",
        reeferMode: "Continuo",
        reeferSetpoint: "-20°C",
        hasActiveTrip: true,
    },
    {
        id: "VEH-003",
        unit: "TRK-3012",
        trailer: "RMQ-234",
        driver: "Mike Chen",
        location: "La Paz, BO",
        coordinates: { lat: -16.5, lng: -68.15 },
        status: "Detenido",
        speed: "0 km/h",
        temperature: "-22°C",
        lastUpdate: "5 min",
        carrier: "Arctic Transport",
        reeferMode: "Continuo",
        reeferSetpoint: "-22°C",
        hasActiveTrip: false,
        reeferError: {
            code: "E102",
            severity: "warning",
        },
    },
    {
        id: "VEH-004",
        unit: "TRK-4089",
        trailer: "RMQ-567",
        trailerEsHibrido: true,
        driver: "Lisa Rodriguez",
        location: "Montero, BO",
        coordinates: { lat: -17.3333, lng: -63.25 },
        status: "En Ruta",
        speed: "68 km/h",
        temperature: "-19°C",
        lastUpdate: "3 min",
        carrier: "TempGuard Freight",
        reeferMode: "Start/Stop",
        reeferSetpoint: "-19°C",
        hasActiveTrip: true,
    },
    {
        id: "VEH-005",
        unit: "TRK-5123",
        trailer: "RMQ-890",
        driver: "James Wilson",
        location: "Colomi, BO",
        coordinates: { lat: -17.3333, lng: -65.8667 },
        status: "En Planta",
        speed: "0 km/h",
        temperature: "-15°C",
        lastUpdate: "8 min",
        carrier: "Glacier Hauling",
        reeferMode: "Start/Stop",
        reeferSetpoint: "-15°C",
        hasActiveTrip: false,
        reeferError: {
            code: "E204",
            severity: "critical",
        },
    },
    {
        id: "VEH-006",
        unit: "TRK-6234",
        trailer: "RMQ-123",
        driver: "Emma Davis",
        location: "Vinto, BO",
        coordinates: { lat: -17.4333, lng: -66.3167 },
        status: "Detenido",
        speed: "70 km/h",
        temperature: "-21°C",
        lastUpdate: "4 min",
        carrier: "Polar Express",
        reeferMode: "Continuo",
        reeferSetpoint: "-21°C",
        hasActiveTrip: true,
    },
    {
        id: "VEH-007",
        unit: "TRK-7145",
        trailer: "RMQ-445",
        trailerEsHibrido: true,
        driver: "Robert Brown",
        location: "Caracollo, BO",
        coordinates: { lat: -17.6333, lng: -67.2167 },
        status: "Detenido",
        speed: "0 km/h",
        temperature: "-17°C",
        lastUpdate: "12 min",
        carrier: "IceRoad Transport",
        reeferMode: "Start/Stop",
        reeferSetpoint: "-17°C",
        hasActiveTrip: false,
    },
    {
        id: "VEH-008",
        unit: "TRK-8056",
        trailer: "RMQ-901",
        driver: "Sophia Martinez",
        location: "El Alto, BO",
        coordinates: { lat: -16.5, lng: -68.1833 },
        status: "En Ruta",
        speed: "63 km/h",
        temperature: "-23°C",
        lastUpdate: "6 min",
        carrier: "FreezeFleet",
        reeferMode: "Continuo",
        reeferSetpoint: "-23°C",
        hasActiveTrip: true,
    },
];
