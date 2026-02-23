import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { Driver } from "../../../../../types/database.types";
import type { DriverFormData } from "../../../../../lib/schemas/driver.schemas";
import { driversService } from "../../../../../services/database/drivers.service";
import { useAppStore } from "../../../../../stores/useAppStore";
import { toast } from "sonner";

interface UseDriversProps {
  organizationId?: string;
  carrierId?: number;
  onBreadcrumbChange?: (breadcrumbs: Array<{ label: string; onClick?: () => void }>) => void;
  onBack: () => void;
  onItemSaved: (item: Driver) => void;
}

export function useDrivers({
  organizationId,
  carrierId,
  onBreadcrumbChange,
  onBack,
  onItemSaved,
}: UseDriversProps) {
  const location = useLocation();
  const { setBreadcrumbs } = useAppStore();
  const [driverMode, setDriverMode] = useState<"view" | "edit" | "create">("view");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const handleSaveDriver = async (data: DriverFormData) => {
    if (!organizationId) {
      toast.error("No hay organización seleccionada");
      return;
    }

    try {
      const finalCarrierId = carrierId || data.carrier_id;

      if (!finalCarrierId) {
        toast.error("El transportista es requerido");
        return;
      }

      if (driverMode === "create") {
        // Create new driver
        const newDriver = await driversService.create({
          ...data,
          carrier_id: finalCarrierId,
          org_id: organizationId,
          email: data.email ?? "",
        });

        toast.success("Conductor creado correctamente");

        // Navigate to view the new driver
        setSelectedDriver(newDriver);
        setDriverMode("view");
        onItemSaved(newDriver);

        // Update breadcrumbs
        const breadcrumbs = [
          {
            label: "Conductores",
            onClick: onBack,
          },
          {
            label: newDriver.name || "",
            onClick: undefined,
          },
        ];

        if (onBreadcrumbChange) {
          onBreadcrumbChange(breadcrumbs);
        } else {
          setBreadcrumbs(location.pathname, breadcrumbs);
        }
      } else if (driverMode === "edit" && selectedDriver) {
        // Update existing driver
        const updatedDriver = await driversService.update(selectedDriver.id, organizationId, {
          ...data,
          email: data.email ?? undefined,
        });

        toast.success("Conductor actualizado correctamente");

        // Refresh the driver
        const refreshed = await driversService.getById(updatedDriver.id, organizationId);
        if (refreshed) {
          setSelectedDriver(refreshed);
          setDriverMode("view");
          onItemSaved(refreshed);

          // Update breadcrumbs
          if (onBreadcrumbChange) {
            onBreadcrumbChange([
              {
                label: "Conductores",
                onClick: onBack,
              },
              {
                label: refreshed.name || "",
                onClick: undefined,
              },
            ]);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error saving driver:", error);

      // Check for unique constraint violation on driver_id
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;

      if (
        errorCode === "23505" ||
        errorMessage?.includes("drivers_org_driver_id_uniq") ||
        errorMessage?.includes("duplicate key value violates unique constraint")
      ) {
        toast.error("El ID de conductor ya existe. Por favor usa un ID diferente.");
      } else {
        toast.error(driverMode === "edit" ? "Error al actualizar conductor" : "Error al crear conductor");
      }
      throw error;
    }
  };

  const startCreate = () => {
    setSelectedDriver(null);
    setDriverMode("create");
  };

  const reset = () => {
    setSelectedDriver(null);
    setDriverMode("view");
  };

  return {
    driverMode,
    selectedDriver,
    setSelectedDriver,
    setDriverMode,
    handleSaveDriver,
    startCreate,
    reset,
  };
}
