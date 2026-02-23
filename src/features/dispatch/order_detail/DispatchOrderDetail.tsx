import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DetailFooter } from '../../../components/widgets/DetailFooter'
import { ScrollArea } from '../../../components/ui/ScrollArea'
import { toast } from 'sonner'
import { InformationTab } from './tabs/InformationTab'
import type { DispatchOrder } from '../../../types/dispatch.types'
import {
  createDispatchOrderSchema,
  type CreateDispatchOrderFormData,
} from '../schemas/dispatchOrder.schema'
import { useAppStore } from '../../../stores/useAppStore'
import { useDispatchOrders } from '../hooks/useDispatchOrders'
import { useFormChanges } from '../../../hooks/useFormChanges'

interface DispatchOrderDetailProps {
  onBack: () => void;
  onSave?: (order: DispatchOrder) => void;
}

/**
 * DispatchOrderDetail - Componente para CREAR nuevas órdenes de despacho
 * 
 * NOTA: La edición y visualización se realiza en el DispatchDrawer.
 * Este componente es exclusivamente para creación de nuevas órdenes.
 */
export function DispatchOrderDetail({ onBack, onSave }: DispatchOrderDetailProps) {
  const organization = useAppStore((state) => state.organization)
  const user = useAppStore((state) => state.user)
  const organizationId = organization?.id
  const userId = user?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const { createDispatchOrder } = useDispatchOrders(organizationId)

  // Single form instance for creation
  const form = useForm<CreateDispatchOrderFormData>({
    resolver: zodResolver(createDispatchOrderSchema) as any,
    defaultValues: {
      configuration: 'standard',
      lane_id: '',
      quantity: 1,
      planned_date: new Date(),
      pickup_window_start: null,
      pickup_window_end: null,
      notes: '',
      compartments: [{
        product_id: 0,
        thermal_profile_id: 0,
        weight_tn: 0
      }],
    },
    mode: "onChange"
  })

  const [originalData] = useState<CreateDispatchOrderFormData>({
    configuration: 'standard',
    lane_id: '',
    quantity: 1,
    planned_date: new Date(),
    pickup_window_start: null,
    pickup_window_end: null,
    notes: '',
    compartments: [{
      product_id: 0,
      thermal_profile_id: 0,
      weight_tn: 0
    }],
  })

  const { hasChanges } = useFormChanges(form as any, originalData, "create")

  const handleSave = async () => {
    if (!organizationId || !userId) {
      toast.error('No hay organización o usuario seleccionado')
      return
    }

    const isValid = await form.trigger()
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setIsSubmitting(true)
    setJustSaved(false)

    try {
      const values = form.getValues()

      const createdOrders = await createDispatchOrder(
        values,
        userId,
        organization?.name || 'ORG'
      )

      if (createdOrders.length > 0 && onSave) {
        await onSave(createdOrders[0])
      } else {
        onBack()
      }
    } catch (error) {
      console.error('Error creating order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la orden'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onBack()
  }

  return (
    <FormProvider {...form}>
      <div className='flex flex-col h-full'>
        <div className='flex-1 overflow-hidden'>
          <ScrollArea className="h-full">
            <div className='p-6 bg-gray-50 pb-24'>
              <div className='max-w-6xl mx-auto'>
                <InformationTab />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          justSaved={justSaved}
          saveLabel='Crear Orden'
          showFooter={true}
        />
      </div>
    </FormProvider>
  )
}
