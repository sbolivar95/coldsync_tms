import { Search, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "../../../../components/ui/Input";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Badge } from "../../../../components/ui/Badge";
import { CancelButton } from "../../../../components/widgets/CancelButton";
import { PrimaryButton } from "../../../../components/widgets/PrimaryButton";
import { CarrierOrder } from "../../../../services/database/orders.service";
import { ordersService } from "../../../../services/database/orders.service";
import { useAppStore } from "../../../../stores/useAppStore";
import { toast } from "sonner";

interface FleetsetSelectionViewProps {
  order: CarrierOrder;
  selectedFleetsetId?: string | null;
  onBack: () => void;
  onSelect: (fleetsetId: string) => void;
}

interface FleetSetDisplay {
  id: string;
  name: string;
  vehicle: string;
  trailer: string;
  driver: string;
  isCompatible: boolean;
  isOriginal: boolean;
  isHybrid: boolean;
  capacity?: string;
  thermalProfile?: string;
  matchScore: number;
}

export function FleetsetSelectionView({ 
  order,
  selectedFleetsetId,
  onBack,
  onSelect,
}: FleetsetSelectionViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(selectedFleetsetId || null);
  const [fleetsets, setFleetsets] = useState<FleetSetDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { organization, organizationMember } = useAppStore();

  useEffect(() => {
    const loadFleetSets = async () => {
      if (!organization?.id || !organizationMember?.carrier_id) return;

      setIsLoading(true);
      try {
        const data = await ordersService.getAvailableFleetSets(
          organizationMember.carrier_id,
          organization.id
        );

        // Transform to display format
        // Filter out fleet sets that have active/committed orders
        const availableFleetSets = data.filter((fs: any) => {
            const orders = fs.orders || [];
            // Check if has any order in committed status
            const hasActiveOrder = orders.some((o: any) => 
                ['ACCEPTED', 'SCHEDULED', 'DISPATCHED', 'AT_DESTINATION'].includes(o.status)
            );
            return !hasActiveOrder;
        });

        const displayFleetsets: FleetSetDisplay[] = availableFleetSets.map((fs: any) => ({
          id: fs.id,
          name: `${fs.vehicle?.unit_code || "Unit"} / ${fs.driver?.name || "Driver"}`,
          vehicle: fs.vehicle?.plate || fs.vehicle?.unit_code || "-",
          trailer: fs.trailer?.plate || fs.trailer?.code || "-", 
          driver: fs.driver?.name || "-",
          isCompatible: true, // Assume compatible for now as service returns available ones
          isOriginal: fs.id === order.fleet_set_id, // Compare with order's current fleetset
          isHybrid: false, // TODO: Check vehicle/trailer capabilities
          capacity: "25 Tn", // Mock/Default if not in DB
          thermalProfile: "Refrigerado", // Mock/Default
          matchScore: 99, // Mock score
        }));

        setFleetsets(displayFleetsets);
      } catch (error) {
        console.error("Error loading fleetsets:", error);
        toast.error("Error al cargar flotas disponibles");
      } finally {
        setIsLoading(false);
      }
    };

    loadFleetSets();
  }, [organization?.id, organizationMember?.carrier_id, order.fleet_set_id]);

  // Filter fleetsets based on search term
  const filteredFleetsets = fleetsets.filter(fleetset => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fleetset.vehicle.toLowerCase().includes(searchLower) ||
      fleetset.trailer.toLowerCase().includes(searchLower) ||
      fleetset.driver.toLowerCase().includes(searchLower)
    );
  });

  const handleCancel = () => {
    onBack();
  };

  const handleApply = () => {
    if (tempSelectedId) {
      onSelect(tempSelectedId);
    }
  };

  const hasChanges = tempSelectedId !== selectedFleetsetId;

  return (
    <div className="flex flex-col h-full">
      {/* Fixed search header - consistent with drawer header height */}
      <div 
        className="shrink-0 px-6 border-b border-gray-200 flex items-center"
        style={{ minHeight: '60px' }}
      >
        {/* Search bar - full width */}
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
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Buscando flotas disponibles...</p>
          </div>
        ) : (
          /* Lista de flotas - formato simple como perfiles térmicos */
          <div className="space-y-0.5">
            {filteredFleetsets.length > 0 ? (
              filteredFleetsets.map((fleetset) => (
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
                      {/* Match score */}
                      <span className="text-xs font-semibold text-primary">
                        {fleetset.matchScore}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {fleetset.trailer} • {fleetset.driver} • <span className="text-gray-900 font-medium">{fleetset.capacity}</span> 
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  No se encontraron flotas que coincidan con "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con botones de acción */}
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
          disabled={!tempSelectedId || !hasChanges}
        >
          Cambiar
        </PrimaryButton>
      </div>
    </div>
  );
}