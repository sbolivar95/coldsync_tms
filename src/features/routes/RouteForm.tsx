import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { InputField, SelectField } from '../../components/widgets/FormField'
import { FormActions } from '../../components/widgets/FormActions'
import { Button } from '../../components/ui/Button'
import { Plus, X } from 'lucide-react'
import type { StopTypes } from '../../types/database.types'

interface RouteFormData {
  // Route table fields
  id?: string
  route_id: string
  name: string
  distance: string
  service_cycle: string
  is_active: boolean
  base_rate: string
  km_rate: string
  hourly_rate: string
  loading_time: string
  unloading_time: string
  hoos_hour: string
  refuel_time: string
  operational_buffer: string
  route_type_id: string
  transit_time: string

  // Stops (will be processed separately)
  stops: Array<{
    location_id: string
    stop_order: number
    stop_type: StopTypes
    notes?: string
  }>
}

interface RouteFormProps {
  route?: any // Route with joined route_stops and route_types
  locations: Array<{ id: number; name: string; code: string }>
  routeTypes: Array<{ id: number; name: string }>
  onSave: (data: RouteFormData) => Promise<void>
  onCancel: () => void
  orgId: string
}

const stopTypeOptions = [
  { value: 'PICKUP', label: 'Recogida' },
  { value: 'DELIVERY', label: 'Entrega' },
]

