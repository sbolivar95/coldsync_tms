import { Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { DialogActions } from '../../../components/widgets/DialogActions'
import type { LaneType } from '../../../types/database.types'

interface LaneTypeItemProps {
    type: LaneType
    isEditing: boolean
    editValue?: string
    onEdit: () => void
    onDelete: () => void
    onEditChange?: (value: string) => void
    onSaveEdit?: () => void
    onCancelEdit?: () => void
    disabled?: boolean
}

export function LaneTypeItem({
    type,
    isEditing,
    editValue,
    onEdit,
    onDelete,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    disabled = false
}: LaneTypeItemProps) {
    if (isEditing && editValue !== undefined) {
        const isValid = editValue.trim().length >= 2

        return (
            <div className="p-4 bg-white rounded-lg border border-primary/20 shadow-lg w-full my-1">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Nombre del Tipo de Carril</label>
                        <Input
                            value={editValue}
                            onChange={(e) => onEditChange?.(e.target.value)}
                            placeholder="Ej: Distribución Nacional"
                            autoFocus
                        />
                    </div>

                    <div className="pt-2 flex justify-end">
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
        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
            <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">
                    {type.name}
                </span>
                {type.description ? (
                    <p className="text-xs text-gray-500 line-clamp-1">
                        {type.description}
                    </p>
                ) : (
                    <p className="text-xs text-gray-400 italic">
                        Sin descripción
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
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
    )
}
