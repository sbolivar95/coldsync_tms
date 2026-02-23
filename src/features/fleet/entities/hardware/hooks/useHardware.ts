import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { ConnectionDevice } from "../../../../../types/database.types";
import type { ConnectionDeviceFormData } from "../../../../../lib/schemas/hardware.schemas";
import { hardwareService, vehiclesService, trailersService } from "../../../../../services/database";
import { useAppStore } from "../../../../../stores/useAppStore";
import { toast } from "sonner";

interface UseHardwareProps {
  organizationId?: string;
  onItemSaved: (item: ConnectionDevice) => void;
  onRefreshList: () => void;
}

export function useHardware({
  organizationId,
  onItemSaved,
  onRefreshList,
}: UseHardwareProps) {
  const location = useLocation();
  const { setBreadcrumbs } = useAppStore();
  const [hardwareMode, setHardwareMode] = useState<"view" | "edit" | "create">("view");
  const [selectedHardware, setSelectedHardware] = useState<ConnectionDevice | null>(null);
  const [hardwareDialogOpen, setHardwareDialogOpen] = useState(false);
  const [hardwareToDelete, setHardwareToDelete] = useState<ConnectionDevice | null>(null);

  const handleSaveHardware = async (data: ConnectionDeviceFormData) => {
    if (!organizationId) {
      toast.error("No hay organización seleccionada");
      return;
    }

    try {
      // Extract fields that are not in connection_device table
      const { assigned_entity_id, ...dbData } = data;
      let savedDevice: ConnectionDevice | null = null;

      if (hardwareMode === "edit" && selectedHardware) {
        // Update existing connection device
        const updated = await hardwareService.updateConnectionDevice(
          selectedHardware.id,
          organizationId,
          dbData
        );
        savedDevice = updated;
        toast.success("Dispositivo actualizado correctamente");

        // Refresh the connection device
        const refreshed = await hardwareService.getConnectionDeviceById(updated.id, organizationId);
        if (refreshed) {
          setSelectedHardware(refreshed);
          setHardwareMode("view");
          onItemSaved(refreshed);
        }
      } else if (hardwareMode === "create") {
        // Create new connection device
        const newDevice = await hardwareService.createConnectionDevice({
          ...dbData,
          org_id: organizationId,
        });
        savedDevice = newDevice;
        toast.success("Dispositivo creado correctamente");

        // Navigate to view the new device
        setSelectedHardware(newDevice);
        setHardwareMode("view");
        setHardwareDialogOpen(false);
        setBreadcrumbs(location.pathname, [
          {
            label: newDevice.ident || "",
            onClick: undefined,
          },
        ]);
        onRefreshList();
        onItemSaved(newDevice);
      }

      // Handle Immediate Assignment
      if (savedDevice && assigned_entity_id && data.tracked_entity_type) {
        if (data.tracked_entity_type === 'VEHICLE') {
          await vehiclesService.update(assigned_entity_id, organizationId, {
            connection_device_id: savedDevice.id
          });
          toast.success('Vinculado a vehículo exitosamente');
        } else if (data.tracked_entity_type === 'TRAILER') {
          await trailersService.update(assigned_entity_id, organizationId, {
            connection_device_id: savedDevice.id
          });
          toast.success('Vinculado a remolque exitosamente');
        }
      }
    } catch (error) {
      console.error("Error saving connection device:", error);
      toast.error(
        hardwareMode === "edit" ? "Error al actualizar dispositivo" : "Error al crear dispositivo"
      );
    }
  };

  const handleEditHardware = (device: ConnectionDevice) => {
    setSelectedHardware(device);
    setHardwareMode("edit");
    setHardwareDialogOpen(true);
  };

  const handleDeleteHardware = (device: ConnectionDevice) => {
    setHardwareToDelete(device);
  };

  const confirmDeleteHardware = async () => {
    if (!hardwareToDelete || !organizationId) return;

    try {
      await hardwareService.deleteConnectionDevice(hardwareToDelete.id, organizationId);
      toast.success("Dispositivo eliminado correctamente");
      setHardwareToDelete(null);
      onRefreshList();
    } catch (error) {
      console.error("Error deleting connection device:", error);
      toast.error("Error al eliminar Dispositivo");
    }
  };

  const startCreate = () => {
    setSelectedHardware(null);
    setHardwareDialogOpen(true);
  };

  const reset = () => {
    setSelectedHardware(null);
    setHardwareMode("view");
    setHardwareDialogOpen(false);
  };

  return {
    hardwareMode,
    selectedHardware,
    hardwareDialogOpen,
    hardwareToDelete,
    setSelectedHardware,
    setHardwareMode,
    setHardwareDialogOpen,
    setHardwareToDelete,
    handleSaveHardware,
    handleEditHardware,
    handleDeleteHardware,
    confirmDeleteHardware,
    startCreate,
    reset,
  };
}