export function RouteForm({
  route,
  locations,
  routeTypes,
  onSave,
  onCancel,
  orgId,
}: RouteFormProps) {
  // Initialize form data
  const [formData, setFormData] = useState<RouteFormData>(() => {
    if (route) {
      // Separate stops by type
      const origins =
        route.route_stops?.filter((s: any) => s.stop_type === 'PICKUP') || []
      const destinations =
        route.route_stops?.filter((s: any) => s.stop_type === 'DELIVERY') || []

      // Create combined stops array maintaining order
      const allStops =
        route.route_stops?.map((stop: any) => ({
          location_id: stop.location_id?.toString() || '',
          stop_order: stop.stop_order || 1,
          stop_type: stop.stop_type || 'PICKUP',
          notes: stop.notes || '',
        })) || []

      return {
        id: route.id,
        route_id: route.route_id || '',
        name: route.name || '',
        distance: route.distance?.toString() || '',
        service_cycle: route.service_cycle?.toString() || '',
        is_active: route.is_active ?? true,
        base_rate: route.base_rate?.toString() || '',
        km_rate: route.km_rate?.toString() || '',
        hourly_rate: route.hourly_rate?.toString() || '',
        loading_time: route.loading_time?.toString() || '',
        unloading_time: route.unloading_time?.toString() || '',
        hoos_hour: route.hoos_hour?.toString() || '',
        refuel_time: route.refuel_time?.toString() || '',
        operational_buffer: route.operational_buffer?.toString() || '',
        route_type_id: route.route_type_id?.toString() || '',
        transit_time: route.transit_time?.toString() || '',
        stops:
          allStops.length > 0
            ? allStops
            : [
                {
                  location_id: '',
                  stop_order: 1,
                  stop_type: 'PICKUP' as StopTypes,
                },
                {
                  location_id: '',
                  stop_order: 2,
                  stop_type: 'DELIVERY' as StopTypes,
                },
              ],
      }
    }

    return {
      route_id: '',
      name: '',
      distance: '',
      service_cycle: '',
      is_active: true,
      base_rate: '',
      km_rate: '',
      hourly_rate: '',
      loading_time: '',
      unloading_time: '',
      hoos_hour: '',
      refuel_time: '',
      operational_buffer: '',
      route_type_id: '',
      transit_time: '',
      stops: [
        { location_id: '', stop_order: 1, stop_type: 'PICKUP' as StopTypes },
        { location_id: '', stop_order: 2, stop_type: 'DELIVERY' as StopTypes },
      ],
    }
  })

  const [cycleError, setCycleError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Convert locations and route types to select options
  const locationOptions = locations.map((loc) => ({
    value: loc.id.toString(),
    label: `${loc.code} - ${loc.name}`,
  }))

  const routeTypeOptions = routeTypes.map((rt) => ({
    value: rt.id.toString(),
    label: rt.name,
  }))

  // Calculate recommended service cycle
  const calculateRecommendedCycle = () => {
    const transitTime = parseFloat(formData.transit_time || '0')
    const loading = parseFloat(formData.loading_time || '0')
    const unloading = parseFloat(formData.unloading_time || '0')
    const service = parseFloat(formData.hoos_hour || '0')
    const refueling = parseFloat(formData.refuel_time || '0')
    const margin = parseFloat(formData.operational_buffer || '0')

    // Sum all components
    const totalBase = transitTime + loading + unloading + service + refueling

    // Apply operational margin (as percentage)
    const totalWithMargin = totalBase * (1 + margin / 100)

    // Minimum is 2x transit time
    const minimumAllowed = transitTime * 2

    return Math.max(totalWithMargin, minimumAllowed)
  }

  // Auto-calculate cycle when components change
  useEffect(() => {
    if (formData.transit_time) {
      const recommendedCycle = calculateRecommendedCycle()
      setFormData((prev) => ({
        ...prev,
        service_cycle: recommendedCycle.toFixed(2),
      }))
    }
  }, [
    formData.transit_time,
    formData.loading_time,
    formData.unloading_time,
    formData.hoos_hour,
    formData.refuel_time,
    formData.operational_buffer,
  ])

  // Validate service cycle
  const handleCycleChange = (value: string) => {
    const cycleValue = parseFloat(value)
    const transitTime = parseFloat(formData.transit_time || '0')

    if (cycleValue < transitTime) {
      setCycleError(
        `El ciclo no puede ser menor que el tiempo de tránsito (${transitTime}h)`
      )
    } else {
      setCycleError('')
    }

    setFormData({ ...formData, service_cycle: value })
  }

  // Stop handlers
  const handleAddStop = (type: StopTypes) => {
    const newStopOrder = formData.stops.length + 1
    setFormData({
      ...formData,
      stops: [
        ...formData.stops,
        { location_id: '', stop_order: newStopOrder, stop_type: type },
      ],
    })
  }

  const handleRemoveStop = (index: number, type: StopTypes) => {
    const stopsOfType = formData.stops.filter((s) => s.stop_type === type)
    if (stopsOfType.length <= 1) return // Keep at least one of each type

    const newStops = formData.stops.filter((_, i) => i !== index)
    // Reorder stop_order
    const reorderedStops = newStops.map((stop, idx) => ({
      ...stop,
      stop_order: idx + 1,
    }))
    setFormData({
      ...formData,
      stops: reorderedStops,
    })
  }

  const handleStopChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newStops = [...formData.stops]
    newStops[index] = { ...newStops[index], [field]: value }
    setFormData({
      ...formData,
      stops: newStops,
    })
  }

  const handleSave = async () => {
    // Validate service cycle before saving
    const cycleValue = parseFloat(formData.service_cycle)
    const transitTime = parseFloat(formData.transit_time || '0')

    if (cycleValue < transitTime) {
      setCycleError(
        `El ciclo no puede ser menor que el tiempo de tránsito (${transitTime}h)`
      )
      return
    }

    // Validate required fields
    if (
      !formData.route_id ||
      !formData.name ||
      !formData.distance ||
      !formData.transit_time
    ) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    // Validate at least one origin and one destination
    const hasOrigin = formData.stops.some(
      (s) => s.stop_type === 'PICKUP' && s.location_id
    )
    const hasDestination = formData.stops.some(
      (s) => s.stop_type === 'DELIVERY' && s.location_id
    )

    if (!hasOrigin || !hasDestination) {
      alert('Debe agregar al menos un origen y un destino')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving route:', error)
      alert('Error al guardar la ruta. Por favor intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Separate stops by type for display
  const origins = formData.stops.filter((s) => s.stop_type === 'PICKUP')
  const destinations = formData.stops.filter((s) => s.stop_type === 'DELIVERY')

  return (
    <div className='space-y-6'>
      {/* SECTION 1: INFORMATION - Origins, Destinations, and Details */}
      <div className='grid grid-cols-2 gap-6'>
        {/* Left Column: Información de Ruta */}
        <Card className='p-6'>
          <h3 className='text-sm font-semibold text-gray-900 mb-4'>
            Información de Ruta
          </h3>

          <div className='space-y-4'>
            {/* Orígenes - Multi-point */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label className='block text-xs text-gray-600'>
                  Orígenes <span className='text-red-500'>*</span>
                </label>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleAddStop('PICKUP')}
                  className='h-7 text-xs text-[#004ef0] hover:text-[#003bc4] px-2'
                >
                  <Plus className='w-3.5 h-3.5 mr-1' />
                  Añadir
                </Button>
              </div>

              <div className='space-y-2'>
                {origins.map((origin, idx) => {
                  const globalIndex = formData.stops.findIndex(
                    (s) => s === origin
                  )
                  return (
                    <div
                      key={globalIndex}
                      className='flex gap-2'
                    >
                      <div className='flex-1'>
                        <SelectField
                          label=''
                          id={`origin-${globalIndex}`}
                          value={origin.location_id}
                          onValueChange={(value) =>
                            handleStopChange(globalIndex, 'location_id', value)
                          }
                          options={locationOptions}
                        />
                      </div>
                      {origins.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleRemoveStop(globalIndex, 'PICKUP')
                          }
                          className='h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className='text-xs text-gray-500'>
                Soporte multipunto disponible
              </p>
            </div>

            {/* Destinos - Multi-point */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label className='block text-xs text-gray-600'>
                  Destinos <span className='text-red-500'>*</span>
                </label>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleAddStop('DELIVERY')}
                  className='h-7 text-xs text-[#004ef0] hover:text-[#003bc4] px-2'
                >
                  <Plus className='w-3.5 h-3.5 mr-1' />
                  Añadir
                </Button>
              </div>

              <div className='space-y-2'>
                {destinations.map((dest, idx) => {
                  const globalIndex = formData.stops.findIndex(
                    (s) => s === dest
                  )
                  return (
                    <div
                      key={globalIndex}
                      className='flex gap-2'
                    >
                      <div className='flex-1'>
                        <SelectField
                          label=''
                          id={`destination-${globalIndex}`}
                          value={dest.location_id}
                          onValueChange={(value) =>
                            handleStopChange(globalIndex, 'location_id', value)
                          }
                          options={locationOptions}
                        />
                      </div>
                      {destinations.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleRemoveStop(globalIndex, 'DELIVERY')
                          }
                          className='h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className='text-xs text-gray-500'>
                Soporte multipunto disponible
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column: Detalles y Configuración */}
        <Card className='p-6'>
          <h3 className='text-sm font-semibold text-gray-900 mb-4'>
            Detalles y Configuración
          </h3>

          <div className='space-y-4'>
            {/* Route Code and Name */}
            <div className='grid grid-cols-2 gap-3'>
              <InputField
                label='Código de Ruta'
                id='route-id'
                required
                value={formData.route_id}
                onChange={(e) =>
                  setFormData({ ...formData, route_id: e.target.value })
                }
                placeholder='RT-001'
              />
              <InputField
                label='Nombre de Ruta'
                id='route-name'
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Ruta Principal'
              />
            </div>

            {/* Route Type and Status */}
            <div className='grid grid-cols-2 gap-3'>
              <SelectField
                label='Tipo de Ruta'
                id='route-type'
                required
                value={formData.route_type_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, route_type_id: value })
                }
                options={routeTypeOptions}
              />
              <SelectField
                label='Estado'
                id='status'
                required
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_active: value === 'active' })
                }
                options={[
                  { value: 'active', label: 'Activa' },
                  { value: 'inactive', label: 'Inactiva' },
                ]}
              />
            </div>

            {/* Distance and Transit Time */}
            <div className='grid grid-cols-2 gap-3'>
              <InputField
                label='Distancia (km)'
                id='distance'
                type='number'
                step='any'
                required
                value={formData.distance}
                onChange={(e) =>
                  setFormData({ ...formData, distance: e.target.value })
                }
                placeholder='380.5'
              />
              <InputField
                label='Tiempo de Tránsito (h)'
                id='transit-time'
                type='number'
                step='any'
                value={formData.transit_time}
                onChange={(e) =>
                  setFormData({ ...formData, transit_time: e.target.value })
                }
                placeholder='8.5'
              />
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 2: PRICING CONFIGURATION */}
      <Card className='p-6'>
        <h3 className='text-sm font-semibold text-gray-900 mb-4'>
          Configuración de Tarifas
        </h3>

        <div className='grid grid-cols-4 gap-3'>
          <InputField
            label='Tarifa Base'
            id='base-rate'
            type='number'
            step='0.01'
            required
            value={formData.base_rate}
            onChange={(e) =>
              setFormData({ ...formData, base_rate: e.target.value })
            }
            placeholder='1000.00'
          />
          <InputField
            label='Tarifa por Kilómetro'
            id='km-rate'
            type='number'
            step='0.01'
            value={formData.km_rate}
            onChange={(e) =>
              setFormData({ ...formData, km_rate: e.target.value })
            }
            placeholder='5.50'
          />
          <InputField
            label='Tarifa por Hora'
            id='hourly-rate'
            type='number'
            step='0.01'
            value={formData.hourly_rate}
            onChange={(e) =>
              setFormData({ ...formData, hourly_rate: e.target.value })
            }
            placeholder='150.00'
          />
          <div className='space-y-2'>
            <label className='block text-xs font-medium text-gray-700'>
              Moneda <span className='text-red-500'>*</span>
            </label>
            <select
              className='w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004ef0] focus:border-transparent'
              value='BOB'
              disabled
            >
              <option value='BOB'>BOB - Boliviano</option>
            </select>
            <p className='text-xs text-gray-500'>
              Moneda fija por organización
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION 3: OPERATIONAL TIMES */}
      <Card className='p-6'>
        <h3 className='text-sm font-semibold text-gray-900 mb-4'>
          Tiempos de Operación
        </h3>

        <div className='space-y-4'>
          {/* First Row: Service Cycle, Loading, Unloading */}
          <div className='grid grid-cols-3 gap-3'>
            <div>
              <InputField
                label='Ciclo de Servicio (h)'
                id='service-cycle'
                type='number'
                step='0.01'
                value={formData.service_cycle}
                onChange={(e) => handleCycleChange(e.target.value)}
                placeholder='17.0'
              />
              <p className='text-xs text-gray-500 mt-1.5'>
                Tiempo total hasta retorno a origen. Incluye tránsito, carga,
                descarga, servicio y margen. Mínimo: 2x tiempo de tránsito.
              </p>
              {cycleError && (
                <p className='text-xs text-red-500 mt-1.5'>{cycleError}</p>
              )}
            </div>
            <InputField
              label='Tiempo de Carga (h)'
              id='loading-time'
              type='number'
              step='0.01'
              value={formData.loading_time}
              onChange={(e) =>
                setFormData({ ...formData, loading_time: e.target.value })
              }
              placeholder='2.5'
            />
            <InputField
              label='Tiempo de Descarga (h)'
              id='unloading-time'
              type='number'
              step='0.01'
              value={formData.unloading_time}
              onChange={(e) =>
                setFormData({ ...formData, unloading_time: e.target.value })
              }
              placeholder='1.5'
            />
          </div>

          {/* Second Row: Service Hours, Refueling, Operational Buffer */}
          <div className='grid grid-cols-3 gap-3'>
            <InputField
              label='Horas de Servicio (Descanso)'
              id='hoos-hour'
              type='number'
              step='0.01'
              value={formData.hoos_hour}
              onChange={(e) =>
                setFormData({ ...formData, hoos_hour: e.target.value })
              }
              placeholder='8.0'
            />
            <InputField
              label='Tiempo de Abastecimiento (h)'
              id='refuel-time'
              type='number'
              step='0.01'
              value={formData.refuel_time}
              onChange={(e) =>
                setFormData({ ...formData, refuel_time: e.target.value })
              }
              placeholder='0.5'
            />
            <InputField
              label='Margen Operacional (Buffer) %'
              id='operational-buffer'
              type='number'
              step='0.01'
              value={formData.operational_buffer}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  operational_buffer: e.target.value,
                })
              }
              placeholder='15.0'
            />
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <FormActions
        onSave={handleSave}
        onCancel={onCancel}
        saveLabel={isSubmitting ? 'Guardando...' : 'Guardar Ruta'}
        disabled={isSubmitting}
      />
    </div>
  )
}
