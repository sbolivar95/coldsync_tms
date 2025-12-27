import { Card } from '../../../../../components/ui/Card'
import {
  InputField,
  SelectField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useOrganization } from '../../../../../hooks/useOrganization'

interface HardwareGeneralTabProps {
  hardware?: any | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
}

export function HardwareGeneralTab({
  hardware,
  isCreating = false,
  onSave,
  onCancel,
}: HardwareGeneralTabProps) {
  const { orgId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [hardwareDevices, setHardwareDevices] = useState<any[]>([])
  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [newProviderName, setNewProviderName] = useState('')
  const [savingProvider, setSavingProvider] = useState(false)
  const [showHardwareDialog, setShowHardwareDialog] = useState(false)
  const [newHardwareName, setNewHardwareName] = useState('')
  const [newHardwareFlespiType, setNewHardwareFlespiType] = useState('')
  const [savingHardware, setSavingHardware] = useState(false)

  const [formData, setFormData] = useState({
    ident: hardware?.ident || '',
    tracked_entity_type: hardware?.tracked_entity_type || 'TRAILER',
    provider: hardware?.provider || (null as number | null),
    hardware: hardware?.hardware || (null as number | null),
    phone_number: hardware?.phone_number || '',
    serial: hardware?.serial || '',
    flespi_device_id: hardware?.flespi_device_id || (null as number | null),
    notes: hardware?.notes || '',
  })

  // Load providers and hardware devices
  useEffect(() => {
    if (!orgId) return

    async function loadOptions() {
      try {
        const [providersData, devicesData] = await Promise.all([
          supabase.from('telematics_provider').select('*').order('name'),
          supabase
            .from('hardware_device')
            .select('*')
            .eq('org_id', orgId)
            .order('name'),
        ])

        if (providersData.data) {
          setProviders(providersData.data)
        }

        if (devicesData.data) {
          setHardwareDevices(devicesData.data)
        }
      } catch (err) {
        console.error('Error loading options:', err)
      }
    }

    loadOptions()
  }, [orgId])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateProvider = async () => {
    if (!orgId) {
      alert('No se pudo obtener la organización')
      return
    }

    if (!newProviderName.trim()) {
      alert('El nombre del proveedor es requerido')
      return
    }

    try {
      setSavingProvider(true)

      const { data, error } = await supabase
        .from('telematics_provider')
        .insert({
          name: newProviderName.trim(),
          org_id: orgId,
        })
        .select()
        .single()

      if (error) throw error

      // Add to providers list
      setProviders((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )

      // Select the new provider
      handleChange('provider', data.id)

      // Close dialog and reset
      setShowProviderDialog(false)
      setNewProviderName('')

      alert('Proveedor creado exitosamente')
    } catch (err: any) {
      console.error('Error creating provider:', err)

      if (err.code === '23505') {
        alert('Ya existe un proveedor con ese nombre')
      } else {
        alert('Error al crear el proveedor')
      }
    } finally {
      setSavingProvider(false)
    }
  }

  const handleCreateHardware = async () => {
    if (!orgId) {
      alert('No se pudo obtener la organización')
      return
    }

    if (!newHardwareName.trim()) {
      alert('El nombre del dispositivo es requerido')
      return
    }

    if (!newHardwareFlespiType.trim()) {
      alert('El tipo de dispositivo Flespi es requerido')
      return
    }

    try {
      setSavingHardware(true)

      const { data, error } = await supabase
        .from('hardware_device')
        .insert({
          name: newHardwareName.trim(),
          org_id: orgId,
          flespi_device_type_id: parseInt(newHardwareFlespiType),
        })
        .select()
        .single()

      if (error) throw error

      // Add to hardware devices list
      setHardwareDevices((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )

      // Select the new hardware device
      handleChange('hardware', data.id)

      // Close dialog and reset
      setShowHardwareDialog(false)
      setNewHardwareName('')
      setNewHardwareFlespiType('')

      alert('Dispositivo hardware creado exitosamente')
    } catch (err: any) {
      console.error('Error creating hardware device:', err)

      if (err.code === '23505') {
        alert('Ya existe un dispositivo hardware con ese nombre')
      } else {
        alert('Error al crear el dispositivo hardware')
      }
    } finally {
      setSavingHardware(false)
    }
  }

  const handleSave = async () => {
    if (!orgId) {
      alert('No se pudo obtener la organización')
      return
    }

    // Validate required fields
    if (!formData.ident) {
      alert('El identificador es requerido')
      return
    }

    try {
      setSaving(true)

      if (isCreating) {
        const { error } = await supabase.from('connection_device').insert({
          id: crypto.randomUUID(),
          org_id: orgId,
          ident: formData.ident,
          tracked_entity_type: formData.tracked_entity_type,
          provider: formData.provider,
          hardware: formData.hardware,
          phone_number: formData.phone_number || null,
          serial: formData.serial || null,
          flespi_device_id: formData.flespi_device_id,
          notes: formData.notes || null,
        })

        if (error) throw error
        alert('Conexión creada exitosamente')
      } else if (hardware) {
        const { error } = await supabase
          .from('connection_device')
          .update({
            ident: formData.ident,
            tracked_entity_type: formData.tracked_entity_type,
            provider: formData.provider,
            hardware: formData.hardware,
            phone_number: formData.phone_number || null,
            serial: formData.serial || null,
            flespi_device_id: formData.flespi_device_id,
            notes: formData.notes || null,
          })
          .eq('id', hardware.id)
          .eq('org_id', orgId)

        if (error) throw error
        alert('Conexión actualizada exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err: any) {
      console.error('Error saving connection:', err)

      if (err.code === '23505') {
        if (err.message.includes('ident')) {
          alert('Ya existe una conexión con este identificador')
        } else if (err.message.includes('phone_number')) {
          alert('Ya existe una conexión con este número de teléfono')
        } else if (err.message.includes('serial')) {
          alert('Ya existe una conexión con este serial')
        } else if (err.message.includes('flespi_device_id')) {
          alert('Ya existe una conexión con este Flespi Device ID')
        } else {
          alert('Error: Valor duplicado')
        }
      } else {
        alert('Error al guardar la conexión')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Identificación */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Identificación
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Identificador'
            id='ident'
            required
            value={formData.ident}
            onChange={(e) => handleChange('ident', e.target.value)}
            placeholder='Ej: DEVICE-001'
            helpText='Identificador único del dispositivo'
          />

          <SelectField
            label='Asignado a'
            id='tracked_entity_type'
            required
            value={formData.tracked_entity_type}
            onChange={(e) =>
              handleChange('tracked_entity_type', e.target.value)
            }
            options={[
              { value: 'VEHICLE', label: 'Vehículo' },
              { value: 'TRAILER', label: 'Remolque' },
            ]}
          />

          <InputField
            label='Número de Teléfono'
            id='phone_number'
            type='tel'
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            placeholder='+591 70000000'
            helpText='Opcional - debe ser único'
          />

          <InputField
            label='Serial'
            id='serial'
            value={formData.serial}
            onChange={(e) => handleChange('serial', e.target.value)}
            placeholder='SN12345678'
            helpText='Opcional - debe ser único'
          />
        </div>
      </Card>

      {/* Dispositivo y Proveedor */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Dispositivo y Proveedor
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Hardware
            </label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <select
                  id='hardware'
                  value={formData.hardware?.toString() || 'none'}
                  onChange={(e) =>
                    handleChange(
                      'hardware',
                      e.target.value === 'none'
                        ? null
                        : parseInt(e.target.value)
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='none'>Sin asignar</option>
                  {hardwareDevices.map((d) => (
                    <option
                      key={d.id}
                      value={d.id.toString()}
                    >
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type='button'
                onClick={() => setShowHardwareDialog(true)}
                className='px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap'
              >
                + Nuevo
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Tipo de dispositivo hardware
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Proveedor de Telemática
            </label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <select
                  id='provider'
                  value={formData.provider?.toString() || 'none'}
                  onChange={(e) =>
                    handleChange(
                      'provider',
                      e.target.value === 'none'
                        ? null
                        : parseInt(e.target.value)
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='none'>Sin asignar</option>
                  {providers.map((p) => (
                    <option
                      key={p.id}
                      value={p.id.toString()}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type='button'
                onClick={() => setShowProviderDialog(true)}
                className='px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap'
              >
                + Nuevo
              </button>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Proveedor del servicio de telemática
            </p>
          </div>

          <InputField
            label='Flespi Device ID'
            id='flespi_device_id'
            type='number'
            value={formData.flespi_device_id?.toString() || ''}
            onChange={(e) =>
              handleChange(
                'flespi_device_id',
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder='123456'
            helpText='ID del dispositivo en Flespi (opcional - debe ser único)'
          />
        </div>
      </Card>

      {/* Notas */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Notas Adicionales
          </h3>
        </div>

        <div className='grid grid-cols-1 gap-5'>
          <div>
            <label
              htmlFor='notes'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Notas
            </label>
            <textarea
              id='notes'
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Información adicional sobre el dispositivo...'
            />
          </div>
        </div>
      </Card>

      {/* Provider Creation Dialog */}
      {showProviderDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Nuevo Proveedor de Telemática
            </h3>

            <div className='mb-4'>
              <label
                htmlFor='providerName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Nombre del Proveedor *
              </label>
              <input
                type='text'
                id='providerName'
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Ej: Flespi, Geotab, etc.'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !savingProvider) {
                    handleCreateProvider()
                  }
                }}
              />
              <p className='text-xs text-gray-500 mt-1'>
                El nombre debe ser único en la organización
              </p>
            </div>

            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowProviderDialog(false)
                  setNewProviderName('')
                }}
                disabled={savingProvider}
                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleCreateProvider}
                disabled={savingProvider || !newProviderName.trim()}
                className='px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {savingProvider ? 'Guardando...' : 'Crear Proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Device Creation Dialog */}
      {showHardwareDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Nuevo Dispositivo Hardware
            </h3>

            <div className='space-y-4 mb-4'>
              <div>
                <label
                  htmlFor='hardwareName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Nombre del Dispositivo *
                </label>
                <input
                  type='text'
                  id='hardwareName'
                  value={newHardwareName}
                  onChange={(e) => setNewHardwareName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Ej: GPS Tracker v2, OBD Reader, etc.'
                  autoFocus
                />
                <p className='text-xs text-gray-500 mt-1'>
                  El nombre debe ser único en la organización
                </p>
              </div>

              <div>
                <label
                  htmlFor='flespiType'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Flespi Device Type ID *
                </label>
                <input
                  type='number'
                  id='flespiType'
                  value={newHardwareFlespiType}
                  onChange={(e) => setNewHardwareFlespiType(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Ej: 123'
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !savingHardware &&
                      newHardwareName.trim() &&
                      newHardwareFlespiType.trim()
                    ) {
                      handleCreateHardware()
                    }
                  }}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  ID del tipo de dispositivo en Flespi
                </p>
              </div>
            </div>

            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowHardwareDialog(false)
                  setNewHardwareName('')
                  setNewHardwareFlespiType('')
                }}
                disabled={savingHardware}
                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleCreateHardware}
                disabled={
                  savingHardware ||
                  !newHardwareName.trim() ||
                  !newHardwareFlespiType.trim()
                }
                className='px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {savingHardware ? 'Guardando...' : 'Crear Dispositivo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <FormActions
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={isCreating ? 'Crear Conexión' : 'Guardar Cambios'}
        disabled={saving}
      />
    </div>
  )
}
