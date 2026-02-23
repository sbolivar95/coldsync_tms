import { useState, useMemo } from "react";
import { Pencil, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction, DataTableBulkAction } from "../../components/widgets/DataTable/types";
import type { Lane } from "../../types/database.types";
import { ConfirmDialog } from "../../components/widgets/ConfirmDialog";
import type { StatusFilterValue } from "../../components/ui/StatusFilter";
import { useLanes, type LaneWithRelations } from "./hooks/useLanes";

interface LanesListProps {
  onSelectLane: (lane: Lane) => void;
  searchTerm?: string;
  statusFilter?: StatusFilterValue;
}

export function LanesList({ onSelectLane, searchTerm = "", statusFilter = "all" }: LanesListProps) {
  // useLanes now handles organization internally
  const { lanes, handleLaneDelete, handleLaneBulkDelete } = useLanes();
  const lanesWithStops = lanes as LaneWithRelations[];

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [laneToDelete, setLaneToDelete] = useState<LaneWithRelations | null>(null);

  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [lanesToBulkDelete, setLanesToBulkDelete] = useState<string[]>([]);

  // Filter lanes locally
  const filteredLanes = useMemo(() => {
    return lanesWithStops.filter((lane) => {
      const matchesSearch = searchTerm === "" ||
        lane.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lane.lane_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && lane.is_active) ||
        (statusFilter === "inactive" && !lane.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [lanesWithStops, searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (!laneToDelete) return;
    await handleLaneDelete(laneToDelete);
    setDeleteDialogOpen(false);
    setLaneToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (lanesToBulkDelete.length === 0) return;
    await handleLaneBulkDelete(lanesToBulkDelete);
    setBulkDeleteDialogOpen(false);
    setLanesToBulkDelete([]);
  };

  // Definir columnas
  const columns: DataTableColumn<LaneWithRelations>[] = [
    {
      key: "name",
      header: "Carril",
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectLane(item)}
            className="text-sm text-primary hover:text-primary-focus hover:underline text-left"
          >
            {item.name}
          </button>
          <span className="text-xs text-gray-500">{item.lane_id}</span>
        </div>
      )
    },
    {
      key: "route",
      header: "Pasillo Logístico (Secuencia)",
      render: (item) => {
        const stops = item.lane_stops || [];
        if (stops.length === 0) return <span className="text-xs text-gray-400">-</span>;

        // Sort by order
        const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);

        // If too many stops, show condensed view
        if (sortedStops.length > 3) {
          const first = sortedStops[0];
          const last = sortedStops[sortedStops.length - 1];
          const middleCount = sortedStops.length - 2;

          return (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-medium text-gray-900">{first.locations?.name || first.location_id}</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">+{middleCount} ubicaciones</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">{last.locations?.name || last.location_id}</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1 flex-wrap">
            {sortedStops.map((stop, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className={`text-xs ${stop.stop_type === 'PICKUP' ? 'font-medium text-gray-900' :
                  stop.stop_type === 'DROP_OFF' ? 'font-medium text-gray-900' :
                    'text-gray-600'
                  }`}>
                  {stop.locations?.name || stop.location_id}
                </span>
                {idx < sortedStops.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "distance",
      header: "Distancia (km)",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.distance} km</span>
      )
    },
    {
      key: "status",
      header: "Estado",
      render: (item) => (
        <Badge
          variant="default"
          className={
            item.is_active ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs" :
              "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs"
          }
        >
          {item.is_active ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
    {
      key: "laneType",
      header: "Tipo",
      render: (item) => (
        <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">
          {item.lane_types?.name || "-"}
        </Badge>
      )
    }
  ];

  // Definir acciones de fila
  const actions: DataTableAction<LaneWithRelations>[] = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: (lane) => onSelectLane(lane),
      title: "Editar",
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      onClick: (lane) => {
        setLaneToDelete(lane);
        setDeleteDialogOpen(true);
      },
      variant: "destructive",
      title: "Eliminar",
    },
  ];

  // Definir acciones masivas
  const bulkActions: DataTableBulkAction[] = [
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (selectedIds) => {
        setLanesToBulkDelete(selectedIds);
        setBulkDeleteDialogOpen(true);
      },
      variant: "destructive",
    },
  ];

  return (
    <>
      <DataTable
        data={filteredLanes}
        columns={columns}
        getRowId={(item) => item.id}
        actions={actions}
        bulkActions={bulkActions}
        itemsPerPage={10}
        totalLabel="carriles"
        emptyMessage="No hay carriles disponibles"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setLaneToDelete(null);
        }}
        title="¿Desactivar carril?"
        description={`¿Estás seguro de que deseas desactivar el carril "${laneToDelete?.name}"?`}
        variant="destructive"
        onConfirm={handleDelete}
        confirmText="Desactivar"
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => {
          setBulkDeleteDialogOpen(open);
          if (!open) setLanesToBulkDelete([]);
        }}
        title="¿Desactivar carriles?"
        description={`¿Estás seguro de que deseas desactivar los ${lanesToBulkDelete.length} carriles seleccionados?`}
        variant="destructive"
        onConfirm={handleBulkDelete}
        confirmText="Desactivar"
      />
    </>
  );
}
