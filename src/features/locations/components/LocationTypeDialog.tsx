import { EntityDialog } from '../../../components/widgets/EntityDialog'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '../../../components/ui/Form'
import { LocationTypeFormFields } from './LocationTypeFormFields'
import { locationTypeSchema, type LocationTypeFormData, type LocationType, type StopType } from './locationType.types'

interface LocationTypeDialogProps {
  open: boolean
  onClose: () => void
  locationType?: LocationType
  allowedStopTypes: StopType[]
  onSave: (
    locationType: Omit<LocationType, 'id' | 'created_at' | 'org_id'>
  ) => void
}

/**
 * LocationTypeDialog - Form dialog for creating/editing location types
 * Now uses the shared LocationTypeFormFields
 */
export function LocationTypeDialog({
  open,
  onClose,
  locationType,
  allowedStopTypes,
  onSave,
}: LocationTypeDialogProps) {
  const form = useForm<LocationTypeFormData>({
    resolver: zodResolver(locationTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      allowedStopTypes: [],
    },
  })

  // Reset form when locationType changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: locationType?.name || '',
        description: locationType?.description || '',
        allowedStopTypes: locationType?.allowed_stop_types || [],
      })
    }
  }, [open, locationType, form])

  const handleSave = (data: LocationTypeFormData) => {
    onSave({
      name: data.name,
      description: data.description || undefined,
      allowed_stop_types: data.allowedStopTypes as StopType[],
    })
    onClose()
  }

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={locationType ? 'Editar Tipo de Ubicación' : 'Agregar Tipo de Ubicación'}
      description={
        locationType
          ? 'Modifica los detalles del tipo de ubicación existente'
          : 'Define un nuevo tipo de ubicación para gestionar en las rutas'
      }
      onSave={form.handleSubmit(handleSave)}
      disableSave={!form.formState.isValid}
      isEdit={!!locationType}
      maxWidth='max-w-xl'
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)}>
          <LocationTypeFormFields allowedStopTypes={allowedStopTypes} />
        </form>
      </Form>
    </EntityDialog>
  )
}