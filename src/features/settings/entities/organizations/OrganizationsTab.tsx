import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction, DataTableBulkAction } from "../../../../components/widgets/DataTable/types";
import { Badge } from "../../../../components/ui/Badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Organization } from "../../../../features/settings/hooks/useOrganizations";
import {
  getOrganizationStatusBadgeClass,
  getOrganizationStatusLabel,
  getPlanTypeLabel,
  formatTaxId,
  formatContactEmail,
  formatDate
} from "../../../../lib/utils/organization.utils";

interface OrganizationsTabProps {
  organizations: Organization[];
  onDelete: (organization: Organization) => void;
  onBulkDelete: (organizationIds: string[]) => void;
  onRowClick?: (organization: Organization) => void;
  isOwner?: boolean; // Si es OWNER, no puede crear/eliminar
}

export function OrganizationsTab({
  organizations,
  onDelete,
  onBulkDelete,
  onRowClick,
  isOwner = false
}: OrganizationsTabProps) {
  // OWNER solo puede ver, no puede eliminar
  const organizationsActions: DataTableAction<Organization>[] = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: (organization) => onRowClick?.(organization),
      title: "Ver detalles"
    },
    // Solo mostrar acción de eliminar si NO es OWNER
    ...(isOwner ? [] : [
      {
        icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
        onClick: onDelete,
        variant: "destructive" as const,
        title: "Eliminar"
      }
    ])
  ];

  // OWNER no puede realizar acciones masivas
  const organizationsBulkActions: DataTableBulkAction[] = isOwner ? [] : [
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onBulkDelete,
      variant: "destructive"
    }
  ];

  const organizationsColumns: DataTableColumn<Organization>[] = [
    {
      key: "comercial_name",
      header: "Nombre Comercial",
      render: (item) => (
        <div>
          <div
            className="text-sm font-medium text-primary cursor-pointer hover:underline"
            onClick={() => onRowClick?.(item)}
          >
            {item.comercial_name}
          </div>
          <div className="text-xs text-gray-500">
            {item.legal_name}
          </div>
        </div>
      )
    },
    {
      key: "tax_id",
      header: "NIT/RUC",
      render: (item) => (
        <span className="text-xs text-gray-600 font-mono">
          {formatTaxId(item.tax_id ?? "")}
        </span>
      ),
      width: "w-24"
    },
    {
      key: "location",
      header: "Ubicación",
      render: (item) => {
        return (
          <div>
            <div className="text-xs text-gray-600 font-semibold">{item.base_country || "-"}</div>
            <div className="text-xs text-gray-500">{item.city || "-"}</div>
          </div>
        );
      },
      width: "w-32"
    },
    {
      key: "contact_email",
      header: "Contacto",
      render: (item) => (
        <span className="text-xs text-gray-600" title={item.contact_email ?? undefined}>
          {formatContactEmail(item.contact_email ?? "")}
        </span>
      ),
      width: "w-40"
    },
    {
      key: "plan_type",
      header: "Plan",
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-primary border border-gray-300">
          {getPlanTypeLabel(item.plan_type ?? "PROFESSIONAL")}
        </span>
      ),
      width: "w-28"
    },
    {
      key: "createdAt",
      header: "Fecha de Creación",
      render: (item) => (
        <span className="text-xs text-gray-600">
          {formatDate(item.created_at ?? "")}
        </span>
      ),
      width: "w-32"
    },
    {
      key: "status",
      header: "Estado",
      render: (item) => (
        <Badge
          variant="default"
          className={getOrganizationStatusBadgeClass(item.status)}
        >
          {getOrganizationStatusLabel(item.status)}
        </Badge>
      ),
      width: "w-28"
    }
  ];

  return (
    <DataTable
      data={organizations}
      columns={organizationsColumns}
      getRowId={(item) => item.id || ""}
      actions={organizationsActions}
      bulkActions={organizationsBulkActions}
      itemsPerPage={10}
      emptyMessage="No hay organizaciones para mostrar"
    />
  );
}


