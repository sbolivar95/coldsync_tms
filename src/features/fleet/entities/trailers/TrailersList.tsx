import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import { DataTableColumn } from "../../../../components/widgets/DataTable/types";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import type { Trailer, TrailerReeferSpecs, Carrier } from "../../../../types/database.types";

// Exported type for trailers with carrier and reefer specs info
export type TrailerWithDetails = Trailer & {
  carrier?: Carrier;
  reeferSpecs?: TrailerReeferSpecs | null;
};

interface TrailersListProps {
  data: TrailerWithDetails[];
  onSelectItem: (item: Trailer, type: "remolque") => void;
  onEditTrailer?: (item: Trailer) => void;
  transportistaNombre?: string;
  carrierId?: number; // ID del transportista para filtrar
}

export function TrailersList({
  data,
  onSelectItem,
  onEditTrailer,
  transportistaNombre,
  carrierId
}: TrailersListProps) {

  // Helper function to get status label in Spanish
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "ACTIVE": "Activo",
      "IN_SERVICE": "En Servicio",
      "IN_MAINTENANCE": "Mantenimiento",
      "OUT_OF_SERVICE": "Fuera de Servicio",
      "RETIRED": "Retirado",
      "IN_TRANSIT": "En Tránsito",
    };
    return statusMap[status] || status;
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    if (status === "ACTIVE") return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
    if (status === "IN_MAINTENANCE") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs";
    if (status === "OUT_OF_SERVICE" || status === "RETIRED") return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
    return "bg-primary-light text-primary hover:bg-primary-light text-xs";
  };

  // Helper function to format temperature range
  const formatTempRange = (trailer: TrailerWithDetails) => {
    if (trailer.reeferSpecs?.temp_min_c !== null && trailer.reeferSpecs?.temp_min_c !== undefined &&
      trailer.reeferSpecs?.temp_max_c !== null && trailer.reeferSpecs?.temp_max_c !== undefined) {
      return `${trailer.reeferSpecs.temp_min_c}°C / ${trailer.reeferSpecs.temp_max_c}°C`;
    }
    return "-";
  };

  // Columnas para Remolques
  const trailerColumns: DataTableColumn<TrailerWithDetails>[] = [
    {
      key: "unidad",
      header: "Unidad",
      render: (trailer) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectItem(trailer, "remolque")}
            className="text-sm text-left hover:underline font-medium text-primary"
          >
            {trailer.code}
          </button>
          <span className="text-xs text-gray-500">{trailer.plate}</span>
        </div>
      ),
    },
    {
      key: "capacidad",
      header: "Capacidad",
      render: (trailer) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-900">{trailer.transport_capacity_weight_tn} Tn</span>
          <span className="text-xs text-gray-500">{trailer.volume_m3} m³</span>
        </div>
      ),
    },
    {
      key: "rangoTermico",
      header: "Rango Térmico",
      render: (trailer) => (
        <span className="text-xs text-gray-900">{formatTempRange(trailer)}</span>
      ),
    },
    {
      key: "transportista",
      header: "Transportista",
      render: (trailer) => (
        <span className="text-xs text-gray-900">{trailer.carrier?.commercial_name || "-"}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (trailer) => (
        <Badge
          variant="default"
          className={getStatusBadgeClass(trailer.operational_status)}
        >
          {getStatusLabel(trailer.operational_status)}
        </Badge>
      ),
    },
    {
      key: "configTermica",
      header: "Config. Térmica",
      render: (trailer) => {
        const isMultiZone = trailer.supports_multi_zone;

        if (isMultiZone) {
          return (
            <Badge
              className="bg-hibrido-bg text-hibrido-text hover:bg-hibrido-bg border-0 text-xs"
            >
              Híbrido
            </Badge>
          );
        }

        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs border-0"
          >
            Standard
          </Badge>
        );
      },
    },
  ];

  // Ocultar columna de transportista si estamos filtrando por uno
  const visibleTrailerColumns = carrierId || transportistaNombre
    ? trailerColumns.filter(col => col.key !== "transportista")
    : trailerColumns;

  // Acciones individuales para remolques
  const trailerActions = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      title: onEditTrailer ? "Editar" : "Ver detalles",
      onClick: (trailer: TrailerWithDetails) => {
        if (onEditTrailer) {
          onEditTrailer(trailer);
        } else {
          onSelectItem(trailer, "remolque");
        }
      },
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      title: "Eliminar",
      onClick: (trailer: TrailerWithDetails) => console.log("Delete trailer:", trailer.id),
    },
  ];

  // Acciones masivas
  const bulkActions = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Eliminar",
      variant: "destructive" as const,
      onClick: (selectedIds: string[]) => {
        console.log("Delete items:", selectedIds);
      },
    },
  ];

  return (
    <DataTable
      data={data}
      columns={visibleTrailerColumns}
      getRowId={(trailer) => trailer.id}
      actions={trailerActions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage="No hay remolques disponibles"
      totalLabel="remolques"
    />
  );
}

