import { Search, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "../../../../components/ui/Input";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Badge } from "../../../../components/ui/Badge";
import { CancelButton } from "../../../../components/widgets/CancelButton";
import { PrimaryButton } from "../../../../components/widgets/PrimaryButton";
import { DispatchOrderWithRelations } from "../../hooks/useDispatchOrders";
import { useAppStore } from "../../../../stores/useAppStore";

interface DispatchFleetsetSelectionViewProps {
  order: DispatchOrderWithRelations;
  selectedFleetsetId?: string | null;
  onBack: () => void;
  onSelect: (fleetsetId: string) => Promise<void> | void;
  isApplying?: boolean;
}

interface FleetSetDisplay {
  id: string;
  name: string;
  vehicle: string;
  trailer: string;
  driver: string;
  carrier: string; // Agregar carrier
  isCompatible: boolean;
  isOriginal: boolean;
  isHybrid: boolean;
  capacity?: string;
  thermalProfile?: string;
  matchScore: number;
}

export function DispatchFleetsetSelectionView({ 
  order,
  selectedFleetsetId,
  onBack,
  onSelect,
  isApplying = false,
}: DispatchFleetsetSelectionViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(selectedFleetsetId || null);

  const { organization } = useAppStore();

  // Get cached fleetsets from Zustand (already loaded by parent)
  const allFleetSets = useAppStore((state) => state.fleetSets);

  // Transform and filter fleetsets for this order
  const fleetsets = useMemo(() => {
    if (!allFleetSets.length) return [];

    // Filter out fleet sets that have active/committed orders
    const availableFleetSets = allFleetSets.filter((fs) => {
      const orders = fs.orders || [];
      const hasActiveOrder = orders.some((o) => 
        ['ASSIGNED', 'SCHEDULED', 'DISPATCHED', 'AT_DESTINATION'].includes(o.status)
      );
      return !hasActiveOrder;
    });

    // Transform to display format
    const displayFleetsets: FleetSetDisplay[] = availableFleetSets.map((fs) => {
      const vehicle = fs.vehicles?.plate || fs.vehicles?.unit_code || "-";
      const trailer = fs.trailers?.plate || fs.trailers?.code || "-";
      const driver = fs.drivers?.name || "-";
      const carrier = fs.carriers?.commercial_name || "Sin Transportista";
      
      // Calcular capacidad real del trailer o vehículo
      const capacity = fs.trailers?.capacity_tn || fs.vehicles?.capacity_tn;
      const capacityDisplay = capacity ? `${capacity} Tn` : "-";
      
      return {
        id: fs.id,
        name: `${fs.vehicles?.unit_code || "Unit"} / ${fs.drivers?.name || "Driver"}`,
        vehicle,
        trailer,
        driver,
        carrier,
        isCompatible: true,
        isOriginal: fs.id === order.fleet_set_id,
        isHybrid: false, // TODO: Check from fleet set capabilities
        capacity: capacityDisplay,
        thermalProfile: "Refrigerado", // TODO: Get from fleet set
        matchScore: 99, // TODO: Calculate match score
      };
    });

    return displayFleetsets;
  }, [allFleetSets, order.fleet_set_id]);

  // Filter fleetsets based on search term
  const filteredFleetsets = fleetsets.filter(fleetset => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fleetset.vehicle.toLowerCase().includes(searchLower) ||
      fleetset.trailer.toLowerCase().includes(searchLower) ||
      fleetset.driver.toLowerCase().includes(searchLower) ||
      fleetset.carrier.toLowerCase().includes(searchLower)
    );
  });

  // Group by carrier and sort by match score within each group
  const groupedByCarrier = filteredFleetsets.reduce((groups, fleetset) => {
    const carrier = fleetset.carrier;
    if (!groups[carrier]) {
      groups[carrier] = [];
    }
    groups[carrier].push(fleetset);
    return groups;
  }, {} as Record<string, FleetSetDisplay[]>);

  // Sort fleetsets within each carrier group by match score (descending)
  Object.keys(groupedByCarrier).forEach(carrier => {
    groupedByCarrier[carrier].sort((a, b) => b.matchScore - a.matchScore);
  });

  const handleCancel = () => {
    onBack();
  };

  const handleApply = async () => {
    if (tempSelectedId) {
      await onSelect(tempSelectedId);
    }
  };

  const hasChanges = tempSelectedId !== selectedFleetsetId;
  const isAssigning = !selectedFleetsetId; // True si no hay fleetset asignado

  return (
    <div className="flex flex-col h-full">
      {/* Fixed search header */}
      <div 
        className="shrink-0 px-6 border-b border-gray-200 flex items-center"
        style={{ minHeight: '60px' }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Buscar flota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-0">
          {Object.keys(groupedByCarrier).length > 0 ? (
            Object.entries(groupedByCarrier).map(([carrier, carrierFleetsets]) => (
              <div key={carrier} className="space-y-0">
                {/* Carrier Header - Full width, sin bordes */}
                <div 
                  className="sticky top-0 z-10 bg-gray-50 px-6 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {carrier}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {carrierFleetsets.length} {carrierFleetsets.length === 1 ? 'flota' : 'flotas'}
                  </span>
                </div>

                {/* Fleetsets del carrier */}
                <div className="space-y-0.5 px-6 py-2">
                  {carrierFleetsets.map((fleetset) => (
                    <div 
                      key={fleetset.id}
                      className={`
                        flex items-start gap-4 p-4 rounded cursor-pointer transition-all
                        ${fleetset.id === tempSelectedId ? 'bg-blue-50' : 'bg-white hover:bg-gray-100'}
                      `}
                      onClick={() => setTempSelectedId(fleetset.id)}
                    >
                      <Checkbox 
                        checked={fleetset.id === tempSelectedId} 
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900">
                              {fleetset.vehicle}
                            </span>
                            {fleetset.isHybrid && (
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-100 text-primary hover:bg-blue-100 text-[9px] font-bold px-1.5 py-0.5"
                              >
                                HYB
                              </Badge>
                            )}
                            {fleetset.isOriginal && (
                              <Badge 
                                variant="secondary" 
                                className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-[9px] font-bold px-1.5 py-0.5"
                              >
                                ACTUAL
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-primary">
                            {fleetset.matchScore}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {fleetset.trailer} • {fleetset.driver} • <span className="text-gray-900 font-medium">{fleetset.capacity}</span> 
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-6">
              <p className="text-sm text-gray-500">
                {searchTerm 
                  ? `No se encontraron flotas que coincidan con "${searchTerm}"`
                  : "No hay flotas disponibles"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div 
        className="shrink-0 border-t border-gray-200 px-6 py-3 bg-white flex gap-3 items-center"
        style={{ minHeight: '60px' }}
      >
        <CancelButton
          className="flex-1"
          onClick={handleCancel}
        />
        <PrimaryButton
          icon={Check}
          size="sm"
          className="flex-1"
          onClick={handleApply}
          disabled={!tempSelectedId || !hasChanges || isApplying}
        >
          {isApplying ? "Guardando..." : isAssigning ? "Asignar" : "Cambiar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
