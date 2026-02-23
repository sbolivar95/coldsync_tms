import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Plus } from "lucide-react";
import { type SmartOption } from "../../../components/widgets/SmartSelect";
import type { LaneFormData } from "../../../lib/schemas/lane.schemas";
import type { Lane } from "../../../types/database.types";
import { useAppStore } from "../../../stores/useAppStore";
import { useLocations } from "../../../features/locations/useLocations";
import { useLaneTypes } from "../hooks/useLaneTypes";
import { useLaneStops } from "../hooks/useLaneStops";
import { LaneTypeManagerDialog } from "../components/LaneTypeManagerDialog";
import { LaneStopsTable } from "../components/LaneStopsTable";
import { LaneConfigurationForm } from "../components/LaneConfigurationForm";
import { LaneSummary } from "../components/LaneSummary";

interface InformationTabProps {
  lane?: Lane | null;
}

export function InformationTab({ lane }: InformationTabProps) {
  const form = useFormContext<LaneFormData>();
  const organizationId = useAppStore((state) => state.organization?.id);

  // External hooks
  const { locations } = useLocations(organizationId || "");
  const {
    stops,
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleMoveStop,
    handleReorderStop
  } = useLaneStops(lane, locations);

  const {
    laneTypes,
    laneTypesData,
    loading: loadingLaneTypes,
    createLaneType,
    updateLaneType,
    deleteLaneType
  } = useLaneTypes(organizationId);

  // Local UI state
  const [showLaneTypeManager, setShowLaneTypeManager] = useState(false);

  // Location options for SmartSelect
  const locationOptions: SmartOption[] = locations.map(loc => ({
    value: loc.id.toString(),
    label: `${loc.name} (${loc.code})`,
    subtitle: loc.city
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <LaneConfigurationForm
          form={form as any}
          laneTypes={laneTypes}
          loadingLaneTypes={loadingLaneTypes}
          onManageLaneTypes={() => setShowLaneTypeManager(true)}
        />

        <Card className="p-6 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Pasillo Logístico (Secuencia)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddStop}
              className="text-primary hover:text-primary hover:bg-gray-100 text-xs h-7 px-2 font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-0.5" />
              Agregar
            </Button>
          </div>

          <LaneStopsTable
            stops={stops}
            locations={locations}
            locationOptions={locationOptions}
            onRemove={handleRemoveStop}
            onChange={handleStopChange}
            onMove={handleMoveStop}
            onReorder={handleReorderStop}
          />
        </Card>

        <LaneSummary form={form as any} stops={stops} />

        {showLaneTypeManager && (
          <LaneTypeManagerDialog
            laneTypes={laneTypesData}
            onClose={() => setShowLaneTypeManager(false)}
            onCreate={createLaneType}
            onUpdate={updateLaneType}
            onDelete={deleteLaneType}
            loading={loadingLaneTypes}
          />
        )}
      </div>
    </div>
  );
}