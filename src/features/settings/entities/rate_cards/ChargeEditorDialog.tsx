import { EntityDialog } from '../../../../components/widgets/EntityDialog'
import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  rateCardChargeSchema,
  rateCardChargeBreakSchema,
  type RateCardChargeFormData,
} from '../../../../lib/schemas/rateCard.schemas'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/Form'
import { Input } from '../../../../components/ui/Input'
import { SmartSelect } from '../../../../components/widgets/SmartSelect'
import { Button } from '../../../../components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'
import { Checkbox } from '../../../../components/ui/Checkbox'
import { validateChargeBreaks } from '../../../../lib/utils/rateCard.utils'

interface ChargeEditorDialogProps {
  open: boolean
  onClose: () => void
  charge?: RateCardChargeFormData
  onSave: (charge: RateCardChargeFormData) => void
}

const chargeTypeOptions = [
  { value: 'FREIGHT', label: 'Flete' },
  { value: 'DISTANCE', label: 'Distancia' },
  { value: 'FUEL', label: 'Combustible' },
]

const rateBasisOptions = [
  { value: 'FLAT', label: 'Fijo' },
  { value: 'PER_TN', label: 'Por Tonelada' },
  { value: 'PER_KM', label: 'Por Kilómetro' },
  { value: 'PERCENTAGE', label: 'Porcentaje' },
]

/**
 * ChargeEditorDialog - Dialog for editing a single charge and its breaks
 */
export function ChargeEditorDialog({
  open,
  onClose,
  charge,
  onSave,
}: ChargeEditorDialogProps) {
  const form = useForm<RateCardChargeFormData>({
    resolver: zodResolver(rateCardChargeSchema),
    mode: 'onChange', // Validate on change to show errors immediately
    defaultValues: {
      charge_type: 'FREIGHT',
      rate_basis: 'FLAT',
      value: 0,
      label: null,
      sort_order: 0,
      is_active: true,
      apply_before_pct: true,
      breaks: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'breaks',
  })

  const rateBasis = form.watch('rate_basis')
  const breaks = form.watch('breaks')

  // Reset form when charge changes or dialog opens
  useEffect(() => {
    if (open) {
      if (charge) {
        form.reset(charge)
      } else {
        form.reset({
          charge_type: 'FREIGHT',
          rate_basis: 'FLAT',
          value: 0,
          label: null,
          sort_order: 0,
          is_active: true,
          apply_before_pct: true,
          breaks: [],
        })
      }
    }
  }, [open, charge, form])

  // Validate breaks when they change
  useEffect(() => {
    if (breaks && breaks.length > 0) {
      const validation = validateChargeBreaks(breaks)
      if (!validation.valid) {
        form.setError('breaks', { message: validation.error })
      } else {
        form.clearErrors('breaks')
      }
    }
  }, [breaks, form])

  const handleSave = (data: RateCardChargeFormData) => {
    onSave(data)
    onClose()
  }

  const handleAddBreak = () => {
    const existingBreaks = form.getValues('breaks') || []
    const lastBreak = existingBreaks[existingBreaks.length - 1]
    const minValue = lastBreak ? (lastBreak.max_value || lastBreak.min_value + 10) : 0

    append({
      min_value: minValue,
      max_value: null,
      rate_value: 0,
    })
  }

  const handleDeleteBreak = (index: number) => {
    remove(index)
  }

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={charge ? 'Editar Cargo' : 'Agregar Cargo'}
      description="Configura el tipo de cargo, base de cálculo y valor"
      onSave={form.handleSubmit(handleSave)}
      disableSave={!form.formState.isValid}
      maxWidth="max-w-2xl"
    >
      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Charge Type */}
            <FormField
              control={form.control}
              name="charge_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">
                    Tipo de Cargo <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <SmartSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={chargeTypeOptions}
                      placeholder="Seleccionar tipo"
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Rate Basis */}
            <FormField
              control={form.control}
              name="rate_basis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">
                    Base de Cálculo <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <SmartSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={rateBasisOptions}
                      placeholder="Seleccionar base"
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Value */}
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">
                    Valor <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Label */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">Etiqueta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Cargo base de ruta"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Apply Before Percentage */}
            <FormField
              control={form.control}
              name="apply_before_pct"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-medium text-gray-700">
                      Aplicar antes de porcentajes
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-medium text-gray-700">Activo</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Breaks Section (only for PER_TN) */}
          {rateBasis === 'PER_TN' && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Escalones de Peso</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBreak}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Agregar Escalón
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500 border border-gray-200 rounded-md">
                  No hay escalones configurados. Agrega al menos uno para tarifas por tonelada.
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 items-end border border-gray-200 rounded-md p-3 bg-gray-50"
                    >
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`breaks.${index}.min_value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">
                                Desde (Tn)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`breaks.${index}.max_value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">
                                Hasta (Tn)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Sin límite"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`breaks.${index}.rate_value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">
                                Tarifa
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-600"
                          onClick={() => handleDeleteBreak(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.formState.errors.breaks && (
                <p className="text-xs text-red-600">{form.formState.errors.breaks.message}</p>
              )}
            </div>
          )}
        </div>
      </Form>
    </EntityDialog>
  )
}
