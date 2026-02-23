import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { Vehicle } from "../../../../../types/database.types";
import type { VehicleFormData } from "../../../../../lib/schemas/vehicle.schemas";
import { vehiclesService } from "../../../../../services/database/vehicles.service";
import { useAppStore } from "../../../../../stores/useAppStore";
import { toast } from "sonner";

interface UseVehiclesProps {
  organizationId?: string;
  carrierId?: number;
  onBreadcrumbChange?: (breadcrumbs: Array<{ label: string; onClick?: () => void }>) => void;
  onBack: () => void;
  onItemSaved: (item: Vehicle) => void;
}

export function useVehicles({
  organizationId,
  carrierId,
  onBreadcrumbChange,
  onBack,
  onItemSaved,
}: UseVehiclesProps) {
  const location = useLocation();
  const { setBreadcrumbs } = useAppStore();
  const [vehicleMode, setVehicleMode] = useState<"view" | "edit" | "create">("view");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleSaveVehicle = async (data: VehicleFormData) => {
    if (!organizationId) {
      toast.error("No hay organización seleccionada");
      return;
    }

    if (!carrierId) {
      toast.error("El transportista es requerido para crear un vehículo");
      return;
    }

    try {
      if (vehicleMode === "create") {
        // Create new vehicle
        const { reefer_equipment, ...vehicleData } = data;
        const newVehicle = await vehiclesService.create({
          ...vehicleData,
          org_id: organizationId,
          carrier_id: carrierId,
          vin: vehicleData.vin ?? "",
          additional_info: vehicleData.additional_info ?? "",
        });

        toast.success("Vehículo creado correctamente");

        // Navigate to view the new vehicle
        setSelectedVehicle(newVehicle);
        setVehicleMode("view");
        onItemSaved(newVehicle);

        // Update breadcrumbs
        const breadcrumbs = [
          {
            label: "Vehículos",
            onClick: onBack,
          },
          {
            label: newVehicle.unit_code || "",
            onClick: undefined,
          },
        ];

        if (onBreadcrumbChange) {
          onBreadcrumbChange(breadcrumbs);
        } else {
          setBreadcrumbs(location.pathname, breadcrumbs);
        }
      } else if (vehicleMode === "edit" && selectedVehicle) {
        // Update existing vehicle
        const { reefer_equipment, ...vehicleData } = data;
        const updatedVehicle = await vehiclesService.update(selectedVehicle.id, organizationId, {
          ...vehicleData,
          vin: vehicleData.vin ?? undefined,
          additional_info: vehicleData.additional_info ?? undefined,
        });

        toast.success("Vehículo actualizado correctamente");

        // Refresh the vehicle
        const refreshed = await vehiclesService.getById(updatedVehicle.id, organizationId);
        if (refreshed) {
          setSelectedVehicle(refreshed);
          setVehicleMode("view");
          onItemSaved(refreshed);

          // Update breadcrumbs
          if (onBreadcrumbChange) {
            onBreadcrumbChange([
              {
                label: "Vehículos",
                onClick: onBack,
              },
              {
                label: refreshed.unit_code || "",
                onClick: undefined,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error(vehicleMode === "edit" ? "Error al actualizar vehículo" : "Error al crear vehículo");
      throw error;
    }
  };

  const startCreate = () => {
    setSelectedVehicle(null);
    setVehicleMode("create");
  };

  const reset = () => {
    setSelectedVehicle(null);
    setVehicleMode("view");
  };

  return {
    vehicleMode,
    selectedVehicle,
    setSelectedVehicle,
    setVehicleMode,
    handleSaveVehicle,
    startCreate,
    reset,
  };
}
