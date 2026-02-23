import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction, DataTableBulkAction } from "../../../../components/widgets/DataTable/types";
import { Badge } from "../../../../components/ui/Badge";
import { Pencil, Trash2 } from "lucide-react";
import { EntityActionsMenu } from "../../../../components/widgets/EntityActionsMenu";
import type { User } from "../../../../types/user.types";
import { getUserStatusBadgeClass, getUserStatusLabel, formatDate } from "../../../../lib/utils/user.utils";
import { mapUserRoleToLabel } from "../../../../services/database/organizationMembers.service";
import { useAppStore } from "../../../../stores/useAppStore";
import { canManageUser as canManageUserPermission } from "../../../../lib/permissions";

/**
 * Get role label for display (handles both enum values and Spanish labels)
 */
function getRoleLabel(role: string | undefined): string {
  if (!role) return "N/A";
  // If it's an enum value, convert to Spanish label
  if (role === 'OWNER' || role === 'ADMIN' || role === 'STAFF' || role === 'DRIVER' || role === 'DEV') {
    return mapUserRoleToLabel(role as any);
  }
  // Otherwise, return as is (already a label)
  return role;
}

interface UsersTabProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onBulkDelete: (userIds: string[]) => void;
  onSuspend: (user: User) => void;
  onReactivate?: (user: User) => void;
}

export function UsersTab({
  users,
  onEdit,
  onDelete,
  onBulkDelete,
  onSuspend,
  onReactivate
}: UsersTabProps) {
  const { user: currentUser, organizationMember, isPlatformUser } = useAppStore();

  // Check if a user is the current user
  const isCurrentUserCheck = (user: User) => {
    if (!currentUser?.id || !organizationMember) return false;
    // Primary check: compare by email (works for both active users and pending invitations)
    if (user.email === currentUser.email) {
      return true;
    }
    // Secondary check: if organizationMember has user_id, compare with current user id
    // Note: user.id is organization_members.id, not auth.users.id
    // We need to check if the user being viewed has the same user_id as the current user
    // This requires checking if user.id matches organizationMember.id AND organizationMember.user_id matches currentUser.id
    if (organizationMember.user_id === currentUser.id && user.id === organizationMember.id) {
      return true;
    }
    return false;
  };

  // Check if current user can manage target user
  const canManage = (targetUser: User) => {
    const isSelf = isCurrentUserCheck(targetUser);
    const targetUserRole = targetUser.role || targetUser.rol || 'STAFF';

    return canManageUserPermission(
      organizationMember?.role,
      targetUserRole,
      isPlatformUser || false,
      isSelf
    );
  };

  const usersActions: DataTableAction<User>[] = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: onEdit,
      title: "Editar",
      // Hide edit action if cannot manage user (includes self and higher/equal roles)
      hidden: (user) => !canManage(user)
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      onClick: onDelete,
      variant: "destructive",
      title: "Eliminar",
      // Hide delete action if cannot manage user (includes self and higher/equal roles)
      hidden: (user) => !canManage(user)
    },
    {
      icon: (user) => (
        <EntityActionsMenu
          entity={user}
          status={user.status || user.estado || ""}
          onSuspend={onSuspend}
          onReactivate={onReactivate}
        />
      ),
      onClick: () => { }, // No-op since the menu handles its own clicks
      title: "Más acciones",
      // Hide suspend/reactivate actions if cannot manage user (includes self and higher/equal roles)
      hidden: (user) => !canManage(user)
    }
  ];

  const usersBulkActions: DataTableBulkAction[] = [
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onBulkDelete,
      variant: "destructive"
    }
  ];

  const usersColumns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-primary">
            {item.firstName || item.nombre} {item.lastName || item.apellido}
          </div>
          <div className="text-xs text-gray-500">{item.email || item.correo}</div>
        </div>
      )
    },
    {
      key: "role",
      header: "Rol",
      render: (item) => (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs"
        >
          {getRoleLabel(item.role || item.rol)}
        </Badge>
      ),
      width: "w-24"
    },
    {
      key: "createdAt",
      header: "Fecha de Creación",
      render: (item) => (
        <span className="text-xs text-gray-600">
          {formatDate(item.createdAt || item.creado)}
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
          className={getUserStatusBadgeClass(item.status || item.estado || "Inactivo")}
        >
          {getUserStatusLabel(item.status || item.estado || "Inactivo")}
        </Badge>
      ),
      width: "w-28"
    }
  ];

  return (
    <DataTable
      data={users}
      columns={usersColumns}
      getRowId={(item) => item.id || ""}
      actions={usersActions}
      bulkActions={usersBulkActions}
      itemsPerPage={10}
      emptyMessage="No hay usuarios para mostrar"
    />
  );
}


