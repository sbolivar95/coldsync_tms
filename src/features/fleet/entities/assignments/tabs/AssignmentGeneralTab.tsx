import { useState, useEffect, useMemo } from 'react'
import { Card } from '../../../../../components/ui/Card'
import {
  SelectField,
  InputField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
import { Badge } from '../../../../../components/ui/Badge'
import { AlertTriangle } from 'lucide-react'
import { fleetSetsService } from '../../../../../services/fleetSets.service'
import { carriersService } from '../../../../../services/carriers.service'
import { driversService } from '../../../../../services/drivers.service'
import { vehiclesService } from '../../../../../services/vehicles.service'
import { trailersService } from '../../../../../services/trailers.service'
import { useOrganization } from '../../../../../hooks/useOrganization'

interface AssignmentGeneralTabProps {
  assignment?: any | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
  preSelectedCarrierId?: number
}

export function AssignmentGeneralTab({
  assignment,
  isCreating = false,
  onSave,
  onCancel,
  preSelectedCarrierId,
}: AssignmentGeneralTabProps) {
  const { orgId, loading: orgLoading } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [warnings, setWarnings] = useState<string[]>([])

  // All carriers (always load all)
  const [carriers, setCarriers] = useState<any[]>([])

  // Assets filtered by carrier
  const [allDrivers, setAllDrivers] = useState<any[]>([])
  const [allVehicles, setAllVehicles] = useState<any[]>([])
  const [allTrailers, setAllTrailers] = useState<any[]>([])

  // Active assignments for conflict detection
  const [activeAssignments, setActiveAssignments] = useState<any[]>([])

  const [formData, setFormData] = useState({
    carrier_id:
      assignment?.carrier_id || preSelectedCarrierId || (null as number | null),
    driver_id: assignment?.driver_id || (null as number | null),
    vehicle_id: assignment?.vehicle_id || (null as string | null),
    trailer_id: assignment?.trailer_id || (null as string | null),
    set_name: assignment?.set_name || '',
    start_date:
      assignment?.starts_at?.split('T')[0] ||
      new Date().toISOString().split('T')[0],
  })

  // Load carriers and active assignments on mount
  useEffect(() => {
    if (!orgId || orgLoading) return

    async function loadInitialData() {
      try {
        setLoading(true)

        const [carriersData, assignmentsData] = await Promise.all([
          carriersService.getActive(orgId!),
          fleetSetsService.getActive(orgId!),
        ])

        setCarriers(carriersData)
        setActiveAssignments(assignmentsData)
      } catch (err) {
        console.error('Error loading initial data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [orgId, orgLoading])

  // Load drivers, vehicles, trailers when carrier changes
  useEffect(() => {
    if (!orgId || !formData.carrier_id) {
      setAllDrivers([])
      setAllVehicles([])
      setAllTrailers([])
      return
    }

    let cancelled = false

    async function loadCarrierAssets() {
      try {
        const carrierId = formData.carrier_id!

        const [driversData, vehiclesData, trailersData] = await Promise.all([
          driversService.getByCarrier(orgId!, carrierId),
          vehiclesService.getAll(orgId!, carrierId),
          trailersService.getAllWithReeferSpecs(orgId!),
        ])

        if (!cancelled) {
          setAllDrivers(driversData)
          setAllVehicles(vehiclesData)
          // Filter trailers by carrier_id
          setAllTrailers(
            trailersData.filter((t: any) => t.carrier_id === carrierId)
          )
        }
      } catch (err) {
        console.error('Error loading carrier assets:', err)
        if (!cancelled) {
          setAllDrivers([])
          setAllVehicles([])
          setAllTrailers([])
        }
      }
    }

    loadCarrierAssets()

    return () => {
      cancelled = true
    }
  }, [orgId, formData.carrier_id])

  // Check for warnings when selection changes
  useEffect(() => {
    if (!isCreating) return

    const newWarnings: string[] = []

    if (formData.driver_id) {
      const driverAssignment = activeAssignments.find(
        (a) => a.driver_id === formData.driver_id
      )
      if (driverAssignment) {
        const driverName =
          allDrivers.find((d) => d.id === formData.driver_id)?.name ||
          'Este conductor'
        newWarnings.push(
          `${driverName} tiene una asignación activa que será finalizada`
        )
      }
    }

    if (formData.vehicle_id) {
      const vehicleAssignment = activeAssignments.find(
        (a) => a.vehicle_id === formData.vehicle_id
      )
      if (vehicleAssignment) {
        const vehicleCode =
          allVehicles.find((v) => v.id === formData.vehicle_id)?.unit_code ||
          'Este vehículo'
        newWarnings.push(
          `${vehicleCode} tiene una asignación activa que será finalizada`
        )
      }
    }

    if (formData.trailer_id) {
      const trailerAssignment = activeAssignments.find(
        (a) => a.trailer_id === formData.trailer_id
      )
      if (trailerAssignment) {
        const trailerCode =
          allTrailers.find((t) => t.id === formData.trailer_id)?.code ||
          'Este remolque'
        newWarnings.push(
          `${trailerCode} tiene una asignación activa que será finalizada`
        )
      }
    }

    setWarnings(newWarnings)
  }, [
    formData.driver_id,
    formData.vehicle_id,
    formData.trailer_id,
    activeAssignments,
    isCreating,
    allDrivers,
    allVehicles,
    allTrailers,
  ])

  // Helper functions for status badges
  const getDriverStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-700',
      DRIVING: 'bg-blue-100 text-blue-700',
      INACTIVE: 'bg-gray-200 text-gray-700',
    }
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible',
      DRIVING: 'En Ruta',
      INACTIVE: 'Inactivo',
    }
    return {
      style: styles[status] || 'bg-gray-200 text-gray-700',
      label: labels[status] || status,
    }
  }

  const getAssetStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      IN_MAINTENANCE: 'bg-yellow-100 text-yellow-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      OUT_OF_SERVICE: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      IN_MAINTENANCE: 'Mantenimiento',
      IN_TRANSIT: 'En Tránsito',
      OUT_OF_SERVICE: 'Fuera de Servicio',
    }
    return {
      style: styles[status] || 'bg-gray-200 text-gray-700',
      label: labels[status] || status,
    }
  }

  // Check if asset is currently assigned
  const isDriverAssigned = (driverId: number) =>
    activeAssignments.some((a) => a.driver_id === driverId)
  const isVehicleAssigned = (vehicleId: string) =>
    activeAssignments.some((a) => a.vehicle_id === vehicleId)
  const isTrailerAssigned = (trailerId: string) =>
    activeAssignments.some((a) => a.trailer_id === trailerId)

  const handleCarrierChange = (carrierId: number | null) => {
    // Reset dependent fields when carrier changes
    setFormData((prev) => ({
      ...prev,
      carrier_id: carrierId,
      driver_id: null,
      vehicle_id: null,
      trailer_id: null,
    }))
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!orgId) {
      alert('No se pudo obtener la organización')
      return
    }

    // Validate required fields
    if (!formData.carrier_id) {
      alert('Debe seleccionar un transportista')
      return
    }

    if (!formData.driver_id) {
      alert('Debe seleccionar un conductor')
      return
    }

    if (!formData.vehicle_id) {
      alert('Debe seleccionar un vehículo')
      return
    }

    if (!formData.trailer_id) {
      alert('Debe seleccionar un remolque')
      return
    }

    // Confirm if there are warnings
    if (warnings.length > 0) {
      const confirmMessage = `Las siguientes asignaciones activas serán finalizadas:\n\n${warnings.join(
        '\n'
      )}\n\n¿Desea continuar?`
      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      setSaving(true)

      if (isCreating) {
        // Create the fleet set (service will auto-end previous assignments)
        const newFleetSet = {
          id: crypto.randomUUID(),
          org_id: orgId,
          carrier_id: formData.carrier_id,
          driver_id: formData.driver_id,
          vehicle_id: formData.vehicle_id,
          trailer_id: formData.trailer_id,
          set_name: formData.set_name || null,
          starts_at: new Date(formData.start_date).toISOString(),
          is_active: true,
        }

        await fleetSetsService.create(newFleetSet)
        alert('Asignación creada exitosamente')
      } else if (assignment) {
        // Update existing assignment (only metadata)
        const updates = {
          set_name: formData.set_name || null,
        }

        await fleetSetsService.update(assignment.id, orgId, updates)
        alert('Asignación actualizada exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving assignment:', err)
      alert('Error al guardar la asignación')
    } finally {
      setSaving(false)
    }
  }

  // Show loading state
  if (orgLoading || loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
        <span className='ml-2 text-sm text-gray-600'>Cargando datos...</span>
      </div>
    )
  }

  // Show message if no org selected
  if (!orgId) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <p className='text-gray-500 mb-2'>No hay organización seleccionada</p>
          <p className='text-sm text-gray-400'>
            Selecciona una organización en Configuración para continuar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div>
              <h4 className='text-sm font-medium text-yellow-800'>
                Asignaciones que serán finalizadas
              </h4>
              <ul className='mt-2 text-sm text-yellow-700 list-disc list-inside'>
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            {isCreating
              ? 'Nueva Asignación de Flota'
              : 'Detalles de Asignación'}
          </h3>
          <p className='text-xs text-gray-500 mt-1'>
            {isCreating
              ? 'Seleccione un transportista primero, luego elija los activos de ese transportista.'
              : 'Los activos asignados no se pueden modificar. Para cambiarlos, cree una nueva asignación.'}
          </p>
        </div>

        <div className='space-y-5'>
          {/* Carrier Selection */}
          <SelectField
            label='Transportista'
            id='carrier_id'
            required
            value={formData.carrier_id?.toString() || 'none'}
            onChange={(e) => {
              const value =
                e.target.value === 'none' ? null : parseInt(e.target.value)
              handleCarrierChange(value)
            }}
            options={[
              { value: 'none', label: 'Seleccione un transportista' },
              ...carriers.map((c) => ({
                value: c.id.toString(),
                label: c.commercial_name,
              })),
            ]}
            disabled={!isCreating}
            helpText={
              isCreating
                ? 'Seleccione un transportista para ver sus activos disponibles'
                : undefined
            }
          />

          {/* Show message if no carrier selected */}
          {isCreating && !formData.carrier_id && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm text-blue-700'>
                Seleccione un transportista para ver los conductores, vehículos
                y remolques disponibles.
              </p>
            </div>
          )}

          {/* Driver Selection - Filtered by carrier */}
          {(formData.carrier_id || !isCreating) && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Conductor <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.driver_id?.toString() || 'none'}
                onChange={(e) => {
                  const value =
                    e.target.value === 'none' ? null : parseInt(e.target.value)
                  handleChange('driver_id', value)
                }}
                disabled={!isCreating}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
              >
                <option value='none'>Seleccione un conductor</option>
                {allDrivers.map((d) => {
                  const { label: statusLabel } = getDriverStatusBadge(d.status)
                  const assigned = isDriverAssigned(d.id)
                  return (
                    <option
                      key={d.id}
                      value={d.id.toString()}
                    >
                      {d.name} ({d.driver_id}) - {statusLabel}
                      {assigned ? ' [ASIGNADO]' : ''}
                    </option>
                  )
                })}
              </select>
              <p className='mt-1 text-xs text-gray-500'>
                {allDrivers.length} conductor(es) del transportista •
                {allDrivers.filter((d) => !isDriverAssigned(d.id)).length} sin
                asignación activa
              </p>
            </div>
          )}

          {/* Vehicle Selection - Filtered by carrier */}
          {(formData.carrier_id || !isCreating) && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Vehículo <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.vehicle_id || 'none'}
                onChange={(e) => {
                  const value =
                    e.target.value === 'none' ? null : e.target.value
                  handleChange('vehicle_id', value)
                }}
                disabled={!isCreating}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
              >
                <option value='none'>Seleccione un vehículo</option>
                {allVehicles.map((v) => {
                  const { label: statusLabel } = getAssetStatusBadge(
                    v.operational_status
                  )
                  const assigned = isVehicleAssigned(v.id)
                  return (
                    <option
                      key={v.id}
                      value={v.id}
                    >
                      {v.unit_code} - {v.plate} ({v.brand} {v.model}) -{' '}
                      {statusLabel}
                      {assigned ? ' [ASIGNADO]' : ''}
                    </option>
                  )
                })}
              </select>
              <p className='mt-1 text-xs text-gray-500'>
                {allVehicles.length} vehículo(s) del transportista •
                {allVehicles.filter((v) => !isVehicleAssigned(v.id)).length} sin
                asignación activa
              </p>
            </div>
          )}

          {/* Trailer Selection - Filtered by carrier */}
          {(formData.carrier_id || !isCreating) && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Remolque <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.trailer_id || 'none'}
                onChange={(e) => {
                  const value =
                    e.target.value === 'none' ? null : e.target.value
                  handleChange('trailer_id', value)
                }}
                disabled={!isCreating}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
              >
                <option value='none'>Seleccione un remolque</option>
                {allTrailers.map((t) => {
                  const { label: statusLabel } = getAssetStatusBadge(
                    t.operational_status
                  )
                  const assigned = isTrailerAssigned(t.id)
                  return (
                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.code} - {t.plate} ({t.transport_capacity_weight_tn} TN)
                      - {statusLabel}
                      {assigned ? ' [ASIGNADO]' : ''}
                    </option>
                  )
                })}
              </select>
              <p className='mt-1 text-xs text-gray-500'>
                {allTrailers.length} remolque(s) del transportista •
                {allTrailers.filter((t) => !isTrailerAssigned(t.id)).length} sin
                asignación activa
              </p>
            </div>
          )}

          {/* Set Name (optional) */}
          <InputField
            label='Nombre del Set (Opcional)'
            id='set_name'
            value={formData.set_name}
            onChange={(e) => handleChange('set_name', e.target.value)}
            placeholder='Ej: Equipo Norte 1'
            helpText='Un nombre descriptivo para identificar este set de flota'
          />

          {/* Start Date */}
          {isCreating && (
            <InputField
              label='Fecha de Inicio'
              id='start_date'
              type='date'
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
            />
          )}
        </div>
      </Card>

      {/* Summary Card for existing assignment */}
      {!isCreating && assignment && (
        <Card className='p-6'>
          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
              Resumen de Asignación
            </h3>
          </div>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-500'>Transportista:</span>
              <p className='font-medium'>
                {assignment.carriers?.commercial_name || '-'}
              </p>
            </div>
            <div>
              <span className='text-gray-500'>Conductor:</span>
              <p className='font-medium'>{assignment.drivers?.name || '-'}</p>
            </div>
            <div>
              <span className='text-gray-500'>Vehículo:</span>
              <p className='font-medium'>
                {assignment.vehicles?.vehicle_code} -{' '}
                {assignment.vehicles?.plate || '-'}
              </p>
            </div>
            <div>
              <span className='text-gray-500'>Remolque:</span>
              <p className='font-medium'>
                {assignment.trailers?.code} -{' '}
                {assignment.trailers?.plate || '-'}
              </p>
            </div>
            <div>
              <span className='text-gray-500'>Fecha de Inicio:</span>
              <p className='font-medium'>
                {assignment.starts_at
                  ? new Date(assignment.starts_at).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <span className='text-gray-500'>Estado:</span>
              <Badge
                variant='default'
                className={
                  assignment.ends_at
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-green-100 text-green-700'
                }
              >
                {assignment.ends_at ? 'Finalizado' : 'Activo'}
              </Badge>
            </div>
            {assignment.ends_at && (
              <div>
                <span className='text-gray-500'>Fecha de Fin:</span>
                <p className='font-medium'>
                  {new Date(assignment.ends_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <FormActions
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
        saveLabel={isCreating ? 'Crear Asignación' : 'Guardar Cambios'}
      />
    </div>
  )
}
