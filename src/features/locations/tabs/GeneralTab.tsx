import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { InputField, SelectField } from '../../../components/widgets/FormField'
import { FormActions } from '../../../components/widgets/FormActions'
import { LocationMap } from '../LocationMap'
import { MapPinIcon, Pentagon } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import { Textarea } from '../../../components/ui/Textarea'

import { useOrganization } from '../../../hooks/useOrganization'
import type { LocationType } from '../../../types/database.types'
import { supabase } from '@/lib/supabase'

type Country = {
  id: number
  name: string
  iso_code: string
  created_at: string | null
}

type GeofenceType = 'circular' | 'polygon'

interface GeneralTabProps {
  ubicacion?: any
  locationTypes: LocationType[]
  saving?: boolean
  onSave?: (data: {
    id?: number | null
    name: string
    code: string
    type_location_id?: number | null
    address: string
    city: string
    country_id: number
    num_docks: number
    is_active: boolean
    geofence_type: GeofenceType
    geofence_data: any
  }) => void
  onCancel?: () => void

  // to match what LocationDetail passes
  onCreateLocationType?: (
    name: string
  ) => Promise<{ id: number; name: string } | null>
}

function uiGeofenceFromDb(ubicacion: any) {
  if (ubicacion?.geofence_type === 'circular') {
    return {
      locationType: 'point' as const,
      coordinates: ubicacion?.geofence_data?.center ?? null,
      polygon: null,
      radius: ubicacion?.geofence_data?.radius_meters ?? 100,
    }
  }

  if (ubicacion?.geofence_type === 'polygon') {
    return {
      locationType: 'polygon' as const,
      coordinates: null,
      polygon: ubicacion?.geofence_data?.points ?? null,
      radius: 100,
    }
  }

  return {
    locationType: 'point' as const,
    coordinates: null,
    polygon: null,
    radius: 100,
  }
}

function buildGeofencePayload(formData: any): {
  geofence_type: GeofenceType
  geofence_data: any
} {
  if (formData.locationType === 'point') {
    if (!formData.coordinates) {
      throw new Error('Selecciona una ubicación en el mapa (círculo).')
    }

    return {
      geofence_type: 'circular',
      geofence_data: {
        center: formData.coordinates, // { lat, lng }
        radius_meters: Number(formData.radius) || 100,
      },
    }
  }

  if (!formData.polygon || formData.polygon.length < 3) {
    throw new Error('Dibuja un polígono válido (mínimo 3 puntos).')
  }

  return {
    geofence_type: 'polygon',
    geofence_data: {
      points: formData.polygon, // [{ lat, lng }, ...]
    },
  }
}

