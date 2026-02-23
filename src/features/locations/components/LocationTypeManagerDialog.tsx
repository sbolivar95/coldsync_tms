import { useState, useCallback, useMemo } from 'react'
import { Search, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { EntityDialog } from '../../../components/widgets/EntityDialog'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Form } from '../../../components/ui/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LocationTypeItem } from './LocationTypeItem'
import { LocationTypeFormFields } from './LocationTypeFormFields'
import { locationTypeSchema, type LocationTypeFormData, type StopType, type LocationType } from './locationType.types'

export type ViewMode = 'list' | 'create' | 'edit' | 'delete'

export interface LocationTypeManagerDialogProps {
  locationTypes: LocationType[]
  allowedStopTypes: StopType[]
  onClose: () => void
  onCreate: (data: Omit<LocationType, 'id' | 'created_at' | 'org_id'>) => Promise<void>
  onUpdate: (id: number, data: Partial<Omit<LocationType, 'id' | 'created_at' | 'org_id'>>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  loading?: boolean
  height?: string
}

export function LocationTypeManagerDialog({
  locationTypes,
  allowedStopTypes,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  loading = false,
  height = '440px',
}: LocationTypeManagerDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedType, setSelectedType] = useState<LocationType | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form for create/edit
  const form = useForm<LocationTypeFormData>({
    resolver: zodResolver(locationTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      allowedStopTypes: [],
    },
  })

  const filteredTypes = useMemo(() => locationTypes.filter(type =>
    searchQuery === '' ||
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [locationTypes, searchQuery])

  const handleBack = useCallback(() => {
    setViewMode('list')
    setSelectedType(undefined)
    form.reset({ name: '', description: '', allowedStopTypes: [] })
  }, [form])

  const startCreate = useCallback(() => {
    setViewMode('create')
    form.reset({ name: '', description: '', allowedStopTypes: [] })
  }, [form])

  const startEdit = useCallback((type: LocationType) => {
    setSelectedType(type)
    setViewMode('edit')
    form.reset({
      name: type.name,
      description: type.description || '',
      allowedStopTypes: type.allowed_stop_types,
    })
  }, [form])

  const startDelete = useCallback((type: LocationType) => {
    setSelectedType(type)
    setViewMode('delete')
  }, [])

  const handleSave = async (data: LocationTypeFormData) => {
    try {
      setIsSubmitting(true)
      const payload = {
        name: data.name,
        description: data.description || undefined,
        allowed_stop_types: data.allowedStopTypes as StopType[],
      }

      if (viewMode === 'edit' && selectedType) {
        await onUpdate(selectedType.id, payload)
      } else {
        await onCreate(payload)
      }
      handleBack()
    } catch (error) {
      // Error is handled by the hook/service and toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedType) return
    try {
      setIsSubmitting(true)
      await onDelete(selectedType.id)
      handleBack()
    } catch (error) {
      // Error is handled by the hook/service and toast
    } finally {
      setIsSubmitting(false)
    }
  }

  // Configuración dinámica del diálogo basada en el modo
  const dialogConfig = useMemo(() => {
    switch (viewMode) {
      case 'create':
        return {
          title: 'Agregar Tipo de Ubicación',
          description: 'Define un nuevo tipo de ubicación para gestionar en las rutas',
          saveLabel: 'Guardar',
          cancelLabel: 'Cancelar',
          onSave: form.handleSubmit(handleSave),
          onCancel: handleBack,
          disableSave: !form.formState.isValid || isSubmitting,
          variant: 'default' as const
        }
      case 'edit':
        return {
          title: (
            <>
              Editar <span className="font-bold">{selectedType?.name}</span>
            </>
          ),
          description: 'Modifica los detalles del tipo de ubicación existente',
          saveLabel: 'Guardar',
          cancelLabel: 'Cancelar',
          onSave: form.handleSubmit(handleSave),
          onCancel: handleBack,
          disableSave: !form.formState.isValid || isSubmitting,
          variant: 'default' as const
        }
      case 'delete':
        return {
          title: (
            <>
              ¿Eliminar <span className="font-bold">{selectedType?.name}</span>?
            </>
          ),
          description: 'Esta acción es irreversible. No podrá utilizarse en nuevas ubicaciones.',
          saveLabel: 'Sí, Eliminar',
          cancelLabel: 'No, Cancelar',
          onSave: handleConfirmDelete,
          onCancel: handleBack,
          disableSave: isSubmitting,
          variant: 'destructive' as const
        }
      default:
        return {
          title: 'Gestionar Tipos de Ubicación',
          description: 'Configure tipos de ubicación y sus roles operativos permitidos',
          saveLabel: 'Listo',
          cancelLabel: 'Cerrar',
          onSave: onClose,
          onCancel: onClose,
          disableSave: false,
          variant: 'default' as const
        }
    }
  }, [viewMode, selectedType, form, isSubmitting, handleSave, handleConfirmDelete, handleBack, onClose])

  return (
    <EntityDialog
      open={true}
      onClose={onClose}
      title={dialogConfig.title}
      description={dialogConfig.description}
      showBackButton={viewMode !== 'list'}
      onBack={handleBack}
      maxWidth="max-w-xl"
      onSave={dialogConfig.onSave}
      onCancel={dialogConfig.onCancel}
      saveLabel={dialogConfig.saveLabel}
      cancelLabel={dialogConfig.cancelLabel}
      disableSave={dialogConfig.disableSave}
      variant={dialogConfig.variant}
    >
      <div className="flex flex-col gap-4 relative" style={{ height }}>
        {(loading || isSubmitting) && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-md">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {viewMode === 'list' && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar tipos de ubicación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={startCreate}
                size="sm"
                className="bg-primary hover:bg-primary80 text-white"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </Button>
            </div>

            {/* Lista de Tipos */}
            <div className="border border-gray-300 rounded-md flex-1 min-h-0 overflow-y-auto">
              {filteredTypes.length === 0 ? (
                <div className="p-4 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-xs text-gray-400 italic">
                    {searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'No hay tipos de ubicación configurados'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTypes.map(type => (
                    <LocationTypeItem
                      key={type.id}
                      type={type}
                      isEditing={false}
                      availableRoles={allowedStopTypes}
                      onEdit={() => startEdit(type)}
                      onDelete={() => startDelete(type)}
                      disabled={loading || isSubmitting}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer Information */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Selecciona uno o más roles operativos para cada tipo de ubicación
              </p>
              <p className="text-xs text-gray-600">
                {filteredTypes.length} tipos en total
              </p>
            </div>
          </>
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="py-2">
              <LocationTypeFormFields allowedStopTypes={allowedStopTypes} />
            </form>
          </Form>
        )}

        {viewMode === 'delete' && selectedType && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-gray-900">Confirmar eliminación</h4>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 flex gap-3 text-left">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">
                ¿Estás seguro de que deseas eliminar el tipo de Ubicación <span className="font-semibold">{selectedType.name}</span>? Esta acción es irreversible.
              </p>
            </div>
          </div>
        )}
      </div>
    </EntityDialog>
  )
}