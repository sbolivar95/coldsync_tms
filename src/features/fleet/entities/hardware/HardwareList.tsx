import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import { DataTableColumn } from "../../../../components/widgets/DataTable/types";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import type { ConnectionDevice, TelematicsProvider, Carrier, Vehicle, Trailer } from "../../../../types/database.types";

// Extended type for connection devices with related data
export type ConnectionDeviceWithDetails = ConnectionDevice & {
  telematicsProvider?: TelematicsProvider | null;
  carrier?: Carrier | null;
  assignedVehicle?: Vehicle | null;
  assignedTrailer?: Trailer | null;
  flespi_device_types?: { name: string } | null;
};

interface HardwareListProps {
  data: ConnectionDeviceWithDetails[];
  onSelectItem: (item: ConnectionDevice, type: "hardware") => void;
  transportistaNombre?: string;
  carrierId?: number; // ID del transportista para filtrar
  onEdit?: (item: ConnectionDevice) => void;
  onDelete?: (item: ConnectionDevice) => void;
}

export function HardwareList({
  data,
  onSelectItem,
  transportistaNombre,
  carrierId,
  onEdit,
  onDelete,
}: HardwareListProps) {
  // Columnas para Hardware/IoT
  const hardwareColumns: DataTableColumn<ConnectionDeviceWithDetails>[] = [
    {
      key: "ident",
      header: "ID Dispositivo",
      render: (device) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectItem(device, "hardware")}
            className="text-sm text-left hover:underline font-medium text-primary"
          >
            {device.ident}
          </button>
          <span className="text-xs text-gray-500">{device.flespi_device_types?.name || "-"}</span>
        </div>
      ),
    },
    {
      key: "phone_number",
      header: "Teléfono",
      render: (device) => (
        <span className="text-xs text-gray-900">{device.phone_number || "-"}</span>
      ),
    },
    {
      key: "telematicsProvider",
      header: "Proveedor",
      render: (device) => (
        <span className="text-xs text-gray-900">
          {device.telematicsProvider?.name || "-"}
        </span>
      ),
    },
    {
      key: "tracked_entity_type",
      header: "Unidad Asignada",
      render: (device) => {
        if (!device.tracked_entity_type || device.tracked_entity_type === 'INVENTORY' as any) {
          return (
            <div className="flex items-center">
              <span className="text-gray-400">-</span>
            </div>
          );
        }

        const isVehicle = device.tracked_entity_type === 'VEHICLE';
        const plate = isVehicle
          ? device.assignedVehicle?.plate
          : device.assignedTrailer?.plate;

        const code = isVehicle
          ? device.assignedVehicle?.unit_code
          : device.assignedTrailer?.code;

        const displayText = plate || code || "-";

        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide bg-primary-light text-primary hover:bg-primary-light w-fit border-primary/20">
              {isVehicle ? "Vehículo" : "Remolque"}
            </Badge>
            <span className="text-xs font-medium text-gray-900">{displayText}</span>
          </div>
        );
      },
    },
    {
      key: "carrier",
      header: "Transportista",
      render: (device) => (
        <span className="text-xs text-gray-900">
          {device.carrier?.commercial_name || "-"}
        </span>
      ),
    },
  ];

  // Ocultar columna de transportista si estamos filtrando por uno
  const visibleColumns = carrierId || transportistaNombre
    ? hardwareColumns.filter(col => col.key !== "carrier")
    : hardwareColumns;

  // Acciones individuales para hardware
  const hardwareActions = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      title: "Editar",
      onClick: (device: ConnectionDeviceWithDetails) => {
        if (onEdit) {
          onEdit(device);
        } else {
          onSelectItem(device, "hardware");
        }
      },
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      title: "Eliminar",
      onClick: (device: ConnectionDeviceWithDetails) => {
        if (onDelete) {
          onDelete(device);
        } else {
          console.log("Delete hardware:", device.id);
        }
      },
    },
  ];

  // Acciones masivas
  const bulkActions = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Eliminar",
      variant: "destructive" as const,
      onClick: (selectedIds: string[]) => {
        // TODO: Implement bulk delete callback
        console.log("Delete items:", selectedIds);
      },
    },
  ];

  return (
    <DataTable
      data={data}
      columns={visibleColumns}
      getRowId={(device: ConnectionDeviceWithDetails) => device.id}
      actions={hardwareActions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage="No hay dispositivos disponibles"
      totalLabel="dispositivos"
    />
  );
}
