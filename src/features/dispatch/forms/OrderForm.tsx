import { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Hooks
import { useAppStore } from '../../../stores/useAppStore'
import { useLanes } from '../../lanes/hooks/useLanes'
import { useDispatchOrders } from '../hooks/useDispatchOrders'

// Services
import { productsService, productThermalProfilesService } from '../../../services/database/products.service'
import { thermalProfilesService } from '../../../services/database/thermalProfiles.service'

// Schema and types
import {
  createDispatchOrderSchema,
  createDispatchOrderDefaults,
  type CreateDispatchOrderFormData,
} from '../schemas/dispatchOrder.schema'
import type { Product, ThermalProfile } from '../../../types/database.types'

// Components
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Textarea } from '../../../components/ui/Textarea'
import { DropdownSelect } from '../../../components/widgets/DropdownSelect'
// import { DatePicker } from '../../../components/widgets/DatePicker'
// import { TimePicker } from '../../../components/widgets/TimePicker'
import { Button } from '../../../components/ui/Button'
import { ProductsSection } from './ProductsSection'
import { SchedulingSection } from './SchedulingSection'

interface OrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  // Auth context
  const user = useAppStore((state) => state.user)
  const organization = useAppStore((state) => state.organization)
  const orgId = organization?.id

  // Data hooks
  const { lanes, isLoading: lanesLoading } = useLanes()
  const { createDispatchOrder } = useDispatchOrders(orgId)

  // Local state
  const [products, setProducts] = useState<Product[]>([])
  const [productThermalMap, setProductThermalMap] = useState<Map<number, number>>(new Map())
  const [thermalProfiles, setThermalProfiles] = useState<ThermalProfile[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timePreference, setTimePreference] = useState<'no-preference' | 'specific-time' | 'time-window'>('no-preference')
  const [specificTime, setSpecificTime] = useState('')

  // React Hook Form
  const form = useForm<CreateDispatchOrderFormData>({
    resolver: zodResolver(createDispatchOrderSchema),
    defaultValues: {
      ...createDispatchOrderDefaults,
      quantity: 1,
      pickup_window_start: null,
      pickup_window_end: null,
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form

  // Watch items to auto-determine configuration
  const compartments = watch('compartments')
  const configuration = compartments && compartments.length > 1 ? 'hybrid' : 'standard'
  const isHybrid = configuration === 'hybrid'

  // Field array for items
  const { fields: compartmentFields, append: appendCompartment, remove: removeCompartment } = useFieldArray({
    control,
    name: 'compartments',
  })

  // Load products, thermal profiles, and their mappings
  useEffect(() => {
    if (orgId) {
      setIsLoadingData(true)
      Promise.all([
        productsService.getAll(orgId),
        thermalProfilesService.getAll(orgId),
      ])
        .then(async ([productsData, profilesData]) => {
          const activeProducts = productsData.filter((p) => p.is_active)
          setThermalProfiles(profilesData.filter((p) => p.is_active))

          // Build product → thermal profile mapping
          const thermalMap = new Map<number, number>()
          for (const product of activeProducts) {
            try {
              const productThermals = await productThermalProfilesService.getByProductId(product.id, orgId)
              if (productThermals && productThermals.length > 0) {
                const firstProfile = productThermals[0]?.thermal_profile
                if (firstProfile) {
                  thermalMap.set(product.id, firstProfile.id)
                }
              }
            } catch {
              // Product has no thermal profile linked, skip
            }
          }

          setProductThermalMap(thermalMap)
          setProducts(activeProducts)
        })
        .catch((error) => {
          console.error('Error loading form data:', error)
          toast.error('Error al cargar datos del formulario')
        })
        .finally(() => {
          setIsLoadingData(false)
        })
    }
  }, [orgId])

  // Reset form
  useEffect(() => {
    reset({
      ...createDispatchOrderDefaults,
      quantity: 1,
      pickup_window_start: null,
      pickup_window_end: null,
      compartments: [{ product_id: 0, weight_tn: 0 }],
    })
  }, [reset])

  // Handle product selection
  const handleProductChange = (productId: number, index: number) => {
    setValue(`compartments.${index}.product_id`, productId)
  }

  // Handle time preference change
  const handleTimePreferenceChange = (value: string) => {
    const preference = value as 'no-preference' | 'specific-time' | 'time-window'
    setTimePreference(preference)

    if (preference === 'no-preference') {
      setValue('pickup_window_start', null)
      setValue('pickup_window_end', null)
      setSpecificTime('')
    } else if (preference === 'specific-time') {
      setValue('pickup_window_start', null)
      setValue('pickup_window_end', null)
    } else {
      setSpecificTime('')
    }
  }

  // Handle specific time change
  const handleSpecificTimeChange = (time: string) => {
    setSpecificTime(time)
    if (time) {
      setValue('pickup_window_start', time)
      setValue('pickup_window_end', time)
    } else {
      setValue('pickup_window_start', null)
      setValue('pickup_window_end', null)
    }
  }

  // Build options
  const routeOptions = lanes.map((lane) => ({
    value: lane.id,
    label: lane.lane_id || lane.name || `Carril ${lane.id.slice(0, 8)}`,
  }))

  // Form submission
  const onSubmit = async (data: CreateDispatchOrderFormData) => {
    if (!user?.id || !organization?.comercial_name) {
      toast.error('Sesión no válida')
      return
    }

    setIsSubmitting(true)

    try {
      await createDispatchOrder(data, user.id, organization.comercial_name)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating dispatch order:', error)
      // Toast is shown by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = lanesLoading || isLoadingData

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Cargando...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Route & Quantity */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 120px' }}>
        <div>
          <Label htmlFor="route" className="text-sm text-gray-700 mb-2 block">
            Ruta <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="lane_id"
            control={control}
            render={({ field }) => (
              <DropdownSelect
                id="route"
                options={routeOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Seleccionar ruta"
              />
            )}
          />
          {errors.lane_id && (
            <p className="text-xs text-red-500 mt-1">{errors.lane_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="quantity" className="text-sm text-gray-700 mb-2 block">
            Cantidad <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <Input
                id="quantity"
                type="number"
                min="1"
                max="50"
                value={field.value}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                placeholder="1"
                className="h-10"
              />
            )}
          />
          {errors.quantity && (
            <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      {/* Products Section */}
      <ProductsSection
        control={control}
        compartmentFields={compartmentFields}
        appendCompartment={appendCompartment}
        removeCompartment={removeCompartment}
        products={products}
        productThermalMap={productThermalMap}
        thermalProfiles={thermalProfiles}
        isHybrid={isHybrid}
        onProductChange={handleProductChange}
        errors={errors}
      />

      {/* Scheduling Section */}
      <SchedulingSection
        control={control}
        timePreference={timePreference}
        specificTime={specificTime}
        onTimePreferenceChange={handleTimePreferenceChange}
        onSpecificTimeChange={handleSpecificTimeChange}
        errors={errors}
      />

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="text-sm text-gray-700 mb-2 block">
          Notas Adicionales
        </Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea
              id="notes"
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Agrega información adicional sobre la orden..."
              rows={3}
              className="resize-none"
            />
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creando...' : 'Crear Orden'}
        </Button>
      </div>
    </form>
  )
}
