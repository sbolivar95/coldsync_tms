import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import { DataTableColumn } from "../../../../components/widgets/DataTable/types";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import type { Driver, Carrier } from "../../../../types/database.types";

export type DriverWithDetails = Driver & {
  carrier?: Carrier;
};

interface DriversListProps {
  data: DriverWithDetails[];
  onSelectItem: (item: Driver, type: "conductor") => void;
  onEdit?: (item: Driver) => void;
  onDelete?: (item: Driver) => void;
  transportistaNombre?: string;
  carrierId?: number; // ID del transportista para filtrar
}

export function DriversList({
  data,
  onSelectItem,
  onEdit,
  onDelete,
  transportistaNombre,
  carrierId
}: DriversListProps) {

  // Helper function to get status label in Spanish
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "AVAILABLE": "Disponible",
      "INACTIVE": "Inactivo",
      "DRIVING": "En Ruta",
    };
    return statusMap[status] || status;
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    if (status === "AVAILABLE") return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
    if (status === "DRIVING") return "bg-primary-light text-primary hover:bg-primary-light text-xs";
    return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
  };

  // Columnas para Conductores
  const driverColumns: DataTableColumn<DriverWithDetails>[] = [
    {
      key: "conductor",
      header: "Conductor",
      render: (driver) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectItem(driver, "conductor")}
            className="text-sm text-left hover:underline font-medium text-primary"
          >
            {driver.name}
          </button>
          <span className="text-xs text-gray-500">{driver.driver_id}</span>
        </div>
      ),
    },
    {
      key: "licencia",
      header: "Licencia",
      render: (driver) => (
        <span className="text-xs text-gray-900">{driver.license_number}</span>
      ),
    },
    {
      key: "contacto",
      header: "Contacto",
      render: (driver) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-900">{driver.phone_number}</span>
          <span className="text-xs text-gray-500">{driver.email}</span>
        </div>
      ),
    },
    {
      key: "transportista",
      header: "Transportista",
      render: (driver) => (
        <span className="text-xs text-gray-900">{driver.carrier?.commercial_name || "-"}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (driver) => (
        <Badge
          variant="default"
          className={getStatusBadgeClass(driver.status)}
        >
          {getStatusLabel(driver.status)}
        </Badge>
      ),
    },
  ];

  // Ocultar columna de transportista si estamos filtrando por uno
  const visibleDriverColumns = carrierId || transportistaNombre
    ? driverColumns.filter(col => col.key !== "transportista")
    : driverColumns;

  // Acciones individuales para conductores
  const driverActions = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      title: "Ver detalles",
      onClick: (driver: DriverWithDetails) => {
        if (onEdit) {
          onEdit(driver);
        } else {
          onSelectItem(driver, "conductor");
        }
      },
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      title: "Eliminar",
      onClick: (driver: DriverWithDetails) => {
        if (onDelete) {
          onDelete(driver);
        } else {
          console.log("Delete driver:", driver.id);
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
      columns={visibleDriverColumns}
      getRowId={(driver) => driver.id.toString()}
      actions={driverActions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage="No hay conductores disponibles"
      totalLabel="conductores"
    />
  );
}

