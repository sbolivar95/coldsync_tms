import { useState, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { Button } from '../../../../components/ui/Button'
import { SmartSelect } from '../../../../components/widgets/SmartSelect'
import { Plus, Trash2 } from 'lucide-react'
import type { RateCardFormData } from '../../../../lib/schemas/rateCard.schemas'
import {
  simulateRateCardCharges,
  formatChargeType,
  formatCurrency,
  type SimulatorCharge,
} from '../../../../lib/utils/rateCard.utils'

/** Shape used by simulator for thermal modifier (avoids circular dependency with RateCardDetail). */
interface ThermalModifierOption {
  thermal_profile_id: number
  modifier_type: 'MULTIPLIER' | 'FIXED_ADD'
  value: number
}

interface RateCardCostSimulatorProps {
  thermalModifiers?: ThermalModifierOption[]
  thermalProfileOptions?: Array<{ value: number; label: string }>
}

type OrderMode = 'standard' | 'hybrid'

interface HybridCompartment {
  id: string
  thermal_profile_id: number
  weight_tn: number
}

const THERMAL_NONE_VALUE = '__none__'

function nextId() {
  return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function RateCardCostSimulator({
  thermalModifiers = [],
  thermalProfileOptions = [],
}: RateCardCostSimulatorProps) {
  const form = useFormContext<RateCardFormData>()
  const charges = form.watch('charges') ?? []

  const [weightTn, setWeightTn] = useState(1)
  const [distanceKm, setDistanceKm] = useState(100)
  const [orderMode, setOrderMode] = useState<OrderMode>('standard')
  const [selectedThermalProfileId, setSelectedThermalProfileId] = useState<number | null>(null)
  const [hybridCompartments, setHybridCompartments] = useState<HybridCompartment[]>([])

  const result = useMemo(() => {
    const scenario = { weightTn, distanceKm }
    const chargesForSim = (charges as unknown as SimulatorCharge[]).filter(
      (c) => c && typeof c.sort_order === 'number'
    )
    if (chargesForSim.length === 0) return null
    return simulateRateCardCharges(chargesForSim, scenario)
  }, [charges, weightTn, distanceKm])

  const thermalOptionsForSelect = useMemo(() => {
    return thermalProfileOptions
      .filter((opt) => thermalModifiers.some((m) => m.thermal_profile_id === opt.value))
      .map((opt) => ({ value: opt.value.toString(), label: opt.label }))
  }, [thermalModifiers, thermalProfileOptions])

  const thermalOptionsWithNone = useMemo(() => {
    const none: Array<{ value: string; label: string }> = [
      { value: THERMAL_NONE_VALUE, label: 'Ninguno' },
      ...thermalOptionsForSelect,
    ]
    return none
  }, [thermalOptionsForSelect])

  const selectedModifier = useMemo(() => {
    if (selectedThermalProfileId == null || thermalModifiers.length === 0) return null
    return thermalModifiers.find((m) => m.thermal_profile_id === selectedThermalProfileId) ?? null
  }, [thermalModifiers, selectedThermalProfileId])

  const totalAndHybridBreakdown = useMemo(() => {
    if (!result) return { total: null, hybridBreakdown: null }
    if (orderMode === 'standard') {
      let t = result.subtotal
      if (selectedModifier) {
        if (selectedModifier.modifier_type === 'MULTIPLIER') {
          t = result.subtotal * selectedModifier.value
        } else {
          t = result.subtotal + selectedModifier.value
        }
      }
      return { total: t, hybridBreakdown: null }
    }
    if (hybridCompartments.length === 0) {
      return { total: result.subtotal, hybridBreakdown: null }
    }
    const totalWeight = hybridCompartments.reduce((s, c) => s + c.weight_tn, 0)
    if (totalWeight <= 0) return { total: result.subtotal, hybridBreakdown: [] }
    const breakdown: Array< { profileLabel: string; weight_tn: number; portion: number; cost: number }> = []
    let totalCost = 0
    for (const comp of hybridCompartments) {
      const mod = thermalModifiers.find((m) => m.thermal_profile_id === comp.thermal_profile_id)
      const portion = (comp.weight_tn / totalWeight) * result.subtotal
      let cost = portion
      if (mod) {
        if (mod.modifier_type === 'MULTIPLIER') {
          cost = portion * mod.value
        } else {
          cost = portion + mod.value
        }
      }
      totalCost += cost
      const label =
        thermalProfileOptions.find((o) => o.value === comp.thermal_profile_id)?.label ?? 'Perfil'
      breakdown.push({ profileLabel: label, weight_tn: comp.weight_tn, portion, cost })
    }
    return { total: totalCost, hybridBreakdown: breakdown }
  }, [
    result,
    orderMode,
    selectedModifier,
    hybridCompartments,
    thermalModifiers,
    thermalProfileOptions,
  ])

  const total = totalAndHybridBreakdown.total
  const hybridBreakdown = totalAndHybridBreakdown.hybridBreakdown

  const addHybridCompartment = () => {
    const firstProfileId =
      thermalProfileOptions.find((o) =>
        thermalModifiers.some((m) => m.thermal_profile_id === o.value)
      )?.value ?? thermalProfileOptions[0]?.value
    setHybridCompartments((prev) => [
      ...prev,
      { id: nextId(), thermal_profile_id: firstProfileId ?? 0, weight_tn: 1 },
    ])
  }

  const updateHybridCompartment = (id: string, patch: Partial<HybridCompartment>) => {
    setHybridCompartments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    )
  }

  const removeHybridCompartment = (id: string) => {
    setHybridCompartments((prev) => prev.filter((c) => c.id !== id))
  }

  const hasThermalUi = thermalModifiers.length > 0 && thermalProfileOptions.length > 0

  return (
    <Card className="p-6 shadow-none border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Simulación de costos</h3>
      <p className="text-xs text-gray-500 mb-4">
        Usa la misma lógica que el cálculo en órdenes de despacho. Ajusta peso y distancia para ver
        el resultado.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Peso (Tn)</label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={weightTn}
            onChange={(e) => setWeightTn(parseFloat(e.target.value) || 0)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Distancia (km)</label>
          <Input
            type="number"
            step="1"
            min={0}
            value={distanceKm}
            onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
            className="h-9"
          />
        </div>
      </div>

      {hasThermalUi && (
        <div className="mb-4">
          <label className="text-xs text-gray-500 block mb-2">Tipo de orden</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orderMode"
                checked={orderMode === 'standard'}
                onChange={() => setOrderMode('standard')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Estándar (un perfil)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orderMode"
                checked={orderMode === 'hybrid'}
                onChange={() => setOrderMode('hybrid')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Híbrido (varios perfiles)</span>
            </label>
          </div>
        </div>
      )}

      {hasThermalUi && orderMode === 'standard' && (
        <div className="mb-4">
          <label className="text-xs text-gray-500 block mb-1">Perfil térmico (opcional)</label>
          <SmartSelect
            value={
              selectedThermalProfileId != null ? String(selectedThermalProfileId) : THERMAL_NONE_VALUE
            }
            onChange={(v) =>
              setSelectedThermalProfileId(
                v && v !== THERMAL_NONE_VALUE ? parseInt(v, 10) : null
              )
            }
            options={thermalOptionsWithNone}
            placeholder="Ninguno"
          />
        </div>
      )}

      {hasThermalUi && orderMode === 'hybrid' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">Compartimientos (perfil + peso)</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHybridCompartment}
              className="h-7 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agregar
            </Button>
          </div>
          {hybridCompartments.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">
              Agrega al menos un compartimiento para simular costo híbrido (porción de subtotal por
              perfil y su modificador).
            </p>
          ) : (
            <div className="space-y-2">
              {hybridCompartments.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center gap-2 flex-wrap border border-gray-200 rounded-md p-2 bg-gray-50"
                >
                  <div className="flex-1 min-w-[120px]">
                    <SmartSelect
                      value={String(comp.thermal_profile_id)}
                      onChange={(v) =>
                        updateHybridCompartment(comp.id, {
                          thermal_profile_id: v ? parseInt(v, 10) : comp.thermal_profile_id,
                        })
                      }
                      options={thermalOptionsForSelect}
                      placeholder="Perfil"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={comp.weight_tn}
                      onChange={(e) =>
                        updateHybridCompartment(comp.id, {
                          weight_tn: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 w-20 tabular-nums"
                    />
                    <span className="text-xs text-gray-500">Tn</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeHybridCompartment(comp.id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result ? (
        <div className="text-center py-6 text-sm text-gray-500 border border-gray-200 rounded-md bg-gray-50">
          Agrega cargos arriba para ver la simulación.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 py-2 px-3">Cargo</th>
                  <th className="text-right text-xs font-medium text-gray-500 py-2 px-3">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-3">
                      <span className="font-medium text-gray-900">
                        {item.label || formatChargeType(item.charge_type)}
                      </span>
                      {item.break_used && (
                        <span className="block text-xs text-gray-500">
                          Escalón: {item.break_used}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-6 pt-2">
            <div className="text-sm">
              <span className="text-gray-500">Subtotal: </span>
              <span className="font-semibold tabular-nums text-gray-900">
                {formatCurrency(result.subtotal)}
              </span>
            </div>
          </div>
          {orderMode === 'standard' &&
            selectedModifier &&
            total != null &&
            total !== result.subtotal && (
              <div className="flex justify-end gap-6 pt-1 border-t border-gray-100">
                <div className="text-sm">
                  <span className="text-gray-500">
                    Modificador ({selectedModifier.modifier_type === 'MULTIPLIER' ? '×' : '+'}
                    {selectedModifier.value}):{' '}
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            )}
          {orderMode === 'hybrid' && hybridBreakdown && hybridBreakdown.length > 0 && (
            <div className="border-t border-gray-100 pt-2 space-y-1">
              <div className="text-xs font-medium text-gray-500 mb-1">Desglose híbrido</div>
              {hybridBreakdown.map((row, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm text-gray-700"
                >
                  <span>
                    {row.profileLabel} ({row.weight_tn} Tn): {formatCurrency(row.portion)} →{' '}
                    {formatCurrency(row.cost)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {total != null && (
            <div className="flex justify-end pt-2">
              <div className="text-sm">
                <span className="text-gray-700 font-semibold">Total: </span>
                <span className="text-base font-semibold tabular-nums text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
