import { EntityDialog } from '../../../../components/widgets/EntityDialog'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Badge } from '../../../../components/ui/Badge'
import { Checkbox } from '../../../../components/ui/Checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/Form'
import { Input } from '../../../../components/ui/Input'
import type { Product, ThermalProfile } from '../../../../types/database.types'

// Zod schema for validation
const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  thermalProfileIds: z.array(z.number()).min(1, 'Selecciona al menos un perfil térmico'),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductDialogProps {
  open: boolean
  onClose: () => void
  product?: Product
  thermalProfiles: ThermalProfile[]
  productThermalProfileIds?: number[]
  onSave: (
    product: Omit<Product, 'id' | 'org_id' | 'created_at' | 'updated_at'> & {
      thermalProfileIds: number[]
    }
  ) => void
}

/**
 * ProductDialog - Form dialog for creating/editing products with thermal profiles
 * Uses React Hook Form + Zod for validation as per project rules
 */
export function ProductDialog({
  open,
  onClose,
  product,
  thermalProfiles,
  productThermalProfileIds = [],
  onSave,
}: ProductDialogProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      thermalProfileIds: [],
    },
  })

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name || '',
        description: product?.description || '',
        thermalProfileIds: productThermalProfileIds || [],
      })
    }
  }, [open, product, productThermalProfileIds, form])

  const handleProfileToggle = (profileId: number) => {
    const currentIds = form.getValues('thermalProfileIds')
    const newIds = currentIds.includes(profileId)
      ? currentIds.filter((id) => id !== profileId)
      : [...currentIds, profileId]

    form.setValue('thermalProfileIds', newIds)
  }

  const handleSave = (data: ProductFormData) => {
    onSave({
      name: data.name,
      description: data.description || null,
      is_active: product?.is_active ?? true,
      thermalProfileIds: data.thermalProfileIds,
    })
    onClose()
  }

  const watchedProfiles = form.watch('thermalProfileIds')

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={product ? 'Editar Producto' : 'Agregar Producto'}
      description={
        product
          ? 'Modifica los detalles del producto existente'
          : 'Define un nuevo producto para gestionar en la cadena de frío'
      }
      onSave={form.handleSubmit(handleSave)}
      disableSave={!form.formState.isValid}
      isEdit={!!product}
      maxWidth='max-w-xl'
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Nombre del Producto */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">
                  Nombre del Producto <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="nombre-producto"
                    placeholder="Ej: Vacuna COVID-19 Pfizer"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">
                  Descripción <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    placeholder="Describe las características del producto..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-h-[70px] resize-none"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Perfiles Térmicos */}
          <FormField
            control={form.control}
            name="thermalProfileIds"
            render={() => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">
                  Perfiles Térmicos <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="border border-gray-300 rounded-md max-h-[200px] overflow-y-auto">
                    {thermalProfiles.filter((p) => p.is_active).length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {thermalProfiles
                          .filter((p) => p.is_active)
                          .map((perfil) => {
                            const checkboxId = `thermal-profile-${perfil.id}`
                            return (
                              <label
                                key={perfil.id}
                                htmlFor={checkboxId}
                                className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <Checkbox
                                  id={checkboxId}
                                  checked={watchedProfiles.includes(perfil.id)}
                                  onCheckedChange={() => handleProfileToggle(perfil.id)}
                                  className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-medium text-gray-900">
                                      {perfil.name}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="bg-primary-light text-primary hover:bg-primary-light text-xs"
                                    >
                                      {perfil.temp_min_c}°C a {perfil.temp_max_c}°C
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    {perfil.description || 'Sin descripción'}
                                  </p>
                                </div>
                              </label>
                            )
                          })}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-400 italic">
                          No hay perfiles térmicos disponibles. Crea uno primero.
                        </p>
                      </div>
                    )}
                  </div>
                </FormControl>
                <p className="text-xs text-gray-500 mt-1.5">
                  Selecciona uno o más perfiles térmicos compatibles con este producto
                </p>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </EntityDialog>
  )
}