export function GeneralTab({
  ubicacion,
  locationTypes: initialTypes,
  saving,
  onSave,
  onCancel,
  onCreateLocationType,
}: GeneralTabProps) {
  const { orgId } = useOrganization()

  const [countries, setCountries] = useState<Country[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [countriesError, setCountriesError] = useState<string | null>(null)

  const [locationTypes, setLocationTypes] = useState<LocationType[]>(
    initialTypes || []
  )

  useEffect(() => {
    setLocationTypes(initialTypes || [])
  }, [initialTypes])

  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [savingType, setSavingType] = useState(false)

  const initialGeo = uiGeofenceFromDb(ubicacion)

  const [formData, setFormData] = useState({
    id: ubicacion?.id as number | undefined,

    name: ubicacion?.name || '',
    code: ubicacion?.code || '',
    type_location_id: (ubicacion?.type_location_id ??
      ubicacion?.location_types?.id ??
      null) as number | null,

    address: ubicacion?.address || '',
    city: ubicacion?.city || '',

    country_id: (ubicacion?.country_id ?? ubicacion?.countries?.id ?? null) as
      | number
      | null,

    num_docks: (ubicacion?.num_docks ?? 1) as number,

    status:
      ubicacion?.is_active === false
        ? 'Inactivo'
        : ubicacion?.status || 'Activo',

    locationType: initialGeo.locationType,
    coordinates: initialGeo.coordinates,
    polygon: initialGeo.polygon,
    radius: initialGeo.radius,
  })

  // reset when editing different location
  useEffect(() => {
    const geo = uiGeofenceFromDb(ubicacion)
    setFormData({
      id: ubicacion?.id as number | undefined,
      name: ubicacion?.name || '',
      code: ubicacion?.code || '',
      type_location_id: (ubicacion?.type_location_id ??
        ubicacion?.location_types?.id ??
        null) as number | null,
      address: ubicacion?.address || '',
      city: ubicacion?.city || '',
      country_id: (ubicacion?.country_id ??
        ubicacion?.countries?.id ??
        null) as number | null,
      num_docks: (ubicacion?.num_docks ?? 1) as number,
      status:
        ubicacion?.is_active === false
          ? 'Inactivo'
          : ubicacion?.status || 'Activo',
      locationType: geo.locationType,
      coordinates: geo.coordinates,
      polygon: geo.polygon,
      radius: geo.radius,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubicacion?.id])

  // load countries
  useEffect(() => {
    let alive = true

    async function loadCountries() {
      setLoadingCountries(true)
      setCountriesError(null)

      const { data, error } = await supabase
        .from('countries')
        .select('id,name,iso_code,created_at')
        .order('name', { ascending: true })

      if (!alive) return

      if (error) {
        setCountries([])
        setCountriesError(error.message)
        setLoadingCountries(false)
        return
      }

      const rows = (data ?? []) as Country[]
      setCountries(rows)
      setLoadingCountries(false)

      setFormData((prev) => {
        if (prev.country_id) return prev
        const chile = rows.find((c) => c.name.toLowerCase() === 'chile')
        return { ...prev, country_id: chile?.id ?? rows[0]?.id ?? null }
      })
    }

    loadCountries()
    return () => {
      alive = false
    }
  }, [])

  const countryOptions = useMemo(
    () =>
      countries.map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [countries]
  )

  const handleCreateLocationType = async () => {
    const trimmed = newTypeName.trim()
    if (!trimmed) {
      alert('El nombre del tipo es requerido')
      return
    }

    if (!orgId) {
      alert('No se pudo obtener la organización')
      return
    }

    try {
      setSavingType(true)

      // use parent callback if provided, else no-op
      const created = (await onCreateLocationType?.(trimmed)) ?? null

      if (!created) {
        alert('No se pudo crear el tipo de ubicación')
        return
      }

      setLocationTypes((prev) =>
        [...prev, created as any].sort((a, b) => a.name.localeCompare(b.name))
      )

      setFormData((prev) => ({
        ...prev,
        type_location_id: created.id,
      }))

      setShowTypeDialog(false)
      setNewTypeName('')
    } finally {
      setSavingType(false)
    }
  }

  const handleSave = () => {
    if (!onSave) return

    const code = formData.code?.trim()
    if (!code) {
      alert('El código es requerido (la base de datos no permite null).')
      return
    }

    if (!formData.country_id) {
      alert('Selecciona un país')
      return
    }

    try {
      const { geofence_type, geofence_data } = buildGeofencePayload(formData)

      onSave({
        id: formData.id ?? null,
        name: formData.name,
        code,
        type_location_id: formData.type_location_id,
        address: formData.address,
        city: formData.city,
        country_id: formData.country_id,
        num_docks: Number(formData.num_docks) || 1,
        is_active: formData.status !== 'Inactivo',
        geofence_type,
        geofence_data,
      })
    } catch (e: any) {
      alert(e.message ?? 'Error en el geofence')
    }
  }

  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
            <InputField
              label='ID'
              id='id'
              defaultValue={ubicacion?.id || 'Generado automáticamente'}
              disabled
            />

            <div className='flex gap-2 items-end'>
              <div className='flex-1'>
                <SelectField
                  label='Tipo de Ubicación'
                  id='tipo-ubicacion'
                  required
                  value={
                    formData.type_location_id
                      ? String(formData.type_location_id)
                      : ''
                  }
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      type_location_id: value ? Number(value) : null,
                    }))
                  }
                  options={locationTypes.map((t) => ({
                    value: String(t.id),
                    label: t.name,
                  }))}
                />
              </div>

              <button
                type='button'
                onClick={() => setShowTypeDialog(true)}
                className='px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap h-9'
              >
                + Nuevo
              </button>
            </div>

            <SelectField
              label='Estado'
              id='estado'
              required
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              options={[
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
                { value: 'Mantenimiento', label: 'Mantenimiento' },
              ]}
            />

            <InputField
              label='Número de Muelles'
              id='num_docks'
              type='number'
              required
              value={formData.num_docks}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10)
                setFormData((prev) => ({
                  ...prev,
                  num_docks: isNaN(value) || value < 1 ? 1 : value,
                }))
              }}
            />

            <InputField
              label='Código'
              id='codigo'
              required
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              placeholder='Ej: LOC-001'
            />

            <InputField
              label='Nombre de la Ubicación'
              id='nombre-ubicacion'
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder='Ej: CD Santiago Norte'
            />

            <InputField
              label='Ciudad'
              id='ciudad'
              required
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              placeholder='Santiago'
            />

            <SelectField
              label='País'
              id='pais'
              required
              value={formData.country_id ? String(formData.country_id) : ''}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  country_id: value ? Number(value) : null,
                }))
              }
              options={countryOptions}
              disabled={loadingCountries}
              placeholder={
                loadingCountries ? 'Cargando países...' : 'Selecciona un país'
              }
            />

            {countriesError && (
              <div className='md:col-span-2 lg:col-span-4 -mt-2'>
                <p className='text-xs text-amber-700'>
                  No se pudieron cargar países: {countriesError}
                </p>
              </div>
            )}

            <div className='md:col-span-2 lg:col-span-4'>
              <div className='space-y-2'>
                <Label htmlFor='address'>Dirección Completa *</Label>
                <Textarea
                  id='address'
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder='Av. Industrial 1234, Sector Norte'
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className='border-t border-gray-200 my-6'></div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
                Ubicación en Mapa
              </h3>

              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant={
                    formData.locationType === 'point' ? 'default' : 'outline'
                  }
                  size='sm'
                  className='gap-2 h-9'
                  style={
                    formData.locationType === 'point'
                      ? { backgroundColor: '#004ef0' }
                      : {}
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      locationType: 'point',
                      polygon: null,
                    }))
                  }
                >
                  <MapPinIcon className='w-3.5 h-3.5' />
                  Círculo
                </Button>

                <Button
                  type='button'
                  variant={
                    formData.locationType === 'polygon' ? 'default' : 'outline'
                  }
                  size='sm'
                  className='gap-2 h-9'
                  style={
                    formData.locationType === 'polygon'
                      ? { backgroundColor: '#004ef0' }
                      : {}
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      locationType: 'polygon',
                      coordinates: null,
                    }))
                  }
                >
                  <Pentagon className='w-3.5 h-3.5' />
                  Polígono
                </Button>

                <div className='flex items-center gap-2 ml-2'>
                  <span
                    className={`text-sm whitespace-nowrap ${
                      formData.locationType === 'polygon'
                        ? 'text-gray-400'
                        : 'text-gray-700'
                    }`}
                  >
                    Radio (metros)
                  </span>
                  <input
                    type='number'
                    value={formData.radius}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        radius: parseInt(e.target.value) || 100,
                      }))
                    }
                    min={10}
                    placeholder='100'
                    disabled={formData.locationType === 'polygon'}
                    className={`w-24 h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.locationType === 'polygon'
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {formData.locationType && (
              <LocationMap
                locationType={formData.locationType}
                coordinates={formData.coordinates}
                polygon={formData.polygon}
                radiusMeters={formData.radius}
                onLocationChange={(type, data) => {
                  if (type === 'point') {
                    setFormData((prev) => ({
                      ...prev,
                      coordinates: data as { lat: number; lng: number } | null,
                      polygon: null,
                    }))
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      polygon: data as Array<{
                        lat: number
                        lng: number
                      }> | null,
                      coordinates: null,
                    }))
                  }
                }}
              />
            )}
          </div>
        </div>
      </Card>

      {showTypeDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Nuevo Tipo de Ubicación
            </h3>

            <div className='mb-4'>
              <label
                htmlFor='locationTypeName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Nombre *
              </label>
              <input
                type='text'
                id='locationTypeName'
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Ej: Centro de Distribución'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !savingType) {
                    handleCreateLocationType()
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
                  setShowTypeDialog(false)
                  setNewTypeName('')
                }}
                disabled={savingType}
                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
              >
                Cancelar
              </button>

              <button
                type='button'
                onClick={handleCreateLocationType}
                disabled={savingType || !newTypeName.trim()}
                className='px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {savingType ? 'Guardando...' : 'Crear Tipo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FormActions
        onSave={handleSave}
        onCancel={onCancel}
        saveLabel={
          saving
            ? 'Guardando...'
            : ubicacion
            ? 'Guardar Cambios'
            : 'Crear Ubicación'
        }
        disabled={!!saving}
      />
    </div>
  )
}
