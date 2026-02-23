import { Card } from "../../../components/ui/Card";
import { InputField } from "../../../components/widgets/FormField";
import { AssignmentDialog } from "../entities/assignments/dialogs/AssignmentDialog";
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ActionButton } from "../../../components/widgets/buttons/ActionButton";

interface CurrentAssignmentCardProps {
  driverAssigned: string | null;
  vehicleAssigned: string | null;
  trailerAssigned: string | null;
  // Entity context for assignment dialog
  currentEntityType: "conductor" | "vehiculo" | "remolque";
  currentEntityId?: string;
  carrierId?: number | null; // ID del transportista para filtrar opciones
}

export function CurrentAssignmentCard({
  driverAssigned,
  vehicleAssigned,
  trailerAssigned,
  currentEntityType,
  currentEntityId,
  carrierId
}: CurrentAssignmentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleManageClick = () => {
    setDialogOpen(true);
  };

  const handleSaveAsignacion = () => {
    // TODO: Integrate with fleet_sets service to refresh assignment data
    // The AssignmentDialog already handles the save operation internally
  };

  // Determine which IDs to pass to the form based on current entity type
  const getContextIds = () => {
    if (!currentEntityId) return {};

    switch (currentEntityType) {
      case "conductor":
        // Driver ID needs to be a number
        return { driverId: parseInt(currentEntityId, 10) };
      case "vehiculo":
        // Vehicle ID is a string (UUID)
        return { vehicleId: currentEntityId };
      case "remolque":
        // Trailer ID is a string (UUID)
        return { trailerId: currentEntityId };
      default:
        return {};
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Asignación y Operación
          </h3>
          <ActionButton
            icon={ArrowLeftRight}
            label="Asignar Flota"
            onClick={handleManageClick}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <InputField
            label="Conductor Asignado"
            id="conductor-asignado"
            defaultValue={driverAssigned || "Sin Asignación"}
            disabled
            helpText="Solo lectura - Editar en Asignaciones"
          />

          <InputField
            label="Vehículo Asignado"
            id="vehiculo-asignado"
            defaultValue={vehicleAssigned || "Sin Asignación"}
            disabled
            helpText="Solo lectura - Editar en Asignaciones"
          />

          <InputField
            label="Remolque Asignado"
            id="remolque-asignado"
            defaultValue={trailerAssigned || "Sin Asignación"}
            disabled
            helpText="Solo lectura - Editar en Asignaciones"
          />
        </div>
      </Card>

      <AssignmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveAsignacion}
        carrierId={carrierId}
        {...getContextIds()}
      />
    </>
  );
}

