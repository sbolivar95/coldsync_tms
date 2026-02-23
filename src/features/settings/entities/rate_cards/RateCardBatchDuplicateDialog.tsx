import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDownIcon } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/Form'
import { EntityDialog } from '../../../../components/widgets/EntityDialog'
import { Checkbox } from '../../../../components/ui/Checkbox'
import { Card } from '../../../../components/ui/Card'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/Popover'
import { cn } from '../../../../lib/utils'

/** Same look as SelectTrigger (lanes / rate card detail) for multi-select dropdowns */
const selectTriggerClass =
  'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4'
import type { RateCardWithCharges } from '../../../../services/database/rateCards.service'
import type { Lane } from '../../../../types/database.types'
import type { Carrier } from '../../../../types/database.types'
import { formatChargeType, formatDateRange } from '../../../../lib/utils/rateCard.utils'

const batchDuplicateSchema = z.object({
  lane_ids: z.array(z.string()).min(1, 'Selecciona al menos un carril'),
  carrier_ids: z.array(z.union([z.number(), z.null()])).min(1, 'Selecciona al menos un transportista'),
})

type BatchDuplicateFormData = z.infer<typeof batchDuplicateSchema>

interface ThermalModifierFormData {
  thermal_profile_id: number
  modifier_type: 'MULTIPLIER' | 'FIXED_ADD'
  value: number
}

interface RateCardBatchDuplicateDialogProps {
  open: boolean
  onClose: () => void
  sourceRateCard: RateCardWithCharges
  sourceThermalModifiers: ThermalModifierFormData[]
  lanes: Lane[]
  carriers: Carrier[]
  onConfirm: (
    laneIds: string[],
    carrierIds: (number | null)[],
    sourceRateCard: RateCardWithCharges,
    sourceThermalModifiers: ThermalModifierFormData[]
  ) => void | Promise<void>
}

/**
 * RateCardBatchDuplicateDialog - Duplicate rate card structure to multiple lane×carrier combinations
 * Shows source summary, target lane + carriers selection, and preview before confirm
 */
