import { useState, useEffect } from 'react'
import { Card } from '../../../../../components/ui/Card'
import {
  SelectField,
  InputField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
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
  const { orgId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [carriers, setCarriers] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [trailers, setTrailers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    carrier_id:
      assignment?.carrier_id || preSelectedCarrierId || (null as number | null),
    driver_id: assignment?.driver_id || (null as number | null),
    vehicle_id: assignment?.vehicle_id || (null as string | null),
    trailer_id: assignment?.trailer_id || (null as string | null),
    set_name: assignment?.set_name || '',
    start_date:
      assignment?.start_date?.split('T')[0] ||
      new Date().toISOString().split('T')[0],
  })

  // Load carriers
  useEffect(() => {
    if (!orgId) return

    async function loadCarriers() {
      try {
        const data = await carriersService.getActive(orgId!)
        setCarriers(data)
      } catch (err) {
        console.error('Error loading carriers:', err)
      }
    }

    loadCarriers()
  }, [orgId])

  // Load drivers, vehicles, trailers when carrier is selected
  useEffect(() => {
    if (!orgId || !formData.carrier_id) {
      setDrivers([])
      setVehicles([])
      setTrailers([])
      return
    }

    async function loadFleetAssets() {
      try {
        const [driversData, vehiclesData, trailersData] = await Promise.all([
          driversService.getByCarrier(orgId!, formData.carrier_id!),
          vehiclesService.getAll(orgId!), // Note: Filter by carrier if you have carrier_id in vehicles
          trailersService.getAll(orgId!), // Note: Filter by carrier if you have carrier_id in trailers
        ])

        // Filter for available/active assets
        setDrivers(driversData.filter((d) => d.status === 'AVAILABLE'))
        setVehicles(
          vehiclesData.filter((v) => v.operational_status === 'ACTIVE')
        )
        setTrailers(
          trailersData.filter((t) => t.operational_status === 'ACTIVE')
        )
      } catch (err) {
        console.error('Error loading fleet assets:', err)
      }
    }

    loadFleetAssets()
  }, [orgId, formData.carrier_id])

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

    try {
      setSaving(true)

      if (isCreating) {
        // Validate that all assets are from the same carrier
        const validation = await fleetSetsService.validateFleetSet(
          orgId,
          formData.carrier_id,
          formData.driver_id,
          formData.vehicle_id,
          formData.trailer_id
        )

        if (!validation.valid) {
          alert(`Validación fallida: ${validation.errors.join(', ')}`)
          return
        }

        // Create the fleet set
        const newFleetSet = {
          id: crypto.randomUUID(),
          org_id: orgId,
          carrier_id: formData.carrier_id,
          driver_id: formData.driver_id,
          vehicle_id: formData.vehicle_id,
          trailer_id: formData.trailer_id,
          set_name: formData.set_name || null,
          start_date: formData.start_date,
          is_active: true,
        }

        await fleetSetsService.create(newFleetSet)
        alert('Asignación creada exitosamente')
      } else if (assignment) {
        // Update existing assignment
        const updates = {
          set_name: formData.set_name || null,
          // Note: Cannot change carrier, driver, vehicle, trailer on existing assignment
          // Only allow updating the set name
        }

        await fleetSetsService.update(assignment.id, orgId, updates)
        alert('Asignación actualizada exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving assignment:', err)
      alert('Error al crear la asignación')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            {isCreating
              ? 'Nueva Asignación de Flota'
              : 'Detalles de Asignación'}
          </h3>
          <p className='text-xs text-gray-500 mt-1'>
            {isCreating
              ? 'Todos los activos deben pertenecer al mismo transportista'
              : 'Los activos asignados no se pueden modificar. Solo se puede actualizar el nombre del set.'}
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
              handleChange('carrier_id', value)
              // Reset dependent fields
              handleChange('driver_id', null)
              handleChange('vehicle_id', null)
              handleChange('trailer_id', null)
            }}
            options={[
              { value: 'none', label: 'Seleccione un transportista' },
              ...carriers.map((c) => ({
                value: c.id.toString(),
                label: c.commercial_name,
              })),
            ]}
            disabled={!isCreating || !!preSelectedCarrierId}
          />

          {/* Set Name (Optional) */}
          <InputField
            label='Nombre del Set (opcional)'
            id='set_name'
            value={formData.set_name}
            onChange={(e) => handleChange('set_name', e.target.value)}
            placeholder='Ej: Flota Norte 1'
            helpText='Si no se especifica, se generará automáticamente'
          />

          {/* Start Date */}
          <InputField
            label='Fecha de Inicio'
            id='start_date'
            type='date'
            required
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            disabled={!isCreating}
          />

          {/* Driver Selection */}
          <SelectField
            label='Conductor'
            id='driver_id'
            required
            value={formData.driver_id?.toString() || 'none'}
            onChange={(e) =>
              handleChange(
                'driver_id',
                e.target.value === 'none' ? null : parseInt(e.target.value)
              )
            }
            options={[
              {
                value: 'none',
                label: formData.carrier_id
                  ? 'Seleccione un conductor'
                  : 'Primero seleccione transportista',
              },
              ...drivers.map((d) => ({
                value: d.id.toString(),
                label: `${d.name} (${d.driver_id})`,
              })),
            ]}
            disabled={!isCreating || !formData.carrier_id}
            helpText={`${drivers.length} conductores disponibles`}
          />

          {/* Vehicle Selection */}
          <SelectField
            label='Vehículo'
            id='vehicle_id'
            required
            value={formData.vehicle_id || 'none'}
            onChange={(e) =>
              handleChange(
                'vehicle_id',
                e.target.value === 'none' ? null : e.target.value
              )
            }
            options={[
              {
                value: 'none',
                label: formData.carrier_id
                  ? 'Seleccione un vehículo'
                  : 'Primero seleccione transportista',
              },
              ...vehicles.map((v) => ({
                value: v.id,
                label: `${v.unit_code} (${v.plate})`,
              })),
            ]}
            disabled={!isCreating || !formData.carrier_id}
            helpText={`${vehicles.length} vehículos disponibles`}
          />

          {/* Trailer Selection */}
          <SelectField
            label='Remolque'
            id='trailer_id'
            required
            value={formData.trailer_id || 'none'}
            onChange={(e) =>
              handleChange(
                'trailer_id',
                e.target.value === 'none' ? null : e.target.value
              )
            }
            options={[
              {
                value: 'none',
                label: formData.carrier_id
                  ? 'Seleccione un remolque'
                  : 'Primero seleccione transportista',
              },
              ...trailers.map((t) => ({
                value: t.id,
                label: `${t.code} (${t.plate})`,
              })),
            ]}
            disabled={!isCreating || !formData.carrier_id}
            helpText={`${trailers.length} remolques disponibles`}
          />
        </div>
      </Card>

      {/* Validation Summary - only show when creating */}
      {isCreating &&
        formData.carrier_id &&
        formData.driver_id &&
        formData.vehicle_id &&
        formData.trailer_id && (
          <Card className='p-4 bg-blue-50 border-blue-200'>
            <h4 className='text-sm font-semibold text-blue-900 mb-2'>
              Resumen de Asignación
            </h4>
            <div className='text-xs text-blue-700 space-y-1'>
              <p>✓ Transportista seleccionado</p>
              <p>✓ Conductor disponible asignado</p>
              <p>✓ Vehículo activo asignado</p>
              <p>✓ Remolque activo asignado</p>
            </div>
          </Card>
        )}

      {/* Actions */}
      <FormActions
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={isCreating ? 'Crear Asignación' : 'Guardar Cambios'}
        disabled={
          saving ||
          (isCreating &&
            (!formData.carrier_id ||
              !formData.driver_id ||
              !formData.vehicle_id ||
              !formData.trailer_id))
        }
      />
    </div>
  )
}
