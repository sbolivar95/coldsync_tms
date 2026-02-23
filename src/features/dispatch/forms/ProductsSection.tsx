import { Control, FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { DropdownSelect } from '../../../components/widgets/DropdownSelect'
import type { CreateDispatchOrderFormData } from '../schemas/dispatchOrder.schema'
import type { Product, ThermalProfile } from '../../../types/database.types'

interface ProductsSectionProps {
  control: Control<CreateDispatchOrderFormData>
  compartmentFields: any[]
  appendCompartment: (value: any) => void
  removeCompartment: (index: number) => void
  products: Product[]
  productThermalMap: Map<number, number>
  thermalProfiles: ThermalProfile[]
  isHybrid: boolean
  onProductChange: (productId: number, index: number) => void
  errors: FieldErrors<CreateDispatchOrderFormData>
}

export function ProductsSection({
  control,
  compartmentFields,
  appendCompartment,
  removeCompartment,
  products,
  productThermalMap,
  thermalProfiles,
  isHybrid,
  onProductChange,
  errors,
}: ProductsSectionProps) {
  // Build product options
  const productOptions = products.map((product) => ({
    value: product.id.toString(),
    label: product.name,
  }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium text-gray-900">
            Productos <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              {isHybrid ? (
                <>
                  <span className="font-medium text-blue-600">Configuración Híbrida</span>
                  {' - '}
                  Cada producto requiere su propio compartimiento con perfil térmico
                </>
              ) : (
                <>
                  <span className="font-medium text-green-600">Configuración Standard</span>
                  {' - '}
                  Un solo perfil térmico compartido
                </>
              )}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendCompartment({ product_id: 0, thermal_profile_id: 0, weight_tn: 0 })}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </Button>
      </div>

      {compartmentFields.length > 0 ? (
        <div className="space-y-3">
          {compartmentFields.map((field, index) => {
            const productId = field.product_id
            const thermalProfileId = productId ? productThermalMap.get(productId) : undefined

            return (
              <div
                key={field.id}
                className={`border rounded-lg p-4 space-y-3 ${isHybrid ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {isHybrid ? `Compartimiento ${index + 1}` : `Producto ${index + 1}`}
                  </span>
                  {compartmentFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompartment(index)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 120px' }}>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1.5 block">
                      Producto <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name={`compartments.${index}.product_id`}
                      control={control}
                      render={({ field: itemField }) => (
                        <DropdownSelect
                          options={productOptions}
                          value={itemField.value?.toString() || ''}
                          onChange={(value) => onProductChange(parseInt(value), index)}
                          placeholder="Seleccionar producto"
                        />
                      )}
                    />
                    {productId && thermalProfileId && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Perfil térmico: {thermalProfiles.find(p => p.id === thermalProfileId)?.name || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1.5 block">
                      Peso (Tn) <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name={`compartments.${index}.weight_tn`}
                      control={control}
                      render={({ field: itemField }) => (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemField.value || ''}
                          onChange={(e) =>
                            itemField.onChange(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="h-10"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
          No hay productos. Agrega al menos uno.
        </div>
      )}

      {errors.compartments && (
        <p className="text-xs text-red-500">{errors.compartments.message}</p>
      )}
    </div>
  )
}
