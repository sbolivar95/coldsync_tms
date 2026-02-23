import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rateCardSchema, type RateCardFormData } from '../../../../lib/schemas/rateCard.schemas'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/Form'
import { Input } from '../../../../components/ui/Input'
import { SmartSelect } from '../../../../components/widgets/SmartSelect'
import { DatePicker } from '../../../../components/widgets/DatePicker'
import { Button } from '../../../../components/ui/Button'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { Checkbox } from '../../../../components/ui/Checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion'
import { ScrollArea } from '../../../../components/ui/ScrollArea'
import { DetailFooter } from '../../../../components/widgets/DetailFooter'
import { Card } from '../../../../components/ui/Card'
import type { RateCardWithCharges } from '../../../../services/database/rateCards.service'
import type { Lane } from '../../../../types/database.types'
import type { Carrier } from '../../../../types/database.types'
import type { ThermalProfile } from '../../../../types/database.types'
import { formatChargeType, formatRateBasis, calculateChargeSortOrder } from '../../../../lib/utils/rateCard.utils'
import { RateCardCostSimulator } from './RateCardCostSimulator'
import { lanesService } from '../../../../services/database/lanes.service'
import { carriersService } from '../../../../services/database/carriers.service'
import { thermalProfilesService } from '../../../../services/database/thermalProfiles.service'
import { useAppStore } from '../../../../stores/useAppStore'
import { toast } from 'sonner'
import { useFormChanges } from '../../../../hooks/useFormChanges'
import { rateCardsService } from '../../../../services/database/rateCards.service'
import { rateCardThermalModifiersService } from '../../../../services/database/rateCardThermalModifiers.service'
import type { ThermalModifierType } from '../../../../services/database/rateCardThermalModifiers.service'

export type ThermalModifierFormData = {
  thermal_profile_id: number
  modifier_type: ThermalModifierType
  value: number
}

interface RateCardDetailProps {
  rateCard?: RateCardWithCharges | null
  onBack: () => void
  onSave: (
    data: RateCardFormData,
    existingRateCard?: RateCardWithCharges | null,
    thermalModifiers?: ThermalModifierFormData[]
  ) => Promise<void>
}

/**
 * RateCardDetail - Full-page form for creating/editing rate cards (like OrganizationDetail)
 */
