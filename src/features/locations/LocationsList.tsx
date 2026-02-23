import { useMemo, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/widgets/DataTable/DataTable";
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from "../../components/widgets/DataTable/types";
import type { Location } from "../../types/database.types";
import type { StatusFilterValue } from "../../components/ui/StatusFilter";
import { ConfirmDialog } from "../../components/widgets/ConfirmDialog";
import { useAppStore } from "../../stores/useAppStore";
import { useLocations, type LocationWithRelations } from "./useLocations";

/**
 * LocationsList - Displays locations in a data table with CRUD actions
 * Follows the same pattern as ProductsTab - only returns DataTable
 */

interface LocationsListProps {
  onSelectLocation: (location: Location) => void;
  searchTerm?: string;
  statusFilter?: StatusFilterValue;
}

export function LocationsList({
  onSelectLocation,
  searchTerm = "",
  statusFilter = "all"
}: LocationsListProps) {
  const organization = useAppStore((state) => state.organization);
  const orgId = organization?.id || '';
  const { locations, handleLocationDelete, handleLocationBulkDelete } = useLocations(orgId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<LocationWithRelations | null>(null);

  // Filter locations based on search and status
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      // Search filter
      const matchesSearch =
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (location.countries?.name && location.countries.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (location.location_types?.name && location.location_types.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && location.is_active) ||
        (statusFilter === 'inactive' && !location.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [locations, searchTerm, statusFilter]);

  // Memoize columns to prevent DataTable recreation
  const columns: DataTableColumn<LocationWithRelations>[] = useMemo(() => [
    {
      key: "ubicacion",
      header: "Ubicación",
      render: (location: LocationWithRelations) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectLocation(location)}
            className="text-sm text-primary hover:text-blue-800 hover:underline text-left"
          >
            {location.name}
          </button>
          <span className="text-xs text-gray-500">{location.code}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (location: LocationWithRelations) => (
        <Badge
          variant="secondary"
          className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs"
        >
          {location.location_types?.name || "Sin tipo"}
        </Badge>
      ),
    },
    {
      key: "ciudad",
      header: "Ciudad/País",
      render: (location: LocationWithRelations) => (
        <span className="text-xs text-gray-900">
          {location.city}/{location.countries?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "direccion",
      header: "Dirección",
      render: (location: LocationWithRelations) => (
        <span className="text-xs text-gray-900">{location.address}</span>
      ),
    },
    {
      key: "docks",
      header: "Muelles",
      align: "center",
      render: (location: LocationWithRelations) => (
        <span className="text-xs text-gray-900">{location.num_docks}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (location: LocationWithRelations) => (
        <Badge
          variant="default"
          className={
            location.is_active
              ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs"
              : "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs"
          }
        >
          {location.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ], [onSelectLocation]);

  // Memoize actions to prevent DataTable recreation
  const handleEditClick = useCallback((location: LocationWithRelations) => {
    onSelectLocation(location);
  }, [onSelectLocation]);

  const handleDeleteClick = useCallback((location: LocationWithRelations) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  }, []);

  const actions: DataTableAction<LocationWithRelations>[] = useMemo(() => [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: handleEditClick,
      title: "Editar",
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      onClick: handleDeleteClick,
      variant: "destructive",
      title: "Eliminar",
    },
  ], [handleEditClick, handleDeleteClick]);

  // Memoize bulk actions to prevent DataTable recreation
  const bulkActions: DataTableBulkAction[] = useMemo(() => [
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (selectedIds: string[]) => handleLocationBulkDelete(selectedIds),
      variant: "destructive",
    },
  ], [handleLocationBulkDelete]);

  return (
    <>
      <DataTable
        data={filteredLocations}
        columns={columns}
        getRowId={(location) => location.id.toString()}
        actions={actions}
        bulkActions={bulkActions}
        itemsPerPage={10}
        totalLabel="ubicaciones"
        emptyMessage="No hay ubicaciones disponibles"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar ubicación?"
        description={`¿Estás seguro de que deseas eliminar la ubicación "${locationToDelete?.name}"? Esta acción no se puede deshacer.`}
        variant="destructive"
        onConfirm={() => {
          if (locationToDelete) {
            handleLocationDelete(locationToDelete);
            setDeleteDialogOpen(false);
            setLocationToDelete(null);
          }
        }}
      />
    </>
  );
}
