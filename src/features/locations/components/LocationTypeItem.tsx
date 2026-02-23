import { Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Input } from '../../../components/ui/Input'
import { DialogActions } from '../../../components/widgets/DialogActions'
import { LocationTypeRoleSelector } from './LocationTypeRoleSelector'
import { type LocationType, type StopType } from './locationType.types'

const STOP_TYPE_LABELS: Record<StopType, string> = {
  PICKUP: 'Recogida',
  DROP_OFF: 'Entrega',
  MANDATORY_WAYPOINT: 'Punto Obligatorio',
  OPTIONAL_WAYPOINT: 'Punto Opcional'
}

interface LocationTypeItemProps {
  type: LocationType
  isEditing: boolean
  editValues?: {
    name: string
    description: string
    allowed_stop_types: StopType[]
  }
  availableRoles: StopType[]
  onEdit: () => void
  onDelete: () => void
  onEditNameChange?: (value: string) => void
  onEditDescriptionChange?: (value: string) => void
  onEditToggleRole?: (role: StopType) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  disabled?: boolean
}

export function LocationTypeItem({
  type,
  isEditing,
  editValues,
  availableRoles,
  onEdit,
  onDelete,
  onEditNameChange,
  onEditDescriptionChange,
  onEditToggleRole,
  onSaveEdit,
  onCancelEdit,
  disabled = false
}: LocationTypeItemProps) {
  if (isEditing && editValues) {
    const isValid = editValues.name.trim() && editValues.allowed_stop_types.length > 0

    return (
      <div className="p-4 bg-white rounded-lg border border-primary/20 shadow-lg w-full my-1">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Nombre</label>
              <Input
                value={editValues.name}
                onChange={(e) => onEditNameChange?.(e.target.value)}
                placeholder="Nombre del tipo"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Descripción</label>
            <Input
              value={editValues.description}
              onChange={(e) => onEditDescriptionChange?.(e.target.value)}
              placeholder="Descripción (opcional)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">Roles permitidos</label>
            <LocationTypeRoleSelector
              selectedRoles={editValues.allowed_stop_types}
              availableRoles={availableRoles}
              onToggleRole={(role) => onEditToggleRole?.(role)}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <DialogActions
              onCancel={() => onCancelEdit?.()}
              onSave={() => onSaveEdit?.()}
              disableSave={!isValid}
              size="sm"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {type.name}
          </span>

          <div className="flex items-center gap-1 ml-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              disabled={disabled}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {type.description ? (
          <p className="text-xs text-gray-500 mb-3 line-clamp-1">
            {type.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic mb-3">
            Sin descripción
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {type.allowed_stop_types.filter(role => role && STOP_TYPE_LABELS[role]).length > 0 ? (
            type.allowed_stop_types.filter(role => role && STOP_TYPE_LABELS[role]).map(role => (
              <Badge
                key={role}
                variant="secondary"
                className="bg-slate-100 text-slate-700 border-0 font-medium px-2.5 py-0.5"
              >
                {STOP_TYPE_LABELS[role]}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">Sin roles asignados</span>
          )}
        </div>
      </div>
    </div>
  )
}
