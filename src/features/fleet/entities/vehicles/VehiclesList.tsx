import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import { DataTableColumn } from "../../../../components/widgets/DataTable/types";
import { Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";

import type { Vehicle, Carrier, FleetSet, Driver, Trailer } from "../../../../types/database.types";

export type VehicleWithDetails = Vehicle & {
  carrier?: Carrier;
  active_assignment?: FleetSet | null;
  assigned_driver?: Driver | null;
  assigned_trailer?: Trailer | null;
};

interface VehiclesListProps {
  data: VehicleWithDetails[];
  onSelectItem: (item: Vehicle, type: "vehiculo") => void;
  onEdit?: (item: Vehicle) => void;
  onDelete?: (item: Vehicle) => void;
  onAssign?: (item: Vehicle) => void; // Nueva prop para asignar flota
  transportistaNombre?: string;
  carrierId?: number; // ID del transportista para filtrar
}

// Helper function to map operational_status to display status
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    ACTIVE: "Activo",
    IN_SERVICE: "En Servicio",
    IN_MAINTENANCE: "Mantenimiento",
    OUT_OF_SERVICE: "Fuera de Servicio",
    RETIRED: "Retirado",
    IN_TRANSIT: "En Tránsito",
  };
  return statusMap[status] || status;
};

// Helper function to get status badge className
const getStatusBadgeClass = (status: string): string => {
  if (status === "ACTIVE") {
    return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
  } else if (status === "IN_MAINTENANCE") {
    return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs";
  } else {
    return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
  }
};

export function VehiclesList({
  data,
  onSelectItem,
  onEdit,
  onDelete,
  onAssign,
  transportistaNombre,
  carrierId
}: VehiclesListProps) {

  // Columnas para Vehículos
  const vehicleColumns: DataTableColumn<VehicleWithDetails>[] = [
    {
      key: "unidad",
      header: "Vehículo",
      render: (vehicle) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectItem(vehicle, "vehiculo")}
            className="text-sm text-left hover:underline font-medium text-primary"
          >
            {vehicle.plate}
          </button>
          <span className="text-xs text-gray-500">{vehicle.unit_code}</span>
        </div>
      ),
    },
    {
      key: "conductor",
      header: "Conductor",
      render: (vehicle) => {
        if (vehicle.assigned_driver) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-900 font-medium">{vehicle.assigned_driver.name}</span>
              <span className="text-[10px] text-gray-500">
                {vehicle.assigned_driver.license_number ? `Lic: ${vehicle.assigned_driver.license_number}` : ''}
              </span>
            </div>
          )
        }
        return <span className="text-xs text-gray-400">Sin conductor</span>
      },
    },
    {
      key: "remolque",
      header: "Remolque",
      render: (vehicle) => (
        vehicle.assigned_trailer ? (
          <Badge variant="outline" className="text-xs font-normal bg-white text-gray-700 border-gray-300">
            {vehicle.assigned_trailer.plate || 'Sin Placa'}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">Sin remolque</span>
        )
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (vehicle) => (
        <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">
          {vehicle.vehicle_type}
        </Badge>
      ),
    },
    {
      key: "marca",
      header: "Marca / Modelo",
      render: (vehicle) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-900">{vehicle.brand}</span>
          <span className="text-xs text-gray-500">{vehicle.model}</span>
        </div>
      ),
    },
    {
      key: "transportista",
      header: "Transportista",
      render: (vehicle) => (
        <span className="text-xs text-gray-900">{vehicle.carrier?.commercial_name || "-"}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (vehicle) => (
        <Badge
          variant="default"
          className={getStatusBadgeClass(vehicle.operational_status)}
        >
          {getStatusLabel(vehicle.operational_status)}
        </Badge>
      ),
    },
  ];

  // Ocultar columna de transportista si estamos filtrando por uno
  const visibleVehicleColumns = transportistaNombre || carrierId
    ? vehicleColumns.filter(col => col.key !== "transportista")
    : vehicleColumns;

  // Acciones individuales para vehículos
  const vehicleActions = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      title: "Ver detalles",
      onClick: (vehicle: VehicleWithDetails) => {
        if (onEdit) {
          onEdit(vehicle);
        } else {
          onSelectItem(vehicle, "vehiculo");
        }
      },
    },
    {
      icon: <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />,
      title: "Asignar Flota",
      onClick: (vehicle: VehicleWithDetails) => {
        if (onAssign) {
          onAssign(vehicle);
        }
      },
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      title: "Eliminar",
      onClick: (vehicle: VehicleWithDetails) => {
        if (onDelete) {
          onDelete(vehicle);
        } else {
          console.log("Delete vehicle:", vehicle.id);
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
      onClick: async (selectedIds: string[]) => {
        // TODO: Implement bulk delete callback
        console.log("Bulk delete not implemented in dumb component yet", selectedIds);
      },
    },
  ];

  return (
    <DataTable
      data={data}
      columns={visibleVehicleColumns}
      getRowId={(vehicle) => vehicle.id}
      actions={vehicleActions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage="No hay vehículos disponibles"
      totalLabel="vehículos"
    />
  );
}