export function RateCardBatchDuplicateDialog({
  open,
  onClose,
  sourceRateCard,
  sourceThermalModifiers,
  lanes,
  carriers,
  onConfirm,
}: RateCardBatchDuplicateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<BatchDuplicateFormData>({
    resolver: zodResolver(batchDuplicateSchema),
    defaultValues: {
      lane_ids: [],
      carrier_ids: [],
    },
  })

  const laneIds = form.watch('lane_ids')
  const carrierIds = form.watch('carrier_ids')

  useEffect(() => {
    if (open && sourceRateCard) {
      form.reset({
        lane_ids: [],
        carrier_ids: [],
      })
    }
  }, [open, sourceRateCard.lane_id, form])

  const handleSave = () => {
    form.handleSubmit(async (data) => {
      setIsSubmitting(true)
      try {
        await Promise.resolve(
          onConfirm(data.lane_ids, data.carrier_ids, sourceRateCard, sourceThermalModifiers)
        )
        onClose()
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const laneNames = laneIds.map((id) => lanes.find((l) => l.id === id)?.name ?? id)
  const carrierNames = carrierIds.map((id) => {
    if (id === null) return 'Default'
    const c = carriers.find((car) => car.id === id)
    return c?.commercial_name ?? `Carrier ${id}`
  })
  const count = laneIds.length * carrierIds.length

  const getCarrierName = (carrierId: number | null) => {
    if (carrierId === null) return 'Default'
    const c = carriers.find((car) => car.id === carrierId)
    return c?.commercial_name ?? `Carrier ${carrierId}`
  }

  const laneOptions = lanes.filter((l) => l.is_active)

  const carrierOptions = [
    { id: null as number | null, label: 'Default (sin transportista específico)' },
    ...carriers
      .filter((c) => c.is_active)
      .map((c) => ({ id: c.id as number, label: c.commercial_name })),
  ]

  const handleLaneToggle = (laneId: string) => {
    const current = form.getValues('lane_ids')
    const exists = current.includes(laneId)
    if (exists) {
      form.setValue(
        'lane_ids',
        current.filter((x) => x !== laneId),
        { shouldValidate: true }
      )
    } else {
      form.setValue('lane_ids', [...current, laneId], { shouldValidate: true })
    }
  }

  const handleCarrierToggle = (id: number | null) => {
    const current = form.getValues('carrier_ids')
    const exists = current.some((x) => x === id)
    if (exists) {
      form.setValue(
        'carrier_ids',
        current.filter((x) => x !== id),
        { shouldValidate: true }
      )
    } else {
      form.setValue('carrier_ids', [...current, id], { shouldValidate: true })
    }
  }

  return (
    <EntityDialog
      open={open}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      title="Duplicar tarifario"
      description="Aplica la misma estructura de cargos y modificadores a otros carriles y transportistas."
      onSave={handleSave}
      saveLabel={count > 0 ? `Duplicar ${count} tarifario(s)` : 'Duplicar'}
      cancelLabel="Cancelar"
      disableSave={laneIds.length === 0 || carrierIds.length === 0}
      saveLoading={isSubmitting}
      saveLoadingLabel="Creando tarifarios..."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <Card className="p-4 shadow-none border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Origen (a copiar)</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <span className="font-medium text-gray-700">Carril:</span>{' '}
              {lanes.find((l) => l.id === sourceRateCard.lane_id)?.name ?? sourceRateCard.lane_id}
            </p>
            <p>
              <span className="font-medium text-gray-700">Transportista:</span>{' '}
              {getCarrierName(sourceRateCard.carrier_id)}
            </p>
            <p>
              <span className="font-medium text-gray-700">Cargos:</span>{' '}
              {(sourceRateCard.rate_card_charges || []).length} (
              {(sourceRateCard.rate_card_charges || [])
                .slice(0, 3)
                .map((c) => `${formatChargeType(c.charge_type)} ${c.rate_basis === 'PERCENTAGE' ? `${c.value}%` : `$${c.value}`}`)
                .join(', ')}
              {(sourceRateCard.rate_card_charges?.length ?? 0) > 3 ? '...' : ''})
            </p>
            <p>
              <span className="font-medium text-gray-700">Modificadores térmicos:</span>{' '}
              {sourceThermalModifiers.length}
            </p>
            <p>
              <span className="font-medium text-gray-700">Vigencia:</span>{' '}
              {formatDateRange(sourceRateCard.valid_from, sourceRateCard.valid_to)}
            </p>
          </div>
        </Card>

        <Form {...form}>
          <FormField
            control={form.control}
            name="lane_ids"
            render={() => (
              <FormItem>
                <FormLabel className="text-xs text-gray-500">Carriles destino</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          selectTriggerClass,
                          !laneIds.length && 'text-gray-500'
                        )}
                      >
                        <span className="truncate">
                          {laneIds.length > 0
                            ? `${laneIds.length} carril(es) seleccionado(s)`
                            : 'Seleccionar carriles'}
                        </span>
                        <ChevronDownIcon className="size-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-1"
                      style={{ width: 'var(--radix-popover-trigger-width)', minWidth: 'var(--radix-popover-trigger-width)' }}
                      align="start"
                    >
                      <div
                        className="max-h-[300px] overflow-y-auto"
                        onWheel={(e) => e.stopPropagation()}
                      >
                        {laneOptions.map((lane) => {
                          const checked = laneIds.includes(lane.id)
                          return (
                            <label
                              key={lane.id}
                              className="flex items-center gap-3 rounded-sm py-1.5 pl-2 pr-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleLaneToggle(lane.id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <span className="text-sm text-gray-700">{lane.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carrier_ids"
            render={() => (
              <FormItem>
                <FormLabel className="text-xs text-gray-500">Transportistas destino</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          selectTriggerClass,
                          !carrierIds.length && 'text-gray-500'
                        )}
                      >
                        <span className="truncate">
                          {carrierIds.length > 0
                            ? `${carrierIds.length} transportista(s) seleccionado(s)`
                            : 'Seleccionar transportistas'}
                        </span>
                        <ChevronDownIcon className="size-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-1"
                      style={{ width: 'var(--radix-popover-trigger-width)', minWidth: 'var(--radix-popover-trigger-width)' }}
                      align="start"
                    >
                      <div
                        className="max-h-[300px] overflow-y-auto"
                        onWheel={(e) => e.stopPropagation()}
                      >
                        {carrierOptions.map((opt) => {
                          const id = opt.id
                          const checked = carrierIds.some((x) => x === id)
                          return (
                            <label
                              key={id === null ? 'null' : id}
                              className="flex items-center gap-3 rounded-sm py-1.5 pl-2 pr-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleCarrierToggle(id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </Form>

        {count > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
            <span className="font-medium text-gray-700">Se crearán {count} tarifario(s):</span>{' '}
            {laneIds.length} carril(es) × {carrierIds.length} transportista(s) —{' '}
            {laneNames.join(', ')} con {carrierNames.join(', ')}
          </div>
        )}
      </div>
    </EntityDialog>
  )
}
