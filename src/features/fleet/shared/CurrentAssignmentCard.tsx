import { Card } from "../../../components/ui/Card";
import { InputField } from "../../../components/widgets/FormField";
import { AssignmentDialog } from "../entities/assignments/AssignmentDialog";
import { useState } from "react";

interface CurrentAssignmentCardProps {
  driverAssigned?: string | null;
  vehicleAssigned?: string | null;
  trailerAssigned?: string | null;
  onManageClick?: () => void;
  // Nuevas props para modal
  asignacionId?: string | null;
  currentEntityType?: "conductor" | "vehiculo" | "remolque";
  currentEntityId?: string;
}

export function CurrentAssignmentCard({ 
  driverAssigned,
  vehicleAssigned,
  trailerAssigned,
  onManageClick,
  asignacionId,
  currentEntityType,
  currentEntityId
}: CurrentAssignmentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleManageClick = () => {
    if (onManageClick) {
      onManageClick();
    } else {
      setDialogOpen(true);
    }
  };

  const handleSaveAsignacion = (data: any) => {
    console.log("Asignación guardada:", data);
    // Aquí se integraría con el store para actualizar la asignación
    // Por ahora solo cerramos el modal
  };

  // Prellenar el formulario según el contexto
  const getAsignacionData = () => {
    if (!asignacionId) return undefined;
    
    return {
      id: asignacionId,
      conductor: driverAssigned || "",
      vehiculo: vehicleAssigned || "",
      remolque: trailerAssigned || "sin-remolque",
      transportista: "ColdChain Express",
      fechaInicio: "2024-01-15",
      notas: ""
    };
  };

  // Determinar qué IDs pasar al formulario según el tipo de entidad actual
  const getContextIds = () => {
    switch (currentEntityType) {
      case "conductor":
        return { driverId: currentEntityId };
      case "vehiculo":
        return { vehicleId: currentEntityId };
      case "remolque":
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
          <button
            onClick={handleManageClick}
            className="text-sm hover:underline"
            style={{ color: '#004ef0' }}
          >
            Gestionar Asignación
          </button>
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
        asignacion={getAsignacionData()}
        onSave={handleSaveAsignacion}
        {...getContextIds()}
      />
    </>
  );
}

