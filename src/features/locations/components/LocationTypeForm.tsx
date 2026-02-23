import { Input } from '../../../components/ui/Input'
import { DialogActions } from '../../../components/widgets/DialogActions'
import { LocationTypeRoleSelector } from './LocationTypeRoleSelector'
import { type StopType } from './locationType.types'

interface LocationTypeFormProps {
  name: string
  description: string
  allowedStopTypes: StopType[]
  availableRoles: StopType[]
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onToggleRole: (role: StopType) => void
  onCancel: () => void
  onSave: () => void
  autoFocus?: boolean
}

export function LocationTypeForm({
  name,
  description,
  allowedStopTypes,
  availableRoles,
  onNameChange,
  onDescriptionChange,
  onToggleRole,
  onCancel,
  onSave,
  autoFocus = false
}: LocationTypeFormProps) {
  const isValid = name.trim() && allowedStopTypes.length > 0

  return (
    <div className="border rounded-md p-3 bg-gray-50/50">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Nombre</label>
            <Input
              placeholder="Nombre del tipo"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus={autoFocus}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground ml-1">Descripción</label>
          <Input
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground ml-1">Roles permitidos</label>
          <LocationTypeRoleSelector
            selectedRoles={allowedStopTypes}
            availableRoles={availableRoles}
            onToggleRole={onToggleRole}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <DialogActions
            onCancel={onCancel}
            onSave={onSave}
            disableSave={!isValid}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
