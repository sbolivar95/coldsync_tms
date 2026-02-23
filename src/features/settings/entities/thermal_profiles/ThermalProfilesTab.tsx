import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction, DataTableBulkAction } from "../../../../components/widgets/DataTable/types";
import { Badge } from "../../../../components/ui/Badge";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import type { ThermalProfile } from "../../../../types/database.types";

interface ThermalProfilesTabProps {
  thermalProfiles: ThermalProfile[];
  onEdit: (profile: ThermalProfile) => void;
  onDelete: (profile: ThermalProfile) => void;
  onReactivate: (profile: ThermalProfile) => void;
  onBulkDelete: (profileIds: string[]) => void;
}

/**
 * ThermalProfilesTab - Displays thermal profiles in a data table with CRUD actions
 * Handles active/inactive profiles with conditional actions (delete/reactivate)
 * Uses database ThermalProfile type - receives data from useThermalProfiles hook
 */

export function ThermalProfilesTab({ 
  thermalProfiles, 
  onEdit, 
  onDelete,
  onReactivate,
  onBulkDelete 
}: ThermalProfilesTabProps) {
  const perfilesActions: DataTableAction<ThermalProfile>[] = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: onEdit,
      title: "Editar"
    },
    {
      icon: (item) => item.is_active ? (
        <Trash2 className="w-3.5 h-3.5 text-red-600" />
      ) : (
        <RotateCcw className="w-3.5 h-3.5 text-green-600" />
      ),
      onClick: (item) => item.is_active ? onDelete(item) : onReactivate(item),
      variant: (item) => item.is_active ? "destructive" : "default",
      title: (item) => item.is_active ? "Eliminar" : "Reactivar"
    }
  ];

  const perfilesBulkActions: DataTableBulkAction[] = [
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onBulkDelete,
      variant: "destructive"
    }
  ];

  const thermalProfilesColumns: DataTableColumn<ThermalProfile>[] = [
    {
      key: "name",
      header: "Nombre del Perfil",
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-[#004ef0]">{item.name}</div>
          <div className="text-xs text-gray-500">ID: {item.id}</div>
        </div>
      )
    },
    {
      key: "description",
      header: "Descripción",
      render: (item) => (
        <span 
          className="text-xs text-gray-600 line-clamp-2 max-w-xs" 
          title={item.description || "Sin descripción"}
        >
          {item.description || "Sin descripción"}
        </span>
      )
    },
    {
      key: "temp_min_c",
      header: "Temp. Min",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.temp_min_c}°C</span>
      ),
      width: "w-24"
    },
    {
      key: "temp_max_c",
      header: "Temp. Max",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.temp_max_c}°C</span>
      ),
      width: "w-24"
    },
    {
      key: "is_active",
      header: "Estado",
      render: (item) => (
        <Badge
          variant={item.is_active ? "default" : "secondary"}
          className={
            item.is_active 
              ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs"
          }
        >
          {item.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
      width: "w-24"
    }
  ];

  return (
    <DataTable
      data={thermalProfiles}
      columns={thermalProfilesColumns}
      getRowId={(item) => item.id.toString()}
      actions={perfilesActions}
      bulkActions={perfilesBulkActions}
      itemsPerPage={10}
      emptyMessage="No hay perfiles térmicos para mostrar"
    />
  );
}

