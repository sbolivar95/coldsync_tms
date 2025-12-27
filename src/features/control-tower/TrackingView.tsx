import { useState } from "react";
import { Navigation } from "lucide-react";
import { UnitDetailsDrawer } from "./UnitDetailsDrawer";
import { UnitCard } from "./UnitCard";

// Mock data de unidades en tiempo real
const mockUnits = [
  {
    id: "VEH-001",
    unit: "TRK-1024",
    trailer: "RMQ-456",
    driver: "Michael Johnson",
    location: "Chicago, IL",
    coordinates: { lat: 41.8781, lng: -87.6298 },
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
    location: "Dallas, TX",
    coordinates: { lat: 32.7767, lng: -96.797 },
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
    location: "Los Angeles, CA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
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
    trailerEsHibrido: true, // ✅ Remolque híbrido
    driver: "Lisa Rodriguez",
    location: "Houston, TX",
    coordinates: { lat: 29.7604, lng: -95.3698 },
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
    location: "Phoenix, AZ",
    coordinates: { lat: 33.4484, lng: -112.074 },
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
      severity: "warning",
    },
  },
  {
    id: "VEH-006",
    unit: "TRK-6234",
    trailer: "RMQ-123",
    driver: "Emma Davis",
    location: "Seattle, WA",
    coordinates: { lat: 47.6062, lng: -122.3321 },
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
    trailerEsHibrido: true, // ✅ Remolque híbrido
    driver: "Robert Brown",
    location: "Miami, FL",
    coordinates: { lat: 25.7617, lng: -80.1918 },
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
    location: "Denver, CO",
    coordinates: { lat: 39.7392, lng: -104.9903 },
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

interface TrackingViewProps {
  searchQuery?: string;
}

export function TrackingView({
  searchQuery,
}: TrackingViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<
    string | null
  >(null);

  // Filtrar unidades por búsqueda
  const filteredUnits = mockUnits.filter((unit) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      unit.unit.toLowerCase().includes(query) ||
      unit.trailer.toLowerCase().includes(query) ||
      unit.driver.toLowerCase().includes(query) ||
      unit.location.toLowerCase().includes(query) ||
      unit.carrier.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-full relative">
      {/* Lista de Unidades - 32% */}
      <div className="w-[32%] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Lista scrolleable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              isSelected={selectedUnit === unit.id}
              onClick={() => setSelectedUnit(unit.id)}
            />
          ))}
        </div>
      </div>

      {/* Mapa - 60% */}
      <div className="flex-1 relative">
        {/* Placeholder del mapa */}
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <Navigation className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Mapa en Tiempo Real
            </h3>
            <p className="text-sm text-gray-600 max-w-sm">
              Aquí se mostraría el mapa con todas las unidades
              en tiempo real.
              {selectedUnit && (
                <span className="block mt-2 text-[#004ef0]">
                  Unidad seleccionada:{" "}
                  {
                    mockUnits.find((u) => u.id === selectedUnit)
                      ?.unit
                  }
                </span>
              )}
            </p>
            <div className="mt-4 text-xs text-gray-500">
              Integración de mapa pendiente (Google Maps /
              Mapbox)
            </div>
          </div>
        </div>

        {/* Controles del mapa (floating) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200">
            <span className="text-lg text-gray-700">+</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200">
            <span className="text-lg text-gray-700">−</span>
          </button>
        </div>

        {/* Drawer de detalles de unidad */}
        {selectedUnit && (
          <UnitDetailsDrawer
            unit={mockUnits.find((u) => u.id === selectedUnit)!}
            onClose={() => setSelectedUnit(null)}
          />
        )}
      </div>
    </div>
  );
}