export function RateCardDetail({ rateCard: rateCardProp, onBack, onSave }: RateCardDetailProps) {
  const { rateCardId: rateCardIdParam } = useParams()
  const organization = useAppStore((state) => state.organization)
  const orgId = organization?.id ?? ''

  const [rateCardFetched, setRateCardFetched] = useState<RateCardWithCharges | null | undefined>(undefined)
  const rateCard = rateCardProp ?? rateCardFetched

  const [lanes, setLanes] = useState<Lane[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [thermalProfiles, setThermalProfiles] = useState<ThermalProfile[]>([])
  const [loadingRelated, setLoadingRelated] = useState(true)
  const [loadingRateCard, setLoadingRateCard] = useState(!!rateCardIdParam && !rateCardProp)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [thermalModifiers, setThermalModifiers] = useState<ThermalModifierFormData[]>([])

  useEffect(() => {
    if (!rateCardIdParam || rateCardProp !== undefined || !orgId) {
      if (!rateCardIdParam) setRateCardFetched(undefined)
      setLoadingRateCard(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const data = await rateCardsService.getById(rateCardIdParam, orgId)
        if (!cancelled) {
          setRateCardFetched(data ?? null)
        }
      } catch (e) {
        if (!cancelled) {
          toast.error('Error al cargar el tarifario')
          setRateCardFetched(null)
        }
      } finally {
        if (!cancelled) setLoadingRateCard(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [rateCardIdParam, rateCardProp, orgId])

  useEffect(() => {
    if (!rateCard?.id) {
      setThermalModifiers([])
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const data = await rateCardThermalModifiersService.getByRateCardIdWithProfiles(rateCard.id)
        if (!cancelled) {
          setThermalModifiers(
            data.map((m) => ({
              thermal_profile_id: m.thermal_profile_id,
              modifier_type: m.modifier_type as ThermalModifierType,
              value: Number(m.value),
            }))
          )
        }
      } catch (e) {
        if (!cancelled) setThermalModifiers([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [rateCard?.id])

  const [expandedChargeIndex, setExpandedChargeIndex] = useState<string | undefined>(undefined)
  const [expandedThermalModifierIndex, setExpandedThermalModifierIndex] = useState<string | undefined>(undefined)

  const form = useForm<RateCardFormData>({
    resolver: zodResolver(rateCardSchema),
    mode: 'onChange',
    defaultValues: {
      name: null,
      lane_id: '',
      carrier_id: null,
      thermal_profile_id: null,
      valid_from: new Date().toISOString().split('T')[0]!,
      valid_to: null,
      is_active: true,
      charges: [],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'charges',
  })

  const [originalData, setOriginalData] = useState<RateCardFormData | null>(null)
  const isEditMode = !!rateCard?.id
  const { hasChanges } = useFormChanges(form, originalData, isEditMode ? 'edit' : 'create')

  useEffect(() => {
    const load = async () => {
      if (!orgId) {
        setLoadingRelated(false)
        return
      }
      try {
        const [lanesData, carriersData, thermalData] = await Promise.all([
          lanesService.getAll(orgId),
          carriersService.getAll(orgId),
          thermalProfilesService.getAll(orgId),
        ])
        setLanes(lanesData)
        setCarriers(carriersData)
        setThermalProfiles(thermalData)
      } catch (e) {
        console.error('Error loading related data for rate card:', e)
        toast.error('Error al cargar datos')
      } finally {
        setLoadingRelated(false)
      }
    }
    load()
  }, [orgId])

  useEffect(() => {
    if (rateCard) {
      const data: RateCardFormData = {
        name: rateCard.name,
        lane_id: rateCard.lane_id,
        carrier_id: rateCard.carrier_id,
        thermal_profile_id: rateCard.thermal_profile_id,
        valid_from: rateCard.valid_from,
        valid_to: rateCard.valid_to,
        is_active: rateCard.is_active,
        charges: (rateCard.rate_card_charges || []).map((c) => ({
          charge_type: c.charge_type,
          rate_basis: c.rate_basis,
          value: c.value,
          label: c.label,
          sort_order: c.sort_order,
          is_active: c.is_active,
          apply_before_pct: c.apply_before_pct,
          weight_source: (c as { weight_source?: string }).weight_source ?? 'ACTUAL',
          breaks: (c.rate_charge_breaks || []).map((b) => ({
            min_value: b.min_value,
            max_value: b.max_value,
            rate_value: b.rate_value,
          })),
        })),
      }
      form.reset(data)
      setOriginalData(data)
    } else {
      const defaultData: RateCardFormData = {
        name: null,
        lane_id: '',
        carrier_id: null,
        thermal_profile_id: null,
        valid_from: new Date().toISOString().split('T')[0]!,
        valid_to: null,
        is_active: true,
        charges: [],
      }
      form.reset(defaultData)
      setOriginalData(defaultData)
    }
  }, [rateCard, form])

  const handleSave = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error('Corrige los errores del formulario')
      return
    }
    setIsSubmitting(true)
    try {
      await onSave(form.getValues(), rateCard ?? undefined, thermalModifiers)
      setJustSaved(true)
      setOriginalData(form.getValues())
      setTimeout(() => {
        setJustSaved(false)
        onBack()
      }, 1500)
    } catch (e) {
      console.error('Error saving rate card:', e)
      toast.error('Error al guardar el tarifario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onBack()
  }

  const handleAddCharge = () => {
    const nextSortOrder = calculateChargeSortOrder(form.getValues('charges'))
    const newIndex = fields.length
    append({
      charge_type: 'FREIGHT',
      rate_basis: 'FLAT',
      value: 0,
      label: null,
      sort_order: nextSortOrder,
      is_active: true,
      apply_before_pct: true,
      weight_source: 'ACTUAL',
      breaks: [],
    })
    setExpandedChargeIndex(`charge-${newIndex}`)
  }

  const handleDeleteCharge = (index: number) => {
    remove(index)
    if (expandedChargeIndex === `charge-${index}`) setExpandedChargeIndex(undefined)
  }

  const handleMoveThermalModifier = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const next = [...thermalModifiers]
      ;[next[index], next[index - 1]] = [next[index - 1]!, next[index]!]
      setThermalModifiers(next)
      if (expandedThermalModifierIndex === `modifier-${index}`) setExpandedThermalModifierIndex(`modifier-${index - 1}`)
      else if (expandedThermalModifierIndex === `modifier-${index - 1}`) setExpandedThermalModifierIndex(`modifier-${index}`)
    } else if (direction === 'down' && index < thermalModifiers.length - 1) {
      const next = [...thermalModifiers]
      ;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
      setThermalModifiers(next)
      if (expandedThermalModifierIndex === `modifier-${index}`) setExpandedThermalModifierIndex(`modifier-${index + 1}`)
      else if (expandedThermalModifierIndex === `modifier-${index + 1}`) setExpandedThermalModifierIndex(`modifier-${index}`)
    }
  }

  const handleDeleteThermalModifier = (index: number) => {
    setThermalModifiers(thermalModifiers.filter((_, i) => i !== index))
    if (expandedThermalModifierIndex === `modifier-${index}`) setExpandedThermalModifierIndex(undefined)
  }

  const handleMoveCharge = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      move(index, index - 1)
      const charges = form.getValues('charges')
      const temp = charges[index]!.sort_order
      charges[index]!.sort_order = charges[index - 1]!.sort_order
      charges[index - 1]!.sort_order = temp
      form.setValue('charges', charges)
      if (expandedChargeIndex === `charge-${index}`) setExpandedChargeIndex(`charge-${index - 1}`)
      else if (expandedChargeIndex === `charge-${index - 1}`) setExpandedChargeIndex(`charge-${index}`)
    } else if (direction === 'down' && index < fields.length - 1) {
      move(index, index + 1)
      const charges = form.getValues('charges')
      const temp = charges[index]!.sort_order
      charges[index]!.sort_order = charges[index + 1]!.sort_order
      charges[index + 1]!.sort_order = temp
      form.setValue('charges', charges)
      if (expandedChargeIndex === `charge-${index}`) setExpandedChargeIndex(`charge-${index + 1}`)
      else if (expandedChargeIndex === `charge-${index + 1}`) setExpandedChargeIndex(`charge-${index}`)
    }
  }

  const laneOptions = lanes
    .filter((l) => l.is_active)
    .map((lane) => ({ value: lane.id, label: lane.name }))

  const carrierOptions = [
    { value: 'null', label: 'Default (Sin transportista específico)' },
    ...carriers
      .filter((c) => c.is_active)
      .map((c) => ({ value: c.id.toString(), label: c.commercial_name })),
  ]

  const charges = form.watch('charges')

  if (loadingRelated || (rateCardIdParam && rateCard === undefined && loadingRateCard)) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                <Card className="p-6 shadow-none">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Tarifario Ruta Lima-Bogotá" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lane_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Carril <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <SmartSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={laneOptions}
                              placeholder="Seleccionar carril"
                              required
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="carrier_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Transportista</FormLabel>
                          <FormControl>
                            <SmartSelect
                              value={field.value?.toString() || 'null'}
                              onChange={(v) => field.onChange(v === 'null' ? null : parseInt(v))}
                              options={carrierOptions}
                              placeholder="Seleccionar transportista"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valid_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Válido Desde <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <DatePicker value={field.value} onChange={field.onChange} placeholder="Seleccionar fecha" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valid_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Válido Hasta</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value || ''}
                              onChange={(v) => field.onChange(v || null)}
                              placeholder="Sin fecha límite"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-xs text-gray-500">Activo</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>

                <Card className="p-6 shadow-none">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Cargos</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCharge}
                      className="text-primary hover:text-primary hover:bg-gray-100 text-xs h-7 px-2 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-0.5" />
                      Agregar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Debe agregar al menos un cargo para guardar el tarifario.</p>
                  {form.formState.errors.charges && (
                    <p className="text-xs text-red-600 mb-2">{form.formState.errors.charges.message}</p>
                  )}
                  {fields.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500 border border-gray-200 rounded-md bg-gray-50">
                      No hay cargos agregados. Haz clic en Agregar para comenzar.
                    </div>
                  ) : (
                    <Accordion
                      type="single"
                      collapsible
                      value={expandedChargeIndex}
                      onValueChange={setExpandedChargeIndex}
                      className="space-y-2"
                    >
                      {fields.map((field, index) => {
                        const charge = charges[index]
                        if (!charge) return null
                        const chargeTypeOptions = [
                          { value: 'BASE', label: 'Base' },
                          { value: 'FREIGHT', label: 'Flete' },
                          { value: 'DISTANCE', label: 'Distancia' },
                          { value: 'FUEL', label: 'Combustible' },
                          { value: 'HYBRID', label: 'Híbrido' },
                        ]
                        const rateBasisOptions = [
                          { value: 'FLAT', label: 'Fijo' },
                          { value: 'PER_TN', label: 'Por Tonelada' },
                          { value: 'PER_KM', label: 'Por Kilómetro' },
                          { value: 'PERCENTAGE', label: 'Porcentaje' },
                        ]
                        return (
                          <AccordionItem
                            key={field.id}
                            value={`charge-${index}`}
                            className="border border-gray-200 rounded-md bg-white"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center justify-between flex-1 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {formatChargeType(charge.charge_type)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {formatRateBasis(charge.rate_basis)}
                                    </Badge>
                                    {!charge.is_active && (
                                      <Badge variant="secondary" className="text-xs bg-gray-200">
                                        Inactivo
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">Valor:</span>{' '}
                                    {charge.rate_basis === 'PERCENTAGE'
                                      ? `${charge.value}%`
                                      : `$${charge.value.toFixed(2)}`}
                                    {charge.label && <span className="text-gray-500 ml-2">- {charge.label}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMoveCharge(index, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMoveCharge(index, 'down')}
                                    disabled={index === fields.length - 1}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600"
                                    onClick={() => handleDeleteCharge(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4 pt-2 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`charges.${index}.charge_type`}
                                    render={({ field: f }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs text-gray-500">Tipo de Cargo *</FormLabel>
                                        <FormControl>
                                          <SmartSelect
                                            value={f.value}
                                            onChange={f.onChange}
                                            options={chargeTypeOptions}
                                            placeholder="Seleccionar tipo"
                                            required
                                          />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`charges.${index}.rate_basis`}
                                    render={({ field: f }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs text-gray-500">Base de Cálculo *</FormLabel>
                                        <FormControl>
                                          <SmartSelect
                                            value={f.value}
                                            onChange={f.onChange}
                                            options={rateBasisOptions}
                                            placeholder="Seleccionar base"
                                            required
                                          />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`charges.${index}.value`}
                                    render={({ field: f }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs text-gray-500">Valor *</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            placeholder="0.00"
                                            {...f}
                                            value={f.value || 0}
                                            onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`charges.${index}.label`}
                                    render={({ field: f }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs text-gray-500">Etiqueta</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Ej: Cargo base" {...f} value={f.value || ''} />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`charges.${index}.apply_before_pct`}
                                    render={({ field: f }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox checked={f.value} onCheckedChange={f.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="text-xs text-gray-500">
                                            Aplicar antes de porcentajes
                                          </FormLabel>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`charges.${index}.is_active`}
                                    render={({ field: f }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox checked={f.value} onCheckedChange={f.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="text-xs text-gray-500">Activo</FormLabel>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                  {form.watch(`charges.${index}.rate_basis`) === 'PER_TN' && (
                                    <FormField
                                      control={form.control}
                                      name={`charges.${index}.weight_source`}
                                      render={({ field: f }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs text-gray-500">
                                            Base de cobro por peso
                                          </FormLabel>
                                          <FormControl>
                                            <SmartSelect
                                              value={f.value || 'ACTUAL'}
                                              onChange={f.onChange}
                                              options={[
                                                { value: 'ACTUAL', label: 'Peso transportado (cantidad real)' },
                                                { value: 'TRUCK_CAPACITY', label: 'Capacidad del camión' },
                                              ]}
                                              placeholder="Seleccionar"
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </div>
                                {form.watch(`charges.${index}.rate_basis`) === 'PER_TN' && (
                                  <ChargeBreaksEditor
                                    chargeIndex={index}
                                    form={form}
                                    weightSource={form.watch(`charges.${index}.weight_source`) || 'ACTUAL'}
                                  />
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  )}
                </Card>

                <Card className="p-6 shadow-none">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Modificadores por perfil térmico</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const available = thermalProfiles
                          .filter((p) => p.is_active && !thermalModifiers.some((m) => m.thermal_profile_id === p.id))
                        if (available.length === 0) {
                          toast.error('Todos los perfiles ya tienen modificador o no hay perfiles disponibles')
                          return
                        }
                        const newIdx = thermalModifiers.length
                        setThermalModifiers([
                          ...thermalModifiers,
                          { thermal_profile_id: available[0]!.id, modifier_type: 'MULTIPLIER', value: 1 },
                        ])
                        setExpandedThermalModifierIndex(`modifier-${newIdx}`)
                      }}
                      className="text-primary hover:text-primary hover:bg-gray-100 text-xs h-7 px-2 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-0.5" />
                      Agregar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Cada orden tiene perfil térmico; estos modificadores definen cómo se ajusta el costo por perfil.
                  </p>
                  {thermalModifiers.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500 border border-gray-200 rounded-md bg-gray-50">
                      No hay modificadores. Haz clic en Agregar para comenzar.
                    </div>
                  ) : (
                    <Accordion
                      type="single"
                      collapsible
                      value={expandedThermalModifierIndex}
                      onValueChange={setExpandedThermalModifierIndex}
                      className="space-y-2"
                    >
                      {thermalModifiers.map((mod, idx) => {
                        const profile = thermalProfiles.find((p) => p.id === mod.thermal_profile_id)
                        const typeLabel = mod.modifier_type === 'MULTIPLIER' ? 'Multiplicador' : 'Cargo fijo'
                        const valueDisplay =
                          mod.modifier_type === 'MULTIPLIER' ? `${mod.value}x` : `$${mod.value.toFixed(2)}`
                        return (
                          <AccordionItem
                            key={`${mod.thermal_profile_id}-${idx}`}
                            value={`modifier-${idx}`}
                            className="border border-gray-200 rounded-md bg-white"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center justify-between flex-1 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {profile
                                        ? `${profile.name} (${profile.temp_min_c}°C - ${profile.temp_max_c}°C)`
                                        : 'Perfil'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {typeLabel}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">Valor:</span> {valueDisplay}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMoveThermalModifier(idx, 'up')}
                                    disabled={idx === 0}
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMoveThermalModifier(idx, 'down')}
                                    disabled={idx === thermalModifiers.length - 1}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600"
                                    onClick={() => handleDeleteThermalModifier(idx)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4 pt-2 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Perfil</label>
                                    <SmartSelect
                                      value={mod.thermal_profile_id.toString()}
                                      onChange={(v) => {
                                        const next = [...thermalModifiers]
                                        next[idx] = { ...mod, thermal_profile_id: parseInt(v) }
                                        setThermalModifiers(next)
                                      }}
                                      options={thermalProfiles
                                        .filter((p) => p.is_active)
                                        .filter(
                                          (p) =>
                                            p.id === mod.thermal_profile_id ||
                                            !thermalModifiers.some((m, i) => i !== idx && m.thermal_profile_id === p.id)
                                        )
                                        .map((p) => ({
                                        value: p.id.toString(),
                                        label: `${p.name} (${p.temp_min_c}°C - ${p.temp_max_c}°C)`,
                                      }))}
                                      placeholder="Seleccionar perfil"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                                    <SmartSelect
                                      value={mod.modifier_type}
                                      onChange={(v) => {
                                        const next = [...thermalModifiers]
                                        next[idx] = { ...mod, modifier_type: v as ThermalModifierType }
                                        setThermalModifiers(next)
                                      }}
                                      options={[
                                        { value: 'MULTIPLIER', label: 'Multiplicador' },
                                        { value: 'FIXED_ADD', label: 'Cargo fijo' },
                                      ]}
                                      placeholder="Seleccionar tipo"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Valor</label>
                                    <Input
                                      type="number"
                                      step={mod.modifier_type === 'MULTIPLIER' ? '0.01' : '1'}
                                      min={mod.modifier_type === 'MULTIPLIER' ? 0.01 : 0}
                                      value={mod.value}
                                      onChange={(e) => {
                                        const next = [...thermalModifiers]
                                        next[idx] = { ...mod, value: parseFloat(e.target.value) || 0 }
                                        setThermalModifiers(next)
                                      }}
                                      placeholder={mod.modifier_type === 'MULTIPLIER' ? '1.0' : '0'}
                                    />
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  )}
                </Card>

                <RateCardCostSimulator
                  thermalModifiers={thermalModifiers}
                  thermalProfileOptions={thermalProfiles
                    .filter((p) => thermalModifiers.some((m) => m.thermal_profile_id === p.id))
                    .map((p) => ({ value: p.id, label: p.name }))}
                />
                  </div>
                </div>
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
        />
      </div>
    </Form>
  )
}

function ChargeBreaksEditor({
  chargeIndex,
  form,
  weightSource,
}: {
  chargeIndex: number
  form: ReturnType<typeof useForm<RateCardFormData>>
  weightSource: 'ACTUAL' | 'TRUCK_CAPACITY'
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `charges.${chargeIndex}.breaks`,
  })

  const handleAddBreak = () => {
    const existingBreaks = form.getValues(`charges.${chargeIndex}.breaks`) || []
    const lastBreak = existingBreaks[existingBreaks.length - 1]
    const minValue = lastBreak ? (lastBreak.max_value ?? lastBreak.min_value + 10) : 0
    const isCapacity = weightSource === 'TRUCK_CAPACITY'
    append({ min_value: minValue, max_value: isCapacity ? minValue : null, rate_value: 0 })
  }

  const isCapacityMode = weightSource === 'TRUCK_CAPACITY'

  return (
    <div className="space-y-3 border-t pt-3 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-900">
          {isCapacityMode ? 'Escalones por capacidad' : 'Escalones de Peso'}
        </h4>
        <Button type="button" variant="outline" size="sm" onClick={handleAddBreak} className="text-xs h-7">
          <Plus className="w-3 h-3 mr-1" />
          Agregar Escalón
        </Button>
      </div>
      {isCapacityMode && (
        <p className="text-xs text-gray-500 leading-snug">
          Exacta: tarifa para un camión de esa capacidad. Rango: tarifa para capacidades entre desde y hasta. El
          sistema usa el escalón más cercano menor (ej. camión 30 tn usa escalón 28 tn).
        </p>
      )}
      {fields.length === 0 ? (
        <div className="text-center py-3 text-xs text-gray-500 border border-gray-200 rounded-md bg-gray-50">
          No hay escalones configurados. Agrega al menos uno para tarifas por tonelada.
        </div>
      ) : (
        <div className="space-y-1.5">
          {fields.map((breakField, breakIndex) => {
            const breaks = form.watch(`charges.${chargeIndex}.breaks`)
            const b = breaks?.[breakIndex]
            const isExact =
              isCapacityMode && b != null && b.max_value != null && b.min_value === b.max_value
            return (
              <div
                key={breakField.id}
                className="grid grid-cols-12 gap-2 items-end border border-gray-200 rounded-md p-2 bg-gray-50"
              >
                {isCapacityMode && (
                  <div className="col-span-2">
                    <SmartSelect
                      value={isExact ? 'EXACT' : 'RANGE'}
                      onChange={(v) => {
                        const min =
                          form.getValues(`charges.${chargeIndex}.breaks.${breakIndex}.min_value`) ?? 0
                        form.setValue(
                          `charges.${chargeIndex}.breaks.${breakIndex}.max_value`,
                          v === 'EXACT' ? min : null
                        )
                      }}
                      options={[
                        { value: 'EXACT', label: 'Exacta' },
                        { value: 'RANGE', label: 'Rango' },
                      ]}
                      placeholder="Tipo"
                    />
                  </div>
                )}
                {isCapacityMode && isExact ? (
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`charges.${chargeIndex}.breaks.${breakIndex}.min_value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">
                            Capacidad (Tn)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              {...field}
                              value={field.value || 0}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0
                                field.onChange(v)
                                form.setValue(
                                  `charges.${chargeIndex}.breaks.${breakIndex}.max_value`,
                                  v
                                )
                              }}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`charges.${chargeIndex}.breaks.${breakIndex}.min_value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              {isCapacityMode ? 'Cap. desde (Tn)' : 'Desde (Tn)'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
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
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`charges.${chargeIndex}.breaks.${breakIndex}.max_value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              {isCapacityMode ? 'Cap. hasta (Tn)' : 'Hasta (Tn)'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                placeholder="Sin límite"
                                {...field}
                                value={field.value ?? ''}
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
                  </>
                )}
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`charges.${chargeIndex}.breaks.${breakIndex}.rate_value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">Tarifa</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
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
                    onClick={() => remove(breakIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {form.formState.errors.charges?.[chargeIndex]?.breaks && (
        <p className="text-xs text-red-600">
          {form.formState.errors.charges[chargeIndex]?.breaks?.message}
        </p>
      )}
    </div>
  )
}
